// Ratchet over the committed art: every asset in manifest.json is QC'd and may only carry the flag categories
// recorded in scripts/asset-gen/qc-known.json. Fix an asset, then shrink the baseline:
//   node scripts/asset-gen/qc.mjs --update-known
// A new defect (or a regenerated sprite that is worse than before) fails here.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { newDefects, qcArt, readKnown } from '../lib/qc-art.mjs'

test('committed art has no QC defects beyond the recorded baseline', async () => {
    const rows = await qcArt()
    assert.ok(rows.length > 0, 'manifest lists no art that exists on disk')
    const fresh = newDefects(rows, readKnown())
    assert.deepEqual(fresh, [], `new QC defects:\n${fresh.map((r) => `${r.target}\n  ${r.flags.join('\n  ')}`).join('\n')}`)
})

test('the baseline lists only assets that are still flagged (stale entries must be removed)', async () => {
    const rows = await qcArt()
    const flagged = new Map(rows.map((r) => [r.target, r.flags]))
    const stale = Object.entries(readKnown())
        .filter(([target, cats]) => cats.some((c) => !(flagged.get(target) ?? []).some((f) => f.startsWith(`${c}:`))))
        .map(([target]) => target)
    assert.deepEqual(stale, [], `fixed assets still in qc-known.json (run qc.mjs --update-known): ${stale.join(', ')}`)
})
