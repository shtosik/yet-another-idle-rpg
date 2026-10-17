// Deterministic QC for generated art: the mechanical defects a reviewer kept finding by eye (holes inside the body,
// detached fragments, subject cut off by the generation frame, wrong size, blown colour budget, a shiny that looks
// like its base).
// Flags are advice, not blocks: `generate` prints them per candidate, `--pick` repeats them, and
// test/art.test.mjs ratchets the committed art so a new defect fails a test.
//
// What this cannot judge (limb and head counts, species fidelity) stays with the agent's own review.

import sharp from 'sharp'

const raw = async (buf) => {
    const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    return { data, width: info.width, height: info.height }
}

const FOUR = [[1, 0], [-1, 0], [0, 1], [0, -1]]
const EIGHT = [...FOUR, [1, 1], [-1, -1], [1, -1], [-1, 1]]

/** Connected components of `mask` cells equal to `value`: [{size, border, pixels}]. */
function components(mask, width, height, value, neighbours) {
    const seen = new Uint8Array(mask.length)
    const out = []
    for (let start = 0; start < mask.length; start++) {
        if (seen[start] || mask[start] !== value) continue
        const stack = [start]
        seen[start] = 1
        let size = 0, border = false
        while (stack.length) {
            const p = stack.pop()
            size++
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
        out.push({ size, border })
    }
    return out
}

/**
 * QC options for a family (and enemy tier): what size and colour budget to expect. Opaque families only get those.
 */
export function qcOptionsFor(family, tierPx) {
    return {
        transparent: !!family.alpha,
        expected: tierPx ? { longer: tierPx } : { width: family.target[0], height: family.target[1] },
        colours: family.post?.find(([name]) => name === 'quantize')?.[1]?.colors,
    }
}

/**
 * @param {Buffer} buf  PNG
 * @param {{transparent?: boolean, expected?: {width?: number, height?: number, longer?: number}, colours?: number,
 *          holeRatio?: number, fragmentRatio?: number}} [opts]
 * @returns {Promise<{flags: string[], metrics: object}>}
 */
export async function qcSprite(buf, { transparent = true, expected, colours, holeRatio = 0.01, fragmentRatio = 0.003 } = {}) {
    const { data, width, height } = await raw(buf)
    const flags = []
    const metrics = { width, height }

    if (expected?.longer && Math.max(width, height) !== expected.longer) flags.push(`size:${width}x${height} (longer side should be ${expected.longer})`)
    if (expected?.width && (width !== expected.width || height !== expected.height)) flags.push(`size:${width}x${height} (expected ${expected.width}x${expected.height})`)

    const palette = new Set()
    for (let i = 0; i < data.length; i += 4) palette.add(data.readUInt32LE(i))
    metrics.colours = palette.size
    if (colours && palette.size > colours) flags.push(`colours:${palette.size} (budget ${colours})`)

    if (!transparent) return { flags, metrics }

    const mask = new Uint8Array(width * height)
    let opaque = 0
    for (let p = 0; p < mask.length; p++) {
        if (data[p * 4 + 3] > 127) {
            mask[p] = 1
            opaque++
        }
    }
    metrics.opaque = opaque
    if (!opaque) return { flags: [...flags, 'empty'], metrics }

    const parts = components(mask, width, height, 1, EIGHT).sort((a, b) => b.size - a.size)
    const fragments = parts.slice(1).filter((c) => c.size >= fragmentRatio * parts[0].size)
    const specks = parts.slice(1).length - fragments.length
    metrics.parts = parts.length
    if (fragments.length) flags.push(`fragments:${fragments.length} detached part(s) (floating or duplicated pieces)`)
    if (specks >= 3) flags.push(`specks:${specks} stray pixels`)

    const holes = components(mask, width, height, 0, FOUR).filter((c) => !c.border)
    const holeArea = holes.reduce((sum, c) => sum + c.size, 0)
    metrics.holeRatio = Math.round((holeArea / (opaque + holeArea)) * 10000) / 10000
    if (metrics.holeRatio > holeRatio) flags.push(`holes:${(metrics.holeRatio * 100).toFixed(1)}% of the body is enclosed transparency`)

    return { flags, metrics }
}

/**
 * Cut-off check on the RAW generation (final sprites are trimmed, so they always touch their own canvas edge): the
 * backdrop is flat, so border pixels far from the median border colour mean the subject runs off the frame.
 * @returns {Promise<string[]>} flags (empty = fits in frame)
 */
export async function rawQc(rawBuf, { distance = 60, ratio = 0.01 } = {}) {
    const { data, width, height } = await raw(rawBuf)
    const border = []
    for (let x = 0; x < width; x++) border.push(['top', x, 0], ['bottom', x, height - 1])
    for (let y = 1; y < height - 1; y++) border.push(['left', 0, y], ['right', width - 1, y])
    const med = (c) => {
        const v = border.map(([, x, y]) => data[(y * width + x) * 4 + c]).sort((a, b) => a - b)
        return v[v.length >> 1]
    }
    const bg = [med(0), med(1), med(2)]
    const off = { top: 0, bottom: 0, left: 0, right: 0 }
    for (const [side, x, y] of border) {
        const i = (y * width + x) * 4
        if (Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2]) > distance) off[side]++
    }
    const sides = Object.entries(off).filter(([side, n]) => n > ratio * (side === 'top' || side === 'bottom' ? width : height)).map(([side]) => side)
    return sides.length ? [`cutoff:${sides.join(',')} (subject runs off the generated frame)`] : []
}

/**
 * Mean RGB distance (0–441) between a sprite and its shiny over pixels opaque in both. A hue rotation that
 * changes nothing visible (grey rat, white gull) scores near zero.
 */
export async function shinyDelta(baseBuf, shinyBuf) {
    const base = await raw(baseBuf)
    const shiny = await raw(shinyBuf)
    if (base.width !== shiny.width || base.height !== shiny.height) return Infinity
    let sum = 0, n = 0
    for (let i = 0; i < base.data.length; i += 4) {
        if (base.data[i + 3] < 128 || shiny.data[i + 3] < 128) continue
        sum += Math.hypot(base.data[i] - shiny.data[i], base.data[i + 1] - shiny.data[i + 1], base.data[i + 2] - shiny.data[i + 2])
        n++
    }
    return n ? sum / n : 0
}

/** Minimum shiny delta that reads as a different creature at game size. */
export const SHINY_MIN_DELTA = 25
