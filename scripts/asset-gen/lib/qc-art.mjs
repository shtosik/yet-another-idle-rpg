// QC over the committed art listed in manifest.json, with a ratchet: scripts/asset-gen/qc-known.json records the flag
// categories each target is already known to have, so the test fails only on a NEW defect. Fix art, then shrink the
// known list (`node scripts/asset-gen/qc.mjs --update-known`).

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { MANIFEST_PATH, readManifest } from './manifest.mjs'
import { qcOptionsFor, qcSprite, shinyDelta, SHINY_MIN_DELTA } from './qc.mjs'
import { shinyPathFor } from './shiny.mjs'
import { getFamily, REPO_ROOT } from '../styles.mjs'

export const KNOWN_PATH = join(REPO_ROOT, 'scripts', 'asset-gen', 'qc-known.json')

/** `holes:1.2% of the body…` -> `holes` */
export const category = (flag) => flag.split(':')[0]

/** @returns {Promise<{target: string, flags: string[]}[]>} one row per manifest target that exists on disk */
export async function qcArt({ root = REPO_ROOT, manifestPath = MANIFEST_PATH } = {}) {
    const manifest = readManifest(manifestPath)
    const rows = []
    for (const [target, entry] of Object.entries(manifest)) {
        const file = join(root, target)
        if (!entry.family || !existsSync(file)) continue
        const family = getFamily(entry.family)
        const buf = readFileSync(file)
        const { flags } = await qcSprite(buf, qcOptionsFor(family, family.tiers?.[entry.tier]))
        const shiny = shinyPathFor(file)
        if (entry.shinyHue !== undefined && existsSync(shiny)) {
            const delta = await shinyDelta(buf, readFileSync(shiny))
            if (delta < SHINY_MIN_DELTA) flags.push(`shiny:${delta.toFixed(1)} mean colour change (needs >= ${SHINY_MIN_DELTA}; raise --saturation/--brightness)`)
        }
        rows.push({ target, flags })
    }
    return rows
}

export function readKnown(path = KNOWN_PATH) {
    return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {}
}

/** Rows with a flag category the known list does not allow for that target. */
export function newDefects(rows, known) {
    return rows
        .map((row) => ({ ...row, flags: row.flags.filter((f) => !(known[row.target] ?? []).includes(category(f))) }))
        .filter((row) => row.flags.length)
}

export function writeKnown(rows, path = KNOWN_PATH) {
    const known = {}
    for (const row of rows) if (row.flags.length) known[row.target] = [...new Set(row.flags.map(category))].sort()
    writeFileSync(path, JSON.stringify(Object.fromEntries(Object.keys(known).sort().map((k) => [k, known[k]])), null, 2) + '\n')
    return known
}
