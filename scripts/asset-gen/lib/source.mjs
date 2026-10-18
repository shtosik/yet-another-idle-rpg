// Frozen source images (refs/control/<name>-source.png, drawn by Z-Image and checked by eye) that SDXL repaints.

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import sharp from 'sharp'

/**
 * Loads a repo-relative source image and fits it to the family's generation size on white (the background
 * `--zimage` sources are drawn on), so the repaint keeps the source's proportions.
 * @returns {Promise<Buffer>} PNG
 */
export async function prepareSource(path, [width, height], root) {
    const file = resolve(root, path)
    if (!existsSync(file)) throw new Error(`Source image not found: ${path}`)
    return sharp(readFileSync(file))
        .resize(width, height, { fit: 'contain', background: '#ffffff' })
        .flatten({ background: '#ffffff' })
        .png()
        .toBuffer()
}
