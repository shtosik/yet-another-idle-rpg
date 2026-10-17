import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { collectImages, makeMontage } from '../lib/montage.mjs'

const png = (w, h) => sharp({ create: { width: w, height: h, channels: 4, background: { r: 200, g: 40, b: 40, alpha: 255 } } }).png().toBuffer()

async function folder() {
    const dir = mkdtempSync(join(tmpdir(), 'montage-'))
    for (const name of ['bat.png', 'bat-shiny.png', 'rat.png', 'sheet.png', 'raw-1.png', 'notes.txt']) {
        writeFileSync(join(dir, name), name.endsWith('.png') ? await png(30, 20) : 'x')
    }
    return dir
}

test('collectImages skips sheets, raws and shinies by default and pairs each base with its shiny on request', async () => {
    const dir = await folder()
    const names = (files) => files.map((f) => f.slice(dir.length + 1))
    assert.deepEqual(names(collectImages([dir])), ['bat.png', 'rat.png'])
    assert.deepEqual(names(collectImages([dir], { pairs: true })), ['bat.png', 'bat-shiny.png', 'rat.png'])
    assert.deepEqual(names(collectImages([join(dir, 'rat.png')])), ['rat.png'])
    assert.throws(() => collectImages([join(dir, 'missing.png')]), /Not found/)
})

test('makeMontage lays sprites out on a grid with one numbered cell per image', async () => {
    const dir = await folder()
    const files = collectImages([dir], { pairs: true })
    const { buffer, items } = await makeMontage(files, { cols: 2, cell: 64 })
    const meta = await sharp(buffer).metadata()
    assert.equal(meta.width, 2 * (64 + 6) + 6)
    assert.equal(meta.height, 2 * (64 + 6) + 6)
    assert.deepEqual(items.map((i) => i.n), [1, 2, 3])
    await assert.rejects(makeMontage([]), /Nothing to show/)
})

test('transparent sprites are flattened onto the montage background', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'montage-'))
    const file = join(dir, 'ghost.png')
    writeFileSync(file, await sharp({ create: { width: 8, height: 8, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toBuffer())
    const { buffer } = await makeMontage([file], { cols: 1, cell: 16, bg: '#00aaff' })
    const { data, info } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true })
    const at = (x, y) => [...data.subarray((y * info.width + x) * info.channels, (y * info.width + x) * info.channels + 3)]
    assert.deepEqual(at(6 + 12, 6 + 12), [0, 170, 255])
})
