// Scribble control images (white lines or silhouettes on black, 1024²) for the union ControlNet, drawn here as SVG
// or frozen from a checked source image in refs/control. SDXL cannot count
// limbs, so for creatures where the count defines the species (spider: 8 legs, crab: 2 claws + 8 legs, quadruped: 4 legs) a skeleton
// is drawn here and the generation is conditioned on it. Only the layout is constrained; style still comes from the
// family and its references.

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { LINEART_TYPE } from './workflow.mjs'

const CONTROL_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'refs', 'control')
const SIZE = 1024
const STROKE = 28

const svg = (body) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}"><rect width="100%" height="100%" fill="black"/>` +
    `<g fill="none" stroke="white" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`

/** Mirrored pair of 3-point legs: start, knee, foot (dx from the centre line, y). */
const leg = (start, knee, foot) =>
    [-1, 1]
        .map((s) => `<polyline points="${512 + s * start[0]},${start[1]} ${512 + s * knee[0]},${knee[1]} ${512 + s * foot[0]},${foot[1]}"/>`)
        .join('')

/** Mirrored pair of jointed legs through any number of [dx, y] points. */
const joints = (...points) =>
    [-1, 1].map((s) => `<polyline points="${points.map(([dx, y]) => `${512 + s * dx},${y}`).join(' ')}"/>`).join('')

/** Mirrored shape: `make(s)` returns SVG for the right (s = 1) and left (s = -1) side. */
const mirrored = (make) => [-1, 1].map(make).join('')

/** Frozen control image from refs/control (white on black, 1024²). */
const fromFile = (name) => () => readFileSync(join(CONTROL_DIR, `${name}.png`))

/** Union ControlNet mode per control; anything not listed is a scribble (SVG skeletons, filled silhouettes). */
export const CONTROL_TYPES = { crabFront: LINEART_TYPE }

export const CONTROLS = {
    /**
     * Spider in 3/4 front view: filled silhouette of a hand-checked Z-Image spider (refs/control/spider-source.png,
     * exactly four legs per side plus palps). Only the outline is fixed, so colour, markings and texture follow the
     * subject prompt. To add a pose: generate a source, check the leg count, save its alpha silhouette next to it.
     */
    spider: fromFile('spider'),
    /**
     * Hand-drawn spider in 3/4 front view (facing the viewer, camera slightly above, like the other enemy sprites): the head in
     * front with two fangs and palps, the larger abdomen rising behind it, and exactly eight legs (four per side)
     * that arch up to a knee and come down, front pair reaching toward the camera, back pair out to the sides.
     * Body segments are filled (an outlined segment reads as another pair of legs); a black rim keeps head and abdomen apart.
     */
    spiderSketch: () =>
        svg(
            '<ellipse cx="512" cy="390" rx="170" ry="140" fill="white"/>' +
                '<ellipse cx="512" cy="580" rx="115" ry="88" fill="white" stroke="black" stroke-width="22"/>' +
                '<polyline points="490,665 482,725"/><polyline points="534,665 542,725"/>' +
                mirrored((s) => `<polyline points="${512 + s * 60},650 ${512 + s * 85},700"/>`) +
                joints([95, 610], [250, 570], [290, 935]) +
                joints([110, 580], [330, 460], [425, 865]) +
                joints([112, 550], [375, 385], [485, 725]) +
                joints([100, 520], [335, 295], [480, 560]),
        ),
    /**
     * Spider seen from above: small cephalothorax with eye cluster, chelicerae and palps, a large separate abdomen,
     * and exactly eight legs (four per side) that rise to a high knee and come back down, like a real spider's.
     */
    spiderTop: () =>
        svg(
            // both body segments are filled: an outlined abdomen reads as one more pair of curved legs
            '<ellipse cx="512" cy="410" rx="100" ry="88" fill="white"/><ellipse cx="512" cy="660" rx="145" ry="195" fill="white"/>' +
                '<polyline points="486,490 478,550"/><polyline points="538,490 546,550"/>' +
                // each leg: body joint, high knee, foot; the four per side fan from forward-reaching to backward-reaching
                joints([70, 375], [250, 215], [400, 300]) +
                joints([90, 405], [290, 305], [450, 450]) +
                joints([95, 440], [290, 475], [440, 640]) +
                joints([85, 470], [250, 640], [340, 860]),
        ),
    /** Side view facing left: body, head on a neck, exactly four legs (two front, two hind). */
    quadruped: () =>
        svg(
            '<ellipse cx="560" cy="470" rx="270" ry="160"/><circle cx="250" cy="380" r="95"/><polyline points="330,420 400,420"/>' +
                '<polyline points="380,580 360,700 340,830"/><polyline points="470,590 480,710 490,830"/>' +
                '<polyline points="670,590 700,710 690,830"/><polyline points="760,570 790,700 800,830"/>',
        ),
    /**
     * Crab seen from the front: line art of a hand-checked Z-Image crab (refs/control/crabFront-source.png) with
     * two raised open pincers, eye stalks on top and legs out to the sides; the face marks on its shell were cleared
     * from the line art. Line art, not a silhouette: the source legs touch and only their outlines keep them apart.
     */
    crabFront: fromFile('crabFront'),
    /**
     * Hand-drawn crab seen from the front (like the original crab sprite): wide domed shell with eye stalks, two arms ending in a
     * big hand whose two fingers form an open pincer, and exactly eight legs (four per side) angled down and out.
     */
    crabFrontSketch: () =>
        svg(
            // filled shell: an empty outline invites the model to paint a face on it
            '<path fill="white" d="M 280,560 C 270,400 390,340 512,340 C 634,340 754,400 744,560 C 735,650 640,690 512,690 C 384,690 289,650 280,560 Z"/>' +
                '<polyline points="470,350 462,290"/><circle cx="462" cy="275" r="22"/><polyline points="554,350 562,290"/><circle cx="562" cy="275" r="22"/>' +
                mirrored(
                    (s) =>
                        `<polyline points="${512 + s * 245},510 ${512 + s * 310},450"/>` +
                        `<ellipse cx="${512 + s * 335}" cy="390" rx="72" ry="92" transform="rotate(${s * 20} ${512 + s * 335} 390)"/>` +
                        `<path d="M ${512 + s * 300},455 L ${512 + s * 225},565 L ${512 + s * 345},470"/>` +
                        `<path d="M ${512 + s * 370},470 L ${512 + s * 300},585 L ${512 + s * 395},465"/>`,
                ) +
                joints([240, 575], [385, 560], [470, 660], [480, 760]) +
                joints([255, 625], [385, 655], [450, 765], [455, 865]) +
                joints([270, 665], [370, 745], [410, 855], [400, 955]) +
                joints([290, 685], [340, 795], [325, 895], [295, 985]),
        ),
    /**
     * Crab seen from above: broad rounded carapace (wider than long) with eyes on stalks, two arms ending in a
     * heavy hand with a pincer, and exactly eight walking legs (four per side) bent at a raised knee.
     */
    crab: () =>
        svg(
            '<path d="M 290,560 C 270,440 380,385 512,380 C 644,385 754,440 734,560 C 720,660 620,705 512,705 C 404,705 304,660 290,560 Z"/>' +
                '<circle cx="450" cy="385" r="16"/><circle cx="574" cy="385" r="16"/>' +
                mirrored((s) =>
                    `<polyline points="${512 + s * 190},460 ${512 + s * 290},390 ${512 + s * 320},300"/>` +
                    `<ellipse cx="${512 + s * 320}" cy="215" rx="70" ry="95" transform="rotate(${s * -12} ${512 + s * 320} 215)"/>` +
                    `<path d="M ${512 + s * 280},130 Q ${512 + s * 255},60 ${512 + s * 305},35 Q ${512 + s * 285},90 ${512 + s * 320},125"/>` +
                    `<path d="M ${512 + s * 375},140 Q ${512 + s * 410},75 ${512 + s * 360},45"/>`,
                ) +
                // legs fan out: the first pair reaches forward, the last pair back, so the four per side never overlap
                joints([250, 500], [370, 430], [430, 480], [450, 560]) +
                joints([275, 555], [395, 530], [455, 600], [465, 700]) +
                joints([285, 610], [395, 640], [440, 720], [430, 810]) +
                joints([300, 660], [380, 740], [400, 830], [370, 925]),
        ),
}

/**
 * Registers every frozen pair in `dir` (`<name>.png` with its `<name>-source.png`) that is not defined above, so a
 * control made with `--make-control` works as `--control <name>` without touching this file. Silhouette scribble mode.
 */
export function registerFrozenControls(dir = CONTROL_DIR, controls = CONTROLS) {
    const names = existsSync(dir) ? readdirSync(dir) : []
    for (const file of names) {
        const name = file.endsWith('-source.png') ? undefined : file.match(/^([A-Za-z][A-Za-z0-9]*)\.png$/)?.[1]
        if (name && names.includes(`${name}-source.png`) && !controls[name]) controls[name] = () => readFileSync(join(dir, file))
    }
    return controls
}
registerFrozenControls()

/**
 * Straight weapon silhouettes drawn by code, so SDXL only paints the weapon and cannot bend, double or merge it.
 * Each is SVG with the grip at (0, 0) and the business end pointing up (-y), sized for a figure about 880 px tall at
 * 1024: a blade stays at least 2-3 art pixels wide after the pixelate step. `upright` weapons (long shafts gripped
 * mid-shaft) always stand straight up from the hand, the others follow the control's grip angle.
 */
export const WEAPONS = {
    knife: { svg: '<rect x="-12" y="-25" width="24" height="60"/><rect x="-30" y="-37" width="60" height="12"/><path d="M -13,-37 L -13,-200 L 0,-228 L 13,-200 L 13,-37 Z"/>' },
    sword: {
        svg:
            '<rect x="-13" y="-30" width="26" height="80"/><circle cx="0" cy="60" r="18"/><rect x="-62" y="-46" width="124" height="16"/>' +
            '<path d="M -16,-46 L -16,-400 L 0,-432 L 16,-400 L 16,-46 Z"/>',
    },
    club: { svg: '<path d="M -14,45 L 14,45 L 36,-280 Q 36,-325 0,-330 Q -36,-325 -36,-280 Z"/>' },
    axe: { svg: '<rect x="-12" y="-385" width="24" height="445"/><path d="M 12,-385 L 110,-420 Q 132,-345 118,-282 L 12,-318 Z"/>' },
    spear: { svg: '<rect x="-10" y="-420" width="20" height="680"/><path d="M 0,-548 L 28,-470 L 0,-415 L -28,-470 Z"/>', upright: true },
    staff: { svg: '<rect x="-13" y="-385" width="26" height="685"/><circle cx="0" cy="-405" r="34"/>', upright: true },
}

/** Hand anchor of a frozen control (`refs/control/<name>.json`: {hand: [x, y], angle?, scale?}), written by --make-control --hand. */
export function controlMeta(name, dir = CONTROL_DIR) {
    const file = join(dir, `${name}.json`)
    return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {}
}

/**
 * Draws `weapon` into a control image at its hand anchor: rotated `angle` degrees clockwise from upright, scaled by
 * `scale` for figures that fill the frame more or less than usual.
 */
export async function withWeapon(controlPng, weapon, { hand, angle = 0, scale = 1 }) {
    const shape = WEAPONS[weapon]
    if (!shape) throw new Error(`Unknown weapon "${weapon}". Known: ${Object.keys(WEAPONS).join(', ')}`)
    if (!hand) throw new Error(`The control has no hand anchor for a weapon: freeze it with --make-control ... --hand x,y`)
    const overlay = svgFill(`<g transform="translate(${hand[0]} ${hand[1]}) rotate(${shape.upright ? 0 : angle}) scale(${scale})">${shape.svg}</g>`)
    return sharp(controlPng).composite([{ input: Buffer.from(overlay), blend: 'lighten' }]).greyscale().png().toBuffer()
}

/** Filled white shapes on a transparent 1024² canvas. */
const svgFill = (body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}"><g fill="white">${body}</g></svg>`

/**
 * @param {string} name
 * @param {{weapon?: string, dir?: string}} [opts] weapon: draw this weapon at the control's hand anchor
 * @returns {Promise<Buffer>} PNG of the named control image
 */
export async function controlImage(name, { weapon, dir = CONTROL_DIR } = {}) {
    const make = CONTROLS[name]
    if (!make) throw new Error(`Unknown control "${name}". Known: ${Object.keys(CONTROLS).join(', ')}`)
    const source = make()
    const png = await sharp(Buffer.isBuffer(source) ? source : Buffer.from(source)).png().toBuffer()
    return weapon ? withWeapon(png, weapon, controlMeta(name, dir)) : png
}
