import { Enemy } from '../../../interfaces/enemy.interface'
import { EnemyDrop } from '../../../interfaces/enemy-drop.interface'
import { InventoryItem } from '../../../interfaces/item.interface'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { Zone } from '../../../interfaces/zone.interface'
import ITEM_DATA from '../../../data/items-data'
import { waveMultipliers } from '../battle/wave-scaling'
import type { PlayerStatsType } from './stats'
import { stackKey } from './inventory'
import { ItemType } from '../../../enums/items/item-type.enum'
import { EquipmentSlot } from '../../../enums/equipment-slot.enum'
import { ItemID } from '../../../enums/ids/item-id.enum'

/** Returns a value in [0, 1). Online kills use `Math.random`; offline claims use a seeded one. */
export type Rng = () => number

/** Each eligible copy gets its own upgrade roll, keeping +0 and +1 copies in separate stacks. */
function addRolledDrop(id: ItemID, amount: number, accumulator: Map<string, InventoryItem>, upgradedDropChance: number, rng: Rng) {
  const item = ITEM_DATA[id]
  const canUpgrade = upgradedDropChance > 0 && item.type === ItemType.equipment && item.slot !== EquipmentSlot.pet && !item.unique
  const add = (count: number, upgradeLevel?: number) => {
    if (count === 0) return
    const stack: InventoryItem = { id, type: item.type, tier: item.tier, amount: count, ...(upgradeLevel === undefined ? {} : { upgradeLevel }) }
    const key = stackKey(stack)
    const existing = accumulator.get(key)
    if (existing) existing.amount += count
    else accumulator.set(key, stack)
  }
  if (!canUpgrade) {
    add(amount)
    return
  }
  let upgraded = 0
  for (let copy = 0; copy < amount; copy++) {
    if (rng() * 100 < upgradedDropChance) upgraded++
  }
  add(amount - upgraded)
  add(upgraded, 1)
}

/** Adds each drop that hits to `accumulator`, keyed by id + tier + upgradeLevel. */
export const rollDropList = (
  drops: EnemyDrop[],
  rolls: number,
  dropChanceBonus: number,
  accumulator: Map<string, InventoryItem>,
  activeQuestIds?: Set<QuestID>,
  rng: Rng = Math.random,
  upgradedDropChance = 0,
) => {
  for (let r = 0; r < rolls; r++) {
    drops.forEach(drop => {
      if (drop.requiredActiveQuestId !== undefined && !activeQuestIds?.has(drop.requiredActiveQuestId)) return

      // Hits with probability (1 + bonus) / chance.
      if (rng() * drop.chance <= drop.chance - 1 - dropChanceBonus) return

      const amount = Math.floor(rng() * (drop.maxAmount - drop.minAmount + 1) + drop.minAmount)
      addRolledDrop(drop.id, amount, accumulator, upgradedDropChance, rng)
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
  activeQuestIds?: Set<QuestID>,
  rng: Rng = Math.random,
  upgradedDropChance = 0,
) {
  rollDropList(enemy.drops, rolls, dropChanceBonus, accumulator, activeQuestIds, rng, upgradedDropChance)
  if (isShiny && enemy.shinyDrops?.length) rollDropList(enemy.shinyDrops, 1, dropChanceBonus, accumulator, activeQuestIds, rng, upgradedDropChance)
}
