// --batch jobs.json: many {family, target, subject} jobs behind one server boot.

import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { slugFor } from '../generate.mjs'
import { CONTROLS } from './controls.mjs'
import { FAMILIES, REPO_ROOT } from '../styles.mjs'

/**
 * Validates a parsed jobs file and returns normalised jobs. Throws one error listing every problem.
 * Accepted job fields: family, target, subject (required); count, seed, tier, tag, control, source (repo path of a frozen image that SDXL repaints instead of starting from noise) with denoise (0-1) and "layer": false (enemy-pixel uses LayerDiffuse by default; a repaint is matted instead), noRef, refs (repo paths replacing the family references), ipWeight, style (replaces the family style prompt), negative (added to the family negative prompt), controlStrength, controlEnd, layer (LayerDiffuse transparent generation), lora (false = no Hyper-SDXL LoRA), erode and fillHoles (cutout cleanup: trim a pale halo, fill see-through body patches), steps, cfg, sampler (optional).
 */
export function parseJobs(json) {
    if (!Array.isArray(json) || json.length === 0) throw new Error('Batch file must be a non-empty JSON array of jobs')
    const problems = []
    const slugs = new Map()
    const jobs = json.map((job, i) => {
        for (const key of ['family', 'target', 'subject']) {
            if (typeof job?.[key] !== 'string' || !job[key]) problems.push(`job ${i}: missing "${key}"`)
        }
        if (job?.family && !FAMILIES[job.family]) problems.push(`job ${i}: unknown family "${job.family}"`)
        if (job?.tier && FAMILIES[job.family] && !FAMILIES[job.family].tiers?.[job.tier]) problems.push(`job ${i}: invalid tier "${job.tier}"`)
        if (job?.control && !CONTROLS[job.control]) problems.push(`job ${i}: unknown control "${job.control}"`)
        if (job?.source && !existsSync(resolve(REPO_ROOT, job.source))) problems.push(`job ${i}: source image not found "${job.source}"`)
        if (job?.source && (job.layer ?? FAMILIES[job.family]?.layer)) problems.push(`job ${i}: "source" needs "layer": false (LayerDiffuse with a source image is untested)`)
        if (job?.denoise !== undefined && !(job.denoise > 0 && job.denoise <= 1)) problems.push(`job ${i}: denoise must be in (0, 1]`)
        if (job?.family && job?.target) {
            const slug = slugFor(job.family, job.target, job.tag)
            if (slugs.has(slug)) problems.push(`job ${i}: slug "${slug}" collides with job ${slugs.get(slug)} (add a "tag")`)
            slugs.set(slug, i)
        }
        return { count: 4, ...job }
    })
    if (problems.length) throw new Error(`Invalid batch file:\n - ${problems.join('\n - ')}`)
    return jobs
}

/**
 * Runs every job against one already-started server. A failing job is reported and does not stop the batch.
 * @returns {Promise<{results: object[], failures: {index: number, target: string, error: string}[]}>}
 */
export async function runBatch({ comfy, jobs, generate, nextSeed = () => Math.floor(Math.random() * 2 ** 31) }) {
    const checked = new Set()
    const results = []
    const failures = []
    for (const [index, job] of jobs.entries()) {
        try {
            const { checkpoint } = FAMILIES[job.family]
            if (!checked.has(checkpoint)) {
                await comfy.assertCheckpoint(checkpoint)
                checked.add(checkpoint)
            }
            results.push(await generate({ comfy, familyId: job.family, target: job.target, subject: job.subject, seed: job.seed ?? nextSeed(), count: job.count, useRef: !job.noRef, tag: job.tag, tier: job.tier, control: job.control, source: job.source, overrides: { denoise: job.denoise, refs: job.refs, ipWeight: job.ipWeight, stylePrompt: job.style, negative: job.negative, layer: job.layer, lora: job.lora, erode: job.erode, fillHoles: job.fillHoles, steps: job.steps, cfg: job.cfg, sampler: job.sampler, controlStrength: job.controlStrength, controlEnd: job.controlEnd } }))
        } catch (err) {
            failures.push({ index, target: job.target, error: err.message })
        }
    }
    return { results, failures }
}
