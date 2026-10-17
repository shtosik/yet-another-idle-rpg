import { test } from 'node:test'
import assert from 'node:assert/strict'
import sharp from 'sharp'
import { cover, fit, keyout, outline, pixelate, quantize, runPipeline, trim } from '../lib/postprocess.mjs'

const rawOf = async (buf) => {
    const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    return { data, width: info.width, height: info.height }
}
const alphaAt = ({ data, width }, x, y) => data[(y * width + x) * 4 + 3]
const solid = (width, height, [r, g, b, alpha = 255]) =>
    sharp({ create: { width, height, channels: 4, background: { r, g, b, alpha } } }).png().toBuffer()
/** A `size`×`size` square of `fg` centred on a `bg` canvas. */
const squareOnBg = (canvas, size, bg, fg) => {
    const off = (canvas - size) / 2
    return sharp({ create: { width: canvas, height: canvas, channels: 4, background: { r: bg[0], g: bg[1], b: bg[2], alpha: 255 } } })
        .composite([{ input: { create: { width: size, height: size, channels: 4, background: { r: fg[0], g: fg[1], b: fg[2], alpha: 255 } } }, left: off, top: off }])
        .png().toBuffer()
}
const colourCount = async (buf) => {
    const { data } = await rawOf(buf)
    const seen = new Set()
    for (let i = 0; i < data.length; i += 4) seen.add(data.readUInt32LE(i))
    return seen.size
}

test('keyout removes the solid background around a square and keeps the square', async () => {
    const out = await rawOf(await keyout(await squareOnBg(64, 24, [0, 255, 0], [200, 30, 30]), { feather: 0 }))
    assert.equal(alphaAt(out, 0, 0), 0)
    assert.equal(alphaAt(out, 63, 63), 0)
    assert.equal(alphaAt(out, 32, 32), 255)
})

test('keyout keeps a subject colour close to the background when it does not touch the corners', async () => {
    const out = await rawOf(await keyout(await squareOnBg(64, 24, [0, 255, 0], [10, 250, 10]), { threshold: 5, feather: 0 }))
    assert.equal(alphaAt(out, 0, 0), 0)
    assert.equal(alphaAt(out, 32, 32), 255)
})

test('trim crops to the opaque bounding box', async () => {
    const keyed = await keyout(await squareOnBg(64, 24, [0, 255, 0], [200, 30, 30]), { feather: 0 })
    const meta = await sharp(await trim(keyed)).metadata()
    assert.deepEqual([meta.width, meta.height], [24, 24])
})

test('pixelate grid mode yields exact target dims', async () => {
    const out = await pixelate(await solid(300, 200, [10, 20, 30]), { grid: 48, width: 48, height: 48 })
    const meta = await sharp(out).metadata()
    assert.deepEqual([meta.width, meta.height], [48, 48])
})

test('pixelate + quantize yields at most N colours', async () => {
    const pixels = Buffer.alloc(128 * 128 * 4)
    for (let i = 0; i < pixels.length; i++) pixels[i] = i % 4 === 3 ? 255 : (i * 37) % 256
    const noise = await sharp(pixels, { raw: { width: 128, height: 128, channels: 4 } }).png().toBuffer()
    const out = await quantize(await pixelate(noise, { grid: 32, width: 32, height: 32 }), { colors: 8 })
    assert.ok((await colourCount(out)) <= 8)
})

test('pixelate block mode keeps dims and makes uniform blocks', async () => {
    const out = await rawOf(await pixelate(await squareOnBg(32, 8, [0, 0, 0], [255, 255, 255]), { block: 4 }))
    assert.deepEqual([out.width, out.height], [32, 32])
    const px = (x, y) => out.data.readUInt32LE((y * 32 + x) * 4)
    assert.equal(px(12, 12), px(15, 15))
})

test('outline only paints transparent pixels next to the subject', async () => {
    const subject = await sharp({ create: { width: 8, height: 8, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite([{ input: await solid(2, 2, [200, 50, 50]), left: 3, top: 3 }]).png().toBuffer()
    const before = await rawOf(subject)
    const after = await rawOf(await outline(subject, { color: [1, 2, 3] }))
    let painted = 0
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            const i = (y * 8 + x) * 4
            const changed = before.data.readUInt32LE(i) !== after.data.readUInt32LE(i)
            const wasOpaque = before.data[i + 3] > 0
            const nextToSubject = !wasOpaque && [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(([nx, ny]) => nx >= 0 && ny >= 0 && nx < 8 && ny < 8 && alphaAt(before, nx, ny) > 0)
            assert.equal(changed, nextToSubject, `pixel ${x},${y}`)
            if (changed) painted++
        }
    }
    assert.equal(painted, 8)
})

test('cover and fit produce exact dims', async () => {
    const src = await solid(100, 60, [5, 5, 5])
    const c = await sharp(await cover(src, { width: 832, height: 1248 })).metadata()
    const f = await sharp(await fit(src, { width: 48, height: 48 })).metadata()
    assert.deepEqual([c.width, c.height, f.width, f.height], [832, 1248, 48, 48])
})

test('runPipeline composes steps and rejects unknown ones', async () => {
    const out = await runPipeline(await squareOnBg(64, 24, [0, 255, 0], [200, 30, 30]), [
        ['keyout', { feather: 0 }], ['trim'], ['pixelate', { grid: 12, width: 12, height: 12 }], ['quantize', { colors: 4 }],
    ])
    assert.equal((await sharp(out).metadata()).width, 12)
    await assert.rejects(runPipeline(out, [['nope']]), /Unknown post-process step/)
})
