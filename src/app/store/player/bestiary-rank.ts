import { EnemyID } from '../../../enums/ids/enemy-id.enum'
import ZONES_DATA from '../../../data/zones-data'

/** Bonus against one enemy at a bestiary rank. Drops only; ranks never change damage. */
export interface RankBonus {
  /** Added to the drop multiplier (0.05: a 1 in 100 drop becomes 1.05 in 100). */
  dropChance: number
  revealsDropOdds: boolean
}

export const MAX_BESTIARY_RANK = 3

/** Indexed by rank (0 = no stars). Placeholder numbers; tune with `npm run sim`. */
export const RANK_BONUSES: RankBonus[] = [
  { dropChance: 0, revealsDropOdds: false },
  { dropChance: 0.05, revealsDropOdds: false },
  { dropChance: 0.1, revealsDropOdds: false },
  { dropChance: 0.15, revealsDropOdds: true },
]

const REGULAR_THRESHOLDS = [100, 1_000, 10_000]
const BOSS_THRESHOLDS = [10, 100, 500]

const BOSS_IDS = new Set(Object.values(ZONES_DATA).map(zone => zone.bossEnemyId))

/** Kills needed for each star, lowest first. Bosses spawn once per boss wave, so they need fewer. */
export const rankThresholds = (enemyId: EnemyID): number[] =>
  BOSS_IDS.has(enemyId) ? BOSS_THRESHOLDS : REGULAR_THRESHOLDS

/** Stars reached (0 to `MAX_BESTIARY_RANK`). Shiny kills share their enemy's id, so they count too. */
/** Read before the kill is counted, so the kill that reaches a star still rolls at the old rank. */
export const bestiaryRank = (enemyId: EnemyID, kills: number): number =>
  rankThresholds(enemyId).filter(threshold => kills >= threshold).length

export const rankBonus = (enemyId: EnemyID, kills: number): RankBonus => RANK_BONUSES[bestiaryRank(enemyId, kills)]
