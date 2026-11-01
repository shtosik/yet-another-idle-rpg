import { Enemy } from '../../../interfaces/enemy.interface'
import { EnemyDrop } from '../../../interfaces/enemy-drop.interface'
import { InventoryItem } from '../../../interfaces/item.interface'
import type { QuestDropLimits } from '../../services/quest-status'
import { Zone } from '../../../interfaces/zone.interface'
import ITEM_DATA from '../../../data/items-data'
import { waveMultipliers } from '../battle/wave-scaling'
import type { PlayerStatsType } from './stats'

/** Returns a value in [0, 1). Online kills use `Math.random`; offline claims use a seeded one. */
export type Rng = () => number

/** Adds each drop that hits to `accumulator`, keyed by id + tier. */
export const rollDropList = (
  drops: EnemyDrop[],
  rolls: number,
  dropChanceBonus: number,
  accumulator: Map<string, InventoryItem>,
  questDropLimits?: QuestDropLimits,
  rng: Rng = Math.random,
) => {
  for (let r = 0; r < rolls; r++) {
    drops.forEach(drop => {
      const { type, tier } = ITEM_DATA[drop.id]
      const key = `${drop.id}:${tier}`
      const existing = accumulator.get(key)
      let missing = Infinity
      if (drop.requiredActiveQuestId !== undefined) {
        missing = (questDropLimits?.get(drop.requiredActiveQuestId)?.get(drop.id) ?? 0) - (existing?.amount ?? 0)
        if (missing <= 0) return
      }

      // Hits with probability (1 + bonus) / chance.
      if (rng() * drop.chance <= drop.chance - 1 - dropChanceBonus) return

      const amount = Math.min(missing, Math.floor(rng() * (drop.maxAmount - drop.minAmount + 1) + drop.minAmount))
      if (existing) existing.amount += amount
      else accumulator.set(key, { id: drop.id, type, tier, amount })
    })
  }
}

export interface KillReward {
  experience: number
  gold: number
  /** Drop rolls on the enemy's regular drop list (a shiny rolls it more often, plus its shiny list once). */
  dropRolls: number
}

/** XP, gold and drop rolls for one kill. A shiny pays from the unscaled base, so low waves stay the place to hunt shinies. */
export function killReward(enemy: Enemy, zone: Zone, wave: number, isShiny: boolean, stats: PlayerStatsType): KillReward {
  const { reward: waveReward } = waveMultipliers(zone, wave)
  const xpMultiplier = isShiny ? 5 : waveReward
  const goldMultiplier = isShiny ? 10 : waveReward

  return {
    experience: Math.ceil(enemy.experience * stats.xpMultiplier * xpMultiplier),
    gold: Math.ceil(enemy.gold * stats.goldCoinsMultiplier * goldMultiplier),
    dropRolls: isShiny ? 10 : 1,
  }
}

/** Rolls one kill's drops into `accumulator`. `dropChanceBonus` comes from the bestiary rank (`rankBonus`). */
export function rollEnemyDrops(
  enemy: Enemy,
  rolls: number,
  isShiny: boolean,
  dropChanceBonus: number,
  accumulator: Map<string, InventoryItem>,
  questDropLimits?: QuestDropLimits,
  rng: Rng = Math.random,
) {
  rollDropList(enemy.drops, rolls, dropChanceBonus, accumulator, questDropLimits, rng)
  if (isShiny && enemy.shinyDrops?.length) rollDropList(enemy.shinyDrops, 1, dropChanceBonus, accumulator, questDropLimits, rng)
}
