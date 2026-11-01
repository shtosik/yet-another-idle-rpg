#!/usr/bin/env node
// Prints one line per PR: state, head -> base, mergeability and each check's result. One `gh` call per PR,
// so worktree sessions can run it where `gh ... --jq` in a loop is refused.
//
// Usage: node scripts/pr-status.mjs <PR number>...

import { execFileSync } from 'node:child_process'

const prs = process.argv.slice(2)
if (prs.length === 0 || !prs.every(pr => /^\d+$/.test(pr))) {
  console.error('Usage: node scripts/pr-status.mjs <PR number>...')
  process.exit(1)
}

const FIELDS = 'number,state,headRefName,baseRefName,mergeable,mergeStateStatus,statusCheckRollup'
for (const pr of prs) {
  const p = JSON.parse(execFileSync('gh', ['pr', 'view', pr, '--json', FIELDS], { encoding: 'utf8' }))
  const checks = p.statusCheckRollup.map(c => `${c.name ?? c.context}: ${c.conclusion || c.status || c.state}`).join(', ')
  console.log(`#${p.number} ${p.state} ${p.headRefName} -> ${p.baseRefName} ${p.mergeable} ${p.mergeStateStatus} [${checks}]`)
}
