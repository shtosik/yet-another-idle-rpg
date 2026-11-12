// npm run test:tools
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HOOK = join(dirname(fileURLToPath(import.meta.url)), 'session-start.mjs')
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()

// An origin with a staging branch and a clone of it, in folders with spaces like this machine's.
const base = mkdtempSync(join(tmpdir(), 'session start '))
const origin = join(base, 'origin')
const clone = join(base, 'main checkout')
git(base, 'init', '-q', '-b', 'staging', origin)
git(origin, 'config', 'user.email', 'test@test')
git(origin, 'config', 'user.name', 'test')
writeFileSync(join(origin, 'a.txt'), '1')
writeFileSync(join(origin, 'b.txt'), '1')
git(origin, 'add', '.')
git(origin, 'commit', '-qm', 'one')
git(base, 'clone', '-q', origin, clone)

const run = () => JSON.parse(execFileSync(process.execPath, [HOOK], { cwd: clone, encoding: 'utf8' })).hookSpecificOutput.additionalContext
const push = (file, text) => { writeFileSync(join(origin, file), text); git(origin, 'commit', '-qam', text) }
const read = file => readFileSync(join(clone, file), 'utf8')

test('fast-forwards staging and keeps a local edit to another file', () => {
  push('a.txt', '2')
  writeFileSync(join(clone, 'b.txt'), 'local')
  assert.match(run(), /Fast-forwarded staging by 1/)
  assert.equal(read('a.txt'), '2')
  assert.equal(read('b.txt'), 'local')
})

test('refuses and keeps the local edit when origin/staging changes the same file', () => {
  push('b.txt', '3')
  assert.match(run(), /Fast-forward of staging failed/)
  assert.equal(read('b.txt'), 'local')
})
