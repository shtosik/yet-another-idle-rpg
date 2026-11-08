#!/usr/bin/env node
// Removes worktrees (and their local branch) whose work is already merged, so they don't pile up.
// Runs detached from the SessionStart hook; also usable by hand.
//
// A worktree is removed only when ALL hold:
//   - its branch tip is merged: a merged PR with that exact tip (squash merges too), or an ancestor of origin/staging
//   - the working tree is clean and it is not locked
//   - its git state was last touched more than MIN_IDLE_HOURS ago
//   - it is not this checkout, the main checkout, or the folder the command runs from
// Anything else is left alone. `git worktree remove` without --force refuses dirty trees as a second guard.
//
// Usage: node scripts/worktree-prune.mjs [--dry]

import { execFileSync } from 'node:child_process'
import { statSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const MIN_IDLE_HOURS = 12
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dry = process.argv.includes('--dry')

const run = (cmd, args, cwd = ROOT) => {
  try {
    return execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 120000, shell: false, windowsHide: true }).trim()
  } catch {
    return null
  }
}
const norm = (p) => resolve(p).toLowerCase()

/** @returns {{ path: string, branch: string | null, head: string, locked: boolean }[]} */
function listWorktrees() {
  const out = run('git', ['worktree', 'list', '--porcelain']) ?? ''
  return out.split(/\r?\n\r?\n/).filter(Boolean).map((block) => {
    const lines = block.split(/\r?\n/)
    const value = (key) => lines.find((l) => l.startsWith(`${key} `))?.slice(key.length + 1) ?? null
    return {
      path: value('worktree'),
      branch: value('branch')?.replace('refs/heads/', '') ?? null,
      head: value('HEAD'),
      locked: lines.some((l) => l === 'locked' || l.startsWith('locked ')),
    }
  })
}

/** Branch name -> tip SHAs of its merged PRs. Empty when gh is missing or not signed in. */
function mergedPrTips() {
  const out = run('gh', ['pr', 'list', '--state', 'merged', '--limit', '1000', '--json', 'headRefName,headRefOid'])
  const tips = new Map()
  for (const pr of out ? JSON.parse(out) : []) tips.set(pr.headRefName, (tips.get(pr.headRefName) ?? new Set()).add(pr.headRefOid))
  return tips
}

function idleHours(worktreePath) {
  const gitDir = run('git', ['rev-parse', '--absolute-git-dir'], worktreePath)
  if (!gitDir) return 0
  try {
    return (Date.now() - Math.max(statSync(join(gitDir, 'index')).mtimeMs, statSync(join(gitDir, 'HEAD')).mtimeMs)) / 36e5
  } catch {
    return 0
  }
}

run('git', ['fetch', 'origin', '--quiet'])
run('git', ['worktree', 'prune'])

const [main, ...others] = listWorktrees()
const prTips = mergedPrTips()
const cwd = norm(process.cwd())
const removed = []
let kept = 0

for (const wt of others) {
  const dir = norm(wt.path)
  const isOurs = dir === norm(ROOT) || cwd === dir || cwd.startsWith(dir + '\\') || cwd.startsWith(dir + '/')
  const merged = wt.branch && (prTips.get(wt.branch)?.has(wt.head) || run('git', ['merge-base', '--is-ancestor', wt.head, 'origin/staging']) !== null)
  // Only the yari-* worktrees made by scripts/worktree.mjs (in .claude/worktrees, or siblings from before it moved there);
  // worktrees another tool placed, such as the app's own claude/* ones, are not ours to remove.
  const ourParents = [dirname(norm(main.path)), norm(join(main.path, '.claude', 'worktrees'))]
  const foreign = !ourParents.includes(dirname(dir)) || !basename(dir).startsWith('yari-') || !/^(feat|fix|chore|docs|hotfix|release|refactor)\//.test(wt.branch ?? '')
  if (isOurs || foreign || !wt.branch || wt.locked || !merged || idleHours(wt.path) < MIN_IDLE_HOURS || run('git', ['status', '--porcelain'], wt.path) !== '') {
    kept++
    continue
  }
  if (dry) {
    removed.push(wt.branch)
    continue
  }
  // No --force: git refuses a worktree with changes. The ref is deleted only if it still points at the verified tip,
  // so a commit made after the checks keeps its branch (and squash-merged branches, which are not ancestors, still go).
  if (run('git', ['worktree', 'remove', wt.path]) !== null) {
    run('git', ['update-ref', '-d', `refs/heads/${wt.branch}`, wt.head], main.path)
    removed.push(wt.branch)
  } else {
    kept++
  }
}

console.log(`${dry ? 'would remove' : 'removed'} ${removed.length} worktree(s)${removed.length ? `: ${removed.join(', ')}` : ''}; kept ${kept}`)
