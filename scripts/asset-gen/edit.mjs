#!/usr/bin/env node
// Repairs and review for finished opaque images (backgrounds): see lib/edit.mjs. Reads and writes PNG files.
//   node scripts/asset-gen/edit.mjs stats <in>                                # luminance, edge strips, QC flags
//   node scripts/asset-gen/edit.mjs darken <in> <out> [--brightness .5] [--top .9] [--vignette .55]
//   node scripts/asset-gen/edit.mjs haze <in> <out>                           # darken pale haze behind a foreground
//   node scripts/asset-gen/edit.mjs trunks <in> <out> [--gain 1.9] [--lift 55]   # brown trunks toward pale silver-grey
//   node scripts/asset-gen/edit.mjs trim <in> <out> [--px 4]                  # drop a bright/black edge strip
//   node scripts/asset-gen/edit.mjs patch <in> <out> --box x0,y0,x1,y1,dx,dy [--box ...]   # clone from offset (dx,dy)
//   node scripts/asset-gen/edit.mjs montage <out> <img> [<img> ...] [--cols 4]  # numbered grid with luminance

import { readFileSync, writeFileSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { PRESETS, adjustMasked, darken, montage, patch, trimEdges } from './lib/edit.mjs'
import { imageStats, qcBackground } from './lib/qc.mjs'

const { values: v, positionals } = parseArgs({
    allowPositionals: true,
    options: { brightness: { type: 'string' }, top: { type: 'string' }, vignette: { type: 'string' }, gain: { type: 'string' }, lift: { type: 'string' }, px: { type: 'string' }, box: { type: 'string', multiple: true }, cols: { type: 'string' } },
})
const num = (x) => (x === undefined ? undefined : Number(x))
const defined = (o) => Object.fromEntries(Object.entries(o).filter(([, x]) => x !== undefined))
const [command, a, b, ...rest] = positionals

const run = {
    async stats() {
        const buf = readFileSync(a)
        console.log(JSON.stringify({ file: a, ...(await imageStats(buf)), flags: (await qcBackground({ candidate: buf })).flags }, null, 2))
    },
    async darken() { writeFileSync(b, await darken(readFileSync(a), defined({ brightness: num(v.brightness), top: num(v.top), vignette: num(v.vignette) }))) },
    async haze() { writeFileSync(b, await adjustMasked(readFileSync(a), PRESETS.haze())) },
    async trunks() { writeFileSync(b, await adjustMasked(readFileSync(a), PRESETS.trunks(defined({ gain: num(v.gain), lift: num(v.lift) })))) },
    async trim() { writeFileSync(b, await trimEdges(readFileSync(a), defined({ px: num(v.px) }))) },
    async patch() {
        const patches = (v.box ?? []).map((s) => {
            const n = s.split(',').map(Number)
            if (n.length !== 6 || n.some(Number.isNaN)) throw new Error(`--box needs x0,y0,x1,y1,dx,dy, got "${s}"`)
            return { box: n.slice(0, 4), from: n.slice(4) }
        })
        if (!patches.length) throw new Error('patch needs at least one --box')
        writeFileSync(b, await patch(readFileSync(a), patches))
    },
    async montage() {
        const { png, luminance } = await montage([b, ...rest], defined({ cols: num(v.cols) }))
        writeFileSync(a, png)
        console.log(JSON.stringify({ out: a, luminance }))
    },
}
if (!run[command]) {
    console.error(`unknown command "${command}": ${Object.keys(run).join(', ')}`)
    process.exit(1)
}
await run[command]()
