// Z-Image-Turbo structure source. SDXL cannot count limbs (its CLIP text encoder reads prompts as a bag of words);
// Z-Image reads them with a language model and gets claws, stalks and body plans right. It draws the structure on a
// plain white background, a person checks it once and freezes it in refs/control, and SDXL repaints it in our style
// (see `source` in workflow.mjs). Z-Image cannot count many identical thin limbs (spider legs), so check those.

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { makeSheet } from './sheet.mjs'

export const ZIMAGE_UNET = 'z_image_turbo_bf16.safetensors'
export const ZIMAGE_CLIP = 'qwen_3_4b_fp8_mixed.safetensors'
export const ZIMAGE_VAE = 'ae.safetensors'
const SIZE = 1024
const SUFFIX = 'Pixel art game sprite, no shadow, plain white background.'

/** Where a frozen structure source lives; `--pick` copies the chosen candidate here. */
export const sourcePathFor = (name) => `scripts/asset-gen/refs/control/${name}-source.png`

/** Graph for one 1024² structure image: 8 steps, cfg 1 (distilled model), fp8 weights so it fits next to SDXL. */
export function buildZImageGraph({ prompt, seed, prefix = 'asset-gen/zimage' }) {
    return {
        unet: { class_type: 'UNETLoader', inputs: { unet_name: ZIMAGE_UNET, weight_dtype: 'fp8_e4m3fn' } },
        shift: { class_type: 'ModelSamplingAuraFlow', inputs: { model: ['unet', 0], shift: 3 } },
        clip: { class_type: 'CLIPLoader', inputs: { clip_name: ZIMAGE_CLIP, type: 'lumina2', device: 'default' } },
        vae: { class_type: 'VAELoader', inputs: { vae_name: ZIMAGE_VAE } },
        positive: { class_type: 'CLIPTextEncode', inputs: { text: `${prompt} ${SUFFIX}`, clip: ['clip', 0] } },
        negative: { class_type: 'ConditioningZeroOut', inputs: { conditioning: ['positive', 0] } },
        latent: { class_type: 'EmptySD3LatentImage', inputs: { width: SIZE, height: SIZE, batch_size: 1 } },
        sampler: {
            class_type: 'KSampler',
            inputs: {
                seed, steps: 8, cfg: 1, sampler_name: 'res_multistep', scheduler: 'simple', denoise: 1,
                model: ['shift', 0], positive: ['positive', 0], negative: ['negative', 0], latent_image: ['latent', 0],
            },
        },
        decode: { class_type: 'VAEDecode', inputs: { samples: ['sampler', 0], vae: ['vae', 0] } },
        save: { class_type: 'SaveImage', inputs: { filename_prefix: prefix, images: ['decode', 0] } },
    }
}

/**
 * Draws `count` structure candidates (one per seed, seed + i) into `.tmp-gen/zimage-<name>/`, with a numbered
 * sheet and a meta.json whose target is the frozen-source path, so `--pick N --slug zimage-<name>` freezes one.
 * @returns {Promise<object>} the JSON result printed on stdout
 */
export async function generateStructure({ comfy, prompt, name, seed, count = 8, tmpDir }) {
    const slug = `zimage-${name}`
    const dir = join(tmpDir, slug)
    mkdirSync(dir, { recursive: true })
    const started = Date.now()
    const candidates = []
    for (let i = 0; i < count; i++) {
        const [image] = await comfy.run(buildZImageGraph({ prompt, seed: seed + i, prefix: `asset-gen/${slug}` }))
        candidates.push(image)
        writeFileSync(join(dir, `candidate-${i + 1}.png`), image)
    }
    const sheet = join(dir, 'sheet.png')
    writeFileSync(sheet, await makeSheet({ refs: [], candidates, target: [SIZE, SIZE], pixel: false }))
    const seconds = Math.round((Date.now() - started) / 100) / 10
    const meta = { slug, kind: 'zimage', family: 'zimage', target: sourcePathFor(name), subject: prompt, seed, count, tier: null, seconds }
    writeFileSync(join(dir, 'meta.json'), JSON.stringify(meta, null, 2))
    return { ...meta, candidates: candidates.map((_, i) => join(dir, `candidate-${i + 1}.png`)), sheet }
}
