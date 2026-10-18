import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { generateJob, pickCandidate } from '../generate.mjs'
import { parseJobs } from '../lib/batch.mjs'
import { readManifest } from '../lib/manifest.mjs'
import { prepareSource } from '../lib/source.mjs'
import { buildZImageGraph, generateStructure, sourcePathFor, ZIMAGE_CLIP, ZIMAGE_UNET, ZIMAGE_VAE } from '../lib/zimage.mjs'

const scratch = () => mkdtempSync(join(tmpdir(), 'asset-gen-'))
const frame = (w, h, rgb) => sharp({ create: { width: w, height: h, channels: 3, background: rgb } }).png().toBuffer()
const SOURCE = 'scripts/asset-gen/refs/control/crab-source.png'

test('Z-Image graph: lumina2 text encoder, 8 steps at cfg 1, prompt gets the sprite suffix, all links valid', () => {
    const g = buildZImageGraph({ prompt: 'a red crab, front view', seed: 7 })
    assert.equal(g.unet.inputs.unet_name, ZIMAGE_UNET)
    assert.equal(g.clip.inputs.clip_name, ZIMAGE_CLIP)
    assert.equal(g.clip.inputs.type, 'lumina2')
    assert.equal(g.vae.inputs.vae_name, ZIMAGE_VAE)
    assert.equal(g.positive.inputs.text, 'a red crab, front view Pixel art game sprite, no shadow, plain white background.')
    assert.deepEqual([g.sampler.inputs.steps, g.sampler.inputs.cfg, g.sampler.inputs.seed], [8, 1, 7])
    assert.deepEqual(g.sampler.inputs.negative, ['negative', 0])
    for (const [id, node] of Object.entries(g)) {
        for (const value of Object.values(node.inputs)) {
            if (Array.isArray(value)) assert.ok(g[value[0]], `${id} links to missing ${value[0]}`)
        }
    }
})

test('generateStructure draws one candidate per seed, and --pick freezes one as the named source without a manifest entry', async () => {
    const root = scratch()
    const tmpDir = join(root, '.tmp-gen')
    const manifestPath = join(root, 'manifest.json')
    const seeds = []
    const comfy = {
        run: async (graph) => {
            seeds.push(graph.sampler.inputs.seed)
            return [await frame(64, 64, { r: 200, g: 40 + seeds.length, b: 40 })]
        },
    }
    const result = await generateStructure({ comfy, prompt: 'a red crab', name: 'crab', seed: 100, count: 3, tmpDir })
    assert.deepEqual(seeds, [100, 101, 102])
    assert.equal(result.slug, 'zimage-crab')
    assert.equal(result.target, sourcePathFor('crab'))
    assert.ok(existsSync(result.sheet))
    assert.equal(result.candidates.length, 3)

    const picked = pickCandidate({ slug: 'zimage-crab', n: 2, tmpDir, root, manifestPath })
    assert.equal(picked.manifest, null)
    assert.ok(readFileSync(join(root, 'scripts/asset-gen/refs/control/crab-source.png')).equals(readFileSync(result.candidates[1])))
    assert.deepEqual(readManifest(manifestPath), {})
})

test('prepareSource fits the image to the family size on white and rejects a missing path', async () => {
    const root = scratch()
    mkdirSync(join(root, 'refs'))
    writeFileSync(join(root, 'refs/s.png'), await frame(200, 100, { r: 10, g: 10, b: 10 }))
    const buf = await prepareSource('refs/s.png', [64, 64], root)
    const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true })
    assert.deepEqual([info.width, info.height], [64, 64])
    assert.deepEqual([...data.subarray(0, 3)], [255, 255, 255], 'letterbox is white')
    const mid = (32 * 64 + 32) * info.channels
    assert.deepEqual([...data.subarray(mid, mid + 3)], [10, 10, 10])
    await assert.rejects(prepareSource('refs/none.png', [64, 64], root), /Source image not found/)
})

test('a job with a source repaints it: one repeated latent, denoise and source recorded in meta', async () => {
    const tmpDir = scratch()
    let graph
    const comfy = {
        run: async (g) => {
            graph = g
            return Promise.all(Array.from({ length: g.sourceBatch.inputs.amount }, () => frame(64, 64, { r: 200, g: 200, b: 200 })))
        },
    }
    const result = await generateJob({
        comfy, familyId: 'enemy-pixel', target: 'out/crab.png', subject: 'a crab', seed: 3, count: 2, tier: 'tiny', tmpDir,
        source: SOURCE, overrides: { denoise: 0.5, layer: false },
    })
    assert.equal(graph.sampler.inputs.denoise, 0.5)
    assert.equal(graph.layer, undefined, 'a repaint is matted, not generated with LayerDiffuse')
    assert.equal(result.source, SOURCE)
    assert.equal(result.denoise, 0.5)
    assert.equal(result.candidates.length, 2)

    const plainComfy = { run: async () => [await frame(64, 64, { r: 1, g: 2, b: 3 })] }
    const plain = await generateJob({ comfy: plainComfy, familyId: 'enemy-pixel', target: 'out/plain.png', subject: 's', seed: 1, count: 1, tier: 'tiny', tmpDir })
    assert.equal(plain.source, null)
    assert.equal(plain.denoise, null)
    await assert.rejects(
        generateJob({ comfy, familyId: 'enemy-pixel', target: 'out/crab.png', subject: 'a crab', seed: 3, count: 1, tier: 'tiny', tmpDir, source: SOURCE }),
        /pass layer: false/,
    )
})

test('batch jobs validate source: it must exist, stay in (0, 1], and need layer: false on a LayerDiffuse family', () => {
    const job = { family: 'enemy-pixel', target: 'a.png', subject: 's', layer: false }
    const [ok] = parseJobs([{ ...job, source: SOURCE, denoise: 0.45 }])
    assert.equal(ok.source, SOURCE)
    assert.throws(
        () => parseJobs([{ ...job, source: 'nope.png' }, { ...job, target: 'b.png', source: SOURCE, denoise: 1.5 }, { ...job, target: 'c.png', source: SOURCE, layer: undefined }, { ...job, target: 'd.png', source: SOURCE, layer: true }]),
        (err) => /job 0: source image not found "nope.png"/.test(err.message) && /job 1: denoise must be in \(0, 1\]/.test(err.message) && /job 2: "source" needs "layer": false/.test(err.message) && /job 3: "source" needs "layer": false/.test(err.message),
    )
})
