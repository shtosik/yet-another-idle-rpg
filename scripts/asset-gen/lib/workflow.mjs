// Pure graph builder: Style Family + subject -> ComfyUI API graph object (no string templating, no I/O).
//
// checkpoint -> Hyper-SDXL 8-step LoRA -> [IP-Adapter style transfer from reference images] -> sampler -> decode -> save
// `useRef: false` (or an empty reference list) drops the IP-Adapter branch entirely.

export const LORA_NAME = 'Hyper-SDXL-8steps-CFG-lora.safetensors'
export const IPADAPTER_NAME = 'ip-adapter_sdxl_vit-h.safetensors'
export const CLIP_VISION_NAME = 'clip-vision_vit-h.safetensors'
export const CONTROLNET_NAME = 'xinsir-controlnet-union-sdxl-1.0-promax.safetensors'
export const SCRIBBLE_TYPE = 'hed/pidi/scribble/ted'
export const LINEART_TYPE = 'canny/lineart/anime_lineart/mlsd'
export const LAYER_CONFIG = 'SDXL, Attention Injection'
/** How far img2img repaints a frozen source: lower keeps its shapes, above ~0.6 the model starts redrawing anatomy. */
export const SOURCE_DENOISE = 0.45
/**
 * IP-Adapter defaults. 'style transfer' injects the references into the SDXL style block only; 'style transfer
 * precise' and 'strong style transfer' are the other style-only modes. 'average' blends all references into one
 * embedding, 'concat' keeps each one (stronger, and slower with many references).
 */
export const IP_WEIGHT_TYPE = 'style transfer'
export const IP_COMBINE = 'average'

const DEFAULT_SAMPLER = { steps: 8, cfg: 5.5, sampler_name: 'euler', scheduler: 'sgm_uniform' }

/**
 * @param {object} p
 * @param {{checkpoint: string, stylePrompt: string, negative: string, gen: [number, number], ipWeight?: number,
 *          ipWeightType?: string, ipCombine?: string, sampler?: Partial<typeof DEFAULT_SAMPLER>}} p.family
 * @param {string} p.subject      content only (what is depicted); style comes from the family
 * @param {number} p.seed
 * @param {string[]} [p.refsBase64] reference images, base64 PNG, already prepared for CLIP vision
 * @param {number} [p.count]      batch size (candidates per run)
 * @param {boolean} [p.useRef]
 * @param {{base64: string, strength?: number, end?: number, type?: string}} [p.control] union ControlNet image that
 *        fixes the layout, e.g. limb count (scribble by default, `type` picks another mode); `end` is the fraction of sampling it applies to
 * @param {{base64: string, denoise?: number}} [p.source] frozen image repainted in the family's style (img2img) instead
 *        of sampling from noise; the image must already be the family's gen size
 * @param {string} [p.prefix]     SaveImage filename prefix
 */
export function buildGraph({ family, subject, seed, refsBase64 = [], count = 1, useRef = true, control, source, prefix = 'asset-gen' }) {
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
    if (family.lora === false) {
        // full-step sampling without the Hyper-SDXL LoRA (LayerDiffuse was trained against the base model)
        delete graph.lora
        modelRef = ['checkpoint', 0]
        graph.positive.inputs.clip = ['checkpoint', 1]
        graph.negative.inputs.clip = ['checkpoint', 1]
    }
    if (family.layer) {
        // LayerDiffuse: the model generates the subject on a transparent background, so no matting is needed
        graph.layer = {
            class_type: 'LayeredDiffusionApply',
            inputs: { model: modelRef, config: LAYER_CONFIG, weight: family.layerWeight ?? 1 },
        }
        modelRef = ['layer', 0]
    }
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
                weight_type: family.ipWeightType ?? IP_WEIGHT_TYPE,
                combine_embeds: family.ipCombine ?? IP_COMBINE,
                start_at: 0,
                end_at: 1,
                embeds_scaling: 'V only',
            },
        }
        modelRef = ['ipadapter', 0]
    }

    let positiveRef = ['positive', 0]
    let negativeRef = ['negative', 0]
    if (control) {
        graph.controlImage = { class_type: 'ETN_LoadImageBase64', inputs: { image: control.base64 } }
        graph.controlLoader = { class_type: 'ControlNetLoader', inputs: { control_net_name: CONTROLNET_NAME } }
        graph.controlType = { class_type: 'SetUnionControlNetType', inputs: { control_net: ['controlLoader', 0], type: control.type ?? SCRIBBLE_TYPE } }
        graph.controlApply = {
            class_type: 'ControlNetApplyAdvanced',
            inputs: {
                positive: positiveRef,
                negative: negativeRef,
                control_net: ['controlType', 0],
                image: ['controlImage', 0],
                vae: ['checkpoint', 2],
                strength: control.strength ?? 0.5,
                start_percent: 0,
                end_percent: control.end ?? 0.5,
            },
        }
        positiveRef = ['controlApply', 0]
        negativeRef = ['controlApply', 1]
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
            positive: positiveRef,
            negative: negativeRef,
            latent_image: ['latent', 0],
        },
    }
    if (source) {
        graph.sourceImage = { class_type: 'ETN_LoadImageBase64', inputs: { image: source.base64 } }
        graph.sourceLatent = { class_type: 'VAEEncode', inputs: { pixels: ['sourceImage', 0], vae: ['checkpoint', 2] } }
        let latentRef = ['sourceLatent', 0]
        if (count > 1) {
            // each candidate repaints the same source with its own noise
            graph.sourceBatch = { class_type: 'RepeatLatentBatch', inputs: { samples: latentRef, amount: count } }
            latentRef = ['sourceBatch', 0]
        }
        graph.sampler.inputs.latent_image = latentRef
        graph.sampler.inputs.denoise = source.denoise ?? SOURCE_DENOISE
        delete graph.latent
    }
    graph.decode = { class_type: 'VAEDecode', inputs: { samples: ['sampler', 0], vae: ['checkpoint', 2] } }
    let imageRef = ['decode', 0]
    if (family.layer) {
        // LayeredDiffusionDecodeRGBA calls a JoinImageWithAlpha method current ComfyUI no longer has, so join here.
        // Core JoinImageWithAlpha inverts its mask input, hence the InvertMask in front of it.
        graph.decodeAlpha = {
            class_type: 'LayeredDiffusionDecode',
            inputs: { samples: ['sampler', 0], images: imageRef, sd_version: 'SDXL', sub_batch_size: 16 },
        }
        graph.invertAlpha = { class_type: 'InvertMask', inputs: { mask: ['decodeAlpha', 1] } }
        graph.joinAlpha = { class_type: 'JoinImageWithAlpha', inputs: { image: ['decodeAlpha', 0], alpha: ['invertAlpha', 0] } }
        imageRef = ['joinAlpha', 0]
    }
    graph.save = { class_type: 'SaveImage', inputs: { filename_prefix: prefix, images: imageRef } }
    return graph
}
