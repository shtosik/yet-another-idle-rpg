import type { PlayerStatsType } from '../store/player/stats'

export const TICK_DURATION_IN_MS = 100
/** Time between an enemy's death and the next spawn. */
export const RESPAWN_DELAY_IN_MS = 2000
export const MS_PER_SECOND = 1000

/** `attackSpeed` is seconds per attack; an attack never takes less than one tick. */
export const timePerAttackMs = (stats: PlayerStatsType): number =>
  Math.max(TICK_DURATION_IN_MS, stats.attackSpeed * MS_PER_SECOND)
