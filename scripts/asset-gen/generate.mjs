#!/usr/bin/env node
// Asset generation CLI. Interface = family + target + subject, then pick.
//
//   node scripts/asset-gen/generate.mjs --family item-pixel --target src/assets/img/items/frostShard.png \
//        --subject "a jagged pale-blue ice crystal shard" [--count 4] [--seed N] [--no-ref] [--tier tiny|small|medium|large] [--control spider|crab|crabFront|quadruped]
//   node scripts/asset-gen/generate.mjs --pick 3 --slug item-pixel-frostShard
//   node scripts/asset-gen/generate.mjs --reprocess --slug <slug> [--erode 14] [--fill-holes 0.03]   # re-run post-process on the saved raw generations, no GPU
//        # --erode trims a pale halo (px at generation size), --fill-holes fills see-through patches in the body (fraction of the frame)
//   node scripts/asset-gen/generate.mjs --batch jobs.json       # [{family,target,subject,count?,seed?,tier?,tag?}], one boot
//   node scripts/asset-gen/generate.mjs --estimate-hue <base target>   # from the existing base + -shiny pair; stores shinyHue
//   node scripts/asset-gen/generate.mjs --shiny-of <base target> [--hue N] [--saturation X] [--brightness X]   # writes <name>-shiny.png beside the base
//   node scripts/asset-gen/generate.mjs --list-families | --stop
//
//   node scripts/asset-gen/generate.mjs --zimage "<what to draw, view and body plan>" --name crab [--count 8] [--seed N]
//        # Z-Image draws structure candidates; --pick N --slug zimage-crab freezes one as refs/control/crab-source.png
//   node scripts/asset-gen/generate.mjs --make-control goblinArcher --from .tmp-gen/zimage-goblinScoutBow/candidate-4.png
//        [--thicken 8]   # freezes a checked structure image and its silhouette in refs/control; then --control goblinArcher works
//        # --thicken grows the outline by N px so thin lines (bowstring) survive the pixelate step
//        [--hand x,y [--grip-angle 20] [--weapon-scale 1]]   # stores the hand anchor (control px) so --weapon works
//   ... --control biped --weapon knife|sword|club|axe|spear|staff   # code draws a straight weapon into the control at its hand
//   ... --source scripts/asset-gen/refs/control/crab-source.png --no-layer [--denoise 0.45]   # SDXL repaints a frozen source in the family's style
//        # enemy-pixel generates with LayerDiffuse (transparent) by default; --no-layer matts instead, which a repaint needs
//
// Tuning overrides (A/B runs): --steps --cfg --ip-weight --ip-type "<IP-Adapter weight type>" --ip-combine average|concat --sampler --grid --colors --tag <suffix for the slug>
// --style "<prompt>" replaces the family's style prompt for this job; --negative "<terms>" adds to its negative prompt
// --ref <repo path> (repeatable) replaces the family's reference images for this job, e.g. a species-specific set
// Progress goes to stderr; the result is a single JSON document on stdout.

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { pathToFileURL } from 'node:url'
import { parseJobs, runBatch } from './lib/batch.mjs'
import { createComfy } from './lib/comfy.mjs'
import { CONTROL_TYPES, controlImage } from './lib/controls.mjs'
import { MANIFEST_PATH, readManifest, recordEntry, setField } from './lib/manifest.mjs'
import { estimateHue, hueShift, shinyPathFor } from './lib/shiny.mjs'
import { runPipeline } from './lib/postprocess.mjs'
import { imageStats, qcBackground, qcCandidate } from './lib/qc.mjs'
import { loadRefs } from './lib/refs.mjs'
import { makeSheet } from './lib/sheet.mjs'
import { makeControl } from './lib/silhouette.mjs'
import { prepareSource } from './lib/source.mjs'
import { buildGraph, SOURCE_DENOISE } from './lib/workflow.mjs'
import { generateStructure } from './lib/zimage.mjs'
import { assertRegistry, DEFAULT_TIER, FAMILIES, getFamily, REPO_ROOT, resolvePost } from './styles.mjs'

const TMP_DIR = join(REPO_ROOT, '.tmp-gen')
const log = (...args) => console.error('[asset-gen]', ...args)

export const slugFor = (familyId, target, tag) => `${familyId}-${basename(target, extname(target))}${tag ? `-${tag}` : ''}`

/** Returns a family copy with CLI tuning overrides applied (never mutates the registry). */
export function applyOverrides(family, { steps, cfg, ipWeight, ipWeightType, ipCombine, sampler, grid, colors, refs, stylePrompt, negative, layer, lora, erode, fillHoles }) {
    const next = { ...family, sampler: { ...family.sampler }, post: family.post.map(([name, params]) => [name, { ...params }]) }
    if (lora !== undefined) next.lora = lora
    if (steps !== undefined) next.sampler.steps = Number(steps)
    if (cfg !== undefined) next.sampler.cfg = Number(cfg)
    if (sampler !== undefined) next.sampler.sampler_name = sampler
    if (ipWeight !== undefined) next.ipWeight = Number(ipWeight)
    if (ipWeightType !== undefined) next.ipWeightType = ipWeightType
    if (ipCombine !== undefined) next.ipCombine = ipCombine
    if (refs?.length) next.references = refs
    if (stylePrompt) next.stylePrompt = stylePrompt
    if (negative) next.negative = `${family.negative}, ${negative}`
    // LayerDiffuse generates real alpha, so the matting step becomes a plain alpha cleanup (and back without it)
    if (layer !== undefined) {
        next.layer = layer
        const [from, to] = layer ? ['matte', 'alpha'] : ['alpha', 'matte']
        next.post = next.post.map(([name, params]) => (name === from ? [to, {}] : [name, params]))
    }
    for (const [name, params] of next.post) {
        if (grid !== undefined && name === 'pixelate') params.grid = Number(grid)
        if (colors !== undefined && name === 'quantize') params.colors = Number(colors)
        // cutout cleanup for one job: `erode` px (at generation size) trims a pale halo, `fillHoles` (fraction of the
        // frame) fills see-through patches inside the body
        if (['alpha', 'matte'].includes(name)) {
            if (erode !== undefined) params.erode = Number(erode)
            if (fillHoles !== undefined) params.holeArea = Number(fillHoles)
        }
    }
    return next
}

/**
 * QC every candidate of a job: cutout checks for transparent families, edge and tone checks for opaque ones.
 * Flags never block a pick: they say where to look.
 * @returns {Promise<{n: number, flags: {code: string, detail: string}[], metrics: object}[]>}
 */
async function runQc({ family, raws, candidates, control, weapon }) {
    if (!family.alpha) return []
    const controlBuf = control ? await controlImage(control, { weapon }) : undefined
    return Promise.all(raws.map(async (raw, i) => ({ n: i + 1, ...(await qcCandidate({ raw, candidate: candidates[i], control: controlBuf })) })))
}

/**
 * Generates `count` candidates for one job into `.tmp-gen/<slug>/` and writes candidate PNGs, sheet and meta.
 * @returns {Promise<object>} the JSON result printed on stdout
 */
export async function generateJob({ comfy, familyId, target, subject, seed, count = 4, useRef = true, tag, tier, control, weapon, source, keepRaw = true, overrides = {}, tmpDir = TMP_DIR }) {
    const family = applyOverrides(getFamily(familyId), overrides)
    if (weapon && !control) throw new Error('--weapon needs --control: the weapon is drawn into the control at its hand anchor')
    if (source && family.layer) throw new Error(`${familyId} generates with LayerDiffuse by default, which is untested with "source": pass layer: false (--no-layer) so the family's matte step cuts out the repaint`)
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
        control: control
            ? { base64: (await controlImage(control, { weapon })).toString('base64'), type: CONTROL_TYPES[control], strength: overrides.controlStrength, end: overrides.controlEnd }
            : undefined,
        source: source ? { base64: (await prepareSource(source, family.gen, REPO_ROOT)).toString('base64'), denoise: overrides.denoise } : undefined,
        prefix: `asset-gen/${slug}`,
    })
    log(`${slug}: ${source ? `repainting ${source},` : 'generating'} ${count} × ${family.gen.join('×')} (${useRef ? `${refs.length} refs` : 'no refs'}, ${family.sampler.steps} steps)`)
    const raws = await comfy.run(graph)

    if (keepRaw) raws.forEach((raw, i) => writeFileSync(join(dir, `raw-${i + 1}.png`), raw))
    const candidates = await Promise.all(raws.map((raw) => runPipeline(raw, post)))
    const files = []
    for (const [i, buf] of candidates.entries()) {
        const file = join(dir, `candidate-${i + 1}.png`)
        writeFileSync(file, buf)
        files.push(file)
    }
    const qc = await runQc({ family, raws, candidates, control, weapon })
    const sheet = join(dir, 'sheet.png')
    writeFileSync(sheet, await makeSheet({ refs: useRef ? refs.map((r) => r.buffer) : [], candidates, target: family.target, pixel: !!family.pixel, flagged: qc.filter((c) => c.flags.length).map((c) => c.n) }))

    const seconds = Math.round((Date.now() - started) / 100) / 10
    const meta = { slug, family: familyId, target, subject, seed, count: files.length, useRef, tag: tag ?? null, tier: usedTier, control: control ?? null, weapon: weapon ?? null, source: source ?? null, denoise: source ? (overrides.denoise ?? SOURCE_DENOISE) : null, layer: !!family.layer, sizeGuessed, seconds, qc }
    writeFileSync(join(dir, 'meta.json'), JSON.stringify(meta, null, 2))
    return { ...meta, candidates: files, sheet, refs: useRef ? refs.map((r) => r.path) : [] }
}

/**
 * Re-runs the post-process chain and contact sheet over the raw generations saved in `.tmp-gen/<slug>/`, so a
 * post-process change can be judged (and an old batch repaired) without regenerating. Needs `raw-N.png` files.
 */
export async function reprocessJob({ slug, tmpDir = TMP_DIR, overrides = {} }) {
    const dir = join(tmpDir, slug)
    const meta = JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf8'))
    // metas from before `layer` was recorded were matted, whatever the family default is now
    const family = applyOverrides(getFamily(meta.family), { layer: meta.layer ?? false, ...overrides })
    const post = resolvePost(family, meta.tier)
    const refs = meta.useRef ? await loadRefs(family) : []
    const raws = []
    const candidates = []
    for (let i = 1; i <= meta.count; i++) {
        const rawFile = join(dir, `raw-${i}.png`)
        if (!existsSync(rawFile)) throw new Error(`${slug}: no raw-${i}.png (it was generated before raws were kept); regenerate instead`)
        raws.push(readFileSync(rawFile))
        candidates.push(await runPipeline(raws[i - 1], post))
        writeFileSync(join(dir, `candidate-${i}.png`), candidates[i - 1])
    }
    const qc = await runQc({ family, raws, candidates, control: meta.control, weapon: meta.weapon ?? undefined })
    writeFileSync(join(dir, 'meta.json'), JSON.stringify({ ...meta, qc }, null, 2))
    const sheet = join(dir, 'sheet.png')
    writeFileSync(sheet, await makeSheet({ refs: refs.map((r) => r.buffer), candidates, target: family.target, pixel: !!family.pixel, flagged: qc.filter((c) => c.flags.length).map((c) => c.n) }))
    return { slug, reprocessed: candidates.length, sheet, qc }
}

/**
 * Copies candidate `n` of `slug` to the job's target path and records it in the manifest (scratch targets under
 * `.tmp-gen/` and frozen sources under `refs/` are not recorded).
 */
export function pickCandidate({ slug, n, tmpDir = TMP_DIR, root = REPO_ROOT, manifestPath = MANIFEST_PATH, date }) {
    const dir = join(tmpDir, slug)
    const meta = JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf8'))
    if (!Number.isInteger(n) || n < 1 || n > meta.count) throw new Error(`--pick must be 1..${meta.count} for ${slug}`)
    const dest = isAbsolute(meta.target) ? meta.target : resolve(root, meta.target)
    mkdirSync(dirname(dest), { recursive: true })
    copyFileSync(join(dir, `candidate-${n}.png`), dest)
    const target = relative(root, dest).replaceAll('\\', '/')
    const entry = target.startsWith('.tmp-gen/') || target.startsWith('scripts/asset-gen/refs/') ? null : recordEntry(target, { family: meta.family, tier: meta.tier, subject: meta.subject, seed: meta.seed, date }, manifestPath)
    // a flagged candidate can still be picked on purpose; say so in the result so it is not lost
    const qcFlags = meta.qc?.find((c) => c.n === n)?.flags ?? []
    return { slug, picked: n, target, manifest: entry, qcFlags, meta }
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
    qc: { type: 'string' }, 'estimate-hue': { type: 'string' }, 'shiny-of': { type: 'string' }, hue: { type: 'string' }, saturation: { type: 'string' }, brightness: { type: 'string' },
    family: { type: 'string' }, target: { type: 'string' }, subject: { type: 'string' },
    count: { type: 'string' }, seed: { type: 'string' }, 'no-ref': { type: 'boolean' }, tag: { type: 'string' }, tier: { type: 'string' },
    pick: { type: 'string' }, slug: { type: 'string' }, batch: { type: 'string' },
    'list-families': { type: 'boolean' }, stop: { type: 'boolean' }, reprocess: { type: 'boolean' }, control: { type: 'string' },
    steps: { type: 'string' }, cfg: { type: 'string' }, 'ip-weight': { type: 'string' }, 'ip-type': { type: 'string' }, 'ip-combine': { type: 'string' }, sampler: { type: 'string' },
    grid: { type: 'string' }, colors: { type: 'string' }, ref: { type: 'string', multiple: true }, 'control-strength': { type: 'string' }, 'control-end': { type: 'string' }, style: { type: 'string' }, negative: { type: 'string' }, layer: { type: 'boolean' }, 'no-layer': { type: 'boolean' },
    source: { type: 'string' }, denoise: { type: 'string' }, zimage: { type: 'string' }, name: { type: 'string' },
    'make-control': { type: 'string' }, from: { type: 'string' }, erode: { type: 'string' }, 'fill-holes': { type: 'string' }, thicken: { type: 'string' },
    weapon: { type: 'string' }, hand: { type: 'string' }, 'grip-angle': { type: 'string' }, 'weapon-scale': { type: 'string' },
}

export async function main(argv = process.argv.slice(2)) {
    const { values: v } = parseArgs({ args: argv, options: OPTIONS })
    assertRegistry()

    if (v['list-families']) {
        return Object.entries(FAMILIES).map(([id, f]) => ({ id, description: f.description, target: f.target, gen: f.gen, alpha: f.alpha, refs: f.references.length }))
    }
    const comfy = createComfy()
    if (v.stop) return comfy.stop()
    if (v.qc) {
        // opaque image check for a finished background: luminance, edge strips and the flags a generation would get
        const file = resolve(REPO_ROOT, v.qc)
        const candidate = readFileSync(file)
        return { file: relative(REPO_ROOT, file).replaceAll('\\', '/'), ...(await imageStats(candidate)), flags: (await qcBackground({ candidate })).flags }
    }
    if (v['estimate-hue']) return estimateShinyHue({ target: v['estimate-hue'] })
    if (v['shiny-of']) return makeShiny({ target: v['shiny-of'], hue: v.hue === undefined ? undefined : Number(v.hue), saturation: v.saturation === undefined ? undefined : Number(v.saturation), brightness: v.brightness === undefined ? undefined : Number(v.brightness) })
    if (v.reprocess) {
        if (!v.slug) throw new Error('--reprocess needs --slug')
        return reprocessJob({ slug: v.slug, overrides: { erode: v.erode, fillHoles: v['fill-holes'] } })
    }
    if (v.pick !== undefined) {
        if (!v.slug) throw new Error('--pick needs --slug')
        return pickCandidate({ slug: v.slug, n: Number(v.pick) })
    }
    if (v['make-control']) {
        if (!v.from) throw new Error('--make-control <name> needs --from <image> (a checked structure image or cutout)')
        const hand = v.hand?.split(',').map(Number)
        if (hand && (hand.length !== 2 || hand.some((n) => !Number.isFinite(n)))) throw new Error('--hand must be x,y in the 1024² control')
        return makeControl({ name: v['make-control'], from: resolve(REPO_ROOT, v.from), thicken: v.thicken === undefined ? 0 : Number(v.thicken), hand, angle: v['grip-angle'] === undefined ? undefined : Number(v['grip-angle']), scale: v['weapon-scale'] === undefined ? undefined : Number(v['weapon-scale']), dir: join(REPO_ROOT, 'scripts', 'asset-gen', 'refs', 'control') })
    }
    if (v.zimage) {
        if (!v.name) throw new Error('--zimage needs --name (the frozen source becomes refs/control/<name>-source.png)')
        const { started } = await comfy.ensureServer()
        const seed = v.seed !== undefined ? Number(v.seed) : Math.floor(Math.random() * 2 ** 31)
        return { ...(await generateStructure({ comfy, prompt: v.zimage, name: v.name, seed, count: v.count ? Number(v.count) : 8, tmpDir: TMP_DIR })), serverStarted: started }
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
    const result = await generateJob({
        comfy, familyId: v.family, target: v.target, subject: v.subject, seed,
        count: v.count ? Number(v.count) : 4, useRef: !v['no-ref'], tag: v.tag, tier: v.tier, control: v.control, weapon: v.weapon, source: v.source,
        overrides: { denoise: v.denoise === undefined ? undefined : Number(v.denoise), steps: v.steps, cfg: v.cfg, ipWeight: v['ip-weight'], ipWeightType: v['ip-type'], ipCombine: v['ip-combine'], sampler: v.sampler, grid: v.grid, colors: v.colors, refs: v.ref, stylePrompt: v.style, negative: v.negative, layer: v['no-layer'] ? false : v.layer, erode: v.erode, fillHoles: v['fill-holes'], controlStrength: v['control-strength'] === undefined ? undefined : Number(v['control-strength']), controlEnd: v['control-end'] === undefined ? undefined : Number(v['control-end']) },
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
