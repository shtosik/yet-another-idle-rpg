import { EnemyID } from '../../../enums/ids/enemy-id.enum'
import { ZoneID } from '../../../enums/ids/zone-id.enum'
import { Zone } from '../../../interfaces/zone.interface'
import ZONES_DATA from '../../../data/zones-data'
import { bestiaryRank } from './bestiary-rank'
import type { StatModifier } from './stats'

/** The three mastery stars every zone has, in display order. */
export const ZONE_STARS = ['conqueror', 'hunter', 'shiny'] as const
export type ZoneStar = typeof ZONE_STARS[number]

export const BOSS_KILLS_FOR_STAR = 10
export const SHINY_KILLS_FOR_STAR = 10
/** Gold multiplier per zone with all three stars claimed. */
export const FULL_MASTERY_GOLD_BONUS = 0.02

export interface ZoneStarProgress {
  star: ZoneStar
  current: number
  target: number
  done: boolean
  claimed: boolean
}

/** What zone mastery is derived from; only `shinyKillsByZone` and `claimedZoneStars` are its own saved state. */
export interface ZoneMasteryState {
  enemyKillCounts: Partial<Record<EnemyID, number>>
  shinyKillsByZone: Partial<Record<ZoneID, number>>
  claimedZoneStars: Partial<Record<ZoneID, ZoneStar[]>>
}

/** `counts` with `amount` more shiny kills in `zoneId`; the same object when `amount` is 0. */
export function addShinyKills(counts: ZoneMasteryState['shinyKillsByZone'], zoneId: ZoneID, amount: number): ZoneMasteryState['shinyKillsByZone'] {
  return amount ? { ...counts, [zoneId]: (counts[zoneId] ?? 0) + amount } : counts
}

const zoneEnemies = (zone: Zone): EnemyID[] => [...zone.enemies, zone.bossEnemyId]

function starCount(star: ZoneStar, zone: Zone, state: ZoneMasteryState): { current: number, target: number } {
  const kills = state.enemyKillCounts
  switch (star) {
    case 'conqueror':
      return { current: kills[zone.bossEnemyId] ?? 0, target: BOSS_KILLS_FOR_STAR }
    case 'hunter': {
      const enemies = zoneEnemies(zone)
      return { current: enemies.filter(id => bestiaryRank(id, kills[id] ?? 0) >= 1).length, target: enemies.length }
    }
    case 'shiny':
      return { current: state.shinyKillsByZone[zone.id] ?? 0, target: SHINY_KILLS_FOR_STAR }
  }
}

export function zoneStarProgress(zoneId: ZoneID, state: ZoneMasteryState): ZoneStarProgress[] {
  const zone = ZONES_DATA[zoneId]
  const claimed = state.claimedZoneStars[zoneId] ?? []
  return ZONE_STARS.map(star => {
    const { current, target } = starCount(star, zone, state)
    return { star, current: Math.min(current, target), target, done: current >= target, claimed: claimed.includes(star) }
  })
}

/** +2% gold per zone with every star claimed, derived from the claims (ADR 0002). */
export function masteryModifiers(claimedZoneStars: ZoneMasteryState['claimedZoneStars']): StatModifier[] {
  const mastered = Object.values(claimedZoneStars).filter(stars => stars?.length === ZONE_STARS.length).length
  return mastered ? [{ stat: 'goldCoinsMultiplier', amount: mastered * FULL_MASTERY_GOLD_BONUS }] : []
}
