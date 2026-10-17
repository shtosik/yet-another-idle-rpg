// Style Family registry. A family is the named art recipe every generated asset belongs to: how to prompt it,
// which references anchor its look, the SDXL-native generation size, and the post-process chain that turns the
// raw generation into game-ready art. Agents only ever supply the subject (content); everything here is style.
//
// Per family:
//   description one-line summary shown by --list-families
//   checkpoint  installed SDXL checkpoint
//   stylePrompt appended to the subject; negative is the negative prompt
//   references  repo paths conditioning the IP-Adapter (style transfer)
//   gen         [w, h] SDXL-native generation size
//   target      [w, h] final asset size (must match FAMILY_TARGETS)
//   pixel       true => pixel-art family: nearest-neighbour refs/sheet scaling
//   refBackground [r, g, b] refs are flattened onto; match the prompted keyout background so style transfer keeps it flat
//   alpha       true => transparent asset, false => fully opaque
//   post        ordered [step, params] list, see lib/postprocess.mjs
//   ipWeight    IP-Adapter strength; sampler overrides steps/cfg/sampler_name/scheduler

import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { STEPS } from './lib/postprocess.mjs'

export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

/** The agreed final size per family. Registry validation fails if an entry drifts from this table. */
export const FAMILY_TARGETS = {
    'item-pixel': [48, 48],
}

const NEGATIVE_BASE = 'text, watermark, signature, frame, border, ui, blurry, photo, realistic, 3d render'

const ITEM_REFS = ['cheese', 'machete', 'vialOfWater', 'stone', 'fish', 'wolfFangs'].map((n) => `src/assets/img/items/${n}.png`)

export const FAMILIES = {
    'item-pixel': {
        description: '48×48 transparent pixel-art item icon',
        checkpoint: 'zavychromaxl_v80.safetensors',
        stylePrompt:
            'pixel art game item icon, single object centred, dark outline, limited colour palette, crisp hard pixels, ' +
            'solid flat bright green background',
        negative: `${NEGATIVE_BASE}, multiple objects, ground shadow, gradient background, anti-aliased, smooth shading`,
        references: ITEM_REFS,
        gen: [1024, 1024],
        target: [48, 48],
        pixel: true,
        alpha: true,
        refBackground: [0, 200, 0],
        // Grid 46 inside a 48 canvas leaves the 1px outline room; outline runs before quantize so its colour
        // is part of the palette and the colour budget holds for the finished asset.
        post: [
            ['keyout', { threshold: 60, feather: 0 }],
            ['trim'],
            ['pixelate', { grid: 46, width: 48, height: 48 }],
            ['outline', { px: 1 }],
            ['quantize', { colors: 24 }],
        ],
        ipWeight: 0.8,
        sampler: { steps: 8, cfg: 5.5, sampler_name: 'euler', scheduler: 'sgm_uniform' },
    },
}

const REQUIRED_KEYS = ['description', 'checkpoint', 'stylePrompt', 'negative', 'references', 'gen', 'target', 'pixel', 'alpha', 'refBackground', 'post', 'ipWeight', 'sampler']

/** Returns the registry problems (empty when valid): missing keys/refs, duplicate refs, target drift, bad post steps. */
export function validateRegistry(families = FAMILIES, root = REPO_ROOT) {
    const problems = []
    for (const [id, f] of Object.entries(families)) {
        const expected = FAMILY_TARGETS[id]
        if (!expected) problems.push(`${id}: not in FAMILY_TARGETS`)
        else if (f.target[0] !== expected[0] || f.target[1] !== expected[1]) problems.push(`${id}: target ${f.target} != planned ${expected}`)
        for (const key of REQUIRED_KEYS) {
            if (f[key] === undefined) problems.push(`${id}: missing "${key}"`)
        }
        const seen = new Map() // content hash -> first ref path; identical files are placeholder duplicates
        for (const ref of f.references ?? []) {
            const path = join(root, ref)
            if (!existsSync(path)) {
                problems.push(`${id}: reference not found: ${ref}`)
                continue
            }
            const hash = createHash('sha1').update(readFileSync(path)).digest('hex')
            if (seen.has(hash)) problems.push(`${id}: reference ${ref} duplicates ${seen.get(hash)}`)
            else seen.set(hash, ref)
        }
        for (const step of f.post ?? []) {
            if (!Array.isArray(step) || typeof step[0] !== 'string') {
                problems.push(`${id}: malformed post step ${JSON.stringify(step)}`)
                continue
            }
            const [name, params = {}] = step
            if (!(name in STEPS)) problems.push(`${id}: unknown post step "${name}"`)
            if (name === 'pixelate' && f.target && (params.width !== f.target[0] || params.height !== f.target[1])) {
                problems.push(`${id}: pixelate output ${params.width}x${params.height} != target ${f.target}`)
            }
        }
    }
    return problems
}

/** Throws on an invalid registry so a bad entry fails loudly at load rather than mid-generation. */
export function assertRegistry(families = FAMILIES, root = REPO_ROOT) {
    const problems = validateRegistry(families, root)
    if (problems.length) throw new Error(`Invalid Style Family registry:\n - ${problems.join('\n - ')}`)
}

export function getFamily(id) {
    const family = FAMILIES[id]
    if (!family) throw new Error(`Unknown family "${id}". Known: ${Object.keys(FAMILIES).join(', ')}`)
    return family
}
