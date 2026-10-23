// Turns a checked source image (a Z-Image structure on white, or any cutout) into a silhouette control: the
// creature's outline as white on black, 1024², centred with a margin. Only the outline is fixed, so colour, markings
// and texture follow the prompt (the spider control works this way).

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { matte, trim } from './postprocess.mjs'

const SIZE = 1024
const MARGIN = 0.86 // the longer side of the creature fills this share of the frame

/** Uses the image's own alpha when it has one (a cutout), otherwise mattes the background away. */
async function cutout(buf) {
    const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    let transparent = 0
    for (let p = 0; p < info.width * info.height; p++) if (data[p * 4 + 3] < 250) transparent++
    const hasAlpha = transparent > 0.01 * info.width * info.height
    const rgba = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer()
    // holeArea 0: the gap inside a bow or between limbs must stay empty in the silhouette
    return trim(hasAlpha ? rgba : await matte(rgba, { holeArea: 0 }))
}

/**
 * Grows a white-on-black mask by about `px` pixels (blur, then threshold: a step edge crosses the threshold 1.5
 * sigma out). Thin lines grow too, so a 2 px bowstring becomes `px` wide.
 */
async function grow(png, px) {
    // two pipelines on purpose: within one, sharp applies threshold() before blur(), which grows nothing
    const blurred = await sharp(png).blur(Math.max(0.3, px / 1.5)).png().toBuffer()
    return sharp(blurred).threshold(16).greyscale().png().toBuffer()
}

/**
 * @param {Buffer} buf
 * @param {{thicken?: number}} [opts] thicken: grow the outline by this many px (at 1024). One art pixel of a small
 *        sprite is about 14 px of the generation, so a line thinner than that (bowstring, whip, antenna) vanishes in
 *        the pixelate step unless the control makes it thicker.
 * @returns {Promise<Buffer>} PNG, 1024² greyscale, white subject on black
 */
export async function makeSilhouette(buf, { thicken = 0 } = {}) {
    const cut = await cutout(buf)
    const meta = await sharp(cut).metadata()
    const k = (SIZE * MARGIN) / Math.max(meta.width, meta.height)
    const fitted = await sharp(cut).resize(Math.max(1, Math.round(meta.width * k)), Math.max(1, Math.round(meta.height * k)), { kernel: 'nearest' }).png().toBuffer()
    const fm = await sharp(fitted).metadata()
    const alphaOnly = await sharp(fitted).extractChannel(3).toColourspace('b-w').png().toBuffer()
    const silhouette = await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: '#000000' } })
        .composite([{ input: alphaOnly, left: (SIZE - fm.width) >> 1, top: (SIZE - fm.height) >> 1 }])
        .flatten({ background: '#000000' })
        .greyscale()
        .png()
        .toBuffer()
    return thicken > 0 ? grow(silhouette, thicken) : silhouette
}

/**
 * Freezes `from` as `<dir>/<name>-source.png` and its silhouette as `<dir>/<name>.png`, which then loads as
 * `--control <name>` (see lib/controls.mjs). Overwrites a control of the same name.
 * `hand` ([x, y] in the 1024² silhouette, with `angle` and `scale`) is stored as `<name>.json` so `--weapon` can draw
 * a weapon into an empty-handed pose.
 */
export async function makeControl({ name, from, dir, thicken = 0, hand, angle, scale }) {
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(name)) throw new Error(`Control name "${name}" must be letters and digits only`)
    const source = readFileSync(from)
    const silhouette = await makeSilhouette(source, { thicken })
    mkdirSync(dir, { recursive: true })
    copyFileSync(from, join(dir, `${name}-source.png`))
    writeFileSync(join(dir, `${name}.png`), silhouette)
    const meta = hand ? { hand, ...(angle !== undefined && { angle }), ...(scale !== undefined && { scale }) } : null
    if (meta) writeFileSync(join(dir, `${name}.json`), `${JSON.stringify(meta)}\n`)
    return { name, source: join(dir, `${name}-source.png`), control: join(dir, `${name}.png`), meta }
}
