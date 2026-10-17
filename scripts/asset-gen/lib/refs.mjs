// Reference loader: prepares a family's reference images for CLIP vision.
// Small pixel refs are nearest-upscaled so CLIP sees crisp blocks instead of a blurry thumbnail.

import { join } from 'node:path'
import sharp from 'sharp'
import { REPO_ROOT } from '../styles.mjs'

export const REF_SIZE = 512
const GRAY = [128, 128, 128]
const rgb = ([r, g, b]) => ({ r, g, b })

/** Prepares one reference file as an opaque REF_SIZE² PNG (transparency flattened onto the family's `refBackground`, grey by default). */
export async function prepareRef(path, { pixel, alpha, refBackground = GRAY }) {
    const img = sharp(path)
    const fitMode = alpha ? 'contain' : 'cover'
    return img
        .resize(REF_SIZE, REF_SIZE, { fit: fitMode, kernel: pixel ? 'nearest' : 'lanczos3', background: { ...rgb(refBackground), alpha: 0 } })
        .flatten({ background: rgb(refBackground) })
        .png()
        .toBuffer()
}

/** @returns {Promise<{path: string, buffer: Buffer, base64: string}[]>} */
export async function loadRefs(family, root = REPO_ROOT) {
    return Promise.all(
        family.references.map(async (ref) => {
            const buffer = await prepareRef(join(root, ref), family)
            return { path: ref, buffer, base64: buffer.toString('base64') }
        }),
    )
}
