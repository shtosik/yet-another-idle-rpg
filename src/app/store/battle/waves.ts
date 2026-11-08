import { Enemy } from '../../../interfaces/enemy.interface'
import { Zone } from '../../../interfaces/zone.interface'
import { ZoneID } from '../../../enums/ids/zone-id.enum'
import ENEMIES_DATA from '../../../data/enemies-data'
import ZONES_DATA from '../../../data/zones-data'
import { waveMultipliers } from './wave-scaling'

/** Wave rules shared by online play and the offline claim: what a wave spawns, the kills it needs, and where a move leads. */

export interface WavePosition {
  zoneId: ZoneID
  wave: number
}

export interface WaveSpawn {
  enemy: Enemy
  isShiny: boolean
  /** Wave-scaled. */
  maxHp: number
}

/** The enemies the wave spawns, each equally likely (the boss wave only spawns its boss). */
export const waveEnemies = (zone: Zone, wave: number): Enemy[] =>
  wave === zone.maxWave ? [ENEMIES_DATA[zone.bossEnemyId]] : zone.enemies.map(id => ENEMIES_DATA[id])

export const scaledHp = (enemy: Enemy, zone: Zone, wave: number): number =>
  Math.round(enemy.maxHp * waveMultipliers(zone, wave).hp)

/** Kills on the wave before the player may move on: the boss wave needs its boss. */
export const requiredKills = (zone: Zone, wave: number): number => wave === zone.maxWave ? 1 : zone.enemiesPerWave

/** Picks the enemy, then rolls shiny (`shinyChance` in percent), in that order online and offline. */
export function rollSpawn(zone: Zone, wave: number, shinyChance: number, rng: () => number): WaveSpawn {
  const enemies = waveEnemies(zone, wave)
  const enemy = enemies[Math.floor(rng() * enemies.length)]
  const isShiny = shinyChance > 0 && rng() * 100 < shinyChance
  return { enemy, isShiny, maxHp: scaledHp(enemy, zone, wave) }
}

/**
 * Where moving forward leads, or null when it isn't allowed: a regular wave needs `enemiesPerWave` kills; from the last
 * wave the move goes to the next zone's wave 1, once that zone is unlocked.
 */
export function nextWave(zone: Zone, wave: number, killsOnWave: number, isZoneUnlocked: (id: ZoneID) => boolean): WavePosition | null {
  if (wave === zone.maxWave) {
    return zone.nextZoneId !== undefined && isZoneUnlocked(zone.nextZoneId) ? { zoneId: zone.nextZoneId, wave: 1 } : null
  }
  return killsOnWave >= zone.enemiesPerWave ? { zoneId: zone.id, wave: wave + 1 } : null
}

/** Where moving back leads: the previous wave, or the previous zone's last wave from wave 1; null with neither. */
export function previousWave(zone: Zone, wave: number): WavePosition | null {
  if (wave > 1) return { zoneId: zone.id, wave: wave - 1 }
  if (zone.previousZoneId === undefined) return null
  return { zoneId: zone.previousZoneId, wave: ZONES_DATA[zone.previousZoneId].maxWave }
}
