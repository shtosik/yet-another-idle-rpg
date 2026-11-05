#!/usr/bin/env node
// Runs the steps of `npm run check` and prints one line per step, plus the end of the output of the step that failed.

import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const TAIL_LINES = 40
const ANSI = /\x1b\[[0-9;?]*[A-Za-z]/g

const { scripts } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

for (const step of scripts.check.split('&&').map(s => s.trim())) {
  const result = spawnSync(`${step} 2>&1`, {
    shell: true, encoding: 'utf8', maxBuffer: 1 << 28, env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
  })
  const output = result.stdout.replace(ANSI, '').trim()
  if (result.status !== 0) {
    console.log(`FAILED ${step}\n${output.split(/\r?\n/).slice(-TAIL_LINES).join('\n')}`)
    process.exit(result.status ?? 1)
  }
  console.log(`ok ${step}`)
  if (/^warning:/m.test(output)) console.log(output.split(/\r?\n/).filter(line => line.startsWith('warning:')).join('\n'))
}
