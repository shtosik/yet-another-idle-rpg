import { Enemy } from '../../interfaces/enemy.interface'
import { InventoryItem } from '../../interfaces/item.interface'
import { Zone } from '../../interfaces/zone.interface'
import { DamageElement } from '../../enums/damage-element.enum'
import { EnemyID } from '../../enums/ids/enemy-id.enum'
import { QuestID } from '../../enums/ids/quest-id.enum'
import ENEMIES_DATA from '../../data/enemies-data'
import { waveMultipliers } from '../store/battle/wave-scaling'
import { killReward, Rng, rollEnemyDrops } from '../store/player/kill-rewards'
import type { PlayerStatsType } from '../store/player/stats'
import { HitInput, resolveHit } from './hit-resolution'
import { rankBonus } from '../store/player/bestiary-rank'
import { RESPAWN_DELAY_IN_MS, timePerAttackMs } from './combat-timing'

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
  hasWeaknessSkill: boolean
  activeQuestIds: Set<QuestID>
  /** Enemies with an unfinished Exploration Guild task. */
  taskEnemyIds: Set<EnemyID>
  /** Kills when the claim starts; bestiary rank bonuses stay at these ranks for the whole claim. */
  enemyKillCounts: Partial<Record<EnemyID, number>>
  /** Average ms per recent online kill; caps the rate at what the player really managed. `null` if unknown. */
  rollingKillMs: number | null
  rng: Rng
}

export interface OfflineSimulationResult {
  kills: number
  shinies: number
  killsByEnemy: Partial<Record<EnemyID, number>>
  taskCountsByEnemy: Partial<Record<EnemyID, number>>
  experience: number
  gold: number
  items: InventoryItem[]
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

/** The enemies the wave spawns, each equally likely (the boss wave only spawns its boss). */
export const waveEnemies = (zone: Zone, wave: number): Enemy[] =>
  wave === zone.maxWave ? [ENEMIES_DATA[zone.bossEnemyId]] : zone.enemies.map(id => ENEMIES_DATA[id])

const scaledHp = (enemy: Enemy, zone: Zone, wave: number): number =>
  Math.round(enemy.maxHp * waveMultipliers(zone, wave).hp)

/** Auto-attacks only: no spells are cast offline. */
const autoAttackInput = (stats: PlayerStatsType, enemy: Enemy, input: OfflineSimulationInput): HitInput => ({
  stats,
  magicDamage: 0,
  isDoubleAttack: false,
  isMelee: input.isMeleeWeapon,
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
 * Kills on the wave the player left on until the claimed time runs out, each rolled like an online kill
 * (enemy, shiny, crits, XP, gold, drops, task double counts). The wave never changes.
 * Kill time = online kill time ÷ `offlineProgressRate`, slowed further when the player's recent online kills
 * were slower than their stats say (so swapping in better gear right before closing pays nothing).
 */
export function simulateOfflineKills(input: OfflineSimulationInput): OfflineSimulationResult {
  const result: OfflineSimulationResult = {
    kills: 0, shinies: 0, killsByEnemy: {}, taskCountsByEnemy: {}, experience: 0, gold: 0, items: [],
  }
  if (!input.segments.length) return result

  const { zone, wave, rng } = input
  const enemies = waveEnemies(zone, wave)
  const theoretical = theoreticalKillMs(input.segments[0].stats, input)
  const slowdown = input.rollingKillMs ? Math.max(1, input.rollingKillMs / theoretical) : 1
  const totalMs = input.segments.reduce((sum, s) => sum + s.durationMs, 0)
  const drops = new Map<string, InventoryItem>()

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
    const enemy = enemies[Math.floor(rng() * enemies.length)]
    const isShiny = stats.shinyChance > 0 && rng() * 100 < stats.shinyChance

    let killMs = RESPAWN_DELAY_IN_MS * timeScale
    let hp = scaledHp(enemy, zone, wave)
    const hit = autoAttackInput(stats, enemy, input)
    while (hp > 0 && elapsedMs + killMs <= totalMs) {
      killMs += attackMs
      hp -= resolveHit(hit, rng).damage
    }
    if (hp > 0 || elapsedMs + killMs > totalMs) break
    elapsedMs += killMs

    const reward = killReward(enemy, zone, wave, isShiny, stats)
    result.kills++
    if (isShiny) result.shinies++
    result.experience += reward.experience
    result.gold += reward.gold
    result.killsByEnemy[enemy.id] = (result.killsByEnemy[enemy.id] ?? 0) + 1
    const { dropChance } = rankBonus(enemy.id, input.enemyKillCounts[enemy.id] ?? 0)
    rollEnemyDrops(enemy, reward.dropRolls, isShiny, dropChance, drops, input.activeQuestIds, rng)

    if (input.taskEnemyIds.has(enemy.id)) {
      const counts = rng() * 100 < stats.taskDoubleKillChance ? 2 : 1
      result.taskCountsByEnemy[enemy.id] = (result.taskCountsByEnemy[enemy.id] ?? 0) + counts
    }
  }

  result.items = [...drops.values()]
  return result
}
