// npm run test:tools
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { jobFileError, markDone } from './job.mjs'

test('takes review and decision files only with the verdict line their brief asks for', () => {
  assert.equal(jobFileError('step-6/round-1/code.md', 'CHANGES\nmust: none'), null)
  assert.equal(jobFileError('decision.md', 'ESCALATE\nreasons: step 6'), null)
  assert.equal(jobFileError('step-6/build.md', 'commit: abc'), null)
  // The Chapter One run, after its context was summarized: hand-written briefs gave these.
  assert.match(jobFileError('step-6/round-1/code.md', 'APPROVE\n'), /not PASS or CHANGES.*review-brief\.md/)
  assert.match(jobFileError('decision.md', 'REJECT\n'), /not APPROVE or ESCALATE.*approver-brief\.md/)
  assert.match(jobFileError('step-6/round-1/cavecrew-reviewer.md', 'CHANGES\n'), /not a job file/)
})

test('marks a step done once', () => {
  const plan = '### 7. Dialogue (L, Sonnet)\n- nodes\n### 8. Check (S, Sonnet)\n'
  const once = markDone(plan, 7)
  assert.equal(once, '### 7. Dialogue (L, Sonnet) ✅\n- nodes\n### 8. Check (S, Sonnet)\n')
  assert.equal(markDone(once, 7), once)
  assert.throws(() => markDone(plan, 9), /no '### 9\.' heading/)
})
