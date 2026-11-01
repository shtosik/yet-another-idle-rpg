// npm run test:tools
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const GUARD = join(dirname(fileURLToPath(import.meta.url)), 'guard.mjs')

// A fake main checkout (.git folder) and a fake worktree (.git file), in folders with spaces like this machine's.
const base = mkdtempSync(join(tmpdir(), 'guard test '))
const MAIN = join(base, 'main checkout')
const WORKTREE = join(base, 'yari-feature')
mkdirSync(join(MAIN, '.git'), { recursive: true })
mkdirSync(join(MAIN, 'src'))
mkdirSync(WORKTREE)
writeFileSync(join(WORKTREE, '.git'), 'gitdir: elsewhere')

const run = (tool_name, tool_input, cwd = WORKTREE) =>
  spawnSync(process.execPath, [GUARD], { input: JSON.stringify({ tool_name, tool_input, cwd }) }).status
const js = text => run('mcp__Claude_Browser__javascript_tool', { text })

test('blocks localStorage writes in browser JS', () => {
  for (const text of ['localStorage.setItem("playerStore", "{}")', 'localStorage.clear()', 'localStorage.removeItem("x")',
    'localStorage["battleStore"] = x', 'localStorage.playerStore = "{}"', 'delete localStorage.playerStore',
    'delete localStorage["playerStore"]']) assert.equal(js(text), 2, text)
})

test('allows localStorage reads and dev calls', () => {
  for (const text of ['JSON.parse(localStorage.getItem("playerStore"))', 'localStorage.playerStore === x', 'dev.reset(); dev.state().battle'])
    assert.equal(js(text), 0, text)
})

test('blocks branch switches in the main checkout, from any folder in it or through -C', () => {
  assert.equal(run('Bash', { command: 'git switch staging' }, MAIN), 2)
  assert.equal(run('Bash', { command: 'git switch -- staging' }, MAIN), 2)
  assert.equal(run('PowerShell', { command: 'git checkout -b feat/x' }, MAIN), 2)
  assert.equal(run('Bash', { command: 'git switch staging' }, join(MAIN, 'src')), 2)
  assert.equal(run('Bash', { command: `git status && git -C "${MAIN}" switch staging` }), 2)
  assert.equal(run('Bash', { command: 'git -c core.autocrlf=false switch staging' }, MAIN), 2)
  assert.equal(run('Bash', { command: 'git --no-pager checkout staging' }, MAIN), 2)
  assert.equal(run('Bash', { command: 'git checkout staging --' }, MAIN), 2)
  assert.equal(run('Bash', { command: `cd "${MAIN}" && git switch staging` }), 2)
  assert.equal(run('PowerShell', { command: `Set-Location '${MAIN}'; git checkout staging` }), 2)
  assert.equal(run('Bash', { command: 'cd "$MAIN_DIR" && git switch staging' }), 2)
})

test('allows file restores, worktrees and other git commands', () => {
  assert.equal(run('Bash', { command: 'git checkout -- src/app.ts' }, MAIN), 0)
  assert.equal(run('Bash', { command: 'git switch -c feat/x' }, WORKTREE), 0)
  assert.equal(run('Bash', { command: `git -C "${WORKTREE}" checkout staging` }, MAIN), 0)
  assert.equal(run('Bash', { command: `git -c core.autocrlf=false -C "${WORKTREE}" switch staging` }, MAIN), 0)
  assert.equal(run('Bash', { command: 'git status' }, MAIN), 0)
  assert.equal(run('Bash', { command: `cd "${WORKTREE}" && git switch staging` }, MAIN), 0)
  assert.equal(run('Bash', { command: 'git switch staging' }, base), 0)
})
