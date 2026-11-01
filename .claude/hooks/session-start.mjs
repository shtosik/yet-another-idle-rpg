// SessionStart hook: session-wide reminders plus where this checkout stands against origin/staging,
// so a session doesn't read a stale local branch (AGENTS.md: explore and develop on origin/staging).
import { execFileSync } from 'node:child_process'

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
const counts = git('rev-list', '--left-right', '--count', 'HEAD...origin/staging')
if (counts) {
  const [ahead, behind] = counts.split(/\s+/).map(Number)
  notes.push(`Checkout is on ${branch}: ${ahead} commit(s) not on origin/staging, ${behind} commit(s) of origin/staging missing${fetched ? '' : ' (fetch failed, origin/staging may be stale)'}.`
    + (behind > 0 ? ' Read code from origin/staging or a worktree, not this checkout.' : ''))
}

console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: notes.join('\n') } }))
