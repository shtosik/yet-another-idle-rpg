import { PlayerStat } from '../../../types/player/player-stat.type'
import { EquipmentItem, isConsumableItem } from '../../../interfaces/item.interface'
import { EquipmentType } from '../../../interfaces/player/equipment.type'
import { UnlockedNodes } from '../../../types/player/unlocked-nodes.type'
import { SkillNodeID } from '../../../enums/ids/skill-node-id.enum'
import { SkillNodeType } from '../../../enums/skill-node-type.enum'
import { ActiveBuff } from '../../../interfaces/spells/equipped-spell.interface'
import { ActiveConsumable, ConsumableSlot } from '../../../interfaces/consumable.interface'
import { SpellBuffEffectProps } from '../../../interfaces/spell.interface'
import { ALL_SKILLS } from '../../../data/skill-tree-data'
import ITEM_DATA from '../../../data/items-data'
import SPELLS_DATA from '../../../data/spells-data'
import { statsInitialState } from './player'
import { ItemType } from '../../../enums/items/item-type.enum'
import { SpellID } from '../../../enums/ids/spell-id.enum'
import { ItemID } from '../../../enums/ids/item-id.enum'
import type { InventoryTab } from './inventory'

export type PlayerStatsType = Record<PlayerStat, number>

/** Stats the player earns and spends. Saved as-is; every other stat is derived from its sources. */
export const RESOURCE_STATS = ['experience', 'level', 'unspentSkillPoints', 'goldCoins', 'mana', 'currentShopRefreshCooldown'] as const
export type ResourceStat = typeof RESOURCE_STATS[number]
export type Resources = Record<ResourceStat, number>

export interface StatModifier {
  stat: PlayerStat
  amount: number
  /** `amount` is a fraction of the stat after every flat modifier (0.2 = 20% better), not a flat value. */
  percent?: boolean
  /** `inventorySlots` only: the one tab it grows; without it, every slot tab (`inventoryCapacity`). */
  tab?: InventoryTab
}

/** Positive amounts lower these stats: lower is better (seconds per attack, ms per mana, ms per refresh). */
const INVERTED_STATS = new Set<PlayerStat>(['attackSpeed', 'manaRegenRate', 'shopRefreshCooldown'])

export const isInvertedStat = (stat: PlayerStat): boolean => INVERTED_STATS.has(stat)

/** Where a stat modifier comes from; the stats panel breaks each stat down by these. */
export type StatSource = 'equipment' | 'skills' | 'buffs' | 'consumables' | 'bonuses' | 'mastery'
export type SourcedModifiers = Record<StatSource, StatModifier[]>

export interface StatContribution {
  source: StatSource
  /** Sum of the source's flat amounts, as written in data (positive = better, also for inverted stats). */
  flat: number
  /** Sum of the source's percent amounts (0.1 = 10% better). */
  percent: number
}

/** What each source adds to `stat`, in `SourcedModifiers` key order; sources adding nothing are left out. */
export function statContributions(stat: PlayerStat, sources: SourcedModifiers): StatContribution[] {
  return (Object.entries(sources) as [StatSource, StatModifier[]][]).flatMap(([source, modifiers]) => {
    let flat = 0
    let percent = 0
    for (const modifier of modifiers) {
      if (modifier.stat !== stat) continue
      if (modifier.percent) percent += modifier.amount
      else flat += modifier.amount
    }
    if (!flat && !percent) return []
    return [{ source, flat: round(flat), percent: round(percent) }]
  })
}

const round = (value: number): number => Math.round(value * STAT_PRECISION) / STAT_PRECISION

/** Rounds away float drift from summing fractional modifiers (2.7000000000000006 -> 2.7). */
const STAT_PRECISION = 1e6

export const isResourceStat = (stat: PlayerStat): stat is ResourceStat =>
  (RESOURCE_STATS as readonly PlayerStat[]).includes(stat)

export const initialResources = (): Resources =>
  Object.fromEntries(RESOURCE_STATS.map(stat => [stat, statsInitialState[stat]])) as Resources

export const equipmentModifiers = (equipment: EquipmentType): StatModifier[] =>
  Object.values(equipment).flatMap(equipped =>
    equipped ? ((ITEM_DATA[equipped.id] as EquipmentItem).stats ?? []).map(s => ({ stat: s.id, amount: s.amount })) : [],
  )

export const skillNodeModifiers = (unlockedNodes: UnlockedNodes): StatModifier[] =>
  Object.entries(unlockedNodes).flatMap(([id, level]) => {
    const node = ALL_SKILLS[Number(id) as SkillNodeID]
    return level && node?.type === SkillNodeType.stat
      ? [{ stat: node.stat, amount: node.statAmount * level, percent: node.statPercent, tab: node.tab }]
      : []
  })

/** Spells whose buff is running. Pass through `sameIds` so a countdown alone doesn't recompute stats. */
export const activeBuffSpellIds = (activeBuffs: ActiveBuff[]): SpellID[] => activeBuffs.map(b => b.spellId)

/** Consumables whose effect is running (the slot lock alone grants nothing). */
export const activeConsumableItemIds = (slots: Record<ConsumableSlot, ActiveConsumable | null>): ItemID[] =>
  Object.values(slots).flatMap(active => active && active.effectRemaining > 0 ? [active.itemId] : [])

export const sameIds = <T>(a: T[], b: T[]): boolean => a.length === b.length && a.every((id, i) => id === b[i])

export const buffModifiers = (spellIds: SpellID[]): StatModifier[] =>
  spellIds.map(spellId => {
    const { stat, amount, percent } = SPELLS_DATA[spellId].effect as SpellBuffEffectProps
    return { stat, amount, percent }
  })

/** Food stats count `foodMultiplier` times (`foodEffectMultiplier`); potions are not scaled. */
export const consumableModifiers = (itemIds: ItemID[], foodMultiplier = 1): StatModifier[] =>
  itemIds.flatMap(itemId => {
    const itemData = ITEM_DATA[itemId]
    if (!isConsumableItem(itemData)) return []
    const scale = itemData.type === ItemType.food ? foodMultiplier : 1
    return (itemData.effect.stats ?? []).map(m => ({ ...m, amount: m.amount * scale }))
  })

/** `foodEffectMultiplier` from these modifiers, read before the food it scales (only gear gives it). */
export const foodMultiplierOf = (modifiers: StatModifier[]): number =>
  modifiers
    .filter(m => m.stat === 'foodEffectMultiplier')
    .reduce((total, m) => total + m.amount, statsInitialState.foodEffectMultiplier)

export const bonusModifiers = (bonuses: Partial<Record<PlayerStat, number>>): StatModifier[] =>
  (Object.entries(bonuses) as [PlayerStat, number][]).map(([stat, amount]) => ({ stat, amount }))

/** Base stats plus every modifier, with saved resources on top. Mana never shows above `maxMana`. */
export function deriveStats(resources: Resources, modifiers: StatModifier[]): PlayerStatsType {
  const stats: PlayerStatsType = { ...statsInitialState }

  // A tab-keyed modifier counts only in that tab's capacity, so `inventorySlots` stays what every slot tab gets.
  for (const { stat, amount, percent, tab } of modifiers) {
    if (isResourceStat(stat) || percent || tab) continue
    stats[stat] += INVERTED_STATS.has(stat) ? -amount : amount
  }
  // Percentages apply after flat modifiers, so they keep the same strength as gear improves.
  for (const { stat, amount, percent, tab } of modifiers) {
    if (isResourceStat(stat) || !percent || tab) continue
    stats[stat] *= INVERTED_STATS.has(stat) ? 1 - amount : 1 + amount
  }
  for (const stat of Object.keys(stats) as PlayerStat[]) {
    stats[stat] = round(stats[stat])
  }

  Object.assign(stats, resources)
  stats.mana = Math.min(stats.mana, stats.maxMana)
  return stats
}
