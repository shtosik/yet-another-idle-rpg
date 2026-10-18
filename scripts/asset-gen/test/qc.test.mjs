import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { generateJob, pickCandidate } from '../generate.mjs'
import { qcCandidate } from '../lib/qc.mjs'
import { makeSheet } from '../lib/sheet.mjs'

/** RGBA PNG of `size`² where `inside(x, y)` is solid (alpha 255, colour `rgb`) and everything else transparent black. */
const shape = (size, inside, rgb = [120, 60, 40]) => {
    const data = Buffer.alloc(size * size * 4)
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4
            const solid = inside(x, y)
            if (solid) [data[i], data[i + 1], data[i + 2]] = rgb
            data[i + 3] = solid ? 255 : 0
        }
    }
    return sharp(data, { raw: { width: size, height: size, channels: 4 } }).png().toBuffer()
}
const disc = (cx, cy, r) => (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r
const rect = (x0, y0, x1, y1) => (x, y) => x >= x0 && x < x1 && y >= y0 && y < y1
const either = (...fns) => (x, y) => fns.some((f) => f(x, y))
const codes = (qc) => qc.flags.map((f) => f.code)
const opaqueRaw = (size) => sharp({ create: { width: size, height: size, channels: 3, background: '#808080' } }).png().toBuffer()

test('a healthy creature shape passes: one body with limbs, no flags', async () => {
    const creature = either(disc(100, 100, 50), rect(40, 90, 160, 110), rect(95, 20, 105, 180))
    const qc = await qcCandidate({ raw: await opaqueRaw(200), candidate: await shape(200, creature) })
    assert.deepEqual(qc.flags, [])
    assert.ok(qc.metrics.fill < 0.88)
})

test('slab: a candidate that is a filled rectangle, or raw alpha covering the frame, is flagged', async () => {
    const full = await shape(100, () => true)
    assert.deepEqual(codes(await qcCandidate({ raw: await opaqueRaw(100), candidate: full })), ['slab'])
    const covered = await qcCandidate({ raw: await shape(100, rect(0, 0, 100, 80)), candidate: await shape(100, disc(50, 50, 30)) })
    assert.deepEqual(codes(covered), ['slab'])
    assert.match(covered.flags[0].detail, /backdrop/)
    assert.equal(covered.metrics.coverage, 0.8)
    const subject = await qcCandidate({ raw: await shape(100, disc(50, 50, 30)), candidate: await shape(100, disc(50, 50, 30)) })
    assert.deepEqual(subject.flags, [])
})

test('fragment: a detached piece of real size is flagged, a speck is not', async () => {
    const body = disc(60, 100, 40)
    const piece = await qcCandidate({ raw: await opaqueRaw(200), candidate: await shape(200, either(body, disc(160, 100, 14))) })
    assert.deepEqual(codes(piece), ['fragment'])
    const speck = await qcCandidate({ raw: await opaqueRaw(200), candidate: await shape(200, either(body, disc(160, 100, 2))) })
    assert.deepEqual(speck.flags, [])
})

test('hole: an empty patch deep inside the body is flagged, a gap enclosed by thin limbs is not', async () => {
    const patch = (x, y) => disc(100, 100, 70)(x, y) && !disc(100, 100, 12)(x, y)
    const withPatch = await qcCandidate({ raw: await opaqueRaw(200), candidate: await shape(200, patch) })
    assert.deepEqual(codes(withPatch), ['hole'])
    assert.equal(withPatch.metrics.holes, 1)
    const loop = (x, y) => (disc(60, 100, 36)(x, y) || (disc(150, 100, 30)(x, y) && !disc(150, 100, 24)(x, y)) || rect(90, 96, 125, 104)(x, y))
    const gap = await qcCandidate({ raw: await opaqueRaw(200), candidate: await shape(200, loop) })
    assert.deepEqual(gap.flags, [], 'a loop of thin limb is a gap, not a patch')
})

test('hollow: a see-through shell is flagged, a solid body with a limb gap is not', async () => {
    const shell = (x, y) => disc(100, 100, 80)(x, y) && !disc(100, 110, 66)(x, y) || rect(30, 170, 170, 182)(x, y)
    const hollow = await qcCandidate({ raw: await opaqueRaw(200), candidate: await shape(200, shell) })
    assert.ok(hollow.flags.some((f) => f.code === 'hollow'), JSON.stringify(hollow.metrics))
    const loop = (x, y) => disc(60, 100, 40)(x, y) || (disc(150, 100, 30)(x, y) && !disc(150, 100, 22)(x, y)) || rect(90, 96, 125, 104)(x, y)
    const solid = await qcCandidate({ raw: await opaqueRaw(200), candidate: await shape(200, loop) })
    assert.ok(!solid.flags.some((f) => f.code === 'hollow'), JSON.stringify(solid.metrics))
})

test('skeleton: the shape must cover the control and stay inside it', async () => {
    const control = await sharp({ create: { width: 1024, height: 1024, channels: 3, background: '#000000' } })
        .composite([{ input: { create: { width: 400, height: 400, channels: 3, background: '#ffffff' } }, left: 300, top: 300 }])
        .png().toBuffer()
    const candidate = await shape(100, disc(50, 50, 30))
    const run = async (inside) => qcCandidate({ raw: await shape(256, inside), candidate, control })
    assert.deepEqual((await run(rect(75, 75, 175, 175))).flags, [])
    const extra = await run(either(rect(75, 75, 175, 175), rect(180, 150, 256, 250)))
    assert.ok(extra.flags.some((f) => /outside the control/.test(f.detail)))
    const missing = await run(rect(75, 75, 115, 175))
    assert.ok(missing.flags.some((f) => /control skeleton is covered/.test(f.detail)))
})

test('skeleton, silhouette control: an empty slot through the body and extra limbs around it are flagged', async () => {
    const SIZE = 1024
    // a body disc with n thin limbs radiating from it, the shape of a spider seen from above
    const star = (n) => (x, y) => {
        const dx = x - 512, dy = y - 512, d = Math.hypot(dx, dy)
        if (d < 120) return true
        if (d > 440) return false
        const a = Math.atan2(dy, dx)
        for (let k = 0; k < n; k++) {
            const diff = Math.abs(((a - (2 * Math.PI * k) / n + 3 * Math.PI) % (2 * Math.PI)) - Math.PI) // shortest angle between the two
            if (diff * d < 9) return true
        }
        return false
    }
    const control = await shape(SIZE, star(8), [255, 255, 255])
    const candidate = await shape(100, disc(50, 50, 30))
    const run = async (inside) => qcCandidate({ raw: await shape(SIZE, inside), candidate, control })
    assert.deepEqual((await run(star(8))).flags, [], 'the same shape as the control passes')
    const notched = await run((x, y) => star(8)(x, y) && !rect(480, 380, 545, 640)(x, y))
    assert.ok(notched.flags.some((f) => /body area the control fills is empty/.test(f.detail)), JSON.stringify(notched.flags))
    const busy = await run(star(13))
    assert.ok(busy.flags.some((f) => /more limbs than the control/.test(f.detail)), JSON.stringify(busy.metrics))
    assert.ok(!busy.flags.some((f) => /body area/.test(f.detail)))
})

test('an empty cutout is flagged, and an RGB raw (matted job) skips the alpha checks without failing', async () => {
    const empty = await qcCandidate({ raw: await opaqueRaw(50), candidate: await shape(50, () => false) })
    assert.deepEqual(codes(empty), ['empty'])
    const matted = await qcCandidate({ raw: await opaqueRaw(100), candidate: await shape(100, disc(50, 50, 30)) })
    assert.equal(matted.metrics.coverage, undefined)
    assert.deepEqual(matted.flags, [])
})

test('flagged candidates get a red badge on the sheet', async () => {
    const candidates = [await shape(32, disc(16, 16, 10))]
    const sheet = (flagged) => makeSheet({ refs: [], candidates, target: [32, 32], pixel: true, flagged })
    const [plain, flagged] = [await sheet([]), await sheet([1])]
    assert.ok(!plain.equals(flagged))
})

test('generateJob reports qc per candidate for transparent families, --pick echoes the picked candidate flags, opaque families skip qc', async () => {
    const root = mkdtempSync(join(tmpdir(), 'asset-gen-'))
    const tmpDir = join(root, '.tmp-gen')
    // a grey frame with a red square, fully opaque: a raw with alpha everywhere is a slab
    const frame = () =>
        sharp({ create: { width: 64, height: 64, channels: 4, background: { r: 200, g: 200, b: 200, alpha: 255 } } })
            .composite([{ input: { create: { width: 24, height: 24, channels: 4, background: { r: 150, g: 40, b: 40, alpha: 255 } } }, left: 20, top: 20 }])
            .png().toBuffer()
    const comfy = { run: async (g) => Promise.all(Array.from({ length: g.latent.inputs.batch_size }, frame)) }
    const result = await generateJob({ comfy, familyId: 'item-pixel', target: 'out/a.png', subject: 's', seed: 1, count: 2, tmpDir })
    assert.equal(result.qc.length, 2)
    assert.deepEqual(result.qc.map((c) => c.n), [1, 2])
    assert.ok(result.qc.every((c) => c.flags.some((f) => f.code === 'slab')))
    const picked = pickCandidate({ slug: 'item-pixel-a', n: 2, tmpDir, root, manifestPath: join(root, 'manifest.json') })
    assert.deepEqual(picked.qcFlags, result.qc[1].flags)

    const zone = await generateJob({ comfy: { run: async (g) => [await sharp({ create: { width: 64, height: 96, channels: 3, background: '#406040' } }).png().toBuffer()].slice(0, g.latent.inputs.batch_size) }, familyId: 'zone-pixel', target: 'out/z.png', subject: 's', seed: 1, count: 1, tmpDir })
    assert.deepEqual(zone.qc, [])
})
