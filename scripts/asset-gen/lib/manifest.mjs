// Tracked manifest: repo-relative target path -> how the accepted asset was made, so a redo is "same entry, new seed
// or edited subject". `--pick` writes the entry. Entries keep unknown fields (e.g. a shiny hue angle) across updates.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { REPO_ROOT } from '../styles.mjs'

export const MANIFEST_PATH = join(REPO_ROOT, 'scripts', 'asset-gen', 'manifest.json')

export function readManifest(path = MANIFEST_PATH) {
    return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {}
}

/** Writes with sorted keys so the tracked file diffs cleanly. */
export function writeManifest(manifest, path = MANIFEST_PATH) {
    const sorted = Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]))
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, JSON.stringify(sorted, null, 2) + '\n')
}

/** Creates or updates the entry for `target`, preserving fields this call does not own. */
export function recordEntry(target, { family, tier = null, subject, seed, date = new Date().toISOString().slice(0, 10) }, path = MANIFEST_PATH) {
    const manifest = readManifest(path)
    manifest[target] = { ...manifest[target], family, tier, subject, seed, date }
    writeManifest(manifest, path)
    return manifest[target]
}

/** Sets one field on `target`'s entry, creating a partial entry if none exists yet (a later `--pick` fills the rest). */
export function setField(target, field, value, path = MANIFEST_PATH) {
    const manifest = readManifest(path)
    manifest[target] = { ...manifest[target], [field]: value }
    writeManifest(manifest, path)
    return manifest[target]
}
