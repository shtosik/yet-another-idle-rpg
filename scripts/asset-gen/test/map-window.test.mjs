import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { blendWindow, composeWindow, prepWindow, windowMask, WINDOW } from '../map-window.mjs'
import { prepareSource } from '../lib/source.mjs'

test('the window mask is 255 in the hole and fades to 0 within the ramp into the drawn map', async () => {
    const [w, h] = [40, 200]
    // rows 0-99 drawn, 100-199 not
    const alpha = Buffer.from(Array.from({ length: w * h }, (_, i) => (i < w * 100 ? 255 : 0)))
    const mask = await windowMask(alpha, w, h, 40)
    const at = (y) => mask[y * w + 20]
    assert.equal(at(150), 255)
    assert.equal(at(100), 255)
    assert.ok(at(90) > 100, `ramp starts strong at the seam (${at(90)})`)
    assert.ok(at(55) <= 3, `ramp has faded by 45 px (${at(55)})`)
    assert.equal(at(10), 0)
    await assert.rejects(windowMask(Buffer.alloc(w * h, 255), w, h), /nothing to draw/)
})

test('blending keeps the window pixels where the mask is 0 and takes the piece where it is 255', () => {
    const window = Buffer.from([10, 20, 30, 255, 10, 20, 30, 255, 0, 0, 0, 0])
    const piece = Buffer.from([200, 200, 200, 200, 200, 200, 100, 110, 120])
    const out = blendWindow(window, piece, Buffer.from([0, 128, 255]))
    assert.deepEqual([...out.subarray(0, 4)], [10, 20, 30, 255])
    assert.deepEqual([...out.subarray(8, 12)], [100, 110, 120, 255])
    assert.ok(out[4] > 10 && out[4] < 200)
})

test('prep writes the window at 2× and compose puts the piece back without touching the kept map', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'map-window-'))
    const canvas = join(dir, 'canvas.png')
    const [w, h] = WINDOW
    // canvas: top half drawn red, bottom half transparent
    await sharp({ create: { width: w, height: h * 2, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite([{ input: { create: { width: w, height: h, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } } }, left: 0, top: 0 }])
        .png()
        .toFile(canvas)
    const { files } = await prepWindow({ canvas, left: 0, top: h / 2, out: join(dir, 'w') })
    assert.deepEqual(Object.keys(files), ['source', 'mask'])
    const meta = await sharp(files.mask).metadata()
    assert.deepEqual([meta.width, meta.height], [w * 2, h * 2])

    const piece = join(dir, 'piece.png')
    await sharp({ create: { width: w * 2, height: h * 2, channels: 3, background: '#0000ff' } }).png().toFile(piece)
    await composeWindow({ canvas, left: 0, top: h / 2, piece, mask: files.mask })
    const px = async (y) => [...(await sharp(canvas).extract({ left: 10, top: y, width: 1, height: 1 }).raw().toBuffer())]
    assert.deepEqual(await px(h / 2 + 5), [255, 0, 0, 255])
    assert.deepEqual(await px(h + 50), [0, 0, 255, 255])
    assert.deepEqual(await px(h * 2 - 5), [0, 0, 0, 0], 'below the window stays undrawn')
})

test('prep with a blockout shows it where the canvas is undrawn and keeps the drawn map on top', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'map-window-'))
    const [w, h] = WINDOW
    const canvas = join(dir, 'canvas.png')
    const blockout = join(dir, 'blockout.png')
    await sharp({ create: { width: w, height: h * 2, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite([{ input: { create: { width: w, height: h, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } } }, left: 0, top: 0 }])
        .png()
        .toFile(canvas)
    await sharp({ create: { width: w, height: h * 2, channels: 3, background: '#00ff00' } }).png().toFile(blockout)
    const { files } = await prepWindow({ canvas, left: 0, top: h / 2, out: join(dir, 'w'), blockout })
    const px = async (y) => [...(await sharp(files.source).extract({ left: 20, top: y, width: 1, height: 1 }).removeAlpha().raw().toBuffer())]
    assert.deepEqual(await px(20), [255, 0, 0], 'drawn map wins')
    assert.deepEqual(await px(h * 2 - 20), [0, 255, 0], 'blockout fills the hole')
    await assert.rejects(prepWindow({ canvas, left: 0, top: h / 2, out: join(dir, 'w2'), blockout: canvas.replace('canvas', 'missing') }))
})

test('an inpaint source must already be the generation size: no letterbox', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'map-window-'))
    await sharp({ create: { width: 100, height: 50, channels: 3, background: '#808080' } }).png().toFile(join(dir, 'small.png'))
    await assert.rejects(prepareSource('small.png', [1344, 752], dir, { exact: true }), /is 100×50, the family generates 1344×752/)
    const meta = await sharp(await prepareSource('small.png', [100, 50], dir, { exact: true })).metadata()
    assert.deepEqual([meta.width, meta.height], [100, 50])
})
