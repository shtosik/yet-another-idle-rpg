// Pure graph builder: Style Family + subject -> ComfyUI API graph object (no string templating, no I/O).
//
// checkpoint -> Hyper-SDXL 8-step LoRA -> [IP-Adapter style transfer from reference images] -> sampler -> decode -> save
// `useRef: false` (or an empty reference list) drops the IP-Adapter branch entirely.

export const LORA_NAME = 'Hyper-SDXL-8steps-CFG-lora.safetensors'
export const IPADAPTER_NAME = 'ip-adapter_sdxl_vit-h.safetensors'
export const CLIP_VISION_NAME = 'clip-vision_vit-h.safetensors'

const DEFAULT_SAMPLER = { steps: 8, cfg: 5.5, sampler_name: 'euler', scheduler: 'sgm_uniform' }

/**
 * @param {object} p
 * @param {{checkpoint: string, stylePrompt: string, negative: string, gen: [number, number], ipWeight?: number,
 *          sampler?: Partial<typeof DEFAULT_SAMPLER>}} p.family
 * @param {string} p.subject      content only (what is depicted); style comes from the family
 * @param {number} p.seed
 * @param {string[]} [p.refsBase64] reference images, base64 PNG, already prepared for CLIP vision
 * @param {number} [p.count]      batch size (candidates per run)
 * @param {boolean} [p.useRef]
 * @param {string} [p.prefix]     SaveImage filename prefix
 */
export function buildGraph({ family, subject, seed, refsBase64 = [], count = 1, useRef = true, prefix = 'asset-gen' }) {
    const sampler = { ...DEFAULT_SAMPLER, ...family.sampler }
    const withRefs = useRef && refsBase64.length > 0

    const graph = {
        checkpoint: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: family.checkpoint } },
        lora: {
            class_type: 'LoraLoader',
            inputs: { model: ['checkpoint', 0], clip: ['checkpoint', 1], lora_name: LORA_NAME, strength_model: 1, strength_clip: 1 },
        },
        positive: {
            class_type: 'CLIPTextEncode',
            inputs: { text: `${subject}, ${family.stylePrompt}`, clip: ['lora', 1] },
        },
        negative: { class_type: 'CLIPTextEncode', inputs: { text: family.negative, clip: ['lora', 1] } },
        latent: { class_type: 'EmptyLatentImage', inputs: { width: family.gen[0], height: family.gen[1], batch_size: count } },
    }

    let modelRef = ['lora', 0]
    if (withRefs) {
        let batchRef = ['ref0', 0]
        refsBase64.forEach((image, i) => {
            graph[`ref${i}`] = { class_type: 'ETN_LoadImageBase64', inputs: { image } }
            if (i === 0) return
            graph[`refBatch${i}`] = { class_type: 'ImageBatch', inputs: { image1: batchRef, image2: [`ref${i}`, 0] } }
            batchRef = [`refBatch${i}`, 0]
        })
        graph.ipadapterModel = { class_type: 'IPAdapterModelLoader', inputs: { ipadapter_file: IPADAPTER_NAME } }
        graph.clipVision = { class_type: 'CLIPVisionLoader', inputs: { clip_name: CLIP_VISION_NAME } }
        graph.ipadapter = {
            class_type: 'IPAdapterAdvanced',
            inputs: {
                model: modelRef,
                ipadapter: ['ipadapterModel', 0],
                clip_vision: ['clipVision', 0],
                image: batchRef,
                weight: family.ipWeight ?? 1,
                weight_type: 'style transfer',
                combine_embeds: 'average',
                start_at: 0,
                end_at: 1,
                embeds_scaling: 'V only',
            },
        }
        modelRef = ['ipadapter', 0]
    }

    graph.sampler = {
        class_type: 'KSampler',
        inputs: {
            seed,
            steps: sampler.steps,
            cfg: sampler.cfg,
            sampler_name: sampler.sampler_name,
            scheduler: sampler.scheduler,
            denoise: 1,
            model: modelRef,
            positive: ['positive', 0],
            negative: ['negative', 0],
            latent_image: ['latent', 0],
        },
    }
    graph.decode = { class_type: 'VAEDecode', inputs: { samples: ['sampler', 0], vae: ['checkpoint', 2] } }
    graph.save = { class_type: 'SaveImage', inputs: { filename_prefix: prefix, images: ['decode', 0] } }
    return graph
}
