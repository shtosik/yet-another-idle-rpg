// Frozen source images (refs/control/<name>-source.png, drawn by Z-Image and checked by eye) that SDXL repaints.

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import sharp from 'sharp'

/**
 * Loads a repo-relative source image and fits it to the family's generation size on white (the background
 * `--zimage` sources are drawn on), so the repaint keeps the source's proportions.
 * `exact`: the image must already be that size (inpaint sources, masks and region images line up pixel for pixel,
 * and a letterbox would put white bars into the context).
 * @returns {Promise<Buffer>} PNG
 */
export async function prepareSource(path, [width, height], root, { exact = false } = {}) {
    const file = resolve(root, path)
    if (!existsSync(file)) throw new Error(`Source image not found: ${path}`)
    if (exact) {
        const meta = await sharp(file).metadata()
        if (meta.width !== width || meta.height !== height) throw new Error(`${path} is ${meta.width}×${meta.height}, the family generates ${width}×${height}: an inpaint needs images at exactly that size`)
        return sharp(readFileSync(file)).removeAlpha().png().toBuffer()
    }
    return sharp(readFileSync(file))
        .resize(width, height, { fit: 'contain', background: '#ffffff' })
        .flatten({ background: '#ffffff' })
        .png()
        .toBuffer()
}
