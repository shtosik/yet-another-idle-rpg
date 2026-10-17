// Procedural scribble control images (white lines on black, 1024²) for the union ControlNet. SDXL cannot count
// limbs, so for creatures where the count defines the species (spider: 8 legs, crab: 2 claws + 8 legs, quadruped: 4 legs) a skeleton
// is drawn here and the generation is conditioned on it. Only the layout is constrained; style still comes from the
// family and its references.

import sharp from 'sharp'

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

export const CONTROLS = {
    /**
     * Spider seen from above: small cephalothorax with eye cluster, chelicerae and palps, a large separate abdomen,
     * and exactly eight legs (four per side) that rise to a high knee and come back down, like a real spider's.
     */
    spider: () =>
        svg(
            '<ellipse cx="512" cy="410" rx="100" ry="88"/><ellipse cx="512" cy="660" rx="145" ry="195"/>' +
                '<circle cx="480" cy="360" r="14"/><circle cx="544" cy="360" r="14"/><circle cx="500" cy="388" r="10"/><circle cx="524" cy="388" r="10"/>' +
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
     * Crab seen from the front (like the original crab sprite): wide domed shell with eye stalks, two arms ending in a
     * big hand whose two fingers form an open pincer, and exactly eight legs (four per side) angled down and out.
     */
    crabFront: () =>
        svg(
            '<path d="M 280,560 C 270,400 390,340 512,340 C 634,340 754,400 744,560 C 735,650 640,690 512,690 C 384,690 289,650 280,560 Z"/>' +
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

/** @returns {Promise<Buffer>} PNG of the named control image */
export async function controlImage(name) {
    const make = CONTROLS[name]
    if (!make) throw new Error(`Unknown control "${name}". Known: ${Object.keys(CONTROLS).join(', ')}`)
    return sharp(Buffer.from(make())).png().toBuffer()
}
