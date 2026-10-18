// Edits applied to a finished (opaque) image: the repairs a generation needs after it, each of which used to be
// rewritten as a throwaway script. All of them keep the image size and return a PNG buffer.
//
//   darken       lowers brightness, tints, adds a dark top gradient and vignette: a darker source for a repaint
//   adjustMasked recolours the pixels a selector picks (soft edge): `PRESETS` holds the ones that worked
//   patch        clones pixels from an offset over a box (removes a small figure or an artifact), feathered
//   montage      labelled grid of candidate images with their mean luminance, for review
//
// Mind the sharp quirk behind `maskBlur`: a blurred 1-channel raw buffer comes back with 3 channels unless it is
// converted back with `toColourspace('b-w')`; indexing it as 1 channel gives horizontal stripes.

import sharp from 'sharp'
import { shave } from './postprocess.mjs'
import { imageStats } from './qc.mjs'

async function decode(buf) {
    const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true })
    if (info.channels !== 3) throw new Error(`expected 3 channels, got ${info.channels}`)
    return { data, width: info.width, height: info.height }
}

const encode = (data, width, height) => sharp(data, { raw: { width, height, channels: 3 } }).png().toBuffer()
const luma = (r, g, b) => 0.3 * r + 0.59 * g + 0.11 * b

/** A darker, cooler copy: `top` is the opacity (0-1) of a dark gradient over the top 30% (covers a sky), `vignette` the corner darkening. */
export async function darken(buf, { brightness = 0.5, saturation = 0.7, tint = [0.75, 0.95, 1], top = 0.9, vignette = 0.55 } = {}) {
    const { width: w, height: h } = await sharp(buf).metadata()
    const base = await sharp(buf).removeAlpha().modulate({ brightness, saturation }).linear(tint, [0, 0, 0]).toBuffer()
    const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs>
<linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1a14" stop-opacity="${top}"/><stop offset="0.3" stop-color="#0a1a14" stop-opacity="${top * 0.6}"/><stop offset="0.5" stop-color="#0a1a14" stop-opacity="0"/></linearGradient>
<radialGradient id="v" cx="0.5" cy="0.5" r="0.75"><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${vignette}"/></radialGradient></defs>
<rect width="100%" height="100%" fill="url(#t)"/><rect width="100%" height="100%" fill="url(#v)"/></svg>`)
    return sharp(base).composite([{ input: overlay }]).png().toBuffer()
}

/**
 * Recolours the pixels `select` picks. `select(r, g, b, l)` returns 0-255 (how strongly a pixel is picked), the mask is
 * blurred by `maskBlur` px for a soft edge, and `apply(r, g, b, l)` returns the fully recoloured `[r, g, b]`.
 */
export async function adjustMasked(buf, { select, apply, maskBlur = 3 }) {
    const { data, width: w, height: h } = await decode(buf)
    const picked = Buffer.alloc(w * h)
    for (let i = 0; i < w * h; i++) {
        const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2]
        picked[i] = Math.max(0, Math.min(255, select(r, g, b, luma(r, g, b))))
    }
    const { data: soft, info } = await sharp(picked, { raw: { width: w, height: h, channels: 1 } })
        .blur(Math.max(0.3, maskBlur))
        .toColourspace('b-w')
        .raw()
        .toBuffer({ resolveWithObject: true })
    if (info.channels !== 1) throw new Error(`mask blur returned ${info.channels} channels`)
    const out = Buffer.from(data)
    for (let i = 0; i < w * h; i++) {
        const m = soft[i] / 255
        if (!m) continue
        const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2]
        const to = apply(r, g, b, luma(r, g, b))
        out[i * 3] = Math.round(r + (to[0] - r) * m)
        out[i * 3 + 1] = Math.round(g + (to[1] - g) * m)
        out[i * 3 + 2] = Math.round(b + (to[2] - b) * m)
    }
    return encode(out, w, h)
}

/** Presets for `adjustMasked`, as `{select, apply}` factories. */
export const PRESETS = {
    /** Darkens pale blue-grey haze, water and distant trunks behind a foreground (the Mawood High Platform) and pale cloud specks; brown wood and warm flames stay. */
    haze: ({ keep = [0.2, 0.3, 0.34] } = {}) => ({
        select: (r, g, b, l) => ((b >= r - 2 && l > 60) || (l > 120 && b >= r - 3 && Math.max(r, g, b) - Math.min(r, g, b) < 28) ? (l - 60) * 5 + 90 : 0),
        apply: (r, g, b) => [r * keep[0], g * keep[1], b * keep[2]],
    }),
    /** Pushes brown or blue-black trunk pixels toward pale silver-grey, keeping the ink shading (`gain`, `lift`: luminance remap; `cool`: blue tint). */
    trunks: ({ gain = 1.9, lift = 55, cool = 0.12 } = {}) => ({
        select: (r, g, b, l) => (r - b > 8 && r >= g - 4 && l < 105 ? 255 : b >= r && l < 70 ? 150 : 0),
        apply: (r, g, b, l) => {
            const v = Math.min(235, l * gain + lift)
            return [v * (1 - cool), v, Math.min(255, v * (1 + cool))]
        },
    }),
}

/**
 * Covers each `box` ([x0, y0, x1, y1]) with the pixels found `from` ([dx, dy]) away, feathered by `feather` px. Choose an
 * offset along a railing or edge so lines continue; the box must not contain the thing it removes at the offset.
 */
export async function patch(buf, patches, { feather = 6 } = {}) {
    const { data, width: w, height: h } = await decode(buf)
    const out = Buffer.from(data)
    for (const { box: [x0, y0, x1, y1], from: [dx, dy] } of patches) {
        for (let y = y0 - feather; y < y1 + feather; y++) {
            for (let x = x0 - feather; x < x1 + feather; x++) {
                const sx = x + dx, sy = y + dy
                if (x < 0 || y < 0 || x >= w || y >= h || sx < 0 || sy < 0 || sx >= w || sy >= h) continue
                const ex = Math.min(x - (x0 - feather), x1 + feather - 1 - x, feather)
                const ey = Math.min(y - (y0 - feather), y1 + feather - 1 - y, feather)
                const m = Math.min(1, Math.min(ex, ey) / feather)
                for (let c = 0; c < 3; c++) out[(y * w + x) * 3 + c] = Math.round(data[(y * w + x) * 3 + c] * (1 - m) + data[(sy * w + sx) * 3 + c] * m)
            }
        }
    }
    return encode(out, w, h)
}

/** Drops a `px` border and scales back (a bright or black edge strip): the step the town-painterly family runs after generating. */
export const trimEdges = (buf, { px = 4 } = {}) => shave(buf, { px })

/**
 * Grid of `images` (paths or buffers) with a number badge and the mean luminance under each tile, in `cols` columns.
 * @returns {Promise<{png: Buffer, luminance: number[]}>}
 */
export async function montage(images, { cols = 4, tile = [340, 190] } = {}) {
    const [tw, th] = tile
    const label = 18
    const rows = Math.ceil(images.length / cols)
    const layers = []
    const luminance = []
    for (const [i, img] of images.entries()) {
        const buf = typeof img === 'string' ? await sharp(img).toBuffer() : img
        const { mean } = await imageStats(buf)
        luminance.push(mean)
        const left = (i % cols) * (tw + 4), top = Math.floor(i / cols) * (th + label + 4)
        layers.push({ input: await sharp(buf).resize(tw, th, { fit: 'cover' }).flatten({ background: '#ff00ff' }).png().toBuffer(), left, top })
        layers.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${tw}" height="${label}"><text x="4" y="14" font-family="Arial" font-size="14" font-weight="bold" fill="#fff">${i + 1}   lum ${Math.round(mean)}</text></svg>`), left, top: top + th })
    }
    const png = await sharp({ create: { width: cols * (tw + 4), height: rows * (th + label + 4), channels: 3, background: '#202020' } }).composite(layers).png().toBuffer()
    return { png, luminance }
}
