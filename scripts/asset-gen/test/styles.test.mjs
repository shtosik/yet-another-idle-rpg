import { test } from 'node:test'
import assert from 'node:assert/strict'
import sharp from 'sharp'
import { runPipeline } from '../lib/postprocess.mjs'
import { FAMILIES, FAMILY_TARGETS, REPO_ROOT, assertRegistry, validateRegistry } from '../styles.mjs'

test('shipped registry is valid: refs exist, are unique and targets match the plan', () => {
    assert.deepEqual(validateRegistry(), [])
    assertRegistry()
})

test('item-pixel is 48×48 transparent pixel art', () => {
    const f = FAMILIES['item-pixel']
    assert.deepEqual(FAMILY_TARGETS['item-pixel'], [48, 48])
    assert.equal(f.alpha, true)
    assert.equal(f.pixel, true)
})

test('validation reports a missing reference, target drift and an unknown family', () => {
    const bad = {
        'item-pixel': { ...FAMILIES['item-pixel'], target: [64, 64], references: ['src/assets/img/items/doesNotExist.png'] },
        'mystery-family': FAMILIES['item-pixel'],
    }
    const problems = validateRegistry(bad, REPO_ROOT).join('\n')
    assert.match(problems, /reference not found: .*doesNotExist/)
    assert.match(problems, /item-pixel: target 64,64 != planned 48,48/)
    assert.match(problems, /mystery-family: not in FAMILY_TARGETS/)
    assert.throws(() => assertRegistry(bad), /Invalid Style Family registry/)
})

test('validation reports missing keys the CLI reads, unknown post steps and a pixelate/target mismatch', () => {
    const { sampler, ...withoutSampler } = FAMILIES['item-pixel']
    const bad = {
        'item-pixel': { ...withoutSampler, post: [['nonsense'], ['pixelate', { grid: 46, width: 32, height: 32 }]] },
    }
    const problems = validateRegistry(bad, REPO_ROOT).join('\n')
    assert.match(problems, /missing "sampler"/)
    assert.match(problems, /unknown post step "nonsense"/)
    assert.match(problems, /pixelate output 32x32 != target 48,48/)
})

test('validation reports a reference that duplicates another by content', () => {
    const ref = FAMILIES['item-pixel'].references[0]
    const bad = { 'item-pixel': { ...FAMILIES['item-pixel'], references: [ref, ref] } }
    assert.match(validateRegistry(bad, REPO_ROOT).join('\n'), /duplicates/)
})

test('post chain turns a raw generation into an exact 48×48 asset with alpha and a bounded palette', async () => {
    const family = FAMILIES['item-pixel']
    const [w, h] = family.gen
    const circle = Buffer.from(
        `<svg width="${w}" height="${h}"><rect width="100%" height="100%" fill="rgb(${family.refBackground})"/>` +
            `<circle cx="${w / 2}" cy="${h / 2}" r="300" fill="rgb(200,40,40)"/><circle cx="${w / 2 - 80}" cy="${h / 2 - 80}" r="90" fill="rgb(240,200,60)"/></svg>`,
    )
    const raw = await sharp(circle).png().toBuffer()
    const out = await runPipeline(raw, family.post)
    const { data, info } = await sharp(out).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    assert.deepEqual([info.width, info.height], family.target)
    const colours = new Set()
    let transparent = 0
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] === 0) transparent++
        else colours.add(`${data[i]},${data[i + 1]},${data[i + 2]}`)
    }
    assert.ok(transparent > 0, 'keyed-out background must be transparent')
    const budget = family.post.find(([name]) => name === 'quantize')[1].colors
    assert.ok(colours.size <= budget, `${colours.size} colours > budget ${budget}`)
})
