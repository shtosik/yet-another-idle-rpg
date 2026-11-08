import { Enemy } from '../../../interfaces/enemy.interface'
import { EnemyDrop } from '../../../interfaces/enemy-drop.interface'
import { InventoryItem } from '../../../interfaces/item.interface'
import type { QuestDropLimits } from '../../services/quest-status'
import { Zone } from '../../../interfaces/zone.interface'
import ITEM_DATA from '../../../data/items-data'
import { waveMultipliers } from '../battle/wave-scaling'
import type { PlayerStatsType } from './stats'
import { isSeed, stackKey } from './inventory'
import { ItemType } from '../../../enums/items/item-type.enum'
import { EquipmentSlot } from '../../../enums/equipment-slot.enum'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { EnemyID } from '../../../enums/ids/enemy-id.enum'
import { ZoneID } from '../../../enums/ids/zone-id.enum'
import ENEMIES_DATA from '../../../data/enemies-data'
import { rankBonus } from './bestiary-rank'

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

/** A drop hits with probability (this / `drop.chance`); only seeds get `seedDropChance`. */
export const dropOddsMultiplier = (id: ItemID, dropChanceBonus: number, seedDropChance: number): number =>
  (1 + dropChanceBonus) * (isSeed(id) ? 1 + seedDropChance : 1)

/** Adds each drop that hits to `accumulator`, keyed by id + tier + upgradeLevel. */
export const rollDropList = (
  drops: EnemyDrop[],
  rolls: number,
  dropChanceBonus: number,
  accumulator: Map<string, InventoryItem>,
  questDropLimits?: QuestDropLimits,
  rng: Rng = Math.random,
  upgradedDropChance = 0,
  seedDropChance = 0,
) => {
  for (let r = 0; r < rolls; r++) {
    drops.forEach(drop => {
      const existing = accumulator.get(stackKey({ id: drop.id }))
      let missing = Infinity
      if (drop.requiredActiveQuestId !== undefined) {
        missing = (questDropLimits?.get(drop.requiredActiveQuestId)?.get(drop.id) ?? 0) - (existing?.amount ?? 0)
        if (missing <= 0) return
      }

      if (rng() * drop.chance <= drop.chance - dropOddsMultiplier(drop.id, dropChanceBonus, seedDropChance)) return

      const amount = Math.min(missing, Math.floor(rng() * (drop.maxAmount - drop.minAmount + 1) + drop.minAmount))
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
  questDropLimits?: QuestDropLimits,
  rng: Rng = Math.random,
  upgradedDropChance = 0,
  seedDropChance = 0,
) {
  rollDropList(enemy.drops, rolls, dropChanceBonus, accumulator, questDropLimits, rng, upgradedDropChance, seedDropChance)
  if (isShiny && enemy.shinyDrops?.length) rollDropList(enemy.shinyDrops, 1, dropChanceBonus, accumulator, questDropLimits, rng, upgradedDropChance, seedDropChance)
}

/** One kill to pay: the enemy, whether it was shiny, and the player's stats at the time. */
export interface Kill {
  enemyId: EnemyID
  isShiny: boolean
  stats: PlayerStatsType
}

/** State read once at the start of a batch: bestiary ranks and quest caps stay fixed for the whole batch. */
export interface KillContext {
  questDropLimits?: QuestDropLimits
  enemyKillCounts: Partial<Record<EnemyID, number>>
  /** Enemies with an unfinished Exploration Guild task. */
  taskEnemyIds: ReadonlySet<EnemyID>
}

/** Totals of one or many kills on one zone wave, applied in one store update (`PlayerStore.applyKillBatch`). */
export interface KillBatch {
  zoneId: ZoneID
  wave: number
  kills: number
  shinies: number
  killsByEnemy: Partial<Record<EnemyID, number>>
  /** Task counts per enemy, Bounty Mark doubles included; capped at each task's target when applied. */
  taskCountsByEnemy: Partial<Record<EnemyID, number>>
  experience: number
  gold: number
  items: InventoryItem[]
}

export const emptyKillBatch = (zoneId: ZoneID, wave: number): KillBatch => ({
  zoneId, wave, kills: 0, shinies: 0, killsByEnemy: {}, taskCountsByEnemy: {}, experience: 0, gold: 0, items: [],
})

/** One kill: XP, gold, drops (bestiary rank bonus included) and its task count (Bounty Mark may double it). */
export function rollKill(enemy: Enemy, zone: Zone, wave: number, isShiny: boolean, stats: PlayerStatsType, ctx: KillContext, rng: Rng): KillBatch {
  const reward = killReward(enemy, zone, wave, isShiny, stats)
  const drops = new Map<string, InventoryItem>()
  const { dropChance } = rankBonus(enemy.id, ctx.enemyKillCounts[enemy.id] ?? 0)
  rollEnemyDrops(enemy, reward.dropRolls, isShiny, dropChance, drops, ctx.questDropLimits, rng, stats.upgradedDropChance, stats.seedDropChance)

  const batch = emptyKillBatch(zone.id, wave)
  batch.kills = 1
  batch.shinies = isShiny ? 1 : 0
  batch.killsByEnemy[enemy.id] = 1
  batch.experience = reward.experience
  batch.gold = reward.gold
  batch.items = [...drops.values()]
  if (ctx.taskEnemyIds.has(enemy.id)) batch.taskCountsByEnemy[enemy.id] = rng() * 100 < stats.taskDoubleKillChance ? 2 : 1
  return batch
}

const addCounts = <K extends number>(into: Partial<Record<K, number>>, from: Partial<Record<K, number>>) => {
  for (const [key, count] of Object.entries(from) as [string, number][]) {
    const id = Number(key) as K
    into[id] = (into[id] ?? 0) + count
  }
}

/** Adds `kill` into `into` (mutated), merging drops by id + tier + upgradeLevel. */
export function mergeKillBatch(into: KillBatch, kill: KillBatch): void {
  into.kills += kill.kills
  into.shinies += kill.shinies
  into.experience += kill.experience
  into.gold += kill.gold
  addCounts(into.killsByEnemy, kill.killsByEnemy)
  addCounts(into.taskCountsByEnemy, kill.taskCountsByEnemy)
  for (const item of kill.items) {
    const existing = into.items.find(stack => stackKey(stack) === stackKey(item))
    if (existing) existing.amount += item.amount
    else into.items.push({ ...item })
  }
}

/** Quest caps minus what the batch has rolled so far, so a batch caps like the same kills one by one. */
export function remainingDropLimits(limits: QuestDropLimits | undefined, items: InventoryItem[]): QuestDropLimits | undefined {
  if (!limits?.size || !items.length) return limits
  const rolled = (id: ItemID) => items.filter(item => item.id === id).reduce((sum, item) => sum + item.amount, 0)
  return new Map([...limits].map(([questId, perItem]) =>
    [questId, new Map([...perItem].map(([id, missing]) => [id, Math.max(0, missing - rolled(id))]))]))
}

/** Rolls every kill in order with one rng and sums them. Same result as rolling and applying them one by one. */
export function rollKills(zone: Zone, wave: number, kills: Kill[], ctx: KillContext, rng: Rng): KillBatch {
  const batch = emptyKillBatch(zone.id, wave)
  for (const { enemyId, isShiny, stats } of kills) {
    const kill = rollKill(ENEMIES_DATA[enemyId], zone, wave, isShiny, stats, { ...ctx, questDropLimits: remainingDropLimits(ctx.questDropLimits, batch.items) }, rng)
    mergeKillBatch(batch, kill)
  }
  return batch
}
