import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyOverrides, main, pickCandidate, slugFor } from '../generate.mjs'
import { FAMILIES } from '../styles.mjs'

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

test('applyOverrides names the flag when a numeric value is not a number', () => {
    assert.throws(() => applyOverrides(FAMILIES['item-pixel'], { steps: 'abc' }), /--steps must be a number/)
    assert.throws(() => applyOverrides(FAMILIES['item-pixel'], { 'ipWeight': '' }), /--ip-weight must be a number/)
})

test('slugFor combines family, target name and optional tag', () => {
    assert.equal(slugFor('item-pixel', 'src/assets/img/items/frostShard.png'), 'item-pixel-frostShard')
    assert.equal(slugFor('item-pixel', 'x/frostShard.png', 'noref'), 'item-pixel-frostShard-noref')
})

test('pickCandidate refuses slugs that could escape the job directory', () => {
    for (const slug of ['..', '.', '../etc', 'a/b', 'a\b', '']) {
        assert.throws(() => pickCandidate({ slug, n: 1 }), /Invalid --slug/, JSON.stringify(slug))
    }
})

test('--list-families describes every registered family', async () => {
    const list = await main(['--list-families'])
    assert.deepEqual(list.map((f) => f.id), Object.keys(FAMILIES))
})

test('--count and --seed reject non-numeric values before any server work', async () => {
    const job = ['--family', 'item-pixel', '--target', 'x/y.png', '--subject', 's']
    await assert.rejects(main([...job, '--count', 'abc']), /--count must be a number/)
    await assert.rejects(main([...job, '--count', '0']), /--count must be a positive integer/)
    await assert.rejects(main([...job, '--seed', 'x']), /--seed must be a number/)
})
