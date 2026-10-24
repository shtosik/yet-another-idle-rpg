#!/usr/bin/env node
// Release helpers around package.json `version` and CHANGELOG.md (docs/deployment.md, Releases).
//
// Usage:
//   npm run release -- <major|minor|patch>   bump the version and move [Unreleased] into a dated section
//   node scripts/release.mjs notes [version] print one version's changelog section (GitHub release notes)
//   node scripts/release.mjs check-bump <base version>  exit 1 unless package.json is above <base version>

import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CHANGELOG = join(ROOT, 'CHANGELOG.md')
const UNRELEASED = '## [Unreleased]'

export const parseVersion = (v) => {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v ?? '')
  return m ? m.slice(1).map(Number) : null
}

/** Negative when a < b, 0 when equal, positive when a > b. */
export const compareVersions = (a, b) => {
  const [pa, pb] = [parseVersion(a), parseVersion(b)]
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i]
  return 0
}

/** `## [x.y.z] - date` sections in file order, with the text up to the next `## `. */
export function changelogSections(md) {
  const sections = []
  for (const line of md.split(/\r?\n/)) {
    const heading = /^## \[([^\]]+)\](?: - (\S+))?\s*$/.exec(line)
    if (heading) sections.push({ version: heading[1], date: heading[2], lines: [] })
    else if (line.startsWith('## ')) sections.push({ version: null, lines: [] })
    else sections.at(-1)?.lines.push(line)
  }
  return sections.map(s => ({ ...s, body: s.lines.join('\n').trim() }))
}

/** Note types and their labels; the game draws each as a colored badge (src/app/components/modals/changelog). */
export const NOTE_TYPES = { feature: 'Feature', bug: 'Bug fix', buff: 'Buff', nerf: 'Nerf' }
export const NOTE_RE = /^- \[(\w+)\] (\S.*)$/

const currentVersion = () => JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version

function bump(kind) {
  const parts = parseVersion(currentVersion())
  const index = ['major', 'minor', 'patch'].indexOf(kind)
  if (!parts || index < 0) fail('usage: npm run release -- <major|minor|patch>')
  parts[index]++
  parts.fill(0, index + 1)
  const next = parts.join('.')

  const md = readFileSync(CHANGELOG, 'utf8')
  const unreleased = changelogSections(md).find(s => s.version === 'Unreleased')
  if (!unreleased) fail(`CHANGELOG.md: no '${UNRELEASED}' section`)
  if (!unreleased.body) fail(`CHANGELOG.md: '${UNRELEASED}' is empty; list the player-facing changes first`)

  const today = new Date().toISOString().slice(0, 10)
  writeFileSync(CHANGELOG, md.replace(UNRELEASED, `${UNRELEASED}\n\n## [${next}] - ${today}`))
  execSync(`npm version ${next} --no-git-tag-version`, { cwd: ROOT, stdio: 'ignore' })
  console.log(`${currentVersion()}: package.json, package-lock.json and CHANGELOG.md updated. Commit them on the release branch.`)
}

function notes(version = currentVersion()) {
  const section = changelogSections(readFileSync(CHANGELOG, 'utf8')).find(s => s.version === version)
  if (!section) fail(`CHANGELOG.md: no section for ${version}`)
  // `- [buff] text` reads as `- **Buff**: text` in a GitHub release.
  console.log(section.body.replace(new RegExp(NOTE_RE.source, 'gm'), (line, type, text) => `- **${Object.hasOwn(NOTE_TYPES, type) ? NOTE_TYPES[type] : type}**: ${text}`))
}

function checkBump(base) {
  const head = currentVersion()
  if (!parseVersion(base) || !parseVersion(head)) fail(`not MAJOR.MINOR.PATCH: base '${base}', head '${head}'`)
  if (compareVersions(head, base) <= 0) fail(`package.json version ${head} must be above ${base}; run npm run release -- <major|minor|patch>`)
  console.log(`version ${base} -> ${head}`)
}

function fail(message) {
  console.error(message)
  process.exit(1)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, arg] = process.argv.slice(2)
  if (command === 'notes') notes(arg)
  else if (command === 'check-bump') checkBump(arg)
  else bump(command)
}
