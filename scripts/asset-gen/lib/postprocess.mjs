// Pure Buffer -> Buffer post-process steps for generated art (sharp only).
// Every step takes and returns an encoded PNG buffer so family `post` lists can compose them freely.

import sharp from 'sharp'

const raw = async (buf) => {
    const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    return { data, width: info.width, height: info.height }
}
const png = (data, width, height) => sharp(data, { raw: { width, height, channels: 4 } }).png().toBuffer()

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 }

/** In-bounds 4-neighbourhood of (x, y) as `[nx, ny]` pairs. */
const neighbours4 = (x, y, width, height) =>
    [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < width && ny < height)

/**
 * Corner-seeded BFS flood-fill background remover. Only pixels contiguously connected to a corner by colour
 * similarity become transparent, so a subject colour close to the background is safe unless it touches the frame.
 * Feathering is a box blur on the alpha plane only — never sharp `.blur()` on a raw buffer, which silently
 * promotes it to 3 channels and corrupts alpha byte alignment.
 */
export async function keyout(buf, { threshold = 40, feather = 1 } = {}) {
    const { data, width, height } = await raw(buf)
    const idx = (x, y) => (y * width + x) * 4
    const cornerIdx = idx(0, 0)
    const colourDistance = (i) =>
        Math.hypot(data[i] - data[cornerIdx], data[i + 1] - data[cornerIdx + 1], data[i + 2] - data[cornerIdx + 2])

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
        const x = queue[qi++]
        const y = queue[qi++]
        isBg[y * width + x] = 1
        for (const [nx, ny] of neighbours4(x, y, width, height)) {
            const np = ny * width + nx
            if (visited[np] || colourDistance(idx(nx, ny)) >= threshold) continue
            visited[np] = 1
            queue.push(nx, ny)
        }
    }

    let alpha = Uint8Array.from(isBg, (v) => (v ? 0 : 255))
    for (let pass = 0; pass < feather; pass++) {
        const next = new Uint8Array(alpha)
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let sum = 0
                let count = 0
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
        ? sharp(cropped).extend({ top: pad, bottom: pad, left: pad, right: pad, background: TRANSPARENT }).png().toBuffer()
        : cropped
}

/**
 * Area-averages the image down to an art-pixel grid, then scales back up with nearest-neighbour so every art pixel
 * is a crisp block. Two modes:
 *  - `grid`: the longer side becomes `grid` art pixels (aspect kept). With `width`/`height` the result is exactly
 *    that size (subject contained and centred on transparent), otherwise the cell grid itself is returned.
 *  - `block`: each `block`×`block` output square is one art pixel; dimensions are unchanged.
 * Colour is alpha-weighted so transparent pixels never bleed into the subject; alpha snaps to 0/255 at `alphaCut`.
 */
export async function pixelate(buf, { grid, block, width, height, alphaCut = 128 }) {
    const src = await raw(buf)
    let cellsWide, cellsHigh
    if (block) {
        cellsWide = Math.ceil(src.width / block)
        cellsHigh = Math.ceil(src.height / block)
    } else {
        const scale = grid / Math.max(src.width, src.height)
        cellsWide = Math.max(1, Math.round(src.width * scale))
        cellsHigh = Math.max(1, Math.round(src.height * scale))
    }
    const cells = Buffer.alloc(cellsWide * cellsHigh * 4)
    for (let cy = 0; cy < cellsHigh; cy++) {
        const top = Math.floor((cy * src.height) / cellsHigh)
        const bottom = Math.max(top + 1, Math.floor(((cy + 1) * src.height) / cellsHigh))
        for (let cx = 0; cx < cellsWide; cx++) {
            const left = Math.floor((cx * src.width) / cellsWide)
            const right = Math.max(left + 1, Math.floor(((cx + 1) * src.width) / cellsWide))
            let redSum = 0
            let greenSum = 0
            let blueSum = 0
            let alphaSum = 0
            let pixelCount = 0
            for (let y = top; y < bottom; y++) {
                for (let x = left; x < right; x++) {
                    const i = (y * src.width + x) * 4
                    const weight = src.data[i + 3]
                    redSum += src.data[i] * weight
                    greenSum += src.data[i + 1] * weight
                    blueSum += src.data[i + 2] * weight
                    alphaSum += weight
                    pixelCount++
                }
            }
            const o = (cy * cellsWide + cx) * 4
            if (alphaSum > 0) {
                cells[o] = Math.round(redSum / alphaSum)
                cells[o + 1] = Math.round(greenSum / alphaSum)
                cells[o + 2] = Math.round(blueSum / alphaSum)
            }
            cells[o + 3] = alphaSum / pixelCount >= alphaCut ? 255 : 0
        }
    }
    const small = await png(cells, cellsWide, cellsHigh)
    if (block) {
        return sharp(small).resize(src.width, src.height, { kernel: 'nearest', fit: 'fill' }).png().toBuffer()
    }
    if (!width || !height) return small
    return fit(small, { width, height })
}

/** Reduces to at most `colors` palette entries (no dithering, so pixel art stays flat). */
export function quantize(buf, { colors = 16 } = {}) {
    return sharp(buf).png({ palette: true, colours: colors, dither: 0 }).toBuffer()
}

/**
 * Paints a `color` border on transparent pixels that touch an opaque pixel (4-neighbourhood), `thickness` times.
 * Opaque pixels are never modified, so the silhouette stays intact.
 */
export async function outline(buf, { thickness = 1, color = [24, 16, 32] } = {}) {
    const { data, width, height } = await raw(buf)
    const [red, green, blue] = color
    for (let pass = 0; pass < thickness; pass++) {
        const edge = []
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (data[(y * width + x) * 4 + 3] !== 0) continue
                const touchesSubject = neighbours4(x, y, width, height).some(([nx, ny]) => data[(ny * width + nx) * 4 + 3] > 0)
                if (touchesSubject) edge.push((y * width + x) * 4)
            }
        }
        for (const i of edge) {
            data[i] = red
            data[i + 1] = green
            data[i + 2] = blue
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
export function fit(buf, { width, height }) {
    return sharp(buf)
        .resize(width, height, { fit: 'contain', kernel: 'nearest', background: TRANSPARENT })
        .png()
        .toBuffer()
}

export const STEPS = { keyout, trim, pixelate, quantize, outline, cover, fit }

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
