// Review montage: many sprites flattened onto a contrasting colour (default saturated blue) at a readable zoom, with
// numbered badges. The generation sheet's dark-grey backdrop hides grey residue, holes and slabs; this makes them
// obvious. Inputs are PNG files or directories (a directory contributes its PNGs, skipping sheet.png, raw-N.png and,
// unless `pairs`, -shiny files).

import { existsSync, readdirSync, statSync } from 'node:fs'
import { basename, join } from 'node:path'
import sharp from 'sharp'
import { badge } from './sheet.mjs'
import { shinyPathFor } from './shiny.mjs'

const GAP = 6

/** Expands files/directories into a sorted list of PNG paths. */
export function collectImages(inputs, { pairs = false } = {}) {
    const files = []
    for (const input of inputs) {
        if (!existsSync(input)) throw new Error(`Not found: ${input}`)
        if (statSync(input).isDirectory()) {
            for (const name of readdirSync(input).sort()) {
                if (!/\.png$/i.test(name) || name === 'sheet.png' || /^raw-\d+\.png$/.test(name)) continue
                if (!pairs && /-shiny\.png$/i.test(name)) continue
                files.push(join(input, name))
            }
        } else files.push(input)
    }
    // pairs: each base is followed by its shiny; a shiny listed on its own is dropped to avoid showing it twice
    if (!pairs) return files
    return files.filter((f) => !/-shiny\.png$/i.test(f)).flatMap((f) => (existsSync(shinyPathFor(f)) ? [f, shinyPathFor(f)] : [f]))
}

/**
 * @param {string[]} files
 * @param {{bg?: string, cols?: number, cell?: number}} [opts]
 * @returns {Promise<{buffer: Buffer, items: {n: number, file: string}[]}>}
 */
export async function makeMontage(files, { bg = '#00aaff', cols = 6, cell = 300 } = {}) {
    if (!files.length) throw new Error('Nothing to show: no PNG files found')
    const rows = Math.ceil(files.length / cols)
    const layers = []
    for (const [i, file] of files.entries()) {
        const left = (i % cols) * (cell + GAP) + GAP
        const top = Math.floor(i / cols) * (cell + GAP) + GAP
        const tile = await sharp(file)
            .flatten({ background: bg })
            .resize(cell, cell, { fit: 'contain', kernel: 'nearest', background: bg })
            .png()
            .toBuffer()
        layers.push({ input: tile, left, top }, { input: await badge(i + 1, 3), left, top })
    }
    const buffer = await sharp({
        create: { width: cols * (cell + GAP) + GAP, height: rows * (cell + GAP) + GAP, channels: 3, background: '#202020' },
    })
        .composite(layers)
        .png()
        .toBuffer()
    return { buffer, items: files.map((file, i) => ({ n: i + 1, file: basename(file) === file ? file : file })) }
}
