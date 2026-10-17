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

export const CONTROLS = {
    /** Front view: round abdomen, small head, exactly eight jointed legs (four per side). */
    spider: () =>
        svg(
            '<ellipse cx="512" cy="620" rx="150" ry="175"/><ellipse cx="512" cy="400" rx="95" ry="85"/>' +
                leg([60, 360], [260, 190], [400, 280]) +
                leg([75, 390], [310, 310], [470, 440]) +
                leg([75, 420], [310, 470], [450, 630]) +
                leg([65, 450], [260, 620], [350, 840]),
        ),
    /** Side view facing left: body, head on a neck, exactly four legs (two front, two hind). */
    quadruped: () =>
        svg(
            '<ellipse cx="560" cy="470" rx="270" ry="160"/><circle cx="250" cy="380" r="95"/><polyline points="330,420 400,420"/>' +
                '<polyline points="380,580 360,700 340,830"/><polyline points="470,590 480,710 490,830"/>' +
                '<polyline points="670,590 700,710 690,830"/><polyline points="760,570 790,700 800,830"/>',
        ),
    /** Top view: oval shell, two arm + pincer claws, exactly eight walking legs (four per side). */
    crab: () => {
        const claw = (s) =>
            `<polyline points="${512 + s * 150},470 ${512 + s * 290},330 ${512 + s * 270},230"/>` +
            `<path d="M ${512 + s * 270},230 Q ${512 + s * 380},110 ${512 + s * 300},90 Q ${512 + s * 250},120 ${512 + s * 270},230"/>` +
            `<path d="M ${512 + s * 270},230 Q ${512 + s * 170},120 ${512 + s * 220},80 Q ${512 + s * 260},120 ${512 + s * 270},230"/>`
        return svg(
            '<ellipse cx="512" cy="560" rx="215" ry="150"/>' +
                claw(-1) + claw(1) +
                leg([190, 520], [340, 520], [430, 640]) +
                leg([200, 570], [350, 600], [440, 740]) +
                leg([190, 620], [330, 680], [400, 830]) +
                leg([170, 660], [280, 760], [330, 900]),
        )
    },
}

/** @returns {Promise<Buffer>} PNG of the named control image */
export async function controlImage(name) {
    const make = CONTROLS[name]
    if (!make) throw new Error(`Unknown control "${name}". Known: ${Object.keys(CONTROLS).join(', ')}`)
    return sharp(Buffer.from(make())).png().toBuffer()
}
