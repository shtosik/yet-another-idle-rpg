#!/usr/bin/env node
// Copies project skills from .claude/skills (Claude Code, the source) to .agents/skills (Codex), so both agents get the same recipes.
// Skipped: skills that need Claude-only tools, and vendored skills that `npx skills` installs into both (skills-lock.json).
// `npm run validate` fails while a copy is stale.
//
// Usage: npm run sync-skills

import { cpSync, existsSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CLAUDE = join(ROOT, '.claude', 'skills')
const CODEX = join(ROOT, '.agents', 'skills')
/** Skills built on Claude Code tools Codex lacks (the built-in browser, subagents, the asset-generator agent). */
const CLAUDE_ONLY = new Set(['create-verification-skill', 'maintain-verification-skill', 'verify-yari', 'reflect', 'generate-2d-asset'])
const VENDORED = new Set(Object.keys(JSON.parse(readFileSync(join(ROOT, 'skills-lock.json'), 'utf8')).skills))

const dirs = dir => existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name) : []
const files = dir => readdirSync(dir, { recursive: true, withFileTypes: true }).filter(d => d.isFile()).map(d => relative(dir, join(d.parentPath, d.name)))
const shared = () => dirs(CLAUDE).filter(name => !CLAUDE_ONLY.has(name) && !VENDORED.has(name))

/** Repo-relative paths under .agents/skills that are missing, differ from .claude/skills, or belong to no shared skill. */
export function staleCodexSkills() {
  const stale = []
  const wanted = new Set(shared())
  for (const name of wanted) {
    const src = join(CLAUDE, name)
    const dst = join(CODEX, name)
    const srcFiles = files(src)
    const dstFiles = existsSync(dst) ? files(dst) : []
    for (const f of new Set([...srcFiles, ...dstFiles])) {
      const a = join(src, f)
      const b = join(dst, f)
      if (!existsSync(a) || !existsSync(b) || !readFileSync(a).equals(readFileSync(b))) stale.push(relative(ROOT, b))
    }
  }
  for (const name of dirs(CODEX)) {
    if (!wanted.has(name) && !VENDORED.has(name)) stale.push(relative(ROOT, join(CODEX, name)))
  }
  return stale.map(p => p.replace(/\\/g, '/'))
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const wanted = new Set(shared())
  for (const name of dirs(CODEX)) {
    if (!wanted.has(name) && !VENDORED.has(name)) rmSync(join(CODEX, name), { recursive: true })
  }
  for (const name of wanted) {
    rmSync(join(CODEX, name), { recursive: true, force: true })
    cpSync(join(CLAUDE, name), join(CODEX, name), { recursive: true })
  }
  console.log(`Synced ${wanted.size} skills to .agents/skills: ${[...wanted].join(', ')}`)
}
