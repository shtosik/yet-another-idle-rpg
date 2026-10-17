import { test } from 'node:test'
import assert from 'node:assert/strict'
import sharp from 'sharp'
import { runPipeline } from '../lib/postprocess.mjs'
import { DEFAULT_TIER, FAMILIES, SIZE_TIERS, resolvePost, validateRegistry } from '../styles.mjs'

const family = FAMILIES['enemy-pixel']

/** A tall 40×80 red figure with a blue stripe on a flat grey 128×128 canvas (a stand-in for a raw generation). */
const rawGeneration = () =>
    sharp({ create: { width: 128, height: 128, channels: 4, background: { r: 200, g: 200, b: 200, alpha: 255 } } })
        .composite([
            { input: { create: { width: 40, height: 80, channels: 4, background: { r: 180, g: 40, b: 40, alpha: 255 } } }, left: 44, top: 24 },
            { input: { create: { width: 40, height: 10, channels: 4, background: { r: 30, g: 60, b: 190, alpha: 255 } } }, left: 44, top: 50 },
        ])
        .png().toBuffer()

const render = async (tier) => {
    // the matting model needs a real subject; the synthetic flat figure is keyed by colour instead (tiering is what is under test)
    const post = resolvePost(family, tier).map((step) => (step[0] === 'matte' ? ['keyout', { feather: 0 }] : step))
    const out = await runPipeline(await rawGeneration(), post)
    const { data, info } = await sharp(out).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    return { out, data, width: info.width, height: info.height }
}

test('registry entry is valid and tiers cap at 256', () => {
    assert.deepEqual(validateRegistry(), [])
    assert.equal(Math.max(...Object.values(SIZE_TIERS)), 256)
    assert.deepEqual(SIZE_TIERS, { tiny: 96, small: 144, medium: 192, large: 256 })
    assert.equal(DEFAULT_TIER, 'medium')
})

test('longer side equals the tier size, aspect is preserved, alpha is present', async () => {
    for (const [tier, px] of Object.entries(SIZE_TIERS)) {
        const { width, height, data } = await render(tier)
        assert.equal(Math.max(width, height), px, tier)
        assert.ok(width < height, `${tier}: natural aspect, not padded to a square`)
        assert.ok(Math.abs(width / height - 0.5) < 0.08, `${tier}: ratio ${width / height}`)
        assert.ok([...Array(width * height).keys()].some((i) => data[i * 4 + 3] === 0), `${tier}: has transparent pixels`)
    }
})

test('pixel density is constant: smaller tiers have fewer art pixels of the same size', async () => {
    const artPixels = async (tier) => {
        const { width, height, data } = await render(tier)
        // every art pixel is a factor×factor block, so sampling the block corners must equal sampling the block interior
        const f = family.artPixel
        for (let y = 0; y < height; y += f) {
            for (let x = 0; x < width; x += f) {
                const at = (px, py) => data.readUInt32LE((py * width + px) * 4)
                assert.equal(at(x, y), at(Math.min(x + f - 1, width - 1), Math.min(y + f - 1, height - 1)), `${tier} block ${x},${y}`)
            }
        }
        return (width / f) * (height / f)
    }
    const small = await artPixels('tiny')
    const big = await artPixels('large')
    assert.ok(big > small * 2, `large (${big}) should have far more art pixels than tiny (${small})`)
})

test('an unknown tier is rejected and item-pixel posts pass through untouched', () => {
    assert.throws(() => resolvePost(family, 'gigantic'), /Unknown Size tier "gigantic"/)
    assert.equal(resolvePost(FAMILIES['item-pixel'], null), FAMILIES['item-pixel'].post)
})
