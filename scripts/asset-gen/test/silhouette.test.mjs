import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { registerFrozenControls } from '../lib/controls.mjs'
import { makeControl, makeSilhouette } from '../lib/silhouette.mjs'

/** A 100×60 transparent canvas with a solid 40×20 block at (10, 20): a cutout needs no matting model. */
const cutout = () =>
    sharp({ create: { width: 100, height: 60, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite([{ input: { create: { width: 40, height: 20, channels: 4, background: { r: 30, g: 120, b: 40, alpha: 255 } } }, left: 10, top: 20 }])
        .png().toBuffer()

test('a silhouette is the cutout as white on black, 1024², centred and scaled to the margin', async () => {
    const { data, info } = await sharp(await makeSilhouette(await cutout())).greyscale().raw().toBuffer({ resolveWithObject: true })
    assert.deepEqual([info.width, info.height, info.channels], [1024, 1024, 1])
    assert.equal(data[0], 0, 'corner is black')
    let minX = 1024, maxX = 0, minY = 1024, maxY = 0
    for (let p = 0; p < data.length; p++) {
        if (data[p] < 200) continue
        const x = p % 1024, y = (p / 1024) | 0
        minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y)
    }
    const width = maxX - minX + 1, height = maxY - minY + 1
    assert.ok(Math.abs(width - 881) <= 2, `width ${width} fills 86% of the frame`)
    assert.ok(Math.abs(width / height - 2) < 0.05, 'the 40×20 block keeps its 2:1 shape')
    assert.ok(Math.abs((minX + maxX) / 2 - 511.5) <= 2 && Math.abs((minY + maxY) / 2 - 511.5) <= 2, 'centred')
})

test('makeControl freezes the source beside its silhouette, and registerFrozenControls turns the pair into a control', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'asset-gen-control-'))
    const from = join(dir, 'archer.png')
    writeFileSync(from, await cutout())
    const out = join(dir, 'refs')
    const made = await makeControl({ name: 'goblinArcher', from, dir: out })
    assert.ok(existsSync(made.source) && existsSync(made.control))

    const controls = registerFrozenControls(out, { spider: () => 'kept' })
    assert.equal(controls.spider(), 'kept', 'an existing control is never replaced')
    const silhouette = await sharp(controls.goblinArcher()).metadata()
    assert.deepEqual([silhouette.width, silhouette.height], [1024, 1024])
    assert.equal(controls['goblinArcher-source'], undefined, 'a source image alone is not a control')

    writeFileSync(join(out, 'lonely.png'), await cutout())
    assert.equal(registerFrozenControls(out, {}).lonely, undefined, 'a silhouette without its source is ignored')
    await assert.rejects(makeControl({ name: 'bad name', from, dir: out }), /letters and digits/)
})

test('thicken grows thin lines so they survive pixelating: a 2 px line becomes about the requested width', async () => {
    // a 2 px wide vertical line on a block, as a bowstring beside a body
    const line = await sharp({ create: { width: 100, height: 60, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite([
            { input: { create: { width: 30, height: 40, channels: 4, background: { r: 30, g: 120, b: 40, alpha: 255 } } }, left: 10, top: 10 },
            { input: { create: { width: 2, height: 50, channels: 4, background: { r: 30, g: 120, b: 40, alpha: 255 } } }, left: 70, top: 5 },
        ])
        .png().toBuffer()
    const widthAt = async (png, y) => {
        const { data } = await sharp(png).greyscale().raw().toBuffer({ resolveWithObject: true })
        let best = 0, run = 0
        for (let x = 600; x < 1024; x++) { run = data[y * 1024 + x] >= 128 ? run + 1 : 0; best = Math.max(best, run) }
        return best
    }
    const plain = await makeSilhouette(line)
    const thick = await makeSilhouette(line, { thicken: 12 })
    assert.ok((await widthAt(plain, 512)) <= 40, 'the plain line scales to a few px of a 1024 frame')
    assert.ok((await widthAt(thick, 512)) >= (await widthAt(plain, 512)) + 10, 'thickened by at least 10 px')
})
