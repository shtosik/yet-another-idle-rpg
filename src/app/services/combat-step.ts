import type { PlayerStatsType } from '../store/player/stats'

export const TICK_DURATION_IN_MS = 100
/** Time between an enemy's death and the next spawn. */
export const RESPAWN_DELAY_IN_MS = 2000
export const MS_PER_SECOND = 1000
/** Caps catch-up attacks in one tick, so a near-zero attack speed can't stall the loop. */
export const MAX_ATTACKS_PER_TICK = 10

/** `attackSpeed` is seconds per attack; an attack never takes less than one tick. */
export const timePerAttackMs = (stats: PlayerStatsType): number =>
  Math.max(TICK_DURATION_IN_MS, stats.attackSpeed * MS_PER_SECOND)

export interface CombatTimers {
  attackTimer: number
  respawnTimer: number
}

export interface CombatStepContext {
  inCombat: boolean
  respawnDelayMs: number
  timePerAttackMs: number
  /** Starts the next battle. */
  spawn: () => void
  /** Performs one attack; returns true when it killed the enemy. */
  attack: () => boolean
}

/**
 * Online combat for one tick: respawn after `respawnDelayMs`, then one attack per `timePerAttackMs`,
 * carrying leftover time. A kill drops leftover attack time; at most `MAX_ATTACKS_PER_TICK` attacks.
 * `spawn` and `attack` are the seam to the stores.
 */
export function stepCombat(timers: CombatTimers, deltaMs: number, ctx: CombatStepContext): CombatTimers {
  let { attackTimer, respawnTimer } = timers
  let remainingMs = deltaMs

  if (!ctx.inCombat) {
    respawnTimer += remainingMs
    if (respawnTimer < ctx.respawnDelayMs) return { attackTimer, respawnTimer }

    remainingMs = respawnTimer - ctx.respawnDelayMs
    respawnTimer = 0
    attackTimer = 0
    ctx.spawn()
  }

  attackTimer += remainingMs
  for (let attacks = 0; attackTimer >= ctx.timePerAttackMs; attacks++) {
    if (attacks === MAX_ATTACKS_PER_TICK) return { attackTimer: ctx.timePerAttackMs, respawnTimer }

    attackTimer -= ctx.timePerAttackMs
    if (ctx.attack()) return { attackTimer: 0, respawnTimer }
  }
  return { attackTimer, respawnTimer }
}
