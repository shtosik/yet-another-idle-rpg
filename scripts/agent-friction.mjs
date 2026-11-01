#!/usr/bin/env node
// Mines this repo's Claude Code transcripts (main checkout and sibling worktrees) for agent friction:
// the owner's corrections, tool calls that were refused or failed, and the most common shell commands.
// Feeds the `correct` and `reflect` skills. Reads only ~/.claude/projects folders named after this repo's parent folder.
//
// Usage: node scripts/agent-friction.mjs [--since YYYY-MM-DD] [--all]   (--all prints every owner message, not only corrections)

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PROJECTS = join(homedir(), '.claude', 'projects')
// Claude Code names a project folder after its path with every non-alphanumeric character replaced by '-'.
const PREFIX = dirname(ROOT).replace(/[^a-zA-Z0-9]/g, '-') + '-'
const CORRECTION = /\b(don'?t|dont|stop|wrong|again|instead|not what|broke|still|forgot|should(n'?t)? have|never|always|why did|revert|undo)\b/i

const args = process.argv.slice(2)
const sinceArg = args.includes('--since') ? args[args.indexOf('--since') + 1] : undefined
const since = sinceArg ? Date.parse(sinceArg) : 0
if (Number.isNaN(since)) {
  console.error('Usage: node scripts/agent-friction.mjs [--since YYYY-MM-DD] [--all]')
  process.exit(1)
}
const all = args.includes('--all')

const messages = []
const errors = new Map()
const commands = new Map()
const bump = (map, key) => map.set(key, (map.get(key) ?? 0) + 1)
const oneLine = (text, max) => text.replace(/\s+/g, ' ').trim().slice(0, max)

const folders = existsSync(PROJECTS) ? readdirSync(PROJECTS).filter(d => d.startsWith(PREFIX)) : []
for (const folder of folders) {
  for (const file of readdirSync(join(PROJECTS, folder)).filter(f => f.endsWith('.jsonl'))) {
    for (const line of readFileSync(join(PROJECTS, folder, file), 'utf8').split('\n')) {
      let entry
      try { entry = JSON.parse(line) } catch { continue }
      if (Date.parse(entry.timestamp ?? '') < since) continue
      const content = entry.message?.content
      const blocks = typeof content === 'string' ? [{ type: 'text', text: content }] : Array.isArray(content) ? content : []
      for (const block of blocks) {
        if (entry.type === 'user' && !entry.isMeta && block.type === 'text' && !/^\s*[<[]/.test(block.text)) {
          const text = oneLine(block.text, 300)
          if (all || CORRECTION.test(text)) messages.push(`${entry.timestamp?.slice(0, 10)} ${folder.slice(PREFIX.length)}: ${text}`)
        }
        if (block.type === 'tool_result' && block.is_error) {
          bump(errors, oneLine(typeof block.content === 'string' ? block.content : JSON.stringify(block.content), 140))
        }
        if (block.type === 'tool_use' && typeof block.input?.command === 'string') {
          bump(commands, block.input.command.trim().split(/\s+/).slice(0, 2).join(' '))
        }
      }
    }
  }
}

const top = (map, n) => [...map].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${String(v).padStart(5)}  ${k}`).join('\n')
console.log(`# ${folders.length} transcript folders matching ${PREFIX}*\n`)
console.log(`## Owner ${all ? 'messages' : 'corrections'} (${[...new Set(messages)].length})\n${[...new Set(messages)].join('\n')}\n`)
console.log(`## Refused or failed tool calls\n${top(errors, 40)}\n`)
console.log(`## Most common commands\n${top(commands, 30)}`)
