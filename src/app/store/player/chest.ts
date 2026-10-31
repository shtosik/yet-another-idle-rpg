import { ChestItem } from '../../../interfaces/item.interface'
import { ItemStack } from './inventory'

export interface ChestContents {
  gold: number
  items: ItemStack[]
}

const between = ([min, max]: [number, number], rng: () => number) => min + Math.floor(rng() * (max - min + 1))

/** `chest.rolls` weighted picks from its loot table; the same item rolled twice lands as one stack. */
export function rollChest(chest: ChestItem, rng: () => number = Math.random): ChestContents {
  const totalWeight = chest.loot.reduce((sum, entry) => sum + entry.weight, 0)
  const contents: ChestContents = { gold: 0, items: [] }

  for (let roll = 0; roll < chest.rolls; roll++) {
    let pick = rng() * totalWeight
    const entry = chest.loot.find(e => (pick -= e.weight) < 0) ?? chest.loot[chest.loot.length - 1]
    if ('gold' in entry) {
      contents.gold += between(entry.gold, rng)
      continue
    }
    const amount = between(entry.amount, rng)
    const stack = contents.items.find(item => item.id === entry.itemId)
    if (stack) stack.amount += amount
    else contents.items.push({ id: entry.itemId, amount })
  }
  return contents
}
