#!/usr/bin/env node
// Creates a worktree for a new branch with its own node_modules: fetch,
// `git worktree add <main checkout>/.claude/worktrees/yari-<name> -b <branch> <base>`, then `npm ci` inside it.
// One allowlisted command instead of a chain the worktree sandbox refuses (docs/git-workflow.md).
// Inside .claude/worktrees because the desktop app asks the owner to approve every EnterWorktree to a path outside it.
//
// Usage: node scripts/worktree.mjs <type/name> [--from <ref>]   e.g. feat/arena-chest; --from defaults to origin/staging

import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const branch = args[0]
const base = args.includes('--from') ? args[args.indexOf('--from') + 1] : 'origin/staging'
if (!/^(feat|fix|chore|docs|hotfix|release|refactor)\/[a-z0-9.-]+$/.test(branch ?? '') || !base) {
  console.error('Usage: node scripts/worktree.mjs <feat|fix|chore|docs|hotfix|release|refactor>/<name> [--from <ref>]')
  process.exit(1)
}

// The main checkout, also when this runs from a worktree: `git worktree list` names it first.
const MAIN = resolve(execFileSync('git', ['worktree', 'list', '--porcelain'], { cwd: ROOT, encoding: 'utf8' }).match(/^worktree (.+)$/m)[1])
const dir = join(MAIN, '.claude', 'worktrees', `yari-${branch.split('/')[1]}`)
if (existsSync(dir)) {
  console.error(`${dir} already exists`)
  process.exit(1)
}

execFileSync('git', ['fetch', 'origin', '--quiet'], { cwd: ROOT, stdio: 'inherit' })
execFileSync('git', ['worktree', 'add', dir, '-b', branch, base], { cwd: ROOT, stdio: 'inherit' })
// npm is npm.cmd on Windows, which needs a shell; a shell joins arguments unquoted, so only space-free ones go here.
execFileSync('npm', ['ci', '--prefer-offline', '--no-audit', '--no-fund'], { cwd: dir, stdio: 'inherit', shell: process.platform === 'win32' })
console.log(`\nReady: ${dir}\nNext: EnterWorktree with path ${dir}`)
