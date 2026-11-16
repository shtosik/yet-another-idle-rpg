// Writes /run-plan job files (<main checkout>/.claude/jobs/<name>/), which a worktree session's Write and Edit can't reach.
//   node scripts/job.mjs save <name> <job file> <source file>   copy a saved reply in, checking its name and verdict line
//   node scripts/job.mjs done <name> <step>                      mark a step heading in plan.md with ✅
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

const BRIEFS = '.claude/skills/run-plan/references'
// Each job file, the first line it must start with, and the brief that asks for that line.
const FILES = [
  { path: /^plan\.md$/ },
  { path: /^plan-review\.md$/ },
  { path: /^step-\d+\/build\.md$/ },
  { path: /^step-\d+\/round-\d+\/(code|systems|blast-radius|owner)\.md$/, verdict: /^(PASS|CHANGES)$/, brief: 'review-brief.md' },
  { path: /^decision\.md$/, verdict: /^(APPROVE|ESCALATE)$/, brief: 'approver-brief.md' },
]

/** Why `content` can't be saved as `file`, or null. */
export function jobFileError(file, content) {
  const kind = FILES.find(({ path }) => path.test(file))
  if (!kind) return `'${file}' is not a job file. Use plan.md, plan-review.md, decision.md, step-<N>/build.md or step-<N>/round-<K>/<code|systems|blast-radius|owner>.md (.claude/skills/run-plan/SKILL.md, "The job folder").`
  const first = content.split(/\r?\n/, 1)[0].trim()
  if (kind.verdict && !kind.verdict.test(first)) {
    return `'${file}' starts with '${first}', not ${kind.verdict.source.slice(2, -2).replace('|', ' or ')}. Brief the agent with ${BRIEFS}/${kind.brief} verbatim and save its reply unchanged.`
  }
  return null
}

/** plan.md with ` ✅` after step `step`'s heading (once). */
export function markDone(plan, step) {
  const heading = new RegExp(String.raw`^(### ${step}\. .*?)\s*$`, 'm')
  if (!heading.test(plan)) throw new Error(`plan.md has no '### ${step}.' heading`)
  return plan.replace(heading, (line, title) => title.endsWith('✅') ? title : `${title} ✅`)
}

function jobsDir(name) {
  const common = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { encoding: 'utf8' }).trim()
  return join(dirname(common), '.claude', 'jobs', name)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [command, name, ...args] = process.argv.slice(2)
  const fail = message => {
    console.error(message)
    process.exit(1)
  }
  if (!name) fail('Usage: node scripts/job.mjs save <name> <job file> <source file> | done <name> <step>')
  const dir = jobsDir(name)
  if (command === 'save') {
    const [file, source] = args
    const content = readFileSync(source, 'utf8').replace(/^﻿/, '')
    const error = jobFileError(file.replace(/\\/g, '/'), content)
    if (error) fail(error)
    mkdirSync(dirname(join(dir, file)), { recursive: true })
    writeFileSync(join(dir, file), content)
    console.log(`saved ${join(dir, file)}`)
  } else if (command === 'done') {
    const plan = join(dir, 'plan.md')
    writeFileSync(plan, markDone(readFileSync(plan, 'utf8'), args[0]))
    console.log(`step ${args[0]} ✅`)
  } else {
    fail(`Unknown command '${command}': save or done.`)
  }
}
