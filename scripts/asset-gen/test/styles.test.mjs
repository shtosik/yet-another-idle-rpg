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
