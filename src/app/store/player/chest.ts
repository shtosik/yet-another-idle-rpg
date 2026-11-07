import { ChestItem } from '../../../interfaces/item.interface'
import { isSeed, ItemStack, stackKey } from './inventory'

export interface ChestContents {
  gold: number
  items: ItemStack[]
}

const between = ([min, max]: [number, number], rng: () => number) => min + Math.floor(rng() * (max - min + 1))

/**
 * Weighted picks plus an optional guarded bonus; callers keep the entire result when it cannot fit.
 * `seedDropChance` scales seed weights, so a seed pick's share rises slightly less than (1 + x).
 */
export function rollChest(chest: ChestItem, rng: () => number = Math.random, bonusEligible = false, seedDropChance = 0): ChestContents {
  const weights = chest.loot.map(entry => entry.weight * ('itemId' in entry && isSeed(entry.itemId) ? 1 + seedDropChance : 1))
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  const contents: ChestContents = { gold: 0, items: [] }

  for (let roll = 0; roll < chest.rolls; roll++) {
    let pick = rng() * totalWeight
    const entry = chest.loot.find((_, index) => (pick -= weights[index]) < 0) ?? chest.loot[chest.loot.length - 1]
    if ('gold' in entry) {
      contents.gold += between(entry.gold, rng)
      continue
    }
    const amount = between(entry.amount, rng)
    const key = stackKey({ id: entry.itemId })
    const stack = contents.items.find(item => stackKey(item) === key)
    if (stack) stack.amount += amount
    else contents.items.push({ id: entry.itemId, amount })
  }
  if (bonusEligible && chest.bonusRoll && rng() < 1 / chest.bonusRoll.chance) {
    const id = chest.bonusRoll.itemId
    const stack = contents.items.find(item => item.id === id)
    if (stack) stack.amount++
    else contents.items.push({ id, amount: 1 })
  }
  return contents
}
