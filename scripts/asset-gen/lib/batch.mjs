// --batch jobs.json: many {family, target, subject} jobs behind one server boot.

import { slugFor } from '../generate.mjs'
import { FAMILIES } from '../styles.mjs'

/**
 * Validates a parsed jobs file and returns normalised jobs. Throws one error listing every problem.
 * Accepted job fields: family, target, subject (required); count, seed, tier, tag, noRef (optional).
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
            results.push(await generate({ comfy, familyId: job.family, target: job.target, subject: job.subject, seed: job.seed ?? nextSeed(), count: job.count, useRef: !job.noRef, tag: job.tag, tier: job.tier }))
        } catch (err) {
            failures.push({ index, target: job.target, error: err.message })
        }
    }
    return { results, failures }
}
