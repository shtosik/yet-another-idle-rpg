// Style Family registry. A family is the named art recipe every generated asset belongs to: how to prompt it,
// which references anchor its look, the SDXL-native generation size, and the post-process chain that turns the
// raw generation into game-ready art. Agents only ever supply the subject (content); everything here is style.
//
// Per family:
//   checkpoint  installed SDXL checkpoint
//   stylePrompt appended to the subject; negative is the negative prompt
//   references  repo paths conditioning the IP-Adapter (style transfer)
//   gen         [w, h] SDXL-native generation size
//   target      [w, h] final asset size (must match FAMILY_TARGETS)
//   pixel       true => pixel-art family: nearest-neighbour refs/sheet scaling
//   refBackground [r, g, b] refs are flattened onto; match the prompted keyout background so style transfer keeps it flat
//   tiers       size-tier table (enemy-pixel): `target` is then the 256 cap and post params may use the tokens
//               $tier (longer side px), $factor (px per art pixel), $grid (art pixels on the longer side), $inner (grid minus outline)
//   alpha       true => transparent asset, false => fully opaque
//   post        ordered [step, params] list, see lib/postprocess.mjs
//   ipWeight    IP-Adapter strength; sampler overrides steps/cfg/sampler_name/scheduler

import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

/** The agreed final size per family. Registry validation fails if an entry drifts from this table. */
export const FAMILY_TARGETS = {
    'item-pixel': [48, 48],
    'zone-pixel': [832, 1248],
    'town-painterly': [1376, 768],
    'portrait-pixel': [256, 256],
    'enemy-pixel': [256, 256], // hard cap on the longer side; the real size comes from the Size tier
}

/** Size tier -> longer side in px (CONTEXT.md: Size tier). 256 is the hard cap. */
export const SIZE_TIERS = { tiny: 96, small: 144, medium: 192, large: 256 }
export const DEFAULT_TIER = 'medium'

const ENEMY_REFS = ['bandit', 'troll', 'crab', 'goat', 'goblinScavenger', 'deer'].map((n) => `src/assets/img/enemies/${n}.png`)

const ANATOMY_NEGATIVE = 'extra limbs, extra legs, extra arms, missing limbs, bad anatomy, deformed, mutated, disfigured, duplicate, two heads, multiple heads, floating body parts, fused bodies, cropped, character sheet, turnaround, multiple views, collage, ground, floor, platform, pedestal'
const NEGATIVE_BASE = 'text, watermark, signature, frame, border, ui, blurry, photo, realistic, 3d render'

const ITEM_REFS = ['cheese', 'machete', 'vialOfWater', 'stone', 'fish', 'wolfFangs'].map((n) => `src/assets/img/items/${n}.png`)

export const FAMILIES = {
    'item-pixel': {
        description: '48×48 transparent pixel-art item icon',
        checkpoint: 'zavychromaxl_v80.safetensors',
        stylePrompt:
            'pixel art game item icon, single object centred, dark outline, limited colour palette, crisp hard pixels, ' +
            'plain flat solid light grey background',
        negative: `${NEGATIVE_BASE}, multiple objects, ground shadow, gradient background, anti-aliased, smooth shading`,
        references: ITEM_REFS,
        gen: [1024, 1024],
        target: [48, 48],
        pixel: true,
        alpha: true,
        refBackground: [200, 200, 200],
        // Grid 46 inside a 48 canvas leaves the 1px outline room; outline runs before quantize so its colour
        // is part of the palette and the colour budget holds for the finished asset.
        post: [
            ['matte'],
            ['trim'],
            ['pixelate', { grid: 46, width: 48, height: 48 }],
            ['outline', { px: 1 }],
            ['quantize', { colors: 24 }],
        ],
        ipWeight: 0.5,
        sampler: { steps: 8, cfg: 5.5, sampler_name: 'euler', scheduler: 'sgm_uniform' },
    },
}

export const ENEMY_ART_PIXEL = 2

FAMILIES['enemy-pixel'] = {
    description: 'transparent pixel-art enemy sprite, ≤256 on the longer side by Size tier, natural aspect',
    checkpoint: 'zavychromaxl_v80.safetensors',
    stylePrompt:
        'pixel art game enemy sprite, anatomically correct, full body, single character, dark outline, limited colour palette, crisp hard pixels, ' +
        'plain flat solid light grey background',
    negative: `${NEGATIVE_BASE}, multiple characters, ground shadow, gradient background, anti-aliased, smooth shading, ${ANATOMY_NEGATIVE}`,
    references: ENEMY_REFS,
    gen: [1024, 1024],
    target: [256, 256],
    tiers: SIZE_TIERS,
    artPixel: ENEMY_ART_PIXEL,
    pixel: true,
    alpha: true,
    refBackground: [200, 200, 200],
    // Art-pixel size is fixed (2 output px, matching the legacy ~69×113 sprites shown at half size), so a smaller
    // tier simply has fewer art pixels. Outline and palette are applied on the cell grid, then blocks are scaled up.
    post: [
        ['matte'],
        ['trim'],
        ['pixelate', { grid: '$inner', pad: 1 }],
        ['outline', { px: 1 }],
        ['quantize', { colors: 32 }],
        ['upscale', { factor: '$factor' }],
    ],
    ipWeight: 0.5,
    sampler: { steps: 8, cfg: 5.5, sampler_name: 'euler', scheduler: 'sgm_uniform' },
}

FAMILIES['zone-pixel'] = {
    description: '832×1248 opaque pixel-art zone landscape (vertical battle background)',
    checkpoint: 'zavychromaxl_v80.safetensors',
    stylePrompt:
        'pixel art game background, side-view landscape scene, no characters, no text, detailed environment, ' +
        'limited colour palette, crisp hard pixels, atmospheric depth',
    negative: `${NEGATIVE_BASE}, characters, people, creatures, ui, anti-aliased, smooth gradient, photograph`,
    references: ['plains-vertical', 'horseshoeBeach-vertical', 'the-long-path-vertical'].map((n) => `src/assets/img/backgrounds/${n}.png`),
    gen: [832, 1216],
    target: [832, 1248],
    pixel: true,
    alpha: false,
    // Generate at the nearest SDXL-native size, cover up to the exact asset size, then 4×4 blocks = one art pixel.
    post: [
        ['cover', { width: 832, height: 1248 }],
        ['pixelate', { block: 4 }],
        ['quantize', { colors: 48 }],
    ],
    ipWeight: 0.7,
    sampler: { steps: 8, cfg: 5.5, sampler_name: 'euler', scheduler: 'sgm_uniform' },
}

FAMILIES['town-painterly'] = {
    description: '1376×768 opaque painterly matte (town / building background)',
    checkpoint: 'zavychromaxl_v80.safetensors',
    stylePrompt:
        'painterly fantasy matte painting, town scene, rich brushwork, warm atmospheric lighting, ' +
        'no characters, no text, wide cinematic composition',
    negative: `${NEGATIVE_BASE}, characters, people, pixel art, low detail, ui`,
    references: ['mawood', 'mawoodApothecary', 'laHarparTavern'].map((n) => `src/assets/img/backgrounds/${n}.png`),
    gen: [1344, 768],
    target: [1376, 768],
    pixel: false,
    alpha: false,
    // Generate at the nearest SDXL-native size and cover up to the exact asset size (a 32px crop-fill, no distortion).
    post: [['cover', { width: 1376, height: 768 }]],
    ipWeight: 0.7,
    sampler: { steps: 8, cfg: 5.5, sampler_name: 'euler', scheduler: 'sgm_uniform' },
}

FAMILIES['portrait-pixel'] = {
    description: '256×256 transparent pixel-art character bust (2× chunky pixels, not the Corwin ink style)',
    checkpoint: 'zavychromaxl_v80.safetensors',
    stylePrompt:
        'pixel art character portrait, head and shoulders bust, facing the viewer, dark outline, limited colour palette, ' +
        'crisp hard pixels, plain flat solid light grey background',
    negative: `${NEGATIVE_BASE}, full body, multiple characters, gradient background, anti-aliased, smooth shading, ink drawing, sketch, ${ANATOMY_NEGATIVE}`,
    // No pixel portraits exist yet: bootstrap from humanoid enemy-pixel refs; add the first accepted portraits here.
    references: ['bandit', 'troll', 'goblinScavenger'].map((n) => `src/assets/img/enemies/${n}.png`),
    gen: [1024, 1024],
    target: [256, 256],
    pixel: true,
    alpha: true,
    refBackground: [200, 200, 200],
    // 128-cell square canvas (126 art pixels + 1-cell outline room each side), scaled 2× so pixels are chunky.
    post: [
        ['matte'],
        ['trim'],
        ['pixelate', { grid: 126, pad: 1, width: 128, height: 128 }],
        ['outline', { px: 1 }],
        ['quantize', { colors: 32 }],
        ['upscale', { factor: 2 }],
    ],
    ipWeight: 0.5,
    sampler: { steps: 8, cfg: 5.5, sampler_name: 'euler', scheduler: 'sgm_uniform' },
}

/** Substitutes the tier tokens in a family's post list. Families without `tiers` pass through unchanged. */
export function resolvePost(family, tier) {
    if (!family.tiers) return family.post
    const px = family.tiers[tier]
    if (!px) throw new Error(`Unknown Size tier "${tier}". Known: ${Object.keys(family.tiers).join(', ')}`)
    const grid = px / family.artPixel
    const tokens = { $tier: px, $factor: family.artPixel, $grid: grid, $inner: grid - 2 }
    return family.post.map(([name, params]) => [name, Object.fromEntries(Object.entries(params ?? {}).map(([k, v]) => [k, tokens[v] ?? v]))])
}

/** Returns the registry problems (empty when valid): missing refs, target drift, malformed post steps. */
export function validateRegistry(families = FAMILIES, root = REPO_ROOT) {
    const problems = []
    for (const [id, f] of Object.entries(families)) {
        const expected = FAMILY_TARGETS[id]
        if (!expected) problems.push(`${id}: not in FAMILY_TARGETS`)
        else if (f.target[0] !== expected[0] || f.target[1] !== expected[1]) problems.push(`${id}: target ${f.target} != planned ${expected}`)
        for (const key of ['checkpoint', 'stylePrompt', 'negative', 'gen', 'target', 'post', 'references']) {
            if (f[key] === undefined) problems.push(`${id}: missing "${key}"`)
        }
        for (const ref of f.references ?? []) {
            if (!existsSync(join(root, ref))) problems.push(`${id}: reference not found: ${ref}`)
        }
        for (const step of f.post ?? []) {
            if (!Array.isArray(step) || typeof step[0] !== 'string') problems.push(`${id}: malformed post step ${JSON.stringify(step)}`)
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
