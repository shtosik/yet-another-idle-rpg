import { Enemy } from '../../interfaces/enemy.interface'
import { Zone } from '../../interfaces/zone.interface'
import { DamageElement } from '../../enums/damage-element.enum'
import { rollSpawn, scaledHp, waveEnemies } from '../store/battle/waves'
import { Kill, Rng } from '../store/player/kill-rewards'
import type { PlayerStatsType } from '../store/player/stats'
import { HitInput, resolveHit } from './hit-resolution'
import { RESPAWN_DELAY_IN_MS, timePerAttackMs } from './combat-step'

/** A stretch of offline time with one set of stats (buffs running or expired). */
export interface OfflineSegment {
  durationMs: number
  stats: PlayerStatsType
}

export interface OfflineSimulationInput {
  zone: Zone
  wave: number
  /** In order; their durations add up to the claimed time. */
  segments: OfflineSegment[]
  damageType: DamageElement
  /** The equipped weapon is melee (or none). */
  isMeleeWeapon: boolean
  /** The equipped weapon is ranged. */
  isRangedWeapon: boolean
  hasWeaknessSkill: boolean
  /** Average ms per recent online kill; caps the rate at what the player really managed. `null` if unknown. */
  rollingKillMs: number | null
  rng: Rng
}

export interface OfflineSimulationResult {
  /** In order, each with the stats of its segment; paid by Kill resolution. */
  kills: Kill[]
}

/** Deterministic PRNG (mulberry32), so a reload replays the same offline rolls. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Auto-attacks only: no spells are cast offline. */
const autoAttackInput = (stats: PlayerStatsType, enemy: Enemy, input: OfflineSimulationInput): HitInput => ({
  stats,
  magicDamage: 0,
  isMelee: input.isMeleeWeapon,
  isRanged: input.isRangedWeapon,
  damageType: input.damageType,
  enemyWeakness: enemy.weakness,
  enemyTypes: enemy.enemyTypes,
  hasWeaknessSkill: input.hasWeaknessSkill,
  hasSpellCritSkill: false,
})

/** Average ms per kill on this wave from stats alone (crits averaged in), respawn included. */
export function theoreticalKillMs(stats: PlayerStatsType, input: OfflineSimulationInput): number {
  const enemies = waveEnemies(input.zone, input.wave)
  const critChance = Math.min(1, Math.max(0, stats.critChance / 100))

  const total = enemies.reduce((sum, enemy) => {
    const hit = autoAttackInput(stats, enemy, input)
    const normal = resolveHit(hit, () => 1).damage
    const crit = resolveHit(hit, () => 0).damage
    const expected = normal * (1 - critChance) + crit * critChance
    const hits = Math.ceil(scaledHp(enemy, input.zone, input.wave) / expected)
    return sum + RESPAWN_DELAY_IN_MS + hits * timePerAttackMs(stats)
  }, 0)

  return total / enemies.length
}

/**
 * Kills on the wave the player left on until the claimed time runs out, each picked like an online kill
 * (enemy, shiny, crits). The wave never changes. What each kill pays is Kill resolution's job.
 * Kill time = online kill time ÷ `offlineProgressRate`, slowed further when the player's recent online kills
 * were slower than their stats say (so swapping in better gear right before closing pays nothing).
 */
export function simulateOfflineKills(input: OfflineSimulationInput): OfflineSimulationResult {
  const result: OfflineSimulationResult = { kills: [] }
  if (!input.segments.length) return result

  const { zone, wave, rng } = input
  const theoretical = theoreticalKillMs(input.segments[0].stats, input)
  const slowdown = input.rollingKillMs ? Math.max(1, input.rollingKillMs / theoretical) : 1
  const totalMs = input.segments.reduce((sum, s) => sum + s.durationMs, 0)

  let elapsedMs = 0
  let segmentIndex = 0
  let segmentEndMs = input.segments[0].durationMs

  while (elapsedMs < totalMs) {
    while (elapsedMs >= segmentEndMs && segmentIndex < input.segments.length - 1) {
      segmentIndex++
      segmentEndMs += input.segments[segmentIndex].durationMs
    }
    const stats = input.segments[segmentIndex].stats
    // No progress in this segment: skip to the next one.
    if (stats.offlineProgressRate <= 0) {
      if (segmentIndex === input.segments.length - 1) break
      elapsedMs = segmentEndMs
      continue
    }

    // Real ms per simulated ms: a 0.5 rate makes every kill take twice as long.
    const timeScale = slowdown / stats.offlineProgressRate
    const attackMs = timePerAttackMs(stats) * timeScale
    const { enemy, isShiny, maxHp } = rollSpawn(zone, wave, stats.shinyChance, rng)

    let killMs = RESPAWN_DELAY_IN_MS * timeScale
    let hp = maxHp
    const hit = autoAttackInput(stats, enemy, input)
    while (hp > 0 && elapsedMs + killMs <= totalMs) {
      killMs += attackMs
      hp -= resolveHit(hit, rng).damage
    }
    if (hp > 0 || elapsedMs + killMs > totalMs) break
    elapsedMs += killMs

    result.kills.push({ enemyId: enemy.id, isShiny, stats })
  }

  return result
}
