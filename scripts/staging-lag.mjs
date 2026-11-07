#!/usr/bin/env node
// Warns when this branch lags origin/staging: CI tests the merge with staging, so a passing local check can still fail
// there, most of all when staging's validator has new rules. Never fails the check, and stays quiet without the ref.

import { execFileSync } from 'node:child_process'

const TIMEOUT_MS = 10000
// Never prompt or wait on a stalled network: this only advises, and must not block the check.
const env = { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never' }
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: TIMEOUT_MS, env }).trim()

try {
  git('fetch', '-q', 'origin', 'staging')
} catch { /* offline: compare with the last fetched ref */ }

try {
  const behind = Number(git('rev-list', '--count', 'HEAD..origin/staging'))
  if (behind > 0) {
    const validator = git('diff', '--name-only', 'HEAD...origin/staging', '--', 'scripts/validate-data.mjs')
    console.warn(`warning: ${behind} commit(s) behind origin/staging${validator ? ', including new validate rules' : ''}. CI tests the merge with staging: merge origin/staging for a matching result.`)
  }
} catch { /* no origin/staging here, as on a shallow clone */ }
