// Pure Buffer -> Buffer post-process steps for generated art (sharp only).
// Every step takes and returns an encoded PNG buffer so family `post` lists can compose them freely.

import { execFile } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import sharp from 'sharp'

const run = promisify(execFile)
const SERVER_DIR = join(process.env.APPDATA ?? '', 'krita', 'ai_diffusion', 'server')
export const MATTE_PYTHON = process.env.ASSET_GEN_PYTHON ?? join(SERVER_DIR, 'venv', 'Scripts', 'python.exe')
export const MATTE_MODEL = process.env.ASSET_GEN_MATTE_MODEL ?? join(SERVER_DIR, 'models', 'matting', 'isnet-general-use.onnx')
const MATTE_SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '..', 'py', 'matte.py')

const raw = async (buf) => {
    const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    return { data, width: info.width, height: info.height }
}
const png = (data, width, height) => sharp(data, { raw: { width, height, channels: 4 } }).png().toBuffer()

/**
 * Corner-seeded BFS flood-fill background remover. Only pixels contiguously connected to a corner by colour
 * similarity become transparent, so a subject colour close to the background is safe unless it touches the frame.
 * Feathering is a box blur on the alpha plane only — never sharp `.blur()` on a raw buffer, which silently
 * promotes it to 3 channels and corrupts alpha byte alignment.
 */
export async function keyout(buf, { threshold = 40, feather = 1 } = {}) {
    const { data, width, height } = await raw(buf)
    const idx = (x, y) => (y * width + x) * 4
    const refIdx = idx(0, 0)
    const dist = (i) => Math.hypot(data[i] - data[refIdx], data[i + 1] - data[refIdx + 1], data[i + 2] - data[refIdx + 2])

    const isBg = new Uint8Array(width * height)
    const visited = new Uint8Array(width * height)
    const queue = []
    for (const [x, y] of [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]]) {
        if (!visited[y * width + x]) {
            visited[y * width + x] = 1
            queue.push(x, y)
        }
    }
    for (let qi = 0; qi < queue.length;) {
        const x = queue[qi++], y = queue[qi++]
        isBg[y * width + x] = 1
        for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
            const np = ny * width + nx
            if (visited[np] || dist(idx(nx, ny)) >= threshold) continue
            visited[np] = 1
            queue.push(nx, ny)
        }
    }

    let alpha = Uint8Array.from(isBg, (v) => (v ? 0 : 255))
    for (let pass = 0; pass < feather; pass++) {
        const next = new Uint8Array(alpha)
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let sum = 0, count = 0
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = x + dx, ny = y + dy
                        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
                        sum += alpha[ny * width + nx]
                        count++
                    }
                }
                next[y * width + x] = Math.round(sum / count)
            }
        }
        alpha = next
    }
    for (let p = 0; p < width * height; p++) data[p * 4 + 3] = alpha[p]
    return png(data, width, height)
}

/**
 * Cleans a binary mask (1 = subject): drops subject specks smaller than `minArea` pixels and fills background
 * holes (not connected to the border) smaller than `holeArea` pixels, then erodes `erode` px so no background-coloured
 * fringe survives. Pure function over a Uint8Array, 8-connected for subject, 4-connected for background.
 */
export function cleanMask(mask, width, height, { minArea, holeArea, erode = 0 }) {
    const label = (value, neighbours, keep) => {
        // returns components of `value` pixels as arrays of indices that satisfy keep(size, touchesBorder)
        const seen = new Uint8Array(width * height)
        for (let start = 0; start < mask.length; start++) {
            if (seen[start] || mask[start] !== value) continue
            const stack = [start]
            const pixels = []
            let border = false
            seen[start] = 1
            while (stack.length) {
                const p = stack.pop()
                pixels.push(p)
                const x = p % width, y = (p - x) / width
                if (x === 0 || y === 0 || x === width - 1 || y === height - 1) border = true
                for (const [dx, dy] of neighbours) {
                    const nx = x + dx, ny = y + dy
                    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
                    const np = ny * width + nx
                    if (!seen[np] && mask[np] === value) {
                        seen[np] = 1
                        stack.push(np)
                    }
                }
            }
            if (keep(pixels.length, border)) for (const p of pixels) mask[p] = 1 - value
        }
    }
    const four = [[1, 0], [-1, 0], [0, 1], [0, -1]]
    const eight = [...four, [1, 1], [-1, -1], [1, -1], [-1, 1]]
    label(1, eight, (size) => size < minArea)
    label(0, four, (size, border) => !border && size < holeArea)
    for (let pass = 0; pass < erode; pass++) {
        const next = Uint8Array.from(mask)
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const p = y * width + x
                if (!mask[p]) continue
                if (x === 0 || y === 0 || x === width - 1 || y === height - 1 || four.some(([dx, dy]) => !mask[p + dy * width + dx])) next[p] = 0
            }
        }
        mask.set(next)
    }
    return mask
}

/**
 * Removes the background with a matting model (ISNet via onnxruntime in the ComfyUI venv), which handles pockets
 * between limbs, light subjects on a light background, and ground shadows that colour keying cannot. The mask is
 * thresholded and cleaned (see cleanMask); thresholds are fractions of the image area.
 */
export async function matte(buf, { threshold = 128, minArea = 0.001, holeArea = 0.003, erode = 1 } = {}) {
    if (!existsSync(MATTE_MODEL)) {
        throw new Error(`Matting model not found at ${MATTE_MODEL}. Download it once: curl -L -o "${MATTE_MODEL}" https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx`)
    }
    const { data, width, height } = await raw(buf)
    const dir = mkdtempSync(join(tmpdir(), 'matte-'))
    try {
        const input = join(dir, 'in.png'), output = join(dir, 'mask.png')
        writeFileSync(input, buf)
        await run(MATTE_PYTHON, [MATTE_SCRIPT, MATTE_MODEL, input, output], { windowsHide: true, maxBuffer: 1 << 24 })
        const soft = await sharp(readFileSync(output)).greyscale().raw().toBuffer()
        const mask = Uint8Array.from(soft, (v) => (v >= threshold ? 1 : 0))
        const area = width * height
        cleanMask(mask, width, height, { minArea: Math.round(minArea * area), holeArea: Math.round(holeArea * area), erode })
        for (let p = 0; p < mask.length; p++) data[p * 4 + 3] = mask[p] ? 255 : 0
        return png(data, width, height)
    } finally {
        rmSync(dir, { recursive: true, force: true })
    }
}

/** Crops to the bounding box of pixels with alpha above `alphaMin`, plus `pad` transparent pixels. */
export async function trim(buf, { alphaMin = 8, pad = 0 } = {}) {
    const { data, width, height } = await raw(buf)
    let minX = width, minY = height, maxX = -1, maxY = -1
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (data[(y * width + x) * 4 + 3] <= alphaMin) continue
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
        }
    }
    if (maxX < 0) return buf
    const cropped = await sharp(buf).extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 }).png().toBuffer()
    return pad
        ? sharp(cropped).extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
        : cropped
}

/**
 * Area-averages the image down to an art-pixel grid, then scales back up with nearest-neighbour so every art pixel
 * is a crisp block. Two modes:
 *  - `grid`: the longer side becomes `grid` art pixels (aspect kept), plus `pad` transparent cells on every side
 *    (room for the outline). With `width`/`height` the result is exactly that size (subject contained and centred on
 *    transparent); otherwise the cell grid itself is returned.
 *  - `block`: each `block`×`block` output square is one art pixel; dimensions are unchanged.
 * Colour is alpha-weighted so transparent pixels never bleed into the subject; alpha snaps to 0/255 at `alphaCut`.
 */
export async function pixelate(buf, { grid, block, width, height, pad = 0, alphaCut = 128 }) {
    const src = await raw(buf)
    let cw, ch
    if (block) {
        cw = Math.ceil(src.width / block)
        ch = Math.ceil(src.height / block)
    } else {
        const scale = grid / Math.max(src.width, src.height)
        cw = Math.max(1, Math.round(src.width * scale))
        ch = Math.max(1, Math.round(src.height * scale))
    }
    const cells = Buffer.alloc(cw * ch * 4)
    for (let cy = 0; cy < ch; cy++) {
        const y0 = Math.floor((cy * src.height) / ch)
        const y1 = Math.max(y0 + 1, Math.floor(((cy + 1) * src.height) / ch))
        for (let cx = 0; cx < cw; cx++) {
            const x0 = Math.floor((cx * src.width) / cw)
            const x1 = Math.max(x0 + 1, Math.floor(((cx + 1) * src.width) / cw))
            let r = 0, g = 0, b = 0, a = 0, n = 0
            for (let y = y0; y < y1; y++) {
                for (let x = x0; x < x1; x++) {
                    const i = (y * src.width + x) * 4
                    const w = src.data[i + 3]
                    r += src.data[i] * w
                    g += src.data[i + 1] * w
                    b += src.data[i + 2] * w
                    a += w
                    n++
                }
            }
            const o = (cy * cw + cx) * 4
            if (a > 0) {
                cells[o] = Math.round(r / a)
                cells[o + 1] = Math.round(g / a)
                cells[o + 2] = Math.round(b / a)
            }
            cells[o + 3] = a / n >= alphaCut ? 255 : 0
        }
    }
    let small = await png(cells, cw, ch)
    if (pad) small = await sharp(small).extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
    if (block) {
        return sharp(small).resize(src.width, src.height, { kernel: 'nearest', fit: 'fill' }).png().toBuffer()
    }
    if (!width || !height) return small
    return fit(small, { width, height })
}

/** Nearest-neighbour integer up-scale: every art pixel becomes a `factor`×`factor` block. */
export async function upscale(buf, { factor }) {
    const meta = await sharp(buf).metadata()
    return sharp(buf).resize(meta.width * factor, meta.height * factor, { kernel: 'nearest' }).png().toBuffer()
}

/** Reduces to at most `colors` palette entries (no dithering, so pixel art stays flat). */
export function quantize(buf, { colors = 16 } = {}) {
    return sharp(buf).png({ palette: true, colours: colors, dither: 0 }).toBuffer()
}

/**
 * Paints a `color` border on transparent pixels that touch an opaque pixel (4-neighbourhood), `px` times.
 * Opaque pixels are never modified, so the silhouette stays intact.
 */
export async function outline(buf, { px = 1, color = [24, 16, 32] } = {}) {
    const { data, width, height } = await raw(buf)
    for (let pass = 0; pass < px; pass++) {
        const edge = []
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (data[(y * width + x) * 4 + 3] !== 0) continue
                const touches = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(
                    ([nx, ny]) => nx >= 0 && ny >= 0 && nx < width && ny < height && data[(ny * width + nx) * 4 + 3] > 0,
                )
                if (touches) edge.push((y * width + x) * 4)
            }
        }
        for (const i of edge) {
            data[i] = color[0]
            data[i + 1] = color[1]
            data[i + 2] = color[2]
            data[i + 3] = 255
        }
    }
    return png(data, width, height)
}

/** Resizes to fill exactly `width`×`height`, cropping the overflow (never distorts). */
export function cover(buf, { width, height }) {
    return sharp(buf).resize(width, height, { fit: 'cover', kernel: 'lanczos3' }).png().toBuffer()
}

/** Scales to fit inside `width`×`height` (nearest, to keep pixel art crisp) and pads with transparency. */
export async function fit(buf, { width, height, position = 'centre' }) {
    return sharp(buf)
        .resize(width, height, { fit: 'contain', kernel: 'nearest', position, background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
}

export const STEPS = { matte, keyout, trim, pixelate, upscale, quantize, outline, cover, fit }

/** Runs a family `post` list: `[['keyout', {…}], ['trim'], …]`. */
export async function runPipeline(buf, steps) {
    let out = buf
    for (const [name, params] of steps) {
        const step = STEPS[name]
        if (!step) throw new Error(`Unknown post-process step "${name}"`)
        out = await step(out, params)
    }
    return out
}
