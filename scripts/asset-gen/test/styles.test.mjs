import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyOverrides, slugFor } from '../generate.mjs'
import { FAMILIES, FAMILY_TARGETS, REPO_ROOT, assertRegistry, validateRegistry } from '../styles.mjs'

test('shipped registry is valid: refs exist and targets match the plan', () => {
    assert.deepEqual(validateRegistry(), [])
    assertRegistry()
    for (const [id, family] of Object.entries(FAMILIES)) assert.deepEqual(family.target, FAMILY_TARGETS[id], id)
})

test('item-pixel is 48×48 transparent pixel art', () => {
    const f = FAMILIES['item-pixel']
    assert.deepEqual(f.target, [48, 48])
    assert.equal(f.alpha, true)
    assert.equal(f.pixel, true)
})

test('enemy-pixel defaults to the validated LayerDiffuse recipe with frozen golden references', () => {
    const f = FAMILIES['enemy-pixel']
    assert.equal(f.layer, true)
    assert.equal(f.lora, false)
    assert.equal(f.ipWeight, 0.8, 'weaker references let LayerDiffuse leave an opaque backdrop slab')
    assert.match(f.negative, /double weapon, merged weapons/)
    assert.match(f.negative, /second creature, duplicate creature/)
    assert.match(f.negative, /dirt mound, soil/)
    assert.deepEqual(f.sampler, { steps: 25, cfg: 6, sampler_name: 'dpmpp_2m', scheduler: 'sgm_uniform' })
    assert.equal(f.post[0][0], 'alpha', 'generated alpha is cleaned, not matted')
    assert.doesNotMatch(f.stylePrompt, /dark fantasy|background colour|grey background/i)
    assert.deepEqual(f.references.map((r) => r.split('/').pop()), ['goat.png', 'gnollScout.png', 'giantEagle.png', 'deer.png', 'canopyBandit.png', 'bandit.png', 'wolf.png'])
    for (const ref of f.references) assert.match(ref, /^scripts\/asset-gen\/refs\/enemy\//, 'references are frozen copies, never live src/assets files')
})

test('applyOverrides layer: false turns an alpha family back into a matted one, and layer: true the reverse', () => {
    const enemy = FAMILIES['enemy-pixel']
    const matted = applyOverrides(enemy, { layer: false })
    assert.equal(matted.layer, false)
    assert.equal(matted.post[0][0], 'matte')
    assert.equal(enemy.post[0][0], 'alpha', 'registry untouched')
    const item = applyOverrides(FAMILIES['item-pixel'], { layer: true, lora: false })
    assert.equal(item.post[0][0], 'alpha')
    assert.equal(item.lora, false)
    assert.equal(applyOverrides(enemy, {}).layer, true)
    assert.equal(applyOverrides(enemy, { lora: true }).lora, true)
})

test('applyOverrides erode and fillHoles tune the cutout step of the copy only', () => {
    const enemy = FAMILIES['enemy-pixel']
    const tuned = applyOverrides(enemy, { erode: '14', fillHoles: '0.03' })
    assert.deepEqual(tuned.post.find(([n]) => n === 'alpha')[1], { erode: 14, holeArea: 0.03 })
    assert.deepEqual(enemy.post.find(([n]) => n === 'alpha')[1] ?? {}, {}, 'registry untouched')
    const matted = applyOverrides(enemy, { layer: false, erode: '2' })
    assert.deepEqual(matted.post.find(([n]) => n === 'matte')[1], { erode: 2 })
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

test('validation rejects a live src/assets reference: only frozen copies under refs/ may anchor a family', () => {
    const live = { 'item-pixel': { ...FAMILIES['item-pixel'], references: ['src/assets/img/items/cheese.png'] } }
    assert.match(validateRegistry(live, REPO_ROOT).join('\n'), /not a frozen copy .*items\/cheese\.png/)
})

test('applyOverrides tunes a copy and leaves the registry untouched', () => {
    const base = FAMILIES['item-pixel']
    const tuned = applyOverrides(base, { steps: '30', cfg: '7', ipWeight: '0.5', grid: '40', colors: '12' })
    assert.equal(tuned.sampler.steps, 30)
    assert.equal(tuned.sampler.cfg, 7)
    assert.equal(tuned.ipWeight, 0.5)
    assert.equal(tuned.post.find(([n]) => n === 'pixelate')[1].grid, 40)
    assert.equal(tuned.post.find(([n]) => n === 'quantize')[1].colors, 12)
    assert.equal(base.sampler.steps, 8)
    assert.equal(base.post.find(([n]) => n === 'pixelate')[1].grid, 46)
})

test('slugFor combines family, target name and optional tag', () => {
    assert.equal(slugFor('item-pixel', 'src/assets/img/items/frostShard.png'), 'item-pixel-frostShard')
    assert.equal(slugFor('item-pixel', 'x/frostShard.png', 'noref'), 'item-pixel-frostShard-noref')
})

test('skill-icon is a 256×256 inked tile cut by the tile step, with frozen references', () => {
    const f = FAMILIES['skill-icon']
    assert.deepEqual(f.target, [256, 256])
    assert.equal(f.pixel, false)
    assert.equal(f.post.at(-1)[0], 'tile')
    for (const ref of f.references) assert.match(ref, /^scripts\/asset-gen\/refs\/skill\//)
})

test('map-painterly draws exactly its target size with no post step, so a window lines up with the map pixel for pixel', () => {
    const f = FAMILIES['map-painterly']
    assert.deepEqual(f.gen, f.target)
    assert.ok(f.gen.every((n) => n % 16 === 0), 'gen/2 must stay a whole latent multiple')
    assert.deepEqual(f.post, [])
    assert.equal(f.alpha, false)
    for (const ref of f.references) assert.match(ref, /^scripts\/asset-gen\/refs\/map\//)
})
