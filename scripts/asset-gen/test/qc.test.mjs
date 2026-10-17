import { test } from 'node:test'
import assert from 'node:assert/strict'
import sharp from 'sharp'
import { qcOptionsFor, qcSprite, rawQc, shinyDelta } from '../lib/qc.mjs'
import { category, newDefects } from '../lib/qc-art.mjs'
import { FAMILIES } from '../styles.mjs'

const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 }
const block = (w, h, [r, g, b]) => ({ create: { width: w, height: h, channels: 4, background: { r, g, b, alpha: 255 } } })
/** A transparent canvas with opaque rectangles composited at (left, top). */
const canvas = (w, h, parts) =>
    sharp({ create: { width: w, height: h, channels: 4, background: CLEAR } })
        .composite(parts.map(([bw, bh, left, top, rgb = [200, 60, 60]]) => ({ input: block(bw, bh, rgb), left, top })))
        .png().toBuffer()

test('a solid sprite of the right size is clean', async () => {
    const { flags } = await qcSprite(await canvas(40, 60, [[24, 40, 8, 10]]), { expected: { width: 40, height: 60 } })
    assert.deepEqual(flags, [])
})

test('flags a wrong size, for a fixed target and for a tier longer side', async () => {
    const buf = await canvas(40, 60, [[24, 40, 8, 10]])
    assert.match((await qcSprite(buf, { expected: { width: 48, height: 48 } })).flags[0], /^size:40x60/)
    assert.match((await qcSprite(buf, { expected: { longer: 96 } })).flags[0], /^size:/)
    assert.deepEqual((await qcSprite(buf, { expected: { longer: 60 } })).flags, [])
})

test('flags enclosed transparency (a hole in the body) but not a gap open to the outside', async () => {
    const ring = await canvas(60, 60, [[40, 40, 10, 10]])
    const cut = (w, h, left, top) => ({ input: { create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 255 } } }, left, top, blend: 'dest-out' })
    const withHole = await sharp(ring).composite([cut(8, 8, 26, 26)]).png().toBuffer()
    assert.ok((await qcSprite(withHole)).flags.some((f) => category(f) === 'holes'))
    const notch = await sharp(ring).composite([cut(8, 14, 26, 8)]).png().toBuffer()
    assert.ok(!(await qcSprite(notch)).flags.some((f) => category(f) === 'holes'))
})

test('flags a detached part (floating second head) and stray specks, ignoring none-sized noise', async () => {
    const body = await qcSprite(await canvas(100, 100, [[50, 80, 10, 10], [15, 15, 75, 10]]))
    assert.ok(body.flags.some((f) => category(f) === 'fragments'))
    const specks = await qcSprite(await canvas(100, 100, [[50, 80, 10, 10], [1, 1, 80, 5], [1, 1, 85, 90], [1, 1, 90, 50]]))
    assert.ok(specks.flags.some((f) => category(f) === 'specks'))
    assert.ok(!specks.flags.some((f) => category(f) === 'fragments'))
})

test('flags a blown colour budget', async () => {
    const pixels = Buffer.alloc(16 * 16 * 4)
    for (let i = 0; i < 256; i++) pixels.set([i, 255 - i, i % 7 * 30, 255], i * 4)
    const buf = await sharp(pixels, { raw: { width: 16, height: 16, channels: 4 } }).png().toBuffer()
    assert.ok((await qcSprite(buf, { colours: 24 })).flags.some((f) => category(f) === 'colours'))
})

test('opaque families skip the transparency checks', async () => {
    const buf = await sharp({ create: { width: 32, height: 32, channels: 3, background: { r: 10, g: 90, b: 10 } } }).png().toBuffer()
    assert.deepEqual((await qcSprite(buf, { transparent: false, expected: { width: 32, height: 32 } })).flags, [])
})

test('qcOptionsFor reads size, tier and colour budget from the family', () => {
    assert.deepEqual(qcOptionsFor(FAMILIES['item-pixel']).expected, { width: 48, height: 48 })
    assert.equal(qcOptionsFor(FAMILIES['item-pixel']).colours, 24)
    assert.deepEqual(qcOptionsFor(FAMILIES['enemy-pixel'], 144).expected, { longer: 144 })
    assert.equal(qcOptionsFor(FAMILIES['zone-pixel']).transparent, false)
})

test('rawQc flags a subject running off the generated frame and passes a centred one', async () => {
    const flat = (parts) => sharp({ create: { width: 200, height: 200, channels: 3, background: { r: 190, g: 190, b: 190 } } }).composite(parts.map(([w, h, left, top]) => ({ input: { create: { width: w, height: h, channels: 3, background: { r: 120, g: 40, b: 40 } } }, left, top }))).png().toBuffer()
    assert.deepEqual(await rawQc(await flat([[80, 120, 60, 40]])), [])
    const cut = await rawQc(await flat([[80, 120, 60, 80]]))
    assert.match(cut[0], /^cutoff:bottom/)
})

test('shinyDelta is near zero for an identical shiny and large for a recolour', async () => {
    const base = await canvas(20, 20, [[16, 16, 2, 2, [130, 128, 126]]])
    const recoloured = await canvas(20, 20, [[16, 16, 2, 2, [60, 200, 90]]])
    assert.ok((await shinyDelta(base, base)) < 1)
    assert.ok((await shinyDelta(base, recoloured)) > 100)
})

test('newDefects ignores baseline categories and reports only new ones', () => {
    const rows = [{ target: 'a.png', flags: ['holes:2.0% x', 'shiny:3 y'] }, { target: 'b.png', flags: [] }, { target: 'c.png', flags: ['holes:1.0% z'] }]
    const fresh = newDefects(rows, { 'a.png': ['holes'] })
    assert.deepEqual(fresh.map((r) => [r.target, r.flags.map(category)]), [['a.png', ['shiny']], ['c.png', ['holes']]])
})
