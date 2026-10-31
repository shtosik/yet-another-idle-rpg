#!/usr/bin/env node
// World-map windows: grow the map one 672×376 window at a time, drawn at 2× by the map-painterly family as an inpaint.
//
//   node scripts/asset-gen/map-window.mjs init --from src/assets/img/world/source.png --size <W>x<H> --canvas .tmp-gen/map/canvas.png
//        # RGBA canvas at the new map size; transparent = not drawn yet
//   node scripts/asset-gen/map-window.mjs prep --canvas <png> --left 600 --top 600 --out .tmp-gen/map/w1 [--ramp 40]
//        [--layer peaks=<canvas-size png>]...   # writes source.png and mask.png at 2×, and each layer cropped to the window
//        # (region masks and ControlNet scribbles painted at canvas scale). Then a --batch job with source, mask and regions.
//        [--blockout <canvas-size png>]   # undrawn pixels show the blockout instead of grey; the job then needs "blockout": true
//   node scripts/asset-gen/map-window.mjs compose --canvas <png> --left 600 --top 600 --piece <candidate.png> --mask .tmp-gen/map/w1/mask.png
//        # scales the pick back to 1×, keeps the canvas pixels where the mask is black, blends only in the ramp
//
// No colour matching: the inpaint continues the kept context, and a global colour shift moved the whole piece off the map.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { pathToFileURL } from 'node:url'
import sharp from 'sharp'
import { FAMILIES } from './styles.mjs'

const [GEN_W, GEN_H] = FAMILIES['map-painterly'].gen
export const SCALE = 2
export const WINDOW = [GEN_W / SCALE, GEN_H / SCALE]
/** Map px over which a window blends from the kept map into new art: under ~30 the seam shows as a line. */
export const RAMP = 40

/**
 * Inpaint mask from a window's alpha (one byte per pixel): 255 where nothing is drawn, fading to 0 over `ramp` px
 * into the drawn map, so the model repaints the edge it continues and the seam falls inside the blend.
 * @returns {Promise<Buffer>} one byte per pixel
 */
export async function windowMask(alpha, width, height, ramp = RAMP) {
    const hole = Buffer.from(alpha.map((a) => (a > 127 ? 0 : 255)))
    if (!hole.includes(255)) throw new Error('The window has nothing to draw: move it over the transparent part of the canvas')
    // the hole blurred and doubled: 255 at its edge, fading out within about `ramp` px
    const blurred = await sharp(hole, { raw: { width, height, channels: 1 } }).blur(ramp / 2.5).extractChannel(0).raw().toBuffer()
    return Buffer.from(hole.map((h, i) => Math.max(h, Math.min(255, blurred[i] * 2))))
}

/** Blends a 1× piece into the window's RGBA pixels by the mask; the result is opaque. */
export function blendWindow(window, piece, mask) {
    const out = Buffer.alloc(window.length)
    for (let i = 0; i < mask.length; i++) {
        const a = mask[i] / 255
        for (let c = 0; c < 3; c++) out[i * 4 + c] = Math.round(window[i * 4 + c] * (1 - a) + piece[i * 3 + c] * a)
        out[i * 4 + 3] = 255
    }
    return out
}

const rawOf = async (input, channels) => {
    const img = sharp(input)
    return (channels === 4 ? img.ensureAlpha() : img.removeAlpha()).raw().toBuffer()
}

function checkWindow(meta, left, top) {
    const [w, h] = WINDOW
    if (!(left >= 0 && top >= 0 && left + w <= meta.width && top + h <= meta.height)) {
        throw new Error(`Window ${left},${top} ${w}×${h} is outside the ${meta.width}×${meta.height} canvas`)
    }
}

export async function initCanvas({ from, size: [width, height], canvas }) {
    const map = readFileSync(from)
    await sharp({ create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite([{ input: await sharp(map).ensureAlpha().png().toBuffer(), left: 0, top: 0 }])
        .png()
        .toFile(canvas)
    return { canvas, width, height }
}

export async function prepWindow({ canvas, left, top, out, ramp = RAMP, layers = {}, blockout }) {
    const file = readFileSync(canvas)
    const size = await sharp(file).metadata()
    checkWindow(size, left, top)
    const [w, h] = WINDOW
    const region = { left, top, width: w, height: h }
    mkdirSync(out, { recursive: true })
    const pixels = await sharp(file).extract(region).ensureAlpha().raw().toBuffer()
    const alpha = Buffer.alloc(w * h)
    for (let i = 0; i < alpha.length; i++) alpha[i] = pixels[i * 4 + 3]
    const mask = await windowMask(alpha, w, h, ramp)
    const up = (img, kernel) => img.resize(GEN_W, GEN_H, { kernel }).png()
    const files = { source: join(out, 'source.png'), mask: join(out, 'mask.png') }
    /** Window crop of a canvas-size image. */
    const crop = async (name, path) => {
        const image = readFileSync(path)
        const meta = await sharp(image).metadata()
        if (meta.width !== size.width || meta.height !== size.height) {
            throw new Error(`${name} (${path}) is ${meta.width}×${meta.height}; it must be painted at the canvas size`)
        }
        return sharp(image).extract(region)
    }
    const drawn = sharp(pixels, { raw: { width: w, height: h, channels: 4 } })
    // Undrawn pixels show the blockout (textures cut from the real map, repainted with "blockout": true at denoise < 1) or
    // go neutral grey, which the inpaint fills from the surroundings anyway.
    const flat = blockout
        ? await sharp(await (await crop('Blockout', blockout)).flatten({ background: '#808080' }).png().toBuffer()).composite([{ input: await drawn.png().toBuffer() }]).png().toBuffer()
        : await drawn.flatten({ background: '#808080' }).png().toBuffer()
    await up(sharp(flat), 'lanczos3').toFile(files.source)
    await up(sharp(mask, { raw: { width: w, height: h, channels: 1 } }), 'linear').toFile(files.mask)
    for (const [name, path] of Object.entries(layers)) {
        files[name] = join(out, `${name}.png`)
        await up((await crop(`Layer ${name}`, path)).flatten({ background: '#000000' }), 'linear').toFile(files[name])
    }
    return { left, top, window: WINDOW, scale: SCALE, files }
}

export async function composeWindow({ canvas, left, top, piece, mask }) {
    const file = readFileSync(canvas)
    checkWindow(await sharp(file).metadata(), left, top)
    const [w, h] = WINDOW
    const window = await sharp(file).extract({ left, top, width: w, height: h }).ensureAlpha().raw().toBuffer()
    const small = await rawOf(await sharp(piece).resize(w, h, { kernel: 'lanczos3' }).png().toBuffer(), 3)
    const m = await sharp(mask).resize(w, h, { kernel: 'linear' }).extractChannel(0).raw().toBuffer()
    const blended = await sharp(blendWindow(window, small, m), { raw: { width: w, height: h, channels: 4 } }).png().toBuffer()
    writeFileSync(canvas, await sharp(file).composite([{ input: blended, left, top }]).png().toBuffer())
    return { canvas, left, top }
}

const OPTIONS = {
    from: { type: 'string' }, size: { type: 'string' }, canvas: { type: 'string' }, left: { type: 'string' }, top: { type: 'string' },
    out: { type: 'string' }, ramp: { type: 'string' }, layer: { type: 'string', multiple: true }, piece: { type: 'string' }, mask: { type: 'string' }, blockout: { type: 'string' },
}

export async function main(argv = process.argv.slice(2)) {
    const { values: v, positionals: [command] } = parseArgs({ args: argv, options: OPTIONS, allowPositionals: true })
    const need = (...keys) => keys.forEach((k) => { if (v[k] === undefined) throw new Error(`${command} needs --${k}`) })
    const at = () => ({ canvas: resolve(v.canvas), left: Number(v.left), top: Number(v.top) })
    if (command === 'init') {
        need('from', 'size', 'canvas')
        const size = v.size.split('x').map(Number)
        if (size.length !== 2 || size.some((n) => !(n > 0))) throw new Error('--size must be WxH, e.g. 2794x1504')
        return initCanvas({ from: resolve(v.from), size, canvas: resolve(v.canvas) })
    }
    if (command === 'prep') {
        need('canvas', 'left', 'top', 'out')
        const layers = Object.fromEntries((v.layer ?? []).map((l) => {
            const [name, path] = l.split('=')
            if (!name || !path || ['source', 'mask'].includes(name)) throw new Error(`--layer must be name=path (not source or mask): "${l}"`)
            if (!existsSync(path)) throw new Error(`Layer image not found: ${path}`)
            return [name, resolve(path)]
        }))
        if (v.blockout && !existsSync(v.blockout)) throw new Error(`Blockout image not found: ${v.blockout}`)
        return prepWindow({ ...at(), out: resolve(v.out), ramp: v.ramp === undefined ? RAMP : Number(v.ramp), layers, blockout: v.blockout && resolve(v.blockout) })
    }
    if (command === 'compose') {
        need('canvas', 'left', 'top', 'piece', 'mask')
        return composeWindow({ ...at(), piece: resolve(v.piece), mask: resolve(v.mask) })
    }
    throw new Error('Usage: map-window.mjs init|prep|compose (see the header of scripts/asset-gen/map-window.mjs)')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().then(
        (result) => console.log(JSON.stringify(result, null, 2)),
        (err) => {
            console.error(err.message)
            process.exit(1)
        },
    )
}
