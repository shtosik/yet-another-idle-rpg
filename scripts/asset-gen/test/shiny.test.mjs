import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { estimateShinyHue, makeShiny } from '../generate.mjs'
import { readManifest } from '../lib/manifest.mjs'
import { estimateHue, hueShift, shinyPathFor } from '../lib/shiny.mjs'

/** 32×32 sprite: red body, blue belt, orange head, fully transparent border, one half-transparent pixel. */
const sprite = () =>
    sharp({ create: { width: 32, height: 32, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite([
            { input: { create: { width: 16, height: 16, channels: 4, background: { r: 190, g: 40, b: 40, alpha: 255 } } }, left: 8, top: 8 },
            { input: { create: { width: 16, height: 4, channels: 4, background: { r: 40, g: 60, b: 200, alpha: 255 } } }, left: 8, top: 16 },
            { input: { create: { width: 6, height: 6, channels: 4, background: { r: 230, g: 140, b: 30, alpha: 255 } } }, left: 13, top: 2 },
            { input: { create: { width: 1, height: 1, channels: 4, background: { r: 190, g: 40, b: 40, alpha: 100 } } }, left: 0, top: 0 },
        ])
        .png().toBuffer()

const raw = async (buf) => (await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })).data

test('shinyPathFor puts -shiny.png beside the base, matching toShinyUrl', () => {
    assert.equal(shinyPathFor('src/assets/img/enemies/wolf.png'), 'src/assets/img/enemies/wolf-shiny.png')
    assert.equal(shinyPathFor('wolf.PNG'), 'wolf-shiny.png')
})

test('hueShift changes colour but preserves alpha on every pixel', async () => {
    const base = await sprite()
    const [a, b] = [await raw(base), await raw(await hueShift(base, 120))]
    let colourChanged = false
    for (let i = 0; i < a.length; i += 4) {
        assert.equal(b[i + 3], a[i + 3], `alpha at ${i / 4}`)
        if (a[i + 3] === 255 && (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2])) colourChanged = true
    }
    assert.ok(colourChanged)
})

test('estimateHue recovers the angle used to make a synthetic shiny', async () => {
    const base = await sprite()
    for (const angle of [60, 140, 250]) {
        const found = await estimateHue(base, await hueShift(base, angle))
        const diff = Math.min(Math.abs(found - angle), 360 - Math.abs(found - angle))
        assert.ok(diff <= 4, `expected ~${angle}, got ${found}`)
    }
})

test('--estimate-hue stores the angle; --shiny-of writes the file with it; --hue overrides and is remembered', async () => {
    const root = mkdtempSync(join(tmpdir(), 'asset-gen-'))
    const manifestPath = join(root, 'manifest.json')
    mkdirSync(join(root, 'enemies'))
    const base = await sprite()
    writeFileSync(join(root, 'enemies/wolf.png'), base)
    writeFileSync(join(root, 'enemies/wolf-shiny.png'), await hueShift(base, 140))

    const est = await estimateShinyHue({ target: 'enemies/wolf.png', root, manifestPath })
    assert.ok(Math.abs(est.shinyHue - 140) <= 4)
    assert.equal(readManifest(manifestPath)['enemies/wolf.png'].shinyHue, est.shinyHue)

    // new base is accepted later; shiny is derived from the stored angle, written next to it with the right name
    const newBase = await sprite()
    writeFileSync(join(root, 'enemies/wolf.png'), newBase)
    const made = await makeShiny({ target: 'enemies/wolf.png', root, manifestPath })
    assert.equal(made.shiny, 'enemies/wolf-shiny.png')
    assert.deepEqual(await raw(readFileSync(join(root, 'enemies/wolf-shiny.png'))), await raw(await hueShift(newBase, est.shinyHue)))

    const overridden = await makeShiny({ target: 'enemies/wolf.png', hue: 200, root, manifestPath })
    assert.equal(overridden.shinyHue, 200)
    assert.equal(readManifest(manifestPath)['enemies/wolf.png'].shinyHue, 200)
})

test('--shiny-of without a stored or given angle fails with guidance', async () => {
    const root = mkdtempSync(join(tmpdir(), 'asset-gen-'))
    writeFileSync(join(root, 'bat.png'), await sprite())
    await assert.rejects(makeShiny({ target: 'bat.png', root, manifestPath: join(root, 'm.json') }), /--hue N, or run --estimate-hue/)
})
