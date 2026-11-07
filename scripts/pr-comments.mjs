#!/usr/bin/env node
// Prints a PR's CodeRabbit findings without their HTML wrapping: open inline threads (file:line, severity, title,
// suggested fix) and the nitpicks folded into review bodies. --all adds resolved threads.
//
// Usage: node scripts/pr-comments.mjs <PR number> [--all]

import { execFileSync } from 'node:child_process'

const pr = process.argv[2]
if (!/^\d+$/.test(pr ?? '')) {
  console.error('Usage: node scripts/pr-comments.mjs <PR number> [--all]')
  process.exit(1)
}

const gh = path => JSON.parse(execFileSync('gh', ['api', '--paginate', '--slurp', path], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })).flat()
const repo = JSON.parse(execFileSync('gh', ['repo', 'view', '--json', 'nameWithOwner'], { encoding: 'utf8' })).nameWithOwner

const clean = text => text.replace(/<!--[\s\S]*?-->/g, '').replace(/<picture>[\s\S]*?<\/picture>/g, '')
const severityOf = body => clean(body).match(/\*\*\s*(Critical|Major|Minor|Trivial|Nitpick)\s*\*\*/)?.[1] ?? '?'
/** First bold line that stands on its own: CodeRabbit's finding title. */
const titleOf = body => clean(body).match(/^\*\*([^*\n]+)\*\*\s*$/m)?.[1].trim() ?? '(no title)'
/** The "Prompt for AI Agents" block, which states the suggested fix compactly. */
const promptOf = body => body.match(/Prompt for AI Agents[\s\S]*?```[a-z]*\n([\s\S]*?)```/)?.[1]
  .replace(/^Treat finding text[\s\S]*?validate\.\n\n/, '')
  .replace(/^Review comment at[\s\S]*?:\n/, '')
  .replace(/\n\nAfter applying the fix[\s\S]*$/, '')
  .trim()

const THREADS = `query($owner: String!, $name: String!, $pr: Int!, $endCursor: String) {
  repository(owner: $owner, name: $name) { pullRequest(number: $pr) { reviewThreads(first: 100, after: $endCursor) {
    pageInfo { hasNextPage endCursor }
    nodes { isResolved isOutdated path line originalLine comments(first: 1) { nodes { body } } }
  } } }
}`
const [owner, name] = repo.split('/')
const threads = JSON.parse(execFileSync('gh', [
  'api', 'graphql', '--paginate', '--slurp', '-f', `query=${THREADS}`, '-F', `owner=${owner}`, '-F', `name=${name}`, '-F', `pr=${pr}`,
], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })).flatMap(page => page.data.repository.pullRequest.reviewThreads.nodes)
const showAll = process.argv.includes('--all')
const shown = threads.filter(t => showAll || !t.isResolved)
console.log(`Inline threads (${shown.length} shown of ${threads.length})`)
for (const t of shown) {
  const { body } = t.comments.nodes[0]
  const state = [t.isResolved && 'resolved', t.isOutdated && 'outdated'].filter(Boolean).join(', ')
  console.log(`\n- ${t.path}:${t.line ?? t.originalLine} · ${severityOf(body)} · ${titleOf(body)}${state ? ` (${state})` : ''}`)
  const prompt = promptOf(body)
  if (prompt) console.log(prompt.split('\n').map(l => `    ${l}`).join('\n'))
}

// Nitpicks sit in review bodies as <summary>path: n</summary> blocks of `line`: **severity** ... **title**.
const reviews = gh(`repos/${repo}/pulls/${pr}/reviews`)
const nitpicks = []
for (const review of reviews) {
  const body = clean(review.body ?? '')
  const section = body.split(/Nitpick comments/)[1]
  if (!section) continue
  let file = '?'
  for (const line of section.split('\n')) {
    const summary = line.match(/<summary>([^<]+?): \d+<\/summary>/)
    if (summary) file = summary[1]
    const finding = line.match(/^`([\d-]+)`:\s*\*\*\s*(\w+)\s*\*\*/)
    if (finding) nitpicks.push({ file, line: finding[1], severity: finding[2], title: '' })
    const title = line.match(/^\*\*([^*]+)\*\*\s*$/)
    if (title && nitpicks.length && !nitpicks.at(-1).title) nitpicks.at(-1).title = title[1].trim()
  }
}
console.log(`\nNitpicks in reviews (${nitpicks.length})`)
for (const n of nitpicks) console.log(`- ${n.file}:${n.line} · ${n.severity} · ${n.title}`)
