#!/usr/bin/env node
// Writes dist/yari/browser/version.json after a build. The running game polls it to tell players a new
// version is out (src/app/services/version-check.service.ts). `commit` changes on every deploy, so a
// staging deploy without a version bump still counts as new.
//
// Usage: node scripts/write-version.mjs   (run by `npm run build` and `npm run build:testing`)

import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'dist', 'yari', 'browser')

if (!existsSync(OUT_DIR)) {
  console.error(`write-version: ${OUT_DIR} not found, build first`)
  process.exit(1)
}

function currentCommit() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA
  try {
    return execSync('git rev-parse HEAD', { cwd: ROOT, encoding: 'utf8' }).trim()
  } catch {
    return 'local'
  }
}

const { version } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
const info = { version, commit: currentCommit(), builtAt: new Date().toISOString() }
writeFileSync(join(OUT_DIR, 'version.json'), JSON.stringify(info, null, 2) + '\n')
console.log(`write-version: ${info.version} (${info.commit.slice(0, 7)})`)
