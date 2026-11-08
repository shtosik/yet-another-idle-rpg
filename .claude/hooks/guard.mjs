// PreToolUse hook: blocks agent actions AGENTS.md and docs/git-workflow.md forbid, with the fix in the message.
// Exit 2 blocks the call and shows stderr to the agent.
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'

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
  block('Blocked: set game state through window.dev (dev.reset(), dev.unlockAll(), dev.giveItem(...); await dev.help() lists them), not localStorage. Read state with dev.state().')
}

// `git [global options] switch …` always changes branch; `git checkout … -- <paths>` only restores files.
// Global options: `-C <dir>` (the checkout it acts on), `-c <key=value>`, and `--flag` / `--flag=value`.
const ARG = String.raw`(?:"[^"]*"|'[^']*'|\S+)`
const GIT_BRANCH_CMD = new RegExp(String.raw`\bgit((?:\s+(?:-[Cc]\s+${ARG}|--[\w-]+(?:=${ARG})?))*)\s+(switch|checkout)\b([^;&|\n]*)`, 'g')
const lastDir = options => [...options.matchAll(new RegExp(String.raw`-C\s+(?:"([^"]*)"|'([^']*)'|(\S+))`, 'g'))]
  .map(([, dq, sq, bare]) => dq ?? sq ?? bare).pop() ?? '.'
// The folder the command is in when git runs: the session's cwd moved by each `cd` / `Set-Location` / `pushd` before it,
// in order. null when a step can't be known (a variable, `~`, `-`, a `cd` inside a `( … )` subshell), so the switch
// is blocked rather than guessed; a later absolute path makes it known again.
// shortcut: a pattern match, not a shell parser; a hook bypass needs deliberate effort, which no agent has shown.
const CD = new RegExp(String.raw`(^|[;&|\n]\s*|\(\s*)(?:cd|Set-Location|sl|pushd)\s+(?:"([^"]*)"|'([^']*)'|([^\s;&|)]+))`, 'g')
const dirAt = index => [...text.slice(0, index).matchAll(CD)]
  .reduce((dir, [, before, dq, sq, bare]) => {
    const target = dq ?? sq ?? bare
    if (before.includes('(') || /[$~%`]|^-$/.test(target)) return null
    if (isAbsolute(target)) return resolve(target)
    return dir === null ? null : resolve(dir, target)
  }, cwd)
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

// A PR based on another feature branch is a stack: 31 of the first 101 PRs were, and those got no CI. A `gh pr create`
// without --base goes to main, the repo default, which only takes release/* and hotfix/*.
if (/^(Bash|PowerShell)$/.test(tool)) {
  for (const { index, 1: verb } of text.matchAll(/\bgh\s+pr\s+(create|edit)\b/g)) {
    // shortcut: reads flags up to the end of the text, so a later chained command's --base counts; no agent chains these.
    const flags = text.slice(index).replace(/(?<!(?:--base|-B)[= ]\s*)("[^"]*"|'[^']*')/g, '')
    const base = /(?:--base|-B)[= ]\s*["']?([^\s"']+)/.exec(flags)?.[1]
    if (base ? !['staging', 'main'].includes(base) : verb === 'create') {
      block(`Blocked: PR base ${base ? `'${base}'` : 'is missing'}. One feature, one PR into staging: plan steps are commits on one branch, no stacked PRs (docs/git-workflow.md). Pass --base staging; only release/* and hotfix/* use --base main.`)
    }
  }
}

// One worktree per session: hopping between worktrees strands work and once failed 19 times in a row.
// Worktrees live in .claude/worktrees, since the app asks the owner to approve entering any path outside it.
const target = String(input.tool_input?.path ?? '')
if (tool === 'EnterWorktree' && target && !inMainCheckout(cwd)) {
  block('Blocked: this session is already in a worktree. Keep one worktree per session (docs/git-workflow.md): commit here, then start the next branch in this worktree with git fetch origin staging && git switch -c <type/name> origin/staging.')
}
if (tool === 'EnterWorktree' && target && !/[\\/]\.claude[\\/]worktrees[\\/]/.test(resolve(cwd, target))) {
  block('Blocked: worktrees outside .claude/worktrees make the app ask the owner to approve entering them. Create one with node scripts/worktree.mjs <type/name>, which puts it in .claude/worktrees, and enter the path it prints.')
}
