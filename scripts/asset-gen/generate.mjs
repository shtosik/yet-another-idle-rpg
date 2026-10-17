#!/usr/bin/env node
// Asset generation CLI. Interface = family + target + subject, then pick.
//
//   node scripts/asset-gen/generate.mjs --family item-pixel --target src/assets/img/items/frostShard.png \
//        --subject "a jagged pale-blue ice crystal shard" [--count 4] [--seed N] [--no-ref] [--tier tiny|small|medium|large] [--recipe crab|gangsterCrab|spider|quadruped] [--control spider|crab|crabFront|quadruped]
//   node scripts/asset-gen/generate.mjs --pick 3 --slug item-pixel-frostShard
//   node scripts/asset-gen/generate.mjs --reprocess --slug <slug>   # re-run post-process on the saved raw generations, no GPU
//   node scripts/asset-gen/generate.mjs --batch jobs.json       # [{family,target,subject,count?,seed?,tier?,tag?}], one boot
//   node scripts/asset-gen/generate.mjs --estimate-hue <base target>   # from the existing base + -shiny pair; stores shinyHue
//   node scripts/asset-gen/generate.mjs --shiny-of <base target> [--hue N] [--saturation X] [--brightness X]   # writes <name>-shiny.png beside the base
//   node scripts/asset-gen/generate.mjs --montage <png|dir>... [--pairs] [--bg #00aaff] [--cols 6] [--cell 300] [--out file]
//        # flatten sprites on a contrasting colour, numbered, to review a whole set at once
//   node scripts/asset-gen/generate.mjs --list-families | --stop
//
// Tuning overrides (A/B runs): --steps --cfg --ip-weight --sampler --grid --colors --tag <suffix for the slug>
// --style "<prompt>" replaces the family's style prompt for this job
// --ref <repo path> (repeatable) replaces the family's reference images for this job, e.g. a species-specific set
// Progress goes to stderr; the result is a single JSON document on stdout.

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { pathToFileURL } from 'node:url'
import { parseJobs, runBatch } from './lib/batch.mjs'
import { createComfy } from './lib/comfy.mjs'
import { collectImages, makeMontage } from './lib/montage.mjs'
import { controlImage } from './lib/controls.mjs'
import { qcOptionsFor, qcSprite, rawQc } from './lib/qc.mjs'
import { MANIFEST_PATH, readManifest, recordEntry, setField } from './lib/manifest.mjs'
import { estimateHue, hueShift, shinyPathFor } from './lib/shiny.mjs'
import { runPipeline } from './lib/postprocess.mjs'
import { loadRefs } from './lib/refs.mjs'
import { makeSheet } from './lib/sheet.mjs'
import { buildGraph } from './lib/workflow.mjs'
import { applyRecipe, assertRegistry, DEFAULT_TIER, FAMILIES, getFamily, REPO_ROOT, resolvePost } from './styles.mjs'

const TMP_DIR = join(REPO_ROOT, '.tmp-gen')
const log = (...args) => console.error('[asset-gen]', ...args)

export const slugFor = (familyId, target, tag) => `${familyId}-${basename(target, extname(target))}${tag ? `-${tag}` : ''}`

/** Returns a family copy with CLI tuning overrides applied (never mutates the registry). */
export function applyOverrides(family, { steps, cfg, ipWeight, sampler, grid, colors, refs, stylePrompt }) {
    const next = { ...family, sampler: { ...family.sampler }, post: family.post.map(([name, params]) => [name, { ...params }]) }
    if (steps !== undefined) next.sampler.steps = Number(steps)
    if (cfg !== undefined) next.sampler.cfg = Number(cfg)
    if (sampler !== undefined) next.sampler.sampler_name = sampler
    if (ipWeight !== undefined) next.ipWeight = Number(ipWeight)
    if (refs?.length) next.references = refs
    if (stylePrompt) next.stylePrompt = stylePrompt
    for (const [name, params] of next.post) {
        if (grid !== undefined && name === 'pixelate') params.grid = Number(grid)
        if (colors !== undefined && name === 'quantize') params.colors = Number(colors)
    }
    return next
}

/** QC flags per candidate, 1-based: [{n, flags}] (empty flags = clean). See lib/qc.mjs. */
async function qcAll(candidates, family, tier, raws) {
    const opts = qcOptionsFor(family, family.tiers?.[tier])
    return Promise.all(
        candidates.map(async (buf, i) => ({ n: i + 1, flags: [...(await qcSprite(buf, opts)).flags, ...(family.alpha ? await rawQc(raws[i]) : [])] })),
    )
}

/**
 * Generates `count` candidates for one job into `.tmp-gen/<slug>/` and writes candidate PNGs, sheet and meta.
 * @returns {Promise<object>} the JSON result printed on stdout
 */
export async function generateJob({ comfy, familyId, target, subject, seed, count = 4, useRef = true, tag, tier, control, keepRaw = true, overrides = {}, tmpDir = TMP_DIR }) {
    const family = applyOverrides(getFamily(familyId), overrides)
    for (const ref of family.references) {
        if (!existsSync(resolve(REPO_ROOT, ref))) throw new Error(`Reference not found: ${ref}`)
    }
    const slug = slugFor(familyId, target, tag)
    const sizeGuessed = !!family.tiers && !tier
    const usedTier = family.tiers ? (tier ?? DEFAULT_TIER) : null
    const post = resolvePost(family, usedTier)
    const dir = join(tmpDir, slug)
    mkdirSync(dir, { recursive: true })
    const started = Date.now()

    const refs = await loadRefs(family)
    const graph = buildGraph({
        family, subject, seed, count, useRef,
        refsBase64: refs.map((r) => r.base64),
        control: control ? { base64: (await controlImage(control)).toString('base64'), strength: overrides.controlStrength, end: overrides.controlEnd } : undefined,
        prefix: `asset-gen/${slug}`,
    })
    log(`${slug}: generating ${count} × ${family.gen.join('×')} (${useRef ? `${refs.length} refs` : 'no refs'}, ${family.sampler.steps} steps)`)
    const raws = await comfy.run(graph)

    if (keepRaw) raws.forEach((raw, i) => writeFileSync(join(dir, `raw-${i + 1}.png`), raw))
    const candidates = await Promise.all(raws.map((raw) => runPipeline(raw, post)))
    const qc = await qcAll(candidates, family, usedTier, raws)
    const files = []
    for (const [i, buf] of candidates.entries()) {
        const file = join(dir, `candidate-${i + 1}.png`)
        writeFileSync(file, buf)
        files.push(file)
    }
    const sheet = join(dir, 'sheet.png')
    writeFileSync(sheet, await makeSheet({ refs: useRef ? refs.map((r) => r.buffer) : [], candidates, target: family.target, pixel: !!family.pixel }))

    const seconds = Math.round((Date.now() - started) / 100) / 10
    const meta = { slug, family: familyId, target, subject, seed, count: files.length, useRef, tag: tag ?? null, tier: usedTier, control: control ?? null, sizeGuessed, seconds, qc }
    writeFileSync(join(dir, 'meta.json'), JSON.stringify(meta, null, 2))
    return { ...meta, candidates: files, sheet, refs: useRef ? refs.map((r) => r.path) : [] }
}

/**
 * Re-runs the post-process chain and contact sheet over the raw generations saved in `.tmp-gen/<slug>/`, so a
 * post-process change can be judged (and an old batch repaired) without regenerating. Needs `raw-N.png` files.
 */
export async function reprocessJob({ slug, tmpDir = TMP_DIR }) {
    const dir = join(tmpDir, slug)
    const meta = JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf8'))
    const family = getFamily(meta.family)
    const post = resolvePost(family, meta.tier)
    const refs = meta.useRef ? await loadRefs(family) : []
    const candidates = []
    const raws = []
    for (let i = 1; i <= meta.count; i++) {
        const rawFile = join(dir, `raw-${i}.png`)
        if (!existsSync(rawFile)) throw new Error(`${slug}: no raw-${i}.png (it was generated before raws were kept); regenerate instead`)
        raws.push(readFileSync(rawFile))
        candidates.push(await runPipeline(raws[i - 1], post))
        writeFileSync(join(dir, `candidate-${i}.png`), candidates[i - 1])
    }
    const sheet = join(dir, 'sheet.png')
    writeFileSync(sheet, await makeSheet({ refs: refs.map((r) => r.buffer), candidates, target: family.target, pixel: !!family.pixel }))
    const qc = await qcAll(candidates, family, meta.tier, raws)
    writeFileSync(join(dir, 'meta.json'), JSON.stringify({ ...meta, qc }, null, 2))
    return { slug, reprocessed: candidates.length, sheet, qc }
}

/**
 * Copies candidate `n` of `slug` to the job's target path and records it in the manifest (scratch targets under
 * `.tmp-gen/` are not recorded).
 */
export function pickCandidate({ slug, n, tmpDir = TMP_DIR, root = REPO_ROOT, manifestPath = MANIFEST_PATH, date }) {
    const dir = join(tmpDir, slug)
    const meta = JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf8'))
    if (!Number.isInteger(n) || n < 1 || n > meta.count) throw new Error(`--pick must be 1..${meta.count} for ${slug}`)
    const dest = isAbsolute(meta.target) ? meta.target : resolve(root, meta.target)
    mkdirSync(dirname(dest), { recursive: true })
    copyFileSync(join(dir, `candidate-${n}.png`), dest)
    const target = relative(root, dest).replaceAll('\\', '/')
    const entry = target.startsWith('.tmp-gen/') ? null : recordEntry(target, { family: meta.family, tier: meta.tier, subject: meta.subject, seed: meta.seed, date }, manifestPath)
    const qc = meta.qc?.find((c) => c.n === n)?.flags ?? []
    if (qc.length) log(`${slug}: candidate ${n} was picked with QC flags: ${qc.join('; ')}`)
    return { slug, picked: n, target, manifest: entry, qc, meta }
}

/** Estimates the hue angle from the base + shiny pair currently on disk and stores it as `shinyHue`. Run before the base is regenerated. */
export async function estimateShinyHue({ target, root = REPO_ROOT, manifestPath = MANIFEST_PATH }) {
    const base = resolve(root, target)
    const shiny = shinyPathFor(base)
    const angle = await estimateHue(readFileSync(base), readFileSync(shiny))
    setField(target, 'shinyHue', angle, manifestPath)
    return { target, shinyHue: angle }
}

/**
 * Writes `<name>-shiny.png` beside the accepted base: hue angle = `hue` flag, else the manifest's stored
 * `shinyHue`. A flag value is stored back so the next redo reuses it.
 */
export async function makeShiny({ target, hue, saturation, brightness, root = REPO_ROOT, manifestPath = MANIFEST_PATH }) {
    const base = resolve(root, target)
    const entry = readManifest(manifestPath)[target]
    const angle = hue ?? entry?.shinyHue
    const sat = saturation ?? entry?.shinySaturation
    const bright = brightness ?? entry?.shinyBrightness
    if (angle === undefined) throw new Error(`No shinyHue for ${target}: pass --hue N, or run --estimate-hue before regenerating the base`)
    const out = shinyPathFor(base)
    writeFileSync(out, await hueShift(readFileSync(base), angle, { saturation: sat, brightness: bright }))
    setField(target, 'shinyHue', angle, manifestPath)
    if (saturation !== undefined) setField(target, 'shinySaturation', saturation, manifestPath)
    if (brightness !== undefined) setField(target, 'shinyBrightness', brightness, manifestPath)
    return { target, shiny: relative(root, out).replaceAll('\\', '/'), shinyHue: angle, shinySaturation: sat ?? null, shinyBrightness: bright ?? null }
}

const OPTIONS = {
    'estimate-hue': { type: 'string' }, 'shiny-of': { type: 'string' }, hue: { type: 'string' }, saturation: { type: 'string' }, brightness: { type: 'string' },
    family: { type: 'string' }, target: { type: 'string' }, subject: { type: 'string' },
    count: { type: 'string' }, seed: { type: 'string' }, 'no-ref': { type: 'boolean' }, tag: { type: 'string' }, tier: { type: 'string' },
    pick: { type: 'string' }, slug: { type: 'string' }, batch: { type: 'string' },
    'list-families': { type: 'boolean' }, stop: { type: 'boolean' }, reprocess: { type: 'boolean' }, montage: { type: 'string', multiple: true }, pairs: { type: 'boolean' }, bg: { type: 'string' }, cols: { type: 'string' }, cell: { type: 'string' }, out: { type: 'string' }, control: { type: 'string' }, recipe: { type: 'string' },
    steps: { type: 'string' }, cfg: { type: 'string' }, 'ip-weight': { type: 'string' }, sampler: { type: 'string' },
    grid: { type: 'string' }, colors: { type: 'string' }, ref: { type: 'string', multiple: true }, 'control-strength': { type: 'string' }, 'control-end': { type: 'string' }, style: { type: 'string' }, 
}

export async function main(argv = process.argv.slice(2)) {
    const { values: v } = parseArgs({ args: argv, options: OPTIONS })
    assertRegistry()

    if (v['list-families']) {
        return Object.entries(FAMILIES).map(([id, f]) => ({ id, description: f.description, target: f.target, gen: f.gen, alpha: f.alpha, refs: f.references.length }))
    }
    if (v.montage) {
        const files = collectImages(v.montage, { pairs: v.pairs })
        const { buffer, items } = await makeMontage(files, { bg: v.bg, cols: v.cols ? Number(v.cols) : undefined, cell: v.cell ? Number(v.cell) : undefined })
        const out = resolve(REPO_ROOT, v.out ?? join('.tmp-gen', 'montage.png'))
        mkdirSync(dirname(out), { recursive: true })
        writeFileSync(out, buffer)
        return { montage: out, count: items.length, items }
    }
    const comfy = createComfy()
    if (v.stop) return comfy.stop()
    if (v['estimate-hue']) return estimateShinyHue({ target: v['estimate-hue'] })
    if (v['shiny-of']) return makeShiny({ target: v['shiny-of'], hue: v.hue === undefined ? undefined : Number(v.hue), saturation: v.saturation === undefined ? undefined : Number(v.saturation), brightness: v.brightness === undefined ? undefined : Number(v.brightness) })
    if (v.reprocess) {
        if (!v.slug) throw new Error('--reprocess needs --slug')
        return reprocessJob({ slug: v.slug })
    }
    if (v.pick !== undefined) {
        if (!v.slug) throw new Error('--pick needs --slug')
        return pickCandidate({ slug: v.slug, n: Number(v.pick) })
    }
    if (v.batch) {
        const jobs = parseJobs(JSON.parse(readFileSync(v.batch, 'utf8')))
        const bootStart = Date.now()
        const { started } = await comfy.ensureServer()
        const bootSeconds = Math.round((Date.now() - bootStart) / 100) / 10
        const { results, failures } = await runBatch({ comfy, jobs, generate: generateJob })
        return { jobs: jobs.length, serverStarted: started, bootSeconds, results, failures }
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
    const job = applyRecipe({
        recipe: v.recipe, family: v.family, control: v.control, refs: v.ref, style: v.style,
        ipWeight: v['ip-weight'], controlStrength: v['control-strength'] === undefined ? undefined : Number(v['control-strength']),
        controlEnd: v['control-end'] === undefined ? undefined : Number(v['control-end']),
    })
    const result = await generateJob({
        comfy, familyId: v.family, target: v.target, subject: v.subject, seed,
        count: v.count ? Number(v.count) : 4, useRef: !v['no-ref'], tag: v.tag, tier: v.tier, control: job.control,
        overrides: { steps: v.steps, cfg: v.cfg, ipWeight: job.ipWeight, sampler: v.sampler, grid: v.grid, colors: v.colors, refs: job.refs, stylePrompt: job.style, controlStrength: job.controlStrength, controlEnd: job.controlEnd },
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
