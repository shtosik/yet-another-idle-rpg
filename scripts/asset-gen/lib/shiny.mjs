// Shiny variants are separate hue-shifted files at `<name>-shiny.png` beside the base sprite (the runtime derives the
// path with `toShinyUrl`). The hue angle is per enemy: estimated from the legacy base/shiny pair, stored in the
// manifest as `shinyHue`, and overridable by flag.

import sharp from 'sharp'

/** `<dir>/<name>.png` -> `<dir>/<name>-shiny.png` (same rule as src/utils/shiny-url.ts). */
export const shinyPathFor = (target) => target.replace(/\.png$/i, '-shiny.png')

/** Rotates hue by `degrees` via sharp `modulate`; alpha is preserved. */
export function hueShift(buf, degrees) {
    return sharp(buf).ensureAlpha().modulate({ hue: ((degrees % 360) + 360) % 360 }).png().toBuffer()
}

const SAMPLE = 48

const sampled = async (buf, width, height) => {
    const { data } = await sharp(buf).ensureAlpha().resize(width, height, { fit: 'fill', kernel: 'nearest' }).raw().toBuffer({ resolveWithObject: true })
    return data
}

/**
 * Finds the hue angle (0–359°) that, applied with `hueShift`, makes `base` look most like `shiny`. Searches the same
 * operation the generator applies, comparing only pixels opaque in both, on a downscaled copy.
 */
export async function estimateHue(baseBuf, shinyBuf) {
    const meta = await sharp(baseBuf).metadata()
    const scale = Math.min(1, SAMPLE / Math.max(meta.width, meta.height))
    const w = Math.max(1, Math.round(meta.width * scale)), h = Math.max(1, Math.round(meta.height * scale))
    const small = await sharp(baseBuf).resize(w, h, { kernel: 'nearest' }).png().toBuffer()
    const target = await sampled(shinyBuf, w, h)

    const error = async (angle) => {
        const shifted = await sampled(await hueShift(small, angle), w, h)
        let sum = 0, n = 0
        for (let i = 0; i < shifted.length; i += 4) {
            if (shifted[i + 3] < 128 || target[i + 3] < 128) continue
            sum += Math.hypot(shifted[i] - target[i], shifted[i + 1] - target[i + 1], shifted[i + 2] - target[i + 2])
            n++
        }
        return n ? sum / n : Infinity
    }
    let best = { angle: 0, err: Infinity }
    for (let angle = 0; angle < 360; angle += 10) {
        const err = await error(angle)
        if (err < best.err) best = { angle, err }
    }
    for (let angle = best.angle - 8; angle <= best.angle + 8; angle += 2) {
        const a = (angle + 360) % 360
        const err = await error(a)
        if (err < best.err) best = { angle: a, err }
    }
    return best.angle
}
