import { InventoryItem } from '../../../interfaces/item.interface'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { ItemTier } from '../../../enums/items/item-tier.enum'
import ITEM_DATA from '../../../data/items-data'

export type Inventory = (InventoryItem | null)[]

export const DEFAULT_INVENTORY_SLOTS = 40

/** What callers hand in; type and default tier come from ITEM_DATA. */
export interface ItemStack {
  id: ItemID
  amount: number
  tier?: ItemTier
}

export const createInventory = (capacity = DEFAULT_INVENTORY_SLOTS): Inventory => new Array(capacity).fill(null)

/** Grows to `capacity` slots; never shrinks. */
export const resizeInventory = (inventory: Inventory, capacity: number): Inventory =>
  inventory.length >= capacity ? inventory : [...inventory, ...createInventory(capacity - inventory.length)]

const findStackIndex = (inventory: Inventory, id: ItemID, tier: ItemTier): number =>
  inventory.findIndex(slot => slot?.id === id && slot.tier === tier)

export const countItem = (inventory: Inventory, id: ItemID): number =>
  inventory.reduce((sum, slot) => (slot?.id === id ? sum + slot.amount : sum), 0)

export const hasItems = (inventory: Inventory, items: ItemStack[]): boolean =>
  items.every(({ id, amount }) => countItem(inventory, id) >= amount)

/** How many times `items` can be paid in full from the inventory. */
export const maxAffordable = (inventory: Inventory, items: ItemStack[]): number =>
  Math.min(...items.map(({ id, amount }) => Math.floor(countItem(inventory, id) / amount)))

/** Whether `id` can be added without being discarded: it stacks onto an existing stack or takes a free slot. */
export const canFit = (inventory: Inventory, id: ItemID, tier?: ItemTier): boolean =>
  findStackIndex(inventory, id, tier ?? ITEM_DATA[id].tier) !== -1 || inventory.includes(null)

/** Stacks per id + tier. Items that do not fit in `capacity` slots are discarded. */
export function addItems(inventory: Inventory, capacity: number, items: ItemStack[]): Inventory {
  const result = resizeInventory([...inventory], capacity)

  for (const { id, amount, tier } of items) {
    const itemData = ITEM_DATA[id]
    const itemTier = tier ?? itemData.tier
    const stackIndex = findStackIndex(result, id, itemTier)

    if (stackIndex !== -1) {
      const stack = result[stackIndex]!
      result[stackIndex] = { ...stack, amount: stack.amount + amount }
      continue
    }

    const emptyIndex = result.findIndex(slot => slot === null)
    if (emptyIndex !== -1) result[emptyIndex] = { id, type: itemData.type, tier: itemTier, amount }
  }

  return result
}

/** Takes across every stack of an id (any tier); stops at what is owned. */
export function removeItems(inventory: Inventory, items: ItemStack[]): Inventory {
  const result = [...inventory]

  for (const { id, amount, tier } of items) {
    let remaining = amount

    for (let i = 0; i < result.length && remaining > 0; i++) {
      const stack = result[i]
      if (!stack || stack.id !== id || (tier !== undefined && stack.tier !== tier)) continue

      const taken = Math.min(stack.amount, remaining)
      remaining -= taken
      result[i] = taken === stack.amount ? null : { ...stack, amount: stack.amount - taken }
    }
  }

  return result
}
