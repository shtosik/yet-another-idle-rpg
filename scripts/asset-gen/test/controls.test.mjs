import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { parseJobs } from '../lib/batch.mjs'
import { CONTROLS, controlImage } from '../lib/controls.mjs'
import { eatAttachedBackground } from '../lib/postprocess.mjs'
import { hueShift } from '../lib/shiny.mjs'
import { buildGraph, CONTROLNET_NAME } from '../lib/workflow.mjs'
import { FAMILIES } from '../styles.mjs'
import { reprocessJob } from '../generate.mjs'

const family = FAMILIES['enemy-pixel']

test('control images are 1024² white-on-black scribbles, and differ per creature', async () => {
    const images = {}
    for (const name of Object.keys(CONTROLS)) {
        const buf = await controlImage(name)
        const { data, info } = await sharp(buf).greyscale().raw().toBuffer({ resolveWithObject: true })
        assert.deepEqual([info.width, info.height], [1024, 1024])
        const lit = data.filter((v) => v > 200).length
        assert.ok(lit > 10_000 && lit < 400_000, `${name}: ${lit} lit pixels`)
        assert.equal(data[0], 0, 'corner is black')
        images[name] = buf.toString('base64')
    }
    assert.notEqual(images.spider, images.crab)
    await assert.rejects(controlImage('dragon'), /Unknown control "dragon"/)
})

test('buildGraph with a control wires union ControlNet conditioning into the sampler; without it the graph is unchanged', () => {
    const g = buildGraph({ family, subject: 's', seed: 1, control: { base64: 'QUJD' } })
    assert.equal(g.controlLoader.inputs.control_net_name, CONTROLNET_NAME)
    assert.deepEqual(g.controlType.inputs.control_net, ['controlLoader', 0])
    assert.equal(g.controlImage.inputs.image, 'QUJD')
    assert.deepEqual(g.controlApply.inputs.positive, ['positive', 0])
    assert.deepEqual(g.sampler.inputs.positive, ['controlApply', 0])
    assert.deepEqual(g.sampler.inputs.negative, ['controlApply', 1])
    for (const node of Object.values(g)) for (const v of Object.values(node.inputs)) if (Array.isArray(v)) assert.ok(g[v[0]], `dangling link ${v[0]}`)

    const plain = buildGraph({ family, subject: 's', seed: 1 })
    assert.ok(!plain.controlApply)
    assert.deepEqual(plain.sampler.inputs.positive, ['positive', 0])
})

test('batch jobs validate the control name', () => {
    assert.equal(parseJobs([{ family: 'enemy-pixel', target: 'a.png', subject: 's', control: 'spider' }])[0].control, 'spider')
    assert.throws(() => parseJobs([{ family: 'enemy-pixel', target: 'a.png', subject: 's', control: 'dragon' }]), /unknown control "dragon"/)
})

test('eatAttachedBackground removes backdrop attached to the subject but keeps same-coloured enclosed parts', () => {
    // 12×8: grey backdrop (mask 0), subject block (mask 1) with a grey slab attached to its right side and a grey patch enclosed inside
    const W = 12, H = 8
    const mask = new Uint8Array(W * H)
    const data = Buffer.alloc(W * H * 4, 255)
    const paint = (x, y, rgb) => { const i = (y * W + x) * 4; data[i] = rgb[0]; data[i + 1] = rgb[1]; data[i + 2] = rgb[2] }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) paint(x, y, [190, 190, 190])
    for (let y = 1; y < 7; y++) for (let x = 2; x < 10; x++) { mask[y * W + x] = 1; paint(x, y, [40, 120, 40]) }
    for (let y = 2; y < 6; y++) for (let x = 8; x < 10; x++) paint(x, y, [186, 188, 190]) // slab on the right edge of the subject
    paint(4, 3, [190, 190, 190]) // enclosed patch of the same grey
    eatAttachedBackground(mask, data, W, H, 30)
    assert.equal(mask[3 * W + 9], 0, 'attached slab removed')
    assert.equal(mask[3 * W + 4], 1, 'enclosed grey patch kept')
    assert.equal(mask[3 * W + 5], 1, 'subject kept')
})

test('hueShift with saturation/brightness changes a near-grey sprite that a hue rotation alone leaves alone', async () => {
    const grey = await sharp({ create: { width: 4, height: 4, channels: 4, background: { r: 130, g: 128, b: 126, alpha: 255 } } }).png().toBuffer()
    const px = async (b) => [...(await sharp(b).raw().toBuffer()).subarray(0, 3)]
    const plain = await px(await hueShift(grey, 200))
    const boosted = await px(await hueShift(grey, 200, { saturation: 6, brightness: 1.1 }))
    const spread = (c) => Math.max(...c) - Math.min(...c)
    assert.ok(spread(boosted) > spread(plain) + 8, `plain ${plain}, boosted ${boosted}`)
})

test('reprocessJob re-runs post-process over saved raws and explains when raws are missing', async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'asset-gen-'))
    const dir = join(tmpDir, 'zone-pixel-demo')
    mkdirSync(dir)
    const raw = await sharp({ create: { width: 832, height: 1216, channels: 3, background: { r: 60, g: 120, b: 60 } } }).png().toBuffer()
    writeFileSync(join(dir, 'raw-1.png'), raw)
    writeFileSync(join(dir, 'meta.json'), JSON.stringify({ slug: 'zone-pixel-demo', family: 'zone-pixel', tier: null, count: 1, useRef: false }))
    const result = await reprocessJob({ slug: 'zone-pixel-demo', tmpDir })
    assert.equal(result.reprocessed, 1)
    const meta = await sharp(join(dir, 'candidate-1.png')).metadata()
    assert.deepEqual([meta.width, meta.height], [832, 1248])
    assert.ok(existsSync(result.sheet))

    writeFileSync(join(dir, 'meta.json'), JSON.stringify({ slug: 'zone-pixel-demo', family: 'zone-pixel', tier: null, count: 2, useRef: false }))
    await assert.rejects(reprocessJob({ slug: 'zone-pixel-demo', tmpDir }), /no raw-2\.png/)
})
