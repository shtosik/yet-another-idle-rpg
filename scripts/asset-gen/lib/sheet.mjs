// Contact sheet: a reference row above a numbered candidate row, so a reviewer (human or agent) can judge style
// fit at a glance. Pixel families are shown with nearest-neighbour scaling (4× where it fits).

import sharp from 'sharp'

const BG = { r: 90, g: 90, b: 96 }
const GAP = 12
const MAX_TILE = 400

// 3×5 bitmap digits so numbering needs no font support from the host.
const DIGITS = {
    0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001',
    5: '111100111001111', 6: '111100111101111', 7: '111001001001001', 8: '111101111101111', 9: '111101111001111',
}

/** RGBA badge with `n` drawn in 3×5 digits at `scale`, white on dark. */
export function badge(n, scale) {
    const digits = String(n).split('')
    const w = (digits.length * 4 + 1) * scale
    const h = 7 * scale
    const data = Buffer.alloc(w * h * 4)
    const set = (x, y, rgba) => rgba.forEach((v, k) => (data[(y * w + x) * 4 + k] = v))
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) set(x, y, [20, 20, 28, 230])
    digits.forEach((d, di) => {
        for (let gy = 0; gy < 5; gy++) {
            for (let gx = 0; gx < 3; gx++) {
                if (DIGITS[d][gy * 3 + gx] !== '1') continue
                for (let sy = 0; sy < scale; sy++) {
                    for (let sx = 0; sx < scale; sx++) set((di * 4 + 1 + gx) * scale + sx, (1 + gy) * scale + sy, [255, 255, 255, 255])
                }
            }
        }
    })
    return sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer()
}

/** Display size of one tile for a `[w, h]` target: 4× when that fits MAX_TILE, otherwise fit the longer side. */
export function tileSize([w, h]) {
    const factor = Math.min(4, MAX_TILE / Math.max(w, h))
    return [Math.max(1, Math.round(w * factor)), Math.max(1, Math.round(h * factor))]
}

/**
 * @param {{refs: Buffer[], candidates: Buffer[], target: [number, number], pixel: boolean}} p
 * @returns {Promise<Buffer>} PNG sheet
 */
export async function makeSheet({ refs, candidates, target, pixel }) {
    const [tw, th] = tileSize(target)
    const kernel = pixel ? 'nearest' : 'lanczos3'
    const tile = (buf, fitMode) =>
        sharp(buf).resize(tw, th, { fit: fitMode, kernel, background: { ...BG, alpha: 0 } }).png().toBuffer()

    const cols = Math.max(refs.length, candidates.length, 1)
    const rows = refs.length ? 2 : 1
    const width = GAP + cols * (tw + GAP)
    const height = GAP + rows * (th + GAP)
    const layers = []
    const place = async (buffers, row, fitMode, numbered) => {
        for (const [i, buf] of buffers.entries()) {
            const left = GAP + i * (tw + GAP)
            const top = GAP + row * (th + GAP)
            layers.push({ input: await tile(buf, fitMode), left, top })
            if (numbered) layers.push({ input: await badge(i + 1, 3), left, top })
        }
    }
    let row = 0
    if (refs.length) await place(refs, row++, 'contain', false)
    await place(candidates, row, 'contain', true)

    return sharp({ create: { width, height, channels: 3, background: BG } }).composite(layers).png().toBuffer()
}
