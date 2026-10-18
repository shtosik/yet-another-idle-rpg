// Automatic QC for generated candidates. It only flags: a flagged candidate can still be picked, so the reviewer
// (a person or the asset-generator agent) decides, with the flag saying where to look. Thresholds were calibrated on
// the 31 shipped enemy sprites (no flags there) and on real generations; they are deliberately conservative.
//
// Checks (all on the transparent result, so they only run for families with `alpha`):
//   slab      the cutout is a backdrop rectangle: raw alpha covers most of the frame, or the silhouette fills its box
//   fragment  detached opaque pieces that are not tiny specks
//   hole      an empty patch deep inside the body (a gap between legs or arms is shallow and is not flagged)
//   hollow    most of the body is enclosed empty space: a see-through shell instead of a solid creature
//   skeleton  the generated shape strays from its control image: too little of the skeleton is covered (a missing limb),
//             too much of the shape lies outside it, and, for a silhouette control, an empty patch in the body area or
//             more limbs than the control on the rings around the body. Needs raw alpha and a control.
// Not checked, so still a manual look: faces painted on shells, metallic or plated surfaces, wrong limb counts without
// a control, grey halo residue.

import sharp from 'sharp'

export const QC = {
    alphaOn: 128, // alpha at or above this counts as solid
    slabRaw: 0.55, // raw alpha coverage of the frame; subjects cover 0.15-0.4, slabs 0.6-1.0
    slabFill: 0.88, // silhouette area / bounding-box area; healthy sprites are 0.35-0.75
    fragment: 0.02, // a detached piece must be this fraction of the sprite to count
    // Gaps between an arm and the torso, or inside a loop of limb, are enclosed holes too, with 10-17 px of wall
    // around them on a 256 px sprite; a real patch in the torso had 29-45 px. Calibrated on 24 troll, goblin and gnoll
    // candidates (these thresholds flag only the one with several torso patches) and the 31 shipped sprites (none).
    holeArea: 0.015, // fraction of the sprite
    holeDepth: 0.1, // body thickness around the hole, as a fraction of the sprite's longer side
    hollow: 0.3, // share of the filled silhouette that is enclosed empty space: translucent slimes came out as hollow arches at 38-50%, skeletons (ribs, gaps) reach 24%, the rest stay under 18%
    fitDilate: 24, // px (at 1024) of tolerance around the control when comparing shapes
    fitRecall: 0.6, // share of the control that must be covered by the generated shape
    fitPrecision: 0.7, // share of the generated shape that must lie within the control
    controlOn: 100, // control pixel value that counts as part of the skeleton
    // Silhouette controls only (a filled body, not strokes): the body core must be filled, and limbs are counted on rings.
    coreErode: 28, // px (at 1024) trimmed off the control's edge to get its body core
    coreMin: 0.02, // a control whose core is smaller than this share of it is strokes, so these two checks are skipped
    coreMissing: 0.05, // share of the core the shape may leave empty (calibrated: good spiders 0-2%, notched or misplaced bodies 11-12%)
    ringRadii: [0.38, 0.47, 0.55, 0.64, 0.72, 0.8], // ring radii as a fraction of the control's reach from its centre
    ringExcess: 4, // limb crossings over the control's count that make a ring "too busy"
    ringBusy: 2, // rings that must be too busy to flag extra limbs (good spiders 0-1, extra-legged ones 3-5)
}

const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]]

async function decodeMask(buf) {
    const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const mask = new Uint8Array(info.width * info.height)
    for (let p = 0; p < mask.length; p++) mask[p] = data[p * 4 + 3] >= QC.alphaOn ? 1 : 0
    return { mask, width: info.width, height: info.height }
}

/** Connected components of `value` pixels (8-connected), largest first. */
function components(mask, w, h, value) {
    const seen = new Uint8Array(w * h)
    const out = []
    for (let s = 0; s < w * h; s++) {
        if (mask[s] !== value || seen[s]) continue
        const stack = [s]
        seen[s] = 1
        let area = 0
        while (stack.length) {
            const p = stack.pop()
            area++
            const x = p % w, y = (p / w) | 0
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = x + dx, ny = y + dy
                    if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
                    const r = ny * w + nx
                    if (mask[r] === value && !seen[r]) { seen[r] = 1; stack.push(r) }
                }
            }
        }
        out.push({ area })
    }
    return out.sort((a, b) => b.area - a.area)
}

/** Enclosed transparent regions (not reachable from the border) with the body thickness around each. */
export function holes(mask, w, h) {
    const bfs = (queue, accept, visit) => {
        for (let i = 0; i < queue.length; i++) {
            const p = queue[i], x = p % w, y = (p / w) | 0
            for (const [dx, dy] of N4) {
                const nx = x + dx, ny = y + dy
                if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
                const r = ny * w + nx
                if (accept(r)) { visit(r, p); queue.push(r) }
            }
        }
    }
    const exterior = new Uint8Array(w * h)
    let queue = []
    for (let p = 0; p < w * h; p++) {
        const x = p % w, y = (p / w) | 0
        if (!mask[p] && (x === 0 || y === 0 || x === w - 1 || y === h - 1)) { exterior[p] = 1; queue.push(p) }
    }
    bfs(queue, (r) => !mask[r] && !exterior[r], (r) => { exterior[r] = 1 })
    // thickness: steps through the opaque body from the exterior
    const depth = new Int32Array(w * h).fill(-1)
    queue = []
    for (let p = 0; p < w * h; p++) if (exterior[p]) { depth[p] = 0; queue.push(p) }
    bfs(queue, (r) => mask[r] && depth[r] === -1, (r, p) => { depth[r] = depth[p] + 1 })

    const seen = new Uint8Array(w * h)
    const found = []
    for (let s = 0; s < w * h; s++) {
        if (mask[s] || exterior[s] || seen[s]) continue
        const stack = [s]
        seen[s] = 1
        let area = 0, thickness = Infinity
        while (stack.length) {
            const p = stack.pop()
            area++
            const x = p % w, y = (p / w) | 0
            for (const [dx, dy] of N4) {
                const nx = x + dx, ny = y + dy
                const r = ny * w + nx
                if (mask[r]) { if (depth[r] >= 0 && depth[r] < thickness) thickness = depth[r] }
                else if (!seen[r] && !exterior[r]) { seen[r] = 1; stack.push(r) }
            }
        }
        found.push({ area, depth: thickness })
    }
    return found
}

/**
 * Mask -> blurred copy at the mask's own size; callers treat any non-zero pixel as inside, which reaches about 3 sigma
 * (1.5x `radius`) out. The threshold() below runs before the blur in sharp's pipeline and changes nothing, but the
 * tolerances in QC were calibrated on exactly this behaviour, so it stays as is.
 */
async function dilate(mask, w, h, radius) {
    const grey = Buffer.from(mask.map((v) => (v ? 255 : 0)))
    // threshold() returns 3 channels; b-w brings it back to one so the buffer indexes like the mask
    return sharp(grey, { raw: { width: w, height: h, channels: 1 } }).blur(radius / 2).threshold(16).toColourspace('b-w').raw().toBuffer()
}

/** Separate runs of solid pixels met walking once around a ring (a limb crosses a ring once). */
function ringCrossings(mask, w, h, cx, cy, radius, samples = 720) {
    const at = (i) => {
        const a = (i / samples) * 2 * Math.PI
        const x = Math.round(cx + radius * Math.cos(a)), y = Math.round(cy + radius * Math.sin(a))
        return x >= 0 && y >= 0 && x < w && y < h ? mask[y * w + x] : 0
    }
    let runs = 0
    for (let i = 0; i < samples; i++) if (at(i) && !at((i + samples - 1) % samples)) runs++
    return runs
}

/** How well the generated shape follows the control skeleton, both ways, plus the silhouette-only body and limb checks. */
async function skeletonFit(rawMask, rw, rh, controlBuf) {
    const { data: control, info } = await sharp(controlBuf).greyscale().resize(rw, rh, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true })
    const ctl = new Uint8Array(rw * rh)
    let ctlCount = 0, cx = 0, cy = 0
    for (let p = 0; p < ctl.length; p++) {
        ctl[p] = control[p] >= QC.controlOn ? 1 : 0
        if (ctl[p]) { ctlCount++; cx += p % rw; cy += (p / rw) | 0 }
    }
    const scale = info.width / 1024
    const radius = Math.max(2, Math.round(QC.fitDilate * scale))
    const ctlWide = await dilate(ctl, rw, rh, radius)
    const rawWide = await dilate(rawMask, rw, rh, radius)
    let rawCount = 0, rawInside = 0, ctlCovered = 0
    for (let p = 0; p < ctl.length; p++) {
        if (rawMask[p]) { rawCount++; if (ctlWide[p]) rawInside++ }
        if (ctl[p] && rawWide[p]) ctlCovered++
    }
    const fit = { recall: ctlCount ? ctlCovered / ctlCount : 1, precision: rawCount ? rawInside / rawCount : 0 }

    // body core = the control with its edge trimmed off (erosion = dilating the background)
    const outside = Uint8Array.from(ctl, (v) => (v ? 0 : 1))
    const grown = await dilate(outside, rw, rh, Math.max(2, Math.round(QC.coreErode * scale)))
    let coreCount = 0, coreEmpty = 0
    for (let p = 0; p < ctl.length; p++) {
        if (!ctl[p] || grown[p]) continue
        coreCount++
        if (!rawMask[p]) coreEmpty++
    }
    if (ctlCount && coreCount / ctlCount >= QC.coreMin) {
        fit.coreEmpty = coreEmpty / coreCount
        cx /= ctlCount
        cy /= ctlCount
        let reach = 0
        for (let p = 0; p < ctl.length; p++) if (ctl[p]) reach = Math.max(reach, Math.hypot((p % rw) - cx, ((p / rw) | 0) - cy))
        const busy = QC.ringRadii.filter((f) => ringCrossings(rawMask, rw, rh, cx, cy, f * reach) - ringCrossings(ctl, rw, rh, cx, cy, f * reach) >= QC.ringExcess)
        fit.busyRings = busy.length
    }
    return fit
}

/**
 * @param {{raw: Buffer, candidate: Buffer, control?: Buffer}} p  raw generation, finished candidate, control image PNG
 * @returns {Promise<{flags: {code: string, detail: string}[], metrics: object}>}
 */
export async function qcCandidate({ raw, candidate, control }) {
    const flags = []
    const metrics = {}
    const pct = (v) => `${Math.round(v * 100)}%`

    const { mask, width: w, height: h } = await decodeMask(candidate)
    let opaque = 0, minX = w, maxX = -1, minY = h, maxY = -1
    for (let p = 0; p < mask.length; p++) {
        if (!mask[p]) continue
        opaque++
        const x = p % w, y = (p / w) | 0
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
    }
    if (!opaque) return { flags: [{ code: 'empty', detail: 'nothing is left after cutout' }], metrics }

    metrics.fill = Math.round((opaque / ((maxX - minX + 1) * (maxY - minY + 1))) * 100) / 100
    if (metrics.fill >= QC.slabFill) flags.push({ code: 'slab', detail: `the silhouette fills ${pct(metrics.fill)} of its bounding box (a backdrop rectangle, not a creature)` })

    // raw alpha (LayerDiffuse generations only): a slab shows as alpha covering most of the frame
    let rawMask
    const rawMeta = await sharp(raw).metadata()
    if (rawMeta.hasAlpha) {
        const decoded = await decodeMask(raw)
        rawMask = decoded
        let covered = 0
        for (const v of decoded.mask) covered += v
        metrics.coverage = Math.round((covered / decoded.mask.length) * 100) / 100
        if (metrics.coverage >= QC.slabRaw) flags.push({ code: 'slab', detail: `the generated alpha covers ${pct(metrics.coverage)} of the frame (subjects cover 15-40%): LayerDiffuse left a backdrop behind` })
    }

    const pieces = components(mask, w, h, 1)
    const fragments = pieces.slice(1).filter((c) => c.area >= QC.fragment * opaque)
    metrics.fragments = fragments.length
    if (fragments.length) flags.push({ code: 'fragment', detail: `${fragments.length} detached piece${fragments.length > 1 ? 's' : ''} (largest ${pct(fragments[0].area / opaque)} of the sprite)` })

    const minDepth = QC.holeDepth * Math.max(w, h)
    const found = holes(mask, w, h)
    const deep = found
        .filter((c) => c.area >= QC.holeArea * opaque && c.depth >= minDepth)
        .sort((a, b) => b.area - a.area)
    const emptied = found.reduce((sum, c) => sum + c.area, 0)
    metrics.hollow = Math.round((emptied / (opaque + emptied)) * 100) / 100
    if (metrics.hollow >= QC.hollow) flags.push({ code: 'hollow', detail: `${pct(metrics.hollow)} of the silhouette is enclosed empty space (a see-through body, like a slime drawn as an empty arch)` })
    metrics.holes = deep.length
    if (deep.length) flags.push({ code: 'hole', detail: `${deep.length} empty patch${deep.length > 1 ? 'es' : ''} inside the body (largest ${pct(deep[0].area / opaque)} of the sprite, ${deep[0].depth}px from the outside)` })

    if (control && rawMask && !flags.some((f) => f.code === 'slab')) {
        const fit = await skeletonFit(rawMask.mask, rawMask.width, rawMask.height, control)
        const round = (v) => Math.round(v * 100) / 100
        metrics.fit = { recall: round(fit.recall), precision: round(fit.precision) }
        if (fit.coreEmpty !== undefined) metrics.fit = { ...metrics.fit, coreEmpty: round(fit.coreEmpty), busyRings: fit.busyRings }
        if (fit.recall < QC.fitRecall) flags.push({ code: 'skeleton', detail: `only ${pct(fit.recall)} of the control skeleton is covered (a limb is missing or moved)` })
        if (fit.precision < QC.fitPrecision) flags.push({ code: 'skeleton', detail: `${pct(1 - fit.precision)} of the shape lies outside the control skeleton (an extra limb or part)` })
        if (fit.coreEmpty > QC.coreMissing) flags.push({ code: 'skeleton', detail: `${pct(fit.coreEmpty)} of the body area the control fills is empty (a notch or patch in the body, or the body is in the wrong place)` })
        if (fit.busyRings >= QC.ringBusy) flags.push({ code: 'skeleton', detail: `more limbs than the control on ${fit.busyRings} of ${QC.ringRadii.length} rings around the body (extra or doubled legs)` })
    }
    return { flags, metrics }
}
