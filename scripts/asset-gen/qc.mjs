#!/usr/bin/env node
// QC report over the committed art in manifest.json.
//   node scripts/asset-gen/qc.mjs                 # print every flagged asset
//   node scripts/asset-gen/qc.mjs --update-known  # accept the current flags as the ratchet baseline (qc-known.json)
// Exit code 1 when there is a defect the baseline does not allow.

import { pathToFileURL } from 'node:url'
import { newDefects, qcArt, readKnown, writeKnown } from './lib/qc-art.mjs'

async function main() {
    const rows = await qcArt()
    if (process.argv.includes('--update-known')) {
        const known = writeKnown(rows)
        console.log(`qc-known.json: ${Object.keys(known).length} of ${rows.length} assets have accepted flags`)
        return 0
    }
    const flagged = rows.filter((row) => row.flags.length)
    for (const row of flagged) console.log(`${row.target}\n  ${row.flags.join('\n  ')}`)
    const fresh = newDefects(rows, readKnown())
    console.log(`\n${rows.length} assets checked, ${flagged.length} flagged, ${fresh.length} with defects beyond the baseline`)
    return fresh.length ? 1 : 0
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) process.exitCode = await main()
