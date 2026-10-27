#!/usr/bin/env node
// Economy simulation: plays the main zone chain with a simple build and prints how fast the game opens up.
// Reads enemy, zone and wave-scaling data from src/ (bundled with esbuild), so tuning a number there and
// re-running this shows the effect. Expected values only: no shinies, no spells, no consumables.
// --weaknesses adds a separate table: kill time per zone with the Weaknesses skill and one strike spell per element.
//
// Usage: npm run sim [-- --waves] [-- --weaknesses]   (--waves also prints every wave of every zone)

import { build } from 'esbuild'
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'src')

const outDir = join(ROOT, 'node_modules', '.cache', 'sim-economy')
mkdirSync(outDir, { recursive: true })
const outFile = join(outDir, 'bundle.mjs')
await build({
  stdin: {
    contents: `
      export { ZoneID } from 'enums/ids/zone-id.enum'
      export { EnemyID } from 'enums/ids/enemy-id.enum'
      export { default as ENEMIES_DATA } from 'data/enemies-data'
      export { default as ZONES_DATA } from 'data/zones-data'
      export { default as SPELLS_DATA } from 'data/spells-data'
      export { DamageElement } from 'enums/damage-element.enum'
      export { SpellType } from 'enums/spell-type.enum'
      export { statsInitialState } from 'app/store/player/player'
      export { waveMultipliers } from 'app/store/battle/wave-scaling'
      export { calculateXp } from 'app/store/player/experience'
    `,
    resolveDir: SRC,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  tsconfig: join(ROOT, 'tsconfig.json'),
  outfile: outFile,

  logLevel: 'error',
})
const D = await import(pathToFileURL(outFile).href + `?t=${Date.now()}`)

// ---------------------------------------------------------------------------
// Assumptions (tune here)

/** Main chain in progression order; side zones are played right after the zone that opens them. */
const ROUTE = ['horseshoeBeach', 'plains', 'theLongPath', 'mountainPass', 'elderwoodWilds', 'deepwood', 'upperCanopy']
/** Skill points go into Strength (attackPower +1, 10 levels), then Agility (attackSpeed −0.1 s, 5 levels), then back to power. */
const POWER_NODE_LEVELS = 10
const SPEED_NODE_LEVELS = 5
/** Attack power from gear the player is expected to own on arriving in each tier (drops, crafts, shops). */
const GEAR_POWER_BY_TIER = { 1: 0, 2: 2, 3: 5, 4: 8, 5: 12, 6: 16, 7: 20 }
const BASE_ATTACK_POWER = 1
const BASE_ATTACK_SECONDS = 3
// The combat timing module is TypeScript, so its respawn constant is read from source.
const RESPAWN_SECONDS = Number(readFileSync(join(SRC, 'app/services/combat-timing.ts'), 'utf8')
  .match(/RESPAWN_DELAY_IN_MS = (\d+)/)[1]) / 1000

/** First-hour targets from docs/ideas/progression-pacing.md, in minutes. */
const TARGETS = [
  { label: 'skill tree (level 2)', min: 0, max: 4 },
  { label: 'La Harpar (Horseshoe Beach wave 5)', min: 8, max: 15 },
  { label: 'Horseshoe Beach boss', min: 40, max: 65 },
]
/** Each zone should take this many times the previous one. */
const ZONE_RATIO = { min: 1.3, max: 2.3 }

// ---------------------------------------------------------------------------
// Model

const player = { level: 1, xp: 0, gold: 0, seconds: 0, tier: 1 }

function build_() {
  const points = player.level - 1
  const power = Math.min(points, POWER_NODE_LEVELS) + Math.max(0, points - POWER_NODE_LEVELS - SPEED_NODE_LEVELS)
  const speed = Math.min(Math.max(0, points - POWER_NODE_LEVELS), SPEED_NODE_LEVELS)
  return {
    attackPower: BASE_ATTACK_POWER + power + GEAR_POWER_BY_TIER[player.tier],
    attackSeconds: BASE_ATTACK_SECONDS - 0.1 * speed,
  }
}

function gainXp(amount) {
  player.xp += amount
  for (;;) {
    const need = D.calculateXp(player.level + 1)
    if (player.xp < need) return
    player.xp -= need
    player.level++
  }
}

/** Expected seconds, XP and gold for one kill of `enemyId` on `wave`. */
function killStats(zone, wave, enemyId, build) {
  const enemy = D.ENEMIES_DATA[enemyId]
  const { hp, reward } = D.waveMultipliers(zone, wave)
  const maxHp = Math.round(enemy.maxHp * hp)
  const hits = Math.ceil(maxHp / build.attackPower)
  return {
    hp: maxHp,
    seconds: hits * build.attackSeconds + RESPAWN_SECONDS,
    xp: Math.ceil(enemy.experience * reward),
    gold: Math.ceil(enemy.gold * reward),
  }
}

/** Average over the wave's enemy pool (uniform pick), or the boss on the last wave. */
function waveAverage(zone, wave, build) {
  const pool = wave === zone.maxWave ? [zone.bossEnemyId] : zone.enemies
  const all = pool.map(id => killStats(zone, wave, id, build))
  const avg = key => all.reduce((s, k) => s + k[key], 0) / all.length
  return { hp: avg('hp'), seconds: avg('seconds'), xp: avg('xp'), gold: avg('gold') }
}

const fmtMin = s => `${(s / 60).toFixed(1)} min`
const fmtH = s => s < 3600 ? fmtMin(s) : `${(s / 3600).toFixed(1)} h`
const perHour = (value, seconds) => Math.round(value / seconds * 3600)
const showWaves = process.argv.includes('--waves')

const milestones = []
const flags = []
const zoneRows = []
let previousZoneSeconds = 0
let previousLastWaveRate = null

for (const key of ROUTE) {
  const zone = D.ZONES_DATA[D.ZoneID[key]]
  player.tier = zone.tier
  const start = player.seconds
  const arrival = build_()
  let previousRate = null

  if (showWaves) console.log(`\n${key} (tier ${zone.tier}) · arrive level ${player.level}, power ${arrival.attackPower}, ${arrival.attackSeconds.toFixed(1)} s/attack`)

  for (let wave = 1; wave <= zone.maxWave; wave++) {
    const kills = wave === zone.maxWave ? 1 : zone.enemiesPerWave
    for (let k = 0; k < kills; k++) {
      const stats = waveAverage(zone, wave, build_())
      player.seconds += stats.seconds
      player.gold += stats.gold
      gainXp(stats.xp)
      if (player.level >= 2 && !milestones.some(m => m.label === TARGETS[0].label)) milestones.push({ label: TARGETS[0].label, seconds: player.seconds })
    }
    if (key === 'horseshoeBeach' && wave === 5) milestones.push({ label: TARGETS[1].label, seconds: player.seconds })

    // Rates use the arrival build, so they show the data itself, not the player's growth.
    const at = waveAverage(zone, wave, arrival)
    const rate = (at.xp + at.gold) / at.seconds
    if (wave < zone.maxWave) {
      if (previousRate !== null && rate < previousRate * 0.95) flags.push(`${key} wave ${wave}: reward per second drops (${rate.toFixed(2)} < ${previousRate.toFixed(2)})`)
      if (wave === 1 && previousLastWaveRate !== null && rate < previousLastWaveRate * 0.8) {
        flags.push(`${key} wave 1 pays less per second than the previous zone's last wave (${rate.toFixed(2)} < ${previousLastWaveRate.toFixed(2)})`)
      }
      previousRate = rate
      if (wave === zone.maxWave - 1) previousLastWaveRate = rate
    }
    if (showWaves) {
      console.log(`  wave ${String(wave).padStart(2)}  hp ${at.hp.toFixed(0).padStart(5)}  ${at.seconds.toFixed(1).padStart(6)} s/kill  ${String(perHour(at.xp, at.seconds)).padStart(7)} xp/h  ${String(perHour(at.gold, at.seconds)).padStart(6)} gold/h`)
    }
  }

  const zoneSeconds = player.seconds - start
  const ratio = previousZoneSeconds ? zoneSeconds / previousZoneSeconds : null
  if (ratio !== null && (ratio < ZONE_RATIO.min || ratio > ZONE_RATIO.max)) {
    flags.push(`${key} takes ${ratio.toFixed(2)}× the previous zone (target ${ZONE_RATIO.min}–${ZONE_RATIO.max}×)`)
  }
  if (key === 'horseshoeBeach') milestones.push({ label: TARGETS[2].label, seconds: player.seconds })
  zoneRows.push({ key, zoneSeconds, ratio, total: player.seconds, level: player.level, gold: player.gold, arrival })
  previousZoneSeconds = zoneSeconds
}

// ---------------------------------------------------------------------------
// Report

console.log('\nZones (cleared wave 1 to boss once, in route order)')
console.log('  zone             arrive pwr/s     zone time   ×prev   total     level   gold')
for (const r of zoneRows) {
  console.log(`  ${r.key.padEnd(16)} ${String(r.arrival.attackPower).padStart(3)}/${r.arrival.attackSeconds.toFixed(1)}   ${fmtH(r.zoneSeconds).padStart(9)}   ${r.ratio ? r.ratio.toFixed(2).padStart(5) : '    -'}   ${fmtH(r.total).padStart(8)}   ${String(r.level).padStart(4)}   ${String(Math.round(r.gold)).padStart(7)}`)
}

console.log('\nFirst hour')
for (const t of TARGETS) {
  const m = milestones.find(x => x.label === t.label)
  const minutes = m ? m.seconds / 60 : Infinity
  const ok = minutes >= t.min && minutes <= t.max
  console.log(`  ${ok ? 'ok  ' : 'OFF '} ${t.label.padEnd(36)} ${m ? fmtMin(m.seconds) : 'never'}  (target ${t.min}–${t.max} min)`)
  if (!ok) flags.push(`${t.label} at ${m ? fmtMin(m.seconds) : 'never'} (target ${t.min}–${t.max} min)`)
}

console.log(flags.length ? `\nFlags\n${flags.map(f => `  - ${f}`).join('\n')}` : '\nNo flags.')

// ---------------------------------------------------------------------------
// Weaknesses and strike spells (--weaknesses)

if (process.argv.includes('--weaknesses')) {
  const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1)
  /** Weakness multiplier for an element at base stats (`extra<Element>DamageMultiplier`, 1.2), as `resolveHit` builds the name. */
  const weaknessMultiplier = element => D.statsInitialState[`extra${capitalize(D.DamageElement[element])}DamageMultiplier`]
  const strikeSpells = Object.values(D.SPELLS_DATA).filter(s => s.effect.type === D.SpellType.magic)

  /**
   * Average seconds per kill on wave 1 at the arrival build, continuous damage (no per-hit rounding), no magic gear.
   * Physical auto-attacks; with `weaknesses`, physical-weak enemies take the weakness multiplier; `spell` is cast on
   * every cooldown and also hits weaknesses (the Weaknesses skill assumed).
   */
  const secondsPerKill = (zone, build, { weaknesses, spell }) => {
    const all = zone.enemies.map(id => {
      const enemy = D.ENEMIES_DATA[id]
      const hp = enemy.maxHp * D.waveMultipliers(zone, 1).hp
      const autoMultiplier = weaknesses && enemy.weakness === D.DamageElement.physical ? weaknessMultiplier(enemy.weakness) : 1
      let dps = build.attackPower * autoMultiplier / build.attackSeconds
      if (spell) {
        const spellMultiplier = enemy.weakness === spell.effect.damageType ? weaknessMultiplier(enemy.weakness) : 1
        dps += spell.effect.baseDamage * spellMultiplier / spell.baseCooldown
      }
      return hp / dps + RESPAWN_SECONDS
    })
    return all.reduce((s, x) => s + x, 0) / all.length
  }

  const spellNames = strikeSpells.map(s => D.DamageElement[s.effect.damageType])
  console.log('\nWeaknesses (wave 1 regulars, s/kill at arrival build; + element = Weaknesses skill and that strike spell on cooldown)')
  console.log(`  zone             weak to                      phys  +weak  ${spellNames.map(n => `+${n}`.padStart(6)).join(' ')}`)
  for (const r of zoneRows) {
    const zone = D.ZONES_DATA[D.ZoneID[r.key]]
    const weakTo = zone.enemies.map(id => D.DamageElement[D.ENEMIES_DATA[id].weakness] ?? '-').join(',')
    const cells = [
      secondsPerKill(zone, r.arrival, { weaknesses: false }),
      secondsPerKill(zone, r.arrival, { weaknesses: true }),
      ...strikeSpells.map(spell => secondsPerKill(zone, r.arrival, { weaknesses: true, spell })),
    ]
    console.log(`  ${r.key.padEnd(16)} ${weakTo.padEnd(28)} ${cells.map(c => c.toFixed(1).padStart(5)).join('  ')}`)
  }
}
