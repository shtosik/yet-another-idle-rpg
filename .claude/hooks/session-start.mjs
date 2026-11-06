// SessionStart hook: session-wide reminders plus where this checkout stands against origin/staging,
// so a session doesn't read a stale local branch (AGENTS.md: explore and develop on origin/staging).
// A clean `staging` checkout with no local commits is fast-forwarded, so the docs, skills and agents
// sessions load from it stay current.
import { execFileSync, spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const git = (...args) => {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 15000 }).trim()
  } catch {
    return null
  }
}

const notes = [
  'Angular repo: before writing or reviewing Angular code (components, templates, signals, stores, routing, forms, tests), load the angular-developer skill with the Skill tool once per session.',
]

const fetched = git('fetch', 'origin', 'staging', '--quiet') !== null
const branch = git('branch', '--show-current') || 'detached HEAD'
let counts = git('rev-list', '--left-right', '--count', 'HEAD...origin/staging')
const [ahead0, behind0] = counts ? counts.split(/\s+/).map(Number) : []
// Tracked changes block it; an untracked or ignored file the merge would overwrite makes it abort.
if (fetched && branch === 'staging' && ahead0 === 0 && behind0 > 0 && git('status', '--porcelain', '--untracked-files=no') === ''
  && git('merge', '--ff-only', '--no-overwrite-ignore', '--quiet', 'origin/staging') !== null) {
  notes.push(`Fast-forwarded staging by ${behind0} commit(s) to origin/staging.`)
  counts = git('rev-list', '--left-right', '--count', 'HEAD...origin/staging')
}
if (counts) {
  const [ahead, behind] = counts.split(/\s+/).map(Number)
  notes.push(`Checkout is on ${branch}: ${ahead} commit(s) not on origin/staging, ${behind} commit(s) of origin/staging missing${fetched ? '' : ' (fetch failed, origin/staging may be stale)'}.`
    + (behind > 0 ? ' Read code from origin/staging or a worktree, not this checkout.' : ''))
} else {
  notes.push(`Checkout is on ${branch}; comparing it with origin/staging failed, so check \`git fetch origin staging\` before reading code here.`)
}

// Merged worktrees pile up because nobody remembers to remove them; clean up in the background, silently.
spawn(process.execPath, [fileURLToPath(new URL('../../scripts/worktree-prune.mjs', import.meta.url))], { detached: true, stdio: 'ignore', windowsHide: true }).unref()

console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: notes.join('\n') } }))
