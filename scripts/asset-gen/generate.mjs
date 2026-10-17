#!/usr/bin/env node
// Asset generation CLI. Interface = family + target + subject, then pick.
//
//   node scripts/asset-gen/generate.mjs --family item-pixel --target src/assets/img/items/frostShard.png \
//        --subject "a jagged pale-blue ice crystal shard" [--count 4] [--seed N] [--no-ref] [--tier tiny|small|medium|large]
//   node scripts/asset-gen/generate.mjs --pick 3 --slug item-pixel-frostShard
//   node scripts/asset-gen/generate.mjs --list-families | --stop
//
// Tuning overrides (A/B runs): --steps --cfg --ip-weight --sampler --grid --colors --tag <suffix for the slug> --keep-raw
// Progress goes to stderr; the result is a single JSON document on stdout.

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { pathToFileURL } from 'node:url'
import { createComfy } from './lib/comfy.mjs'
import { runPipeline } from './lib/postprocess.mjs'
import { loadRefs } from './lib/refs.mjs'
import { makeSheet } from './lib/sheet.mjs'
import { buildGraph } from './lib/workflow.mjs'
import { assertRegistry, DEFAULT_TIER, FAMILIES, getFamily, REPO_ROOT, resolvePost } from './styles.mjs'

const TMP_DIR = join(REPO_ROOT, '.tmp-gen')
const log = (...args) => console.error('[asset-gen]', ...args)

export const slugFor = (familyId, target, tag) => `${familyId}-${basename(target, extname(target))}${tag ? `-${tag}` : ''}`

/** Returns a family copy with CLI tuning overrides applied (never mutates the registry). */
export function applyOverrides(family, { steps, cfg, ipWeight, sampler, grid, colors }) {
    const next = { ...family, sampler: { ...family.sampler }, post: family.post.map(([name, params]) => [name, { ...params }]) }
    if (steps !== undefined) next.sampler.steps = Number(steps)
    if (cfg !== undefined) next.sampler.cfg = Number(cfg)
    if (sampler !== undefined) next.sampler.sampler_name = sampler
    if (ipWeight !== undefined) next.ipWeight = Number(ipWeight)
    for (const [name, params] of next.post) {
        if (grid !== undefined && name === 'pixelate') params.grid = Number(grid)
        if (colors !== undefined && name === 'quantize') params.colors = Number(colors)
    }
    return next
}

/**
 * Generates `count` candidates for one job into `.tmp-gen/<slug>/` and writes candidate PNGs, sheet and meta.
 * @returns {Promise<object>} the JSON result printed on stdout
 */
export async function generateJob({ comfy, familyId, target, subject, seed, count = 4, useRef = true, tag, tier, keepRaw = false, overrides = {} }) {
    const family = applyOverrides(getFamily(familyId), overrides)
    const slug = slugFor(familyId, target, tag)
    const sizeGuessed = !!family.tiers && !tier
    const usedTier = family.tiers ? (tier ?? DEFAULT_TIER) : null
    const post = resolvePost(family, usedTier)
    const dir = join(TMP_DIR, slug)
    mkdirSync(dir, { recursive: true })
    const started = Date.now()

    const refs = await loadRefs(family)
    const graph = buildGraph({
        family, subject, seed, count, useRef,
        refsBase64: refs.map((r) => r.base64),
        prefix: `asset-gen/${slug}`,
    })
    log(`${slug}: generating ${count} × ${family.gen.join('×')} (${useRef ? `${refs.length} refs` : 'no refs'}, ${family.sampler.steps} steps)`)
    const raws = await comfy.run(graph)

    if (keepRaw) raws.forEach((raw, i) => writeFileSync(join(dir, `raw-${i + 1}.png`), raw))
    const candidates = await Promise.all(raws.map((raw) => runPipeline(raw, post)))
    const files = []
    for (const [i, buf] of candidates.entries()) {
        const file = join(dir, `candidate-${i + 1}.png`)
        writeFileSync(file, buf)
        files.push(file)
    }
    const sheet = join(dir, 'sheet.png')
    writeFileSync(sheet, await makeSheet({ refs: useRef ? refs.map((r) => r.buffer) : [], candidates, target: family.target, pixel: !!family.pixel }))

    const seconds = Math.round((Date.now() - started) / 100) / 10
    const meta = { slug, family: familyId, target, subject, seed, count: files.length, useRef, tag: tag ?? null, tier: usedTier, sizeGuessed, seconds }
    writeFileSync(join(dir, 'meta.json'), JSON.stringify(meta, null, 2))
    return { ...meta, candidates: files, sheet, refs: useRef ? refs.map((r) => r.path) : [] }
}

/** Copies candidate `n` of `slug` to the job's target path. */
export function pickCandidate({ slug, n }) {
    const dir = join(TMP_DIR, slug)
    const meta = JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf8'))
    if (!Number.isInteger(n) || n < 1 || n > meta.count) throw new Error(`--pick must be 1..${meta.count} for ${slug}`)
    const dest = isAbsolute(meta.target) ? meta.target : resolve(REPO_ROOT, meta.target)
    mkdirSync(dirname(dest), { recursive: true })
    copyFileSync(join(dir, `candidate-${n}.png`), dest)
    return { slug, picked: n, target: relative(REPO_ROOT, dest).replaceAll('\\', '/'), meta }
}

const OPTIONS = {
    family: { type: 'string' }, target: { type: 'string' }, subject: { type: 'string' },
    count: { type: 'string' }, seed: { type: 'string' }, 'no-ref': { type: 'boolean' }, tag: { type: 'string' }, tier: { type: 'string' },
    pick: { type: 'string' }, slug: { type: 'string' },
    'list-families': { type: 'boolean' }, stop: { type: 'boolean' },
    steps: { type: 'string' }, cfg: { type: 'string' }, 'ip-weight': { type: 'string' }, sampler: { type: 'string' },
    grid: { type: 'string' }, colors: { type: 'string' }, 'keep-raw': { type: 'boolean' },
}

export async function main(argv = process.argv.slice(2)) {
    const { values: v } = parseArgs({ args: argv, options: OPTIONS })
    assertRegistry()

    if (v['list-families']) {
        return Object.entries(FAMILIES).map(([id, f]) => ({ id, description: f.description, target: f.target, gen: f.gen, alpha: f.alpha, refs: f.references.length }))
    }
    const comfy = createComfy()
    if (v.stop) return comfy.stop()
    if (v.pick !== undefined) {
        if (!v.slug) throw new Error('--pick needs --slug')
        return pickCandidate({ slug: v.slug, n: Number(v.pick) })
    }
    for (const required of ['family', 'target', 'subject']) {
        if (!v[required]) throw new Error(`Missing --${required}`)
    }
    const family = getFamily(v.family)
    const bootStart = Date.now()
    const { started } = await comfy.ensureServer()
    const bootSeconds = Math.round((Date.now() - bootStart) / 100) / 10
    await comfy.assertCheckpoint(family.checkpoint)
    const seed = v.seed !== undefined ? Number(v.seed) : Math.floor(Math.random() * 2 ** 31)
    const result = await generateJob({
        comfy, familyId: v.family, target: v.target, subject: v.subject, seed,
        count: v.count ? Number(v.count) : 4, useRef: !v['no-ref'], tag: v.tag, tier: v.tier, keepRaw: v['keep-raw'],
        overrides: { steps: v.steps, cfg: v.cfg, ipWeight: v['ip-weight'], sampler: v.sampler, grid: v.grid, colors: v.colors },
    })
    return { ...result, serverStarted: started, bootSeconds }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
    main().then(
        (result) => console.log(JSON.stringify(result, null, 2)),
        (err) => {
            console.error(`[asset-gen] ${err.message}`)
            process.exit(1)
        },
    )
}
