import assert from 'node:assert/strict'
import { test } from 'node:test'
import sharp from 'sharp'
import { PRESETS, adjustMasked, darken, montage, patch, trimEdges } from '../lib/edit.mjs'
import { imageStats, qcBackground } from '../lib/qc.mjs'

const solid = (w, h, background) => sharp({ create: { width: w, height: h, channels: 3, background } }).png().toBuffer()
const withStrip = async (w, h, background, stripHeight) =>
    sharp(await solid(w, h, background)).composite([{ input: await solid(w, stripHeight, '#ffffff'), left: 0, top: 0 }]).png().toBuffer()

test('imageStats reads the mean and an edge strip', async () => {
    const s = await imageStats(await withStrip(120, 80, '#202020', 2))
    assert.ok(Math.abs(s.mean - 38) < 3)
    assert.ok(s.edges.top > 40, 'the bright top rows stand out from the band inside')
    assert.ok(Math.abs(s.edges.bottom) < 1)
})

test('qcBackground flags an edge strip and a black image, and passes a clean one', async () => {
    assert.deepEqual((await qcBackground({ candidate: await withStrip(120, 80, '#404040', 3) })).flags.map((f) => f.code), ['edge'])
    assert.deepEqual((await qcBackground({ candidate: await solid(120, 80, '#000000') })).flags.map((f) => f.code), ['tone'])
    assert.deepEqual((await qcBackground({ candidate: await solid(120, 80, '#808080') })).flags, [])
})

test('darken lowers the mean and keeps the size', async () => {
    const src = await solid(100, 60, '#c0c0c0')
    const out = await darken(src)
    const meta = await sharp(out).metadata()
    assert.equal(meta.width, 100)
    assert.equal(meta.height, 60)
    assert.ok((await imageStats(out)).mean < (await imageStats(src)).mean * 0.6)
})

test('adjustMasked recolours only the picked pixels and keeps the mask one channel', async () => {
    // left half pale blue-grey (haze), right half brown (kept)
    const pale = await solid(50, 40, { r: 150, g: 170, b: 190 })
    const brown = await solid(50, 40, { r: 110, g: 80, b: 50 })
    const src = await sharp({ create: { width: 100, height: 40, channels: 3, background: '#000' } })
        .composite([{ input: pale, left: 0, top: 0 }, { input: brown, left: 50, top: 0 }])
        .png()
        .toBuffer()
    const { data } = await sharp(await adjustMasked(src, { ...PRESETS.haze(), maskBlur: 1 })).raw().toBuffer({ resolveWithObject: true })
    const px = (x, y) => [0, 1, 2].map((c) => data[(y * 100 + x) * 3 + c])
    assert.ok(px(10, 20)[0] < 60, 'haze darkened')
    assert.deepEqual(px(90, 20), [110, 80, 50], 'brown wood untouched')
    assert.deepEqual(px(10, 3), px(10, 30), 'no horizontal stripes')
})

test('patch clones the offset pixels over the box', async () => {
    const src = await sharp(await solid(80, 40, '#3030a0')).composite([{ input: await solid(10, 10, '#ff0000'), left: 40, top: 15 }]).png().toBuffer()
    const { data } = await sharp(await patch(src, [{ box: [38, 13, 52, 27], from: [-30, 0] }], { feather: 2 })).raw().toBuffer({ resolveWithObject: true })
    const at = (x, y) => [0, 1, 2].map((c) => data[(y * 80 + x) * 3 + c])
    assert.deepEqual(at(45, 20), [0x30, 0x30, 0xa0], 'the red square is gone')
})

test('trimEdges removes a bright edge row and keeps the size', async () => {
    const out = await trimEdges(await withStrip(100, 60, '#303030', 2), { px: 3 })
    assert.equal((await sharp(out).metadata()).height, 60)
    assert.ok(Math.abs((await imageStats(out)).edges.top) < 5)
})

test('montage returns one luminance per image', async () => {
    const { png, luminance } = await montage([await solid(40, 30, '#202020'), await solid(40, 30, '#e0e0e0')], { cols: 2, tile: [40, 30] })
    assert.equal(luminance.length, 2)
    assert.ok(luminance[1] > luminance[0])
    assert.equal((await sharp(png).metadata()).width, 88)
})
