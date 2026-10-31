// Pure graph builder: Style Family + subject -> ComfyUI API graph object (no string templating, no I/O).
//
// checkpoint -> Hyper-SDXL 8-step LoRA -> [IP-Adapter style transfer from reference images] -> sampler -> decode -> save
// `useRef: false` (or an empty reference list) drops the IP-Adapter branch entirely.
// A source with a mask is an inpaint: DifferentialDiffusion + filled hole + Fooocus inpaint patch (map windows).

export const LORA_NAME = 'Hyper-SDXL-8steps-CFG-lora.safetensors'
export const IPADAPTER_NAME = 'ip-adapter_sdxl_vit-h.safetensors'
export const CLIP_VISION_NAME = 'clip-vision_vit-h.safetensors'
export const CONTROLNET_NAME = 'xinsir-controlnet-union-sdxl-1.0-promax.safetensors'
export const SCRIBBLE_TYPE = 'hed/pidi/scribble/ted'
export const LINEART_TYPE = 'canny/lineart/anime_lineart/mlsd'
export const LAYER_CONFIG = 'SDXL, Attention Injection'
export const FOOOCUS_HEAD = 'fooocus_inpaint_head.pth'
export const FOOOCUS_PATCH = 'inpaint_v26.fooocus.patch'
/** How far img2img repaints a frozen source: lower keeps its shapes, above ~0.6 the model starts redrawing anatomy. */
export const SOURCE_DENOISE = 0.45
/** A blockout in the hole is kept as layout and colour at this denoise; at 1 it is noise and ignored. */
export const BLOCKOUT_DENOISE = 0.75
/** Denoise for a source job: its own, else the blockout, inpaint (1) or repaint default. */
export const sourceDenoise = ({ denoise, mask, blockout }) => denoise ?? (blockout ? BLOCKOUT_DENOISE : mask ? 1 : SOURCE_DENOISE)
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
 * @param {{base64: string, denoise?: number, mask?: string, blockout?: boolean}} [p.source] frozen image repainted in the family's style (img2img) instead
 *        of sampling from noise; the image must already be the family's gen size. `mask` (base64, same size, white =
 *        repaint, black = keep, grey = partly) turns it into an inpaint. `blockout`: the hole already holds a
 *        blockout to repaint (denoise BLOCKOUT_DENOISE by default, must stay below 1), so it is not filled from the surroundings
 * @param {{mask: string, prompt: string, control?: {base64: string, strength?: number, end?: number, type?: string}}[]} [p.regions]
 *        regional prompts: inside each mask (base64, white = region) the subject is `prompt` and its own ControlNet
 *        image applies there only, e.g. a mountain range drawn as peaks scribble while the rest stays grassland
 * @param {string} [p.prefix]     SaveImage filename prefix
 */
export function buildGraph({ family, subject, seed, refsBase64 = [], count = 1, useRef = true, control, source, regions = [], prefix = 'asset-gen' }) {
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
    if (source?.mask) {
        // grey mask values become per-pixel denoise strength, so the mask ramp blends into the kept map instead of a hard cut
        graph.differentialDiffusion = { class_type: 'DifferentialDiffusion', inputs: { model: modelRef } }
        modelRef = ['differentialDiffusion', 0]
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

    /** Adds `<key>Image`, `<key>Type` and `<key>Apply` nodes (one shared loader) and returns the controlled [positive, negative]. */
    const applyControl = (key, ctl, positive, negative) => {
        graph[`${key}Image`] = { class_type: 'ETN_LoadImageBase64', inputs: { image: ctl.base64 } }
        graph.controlLoader ??= { class_type: 'ControlNetLoader', inputs: { control_net_name: CONTROLNET_NAME } }
        graph[`${key}Type`] = { class_type: 'SetUnionControlNetType', inputs: { control_net: ['controlLoader', 0], type: ctl.type ?? SCRIBBLE_TYPE } }
        graph[`${key}Apply`] = {
            class_type: 'ControlNetApplyAdvanced',
            inputs: {
                positive,
                negative,
                control_net: [`${key}Type`, 0],
                image: [`${key}Image`, 0],
                vae: ['checkpoint', 2],
                strength: ctl.strength ?? 0.5,
                start_percent: 0,
                end_percent: ctl.end ?? 0.5,
            },
        }
        return [[`${key}Apply`, 0], [`${key}Apply`, 1]]
    }

    let positiveRef = ['positive', 0]
    let negativeRef = ['negative', 0]
    if (control) [positiveRef, negativeRef] = applyControl('control', control, positiveRef, negativeRef)
    if (regions.length) {
        // each region's conditioning applies inside its mask, the main subject everywhere else (regions must not overlap)
        const parts = regions.map((region, i) => {
            graph[`region${i}MaskImage`] = { class_type: 'ETN_LoadImageBase64', inputs: { image: region.mask } }
            graph[`region${i}Mask`] = { class_type: 'ImageToMask', inputs: { image: [`region${i}MaskImage`, 0], channel: 'red' } }
            graph[`region${i}Prompt`] = { class_type: 'CLIPTextEncode', inputs: { text: `${region.prompt}, ${family.stylePrompt}`, clip: graph.positive.inputs.clip } }
            const conds = region.control
                ? applyControl(`region${i}Control`, region.control, [`region${i}Prompt`, 0], negativeRef)
                : [[`region${i}Prompt`, 0], negativeRef]
            return { conds, mask: [`region${i}Mask`, 0] }
        })
        let unionRef = parts[0].mask
        parts.slice(1).forEach(({ mask }, i) => {
            graph[`regionUnion${i + 1}`] = { class_type: 'MaskComposite', inputs: { destination: unionRef, source: mask, x: 0, y: 0, operation: 'add' } }
            unionRef = [`regionUnion${i + 1}`, 0]
        })
        graph.regionRest = { class_type: 'InvertMask', inputs: { mask: unionRef } }
        const masked = (key, conditioning, mask) => {
            graph[key] = { class_type: 'ConditioningSetMask', inputs: { conditioning, mask, strength: 1, set_cond_area: 'default' } }
            return [key, 0]
        }
        ;[positiveRef, negativeRef] = ['Positive', 'Negative'].map((side, s) => {
            let combined = masked(`rest${side}`, s ? negativeRef : positiveRef, ['regionRest', 0])
            parts.forEach(({ conds, mask }, i) => {
                const part = masked(`region${i}${side}`, conds[s], mask)
                graph[`combine${i}${side}`] = { class_type: 'ConditioningCombine', inputs: { conditioning_1: combined, conditioning_2: part } }
                combined = [`combine${i}${side}`, 0]
            })
            return combined
        })
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
        let latentRef
        if (source.mask) {
            // Inpaint the way Krita AI Diffusion does: the hole is filled from its surroundings (Navier-Stokes, then
            // blurred) so no placeholder colour or edge reaches the latent, and the Fooocus inpaint patch makes the model
            // continue the kept context instead of drawing a new picture over it.
            graph.maskImage = { class_type: 'ETN_LoadImageBase64', inputs: { image: source.mask } }
            graph.mask = { class_type: 'ImageToMask', inputs: { image: ['maskImage', 0], channel: 'red' } }
            let pixelsRef = ['sourceImage', 0]
            if (!source.blockout) {
                graph.holeMask = { class_type: 'ThresholdMask', inputs: { mask: ['mask', 0], value: 0.5 } }
                graph.holeFill = { class_type: 'INPAINT_MaskedFill', inputs: { image: pixelsRef, mask: ['holeMask', 0], fill: 'navier-stokes', falloff: 0 } }
                graph.holeBlur = { class_type: 'INPAINT_MaskedBlur', inputs: { image: ['holeFill', 0], mask: ['holeMask', 0], blur: 65, falloff: 0 } }
                pixelsRef = ['holeBlur', 0]
            }
            graph.inpaintEncode = {
                class_type: 'INPAINT_VAEEncodeInpaintConditioning',
                inputs: { positive: positiveRef, negative: negativeRef, vae: ['checkpoint', 2], pixels: pixelsRef, mask: ['mask', 0] },
            }
            graph.inpaintPatch = { class_type: 'INPAINT_LoadFooocusInpaint', inputs: { head: FOOOCUS_HEAD, patch: FOOOCUS_PATCH } }
            graph.inpaintModel = { class_type: 'INPAINT_ApplyFooocusInpaint', inputs: { model: modelRef, patch: ['inpaintPatch', 0], latent: ['inpaintEncode', 2] } }
            Object.assign(graph.sampler.inputs, { model: ['inpaintModel', 0], positive: ['inpaintEncode', 0], negative: ['inpaintEncode', 1] })
            latentRef = ['inpaintEncode', 3]
        } else {
            graph.sourceLatent = { class_type: 'VAEEncode', inputs: { pixels: ['sourceImage', 0], vae: ['checkpoint', 2] } }
            latentRef = ['sourceLatent', 0]
        }
        if (count > 1) {
            // each candidate repaints the same source with its own noise
            graph.sourceBatch = { class_type: 'RepeatLatentBatch', inputs: { samples: latentRef, amount: count } }
            latentRef = ['sourceBatch', 0]
        }
        graph.sampler.inputs.latent_image = latentRef
        graph.sampler.inputs.denoise = sourceDenoise(source)
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
