import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { generateJob, pickCandidate } from '../generate.mjs'
import { parseJobs, runBatch } from '../lib/batch.mjs'
import { readManifest, recordEntry, writeManifest } from '../lib/manifest.mjs'

const scratch = () => mkdtempSync(join(tmpdir(), 'asset-gen-'))

/** Fake comfy: counts boots and returns `count` flat 64×64 PNGs per run (what a raw generation looks like). */
const fakeComfy = () => {
    const calls = { ensureServer: 0, run: 0, checkpoints: [] }
    return {
        calls,
        ensureServer: async () => (calls.ensureServer++, { started: true }),
        assertCheckpoint: async (name) => void calls.checkpoints.push(name),
        run: async (graph) => {
            calls.run++
            const frame = await sharp({ create: { width: 64, height: 64, channels: 4, background: { r: 200, g: 200, b: 200, alpha: 255 } } })
                .composite([{ input: { create: { width: 24, height: 24, channels: 4, background: { r: 150, g: 40, b: 40, alpha: 255 } } }, left: 20, top: 20 }])
                .png().toBuffer()
            return Array.from({ length: graph.latent.inputs.batch_size }, () => frame)
        },
    }
}

test('parseJobs normalises valid jobs and reports every problem at once', () => {
    const jobs = parseJobs([{ family: 'item-pixel', target: 'a/frost.png', subject: 's' }, { family: 'enemy-pixel', target: 'b/wolf.png', subject: 's', tier: 'small' }])
    assert.equal(jobs[0].count, 4)
    assert.equal(jobs[1].tier, 'small')
    assert.throws(() => parseJobs({}), /non-empty JSON array/)
    assert.throws(
        () => parseJobs([{ family: 'nope', target: 't.png', subject: 's' }, { family: 'item-pixel', target: 'x/same.png', subject: 's' }, { family: 'item-pixel', target: 'y/same.png', subject: 's' }, { family: 'item-pixel', subject: 's' }, { family: 'enemy-pixel', target: 'e.png', subject: 's', tier: 'huge' }]),
        (err) => /unknown family "nope"/.test(err.message) && /collides with job 1/.test(err.message) && /missing "target"/.test(err.message) && /invalid tier "huge"/.test(err.message),
    )
})

test('a batch of N jobs boots the server once and yields N sheets', async () => {
    const tmpDir = scratch()
    const comfy = fakeComfy()
    const jobs = parseJobs([
        { family: 'item-pixel', target: 'out/a.png', subject: 'a', count: 2 },
        { family: 'item-pixel', target: 'out/b.png', subject: 'b', count: 2 },
        { family: 'item-pixel', target: 'out/c.png', subject: 'c', count: 2 },
    ])
    await comfy.ensureServer()
    const { results, failures } = await runBatch({ comfy, jobs, generate: (job) => generateJob({ ...job, tmpDir }), nextSeed: () => 1 })
    assert.equal(failures.length, 0)
    assert.equal(results.length, 3)
    assert.equal(comfy.calls.ensureServer, 1)
    assert.equal(comfy.calls.run, 3)
    assert.deepEqual(comfy.calls.checkpoints, ['zavychromaxl_v80.safetensors'], 'checkpoint verified once per distinct checkpoint')
    for (const r of results) assert.ok(existsSync(r.sheet))
})

test('a failing job is reported without stopping the batch', async () => {
    const jobs = parseJobs([{ family: 'item-pixel', target: 'out/a.png', subject: 'a' }, { family: 'item-pixel', target: 'out/b.png', subject: 'b' }])
    const { results, failures } = await runBatch({
        comfy: fakeComfy(), jobs, nextSeed: () => 1,
        generate: async (job) => {
            if (job.target === 'out/a.png') throw new Error('boom')
            return job
        },
    })
    assert.equal(results.length, 1)
    assert.deepEqual(failures, [{ index: 0, target: 'out/a.png', error: 'boom' }])
})

test('manifest read/write keeps sorted keys, creates the file, and preserves extra fields on update', () => {
    const path = join(scratch(), 'manifest.json')
    assert.deepEqual(readManifest(path), {})
    recordEntry('z/last.png', { family: 'item-pixel', subject: 's', seed: 1, date: '2026-01-01' }, path)
    recordEntry('a/first.png', { family: 'enemy-pixel', tier: 'small', subject: 'wolf', seed: 2, date: '2026-01-02' }, path)
    assert.deepEqual(Object.keys(readManifest(path)), ['a/first.png', 'z/last.png'])

    const manifest = readManifest(path)
    manifest['a/first.png'].shinyHue = 120
    writeManifest(manifest, path)
    recordEntry('a/first.png', { family: 'enemy-pixel', tier: 'small', subject: 'wolf, redo', seed: 3, date: '2026-02-01' }, path)
    assert.deepEqual(readManifest(path)['a/first.png'], { family: 'enemy-pixel', tier: 'small', subject: 'wolf, redo', seed: 3, date: '2026-02-01', shinyHue: 120 })
    assert.ok(readFileSync(path, 'utf8').endsWith('\n'))
})

test('--pick copies the candidate and creates/updates the manifest entry; scratch targets are not recorded', async () => {
    const root = scratch()
    const tmpDir = join(root, '.tmp-gen')
    const manifestPath = join(root, 'manifest.json')
    const comfy = fakeComfy()
    const run = (target, subject, seed) => generateJob({ comfy, familyId: 'enemy-pixel', target, subject, seed, count: 2, tier: 'tiny', tmpDir })

    await run('src/enemies/wolf.png', 'a wolf', 5)
    const first = pickCandidate({ slug: 'enemy-pixel-wolf', n: 2, tmpDir, root, manifestPath, date: '2026-03-01' })
    assert.ok(existsSync(join(root, 'src/enemies/wolf.png')))
    assert.deepEqual(first.manifest, { family: 'enemy-pixel', tier: 'tiny', subject: 'a wolf', seed: 5, date: '2026-03-01' })

    await run('src/enemies/wolf.png', 'a grey wolf', 6)
    pickCandidate({ slug: 'enemy-pixel-wolf', n: 1, tmpDir, root, manifestPath, date: '2026-03-02' })
    assert.equal(readManifest(manifestPath)['src/enemies/wolf.png'].seed, 6)
    assert.equal(Object.keys(readManifest(manifestPath)).length, 1)

    mkdirSync(join(root, '.tmp-gen'), { recursive: true })
    await run('.tmp-gen/scratch/wolf.png', 'scratch', 7)
    const scratchPick = pickCandidate({ slug: 'enemy-pixel-wolf', n: 1, tmpDir, root, manifestPath })
    assert.equal(scratchPick.manifest, null)
    assert.equal(Object.keys(readManifest(manifestPath)).length, 1)
    assert.throws(() => pickCandidate({ slug: 'enemy-pixel-wolf', n: 9, tmpDir, root, manifestPath }), /--pick must be 1\.\.2/)
})
