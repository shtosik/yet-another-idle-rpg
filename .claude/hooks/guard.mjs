// PreToolUse hook: blocks agent actions AGENTS.md and docs/git-workflow.md forbid, with the fix in the message.
// Exit 2 blocks the call and shows stderr to the agent.
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const input = JSON.parse(readFileSync(0, 'utf8'))
const tool = input.tool_name ?? ''
const text = String(input.tool_input?.text ?? input.tool_input?.command ?? '')
const cwd = input.cwd ?? process.cwd()

const block = message => {
  console.error(message)
  process.exit(2)
}

// The checkout holding `dir` is the main one when its .git is a folder; a worktree has a .git file.
const inMainCheckout = dir => {
  for (let d = resolve(dir); ; d = dirname(d)) {
    const dotGit = join(d, '.git')
    if (existsSync(dotGit)) return statSync(dotGit).isDirectory()
    if (dirname(d) === d) return false
  }
}

const STORAGE_WRITE = /localStorage\s*\.\s*(setItem|removeItem|clear)\b|localStorage\s*(\.\s*\w+|\[[^\]]+\])\s*=(?!=)|\bdelete\s+localStorage\b/
if (/javascript_tool$/.test(tool) && STORAGE_WRITE.test(text)) {
  block('Blocked: set game state through window.dev (dev.reset(), dev.unlockAll(), dev.giveItem(...); list in dev-cheats.component.ts), not localStorage. Read state with dev.state().')
}

// `git [global options] switch …` always changes branch; `git checkout … -- <paths>` only restores files.
// Global options: `-C <dir>` (the checkout it acts on), `-c <key=value>`, and `--flag` / `--flag=value`.
const ARG = String.raw`(?:"[^"]*"|'[^']*'|\S+)`
const GIT_BRANCH_CMD = new RegExp(String.raw`\bgit((?:\s+(?:-[Cc]\s+${ARG}|--[\w-]+(?:=${ARG})?))*)\s+(switch|checkout)\b([^;&|\n]*)`, 'g')
const lastDir = options => [...options.matchAll(new RegExp(String.raw`-C\s+(?:"([^"]*)"|'([^']*)'|(\S+))`, 'g'))]
  .map(([, dq, sq, bare]) => dq ?? sq ?? bare).pop() ?? '.'
// The folder the command is in when git runs: the session's cwd moved by each `cd` / `Set-Location` / `pushd` before it,
// in order. null when a step can't be known (a variable, `~`, `-`), so the switch is blocked rather than guessed.
const CD = new RegExp(String.raw`(?:^|[;&|\n]\s*|\(\s*)(?:cd|Set-Location|sl|pushd)\s+(?:"([^"]*)"|'([^']*)'|([^\s;&|)]+))`, 'g')
const dirAt = index => [...text.slice(0, index).matchAll(CD)]
  .map(([, dq, sq, bare]) => dq ?? sq ?? bare)
  .reduce((dir, target) => dir === null || /[$~%`]|^-$/.test(target) ? null : resolve(dir, target), cwd)
if (/^(Bash|PowerShell)$/.test(tool)) {
  for (const match of text.matchAll(GIT_BRANCH_CMD)) {
    const [, options, verb, rest] = match
    if (verb === 'checkout' && /\s--\s+\S/.test(rest)) continue
    const dir = dirAt(match.index)
    if (dir === null || inMainCheckout(resolve(dir, lastDir(options)))) {
      block('Blocked: switching branches in the main checkout moves every parallel session (docs/git-workflow.md). Create a worktree: node scripts/worktree.mjs <type/name>, then EnterWorktree.')
    }
  }
}
