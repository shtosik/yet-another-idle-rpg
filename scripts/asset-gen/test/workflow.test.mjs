import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildGraph, CLIP_VISION_NAME, IPADAPTER_NAME, LORA_NAME, SOURCE_DENOISE } from '../lib/workflow.mjs'

const family = (overrides = {}) => ({
    checkpoint: 'zavychromaxl_v80.safetensors',
    stylePrompt: 'pixel art, flat colours',
    negative: 'blurry, photo',
    gen: [1024, 1024],
    ipWeight: 0.7,
    ...overrides,
})
const classes = (graph) => Object.values(graph).map((n) => n.class_type)

test('reference graph: checkpoint -> lora -> ip-adapter -> sampler -> decode -> save', () => {
    const g = buildGraph({ family: family(), subject: 'a frost shard', seed: 5, refsBase64: ['AAA', 'BBB', 'CCC'], count: 4 })
    assert.equal(g.checkpoint.inputs.ckpt_name, 'zavychromaxl_v80.safetensors')
    assert.equal(g.lora.inputs.lora_name, LORA_NAME)
    assert.deepEqual(g.lora.inputs.model, ['checkpoint', 0])
    assert.equal(g.ipadapterModel.inputs.ipadapter_file, IPADAPTER_NAME)
    assert.equal(g.clipVision.inputs.clip_name, CLIP_VISION_NAME)
    assert.deepEqual(g.ipadapter.inputs.model, ['lora', 0])
    assert.equal(g.ipadapter.inputs.weight, 0.7)
    assert.equal(g.ipadapter.inputs.weight_type, 'style transfer')
    assert.equal(g.ipadapter.inputs.combine_embeds, 'average')
    assert.deepEqual(g.sampler.inputs.model, ['ipadapter', 0])
    assert.deepEqual(g.decode.inputs.vae, ['checkpoint', 2])
    assert.deepEqual(g.save.inputs.images, ['decode', 0])
    assert.equal(g.latent.inputs.batch_size, 4)
    assert.equal(g.sampler.inputs.seed, 5)
})

test('three references are loaded and folded into one ImageBatch chain', () => {
    const g = buildGraph({ family: family(), subject: 's', seed: 1, refsBase64: ['AAA', 'BBB', 'CCC'] })
    assert.equal(classes(g).filter((c) => c === 'ETN_LoadImageBase64').length, 3)
    assert.equal(classes(g).filter((c) => c === 'ImageBatch').length, 2)
    assert.deepEqual(g.refBatch1.inputs, { image1: ['ref0', 0], image2: ['ref1', 0] })
    assert.deepEqual(g.refBatch2.inputs, { image1: ['refBatch1', 0], image2: ['ref2', 0] })
    assert.deepEqual(g.ipadapter.inputs.image, ['refBatch2', 0])
})

test('a single reference needs no ImageBatch', () => {
    const g = buildGraph({ family: family(), subject: 's', seed: 1, refsBase64: ['AAA'] })
    assert.ok(!classes(g).includes('ImageBatch'))
    assert.deepEqual(g.ipadapter.inputs.image, ['ref0', 0])
})

test('no-reference option drops the whole IP-Adapter branch', () => {
    for (const g of [
        buildGraph({ family: family(), subject: 's', seed: 1, refsBase64: ['AAA'], useRef: false }),
        buildGraph({ family: family(), subject: 's', seed: 1, refsBase64: [] }),
    ]) {
        for (const cls of ['IPAdapterAdvanced', 'IPAdapterModelLoader', 'CLIPVisionLoader', 'ETN_LoadImageBase64', 'ImageBatch']) {
            assert.ok(!classes(g).includes(cls), cls)
        }
        assert.deepEqual(g.sampler.inputs.model, ['lora', 0])
    }
})

test('family inputs drive size, prompt and sampler overrides', () => {
    const g = buildGraph({
        family: family({ gen: [832, 1216], stylePrompt: 'painterly matte', negative: 'pixelated', sampler: { steps: 30, cfg: 7 } }),
        subject: 'a mossy bridge', seed: 9,
    })
    assert.deepEqual([g.latent.inputs.width, g.latent.inputs.height], [832, 1216])
    assert.equal(g.positive.inputs.text, 'a mossy bridge, painterly matte')
    assert.equal(g.negative.inputs.text, 'pixelated')
    assert.equal(g.sampler.inputs.steps, 30)
    assert.equal(g.sampler.inputs.cfg, 7)
    assert.equal(g.sampler.inputs.sampler_name, 'euler')
})

test('every node link points at an existing node', () => {
    const g = buildGraph({ family: family(), subject: 's', seed: 1, refsBase64: ['A', 'B'], count: 2 })
    for (const [id, node] of Object.entries(g)) {
        for (const value of Object.values(node.inputs)) {
            if (Array.isArray(value)) assert.ok(g[value[0]], `${id} links to missing ${value[0]}`)
        }
    }
})

test('layer graph: LayerDiffuse patches the model before IP-Adapter and decodes alpha before save', () => {
    const g = buildGraph({ family: family({ layer: true }), subject: 'a troll', seed: 1, refsBase64: ['AAA'] })
    assert.equal(g.layer.class_type, 'LayeredDiffusionApply')
    assert.deepEqual(g.layer.inputs.model, ['lora', 0])
    assert.deepEqual(g.ipadapter.inputs.model, ['layer', 0])
    assert.deepEqual(g.decodeAlpha.inputs.samples, ['sampler', 0])
    assert.deepEqual(g.joinAlpha.inputs.alpha, ['invertAlpha', 0])
    assert.deepEqual(g.save.inputs.images, ['joinAlpha', 0])
})

test('lora: false drops the Hyper-SDXL LoRA and wires model and clip straight from the checkpoint', () => {
    const g = buildGraph({ family: family({ lora: false }), subject: 'a troll', seed: 1, useRef: false })
    assert.equal(g.lora, undefined)
    assert.deepEqual(g.sampler.inputs.model, ['checkpoint', 0])
    assert.deepEqual(g.positive.inputs.clip, ['checkpoint', 1])
    assert.ok(!classes(g).includes('LayeredDiffusionApply'))
})

test('source graph: the frozen image is VAE-encoded as the start latent at the chosen denoise, no empty latent', () => {
    const g = buildGraph({ family: family(), subject: 'a crab', seed: 1, source: { base64: 'SRC', denoise: 0.4 } })
    assert.equal(g.sourceImage.inputs.image, 'SRC')
    assert.deepEqual(g.sourceLatent.inputs, { pixels: ['sourceImage', 0], vae: ['checkpoint', 2] })
    assert.deepEqual(g.sampler.inputs.latent_image, ['sourceLatent', 0])
    assert.equal(g.sampler.inputs.denoise, 0.4)
    assert.equal(g.latent, undefined)
    assert.ok(!classes(g).includes('RepeatLatentBatch'))
    assert.equal(buildGraph({ family: family(), subject: 's', seed: 1, source: { base64: 'SRC' } }).sampler.inputs.denoise, SOURCE_DENOISE)
    assert.equal(buildGraph({ family: family(), subject: 's', seed: 1 }).sampler.inputs.denoise, 1)
})

test('source graph repeats the encoded latent once per candidate and keeps every link valid', () => {
    const g = buildGraph({ family: family(), subject: 's', seed: 1, count: 6, refsBase64: ['A'], source: { base64: 'SRC' } })
    assert.deepEqual(g.sourceBatch.inputs, { samples: ['sourceLatent', 0], amount: 6 })
    assert.deepEqual(g.sampler.inputs.latent_image, ['sourceBatch', 0])
    for (const [id, node] of Object.entries(g)) {
        for (const value of Object.values(node.inputs)) {
            if (Array.isArray(value)) assert.ok(g[value[0]], `${id} links to missing ${value[0]}`)
        }
    }
})
