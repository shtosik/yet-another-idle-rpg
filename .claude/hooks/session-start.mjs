// SessionStart hook: session-wide reminders plus where this checkout stands against origin/staging,
// so a session doesn't read a stale local branch (AGENTS.md: explore and develop on origin/staging).
// A `staging` checkout with no local commits is fast-forwarded, so the docs, skills, agents, hooks
// and scripts sessions load from it stay current.
import { execFileSync, spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const git = (...args) => {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 15000, windowsHide: true }).trim()
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
// Local edits stay: git refuses the merge only when it would overwrite a changed, untracked or ignored file.
// Requiring a clean tree left the checkout behind for good whenever one unrelated file was edited.
if (fetched && branch === 'staging' && ahead0 === 0 && behind0 > 0) {
  if (git('merge', '--ff-only', '--no-overwrite-ignore', '--quiet', 'origin/staging') !== null) {
    notes.push(`Fast-forwarded staging by ${behind0} commit(s) to origin/staging.`)
    counts = git('rev-list', '--left-right', '--count', 'HEAD...origin/staging')
  } else {
    notes.push(`Fast-forward of staging failed: local changes to files origin/staging also changes. Tell the owner to commit or discard them: ${git('status', '--porcelain') || 'see git status'}.`)
  }
}
if (counts) {
  const [ahead, behind] = counts.split(/\s+/).map(Number)
  notes.push(`Checkout is on ${branch}: ${ahead} commit(s) not on origin/staging, ${behind} commit(s) of origin/staging missing${fetched ? '' : ' (fetch failed, origin/staging may be stale)'}.`
    + (behind > 0 ? ' Read code from origin/staging or a worktree, not this checkout.' : ''))
} else {
  notes.push(`Checkout is on ${branch}; comparing it with origin/staging failed, so check \`git fetch origin staging\` before reading code here.`)
}

// Merged worktrees pile up because nobody remembers to remove them; clean up in the background, silently.
spawn(process.execPath, [fileURLToPath(new URL('../../scripts/worktree-prune.mjs', import.meta.url))], { detached: true, stdio: 'ignore', windowsHide: true }).on('error', () => {}).unref()

console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: notes.join('\n') } }))
