import { EquipmentItem, InventoryItem } from '../../../interfaces/item.interface'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { ItemTier } from '../../../enums/items/item-tier.enum'
import { ItemType } from '../../../enums/items/item-type.enum'
import { EquipmentSlot } from '../../../enums/equipment-slot.enum'
import ITEM_DATA from '../../../data/items-data'
import { statsInitialState } from './player'
import type { StatModifier } from './stats'

/** One tab's slots. Never shrinks: slots past the tab's capacity are locked (their items can still be taken out). */
export type Inventory = (InventoryItem | null)[]

/** Each tab has its own slots and capacity (docs/ideas/inventory-tabs.md). */
export const INVENTORY_TABS = ['gear', 'consumables', 'materials', 'pets', 'quest'] as const
export type InventoryTab = typeof INVENTORY_TABS[number]

/** Tabs sized by the `inventorySlots` stat. Pets get one slot per pet species and Quest is unlimited, so neither fills. */
export const SLOT_TABS = ['gear', 'consumables', 'materials'] as const satisfies readonly InventoryTab[]
export type SlotTab = typeof SLOT_TABS[number]

export type Inventories = Record<InventoryTab, Inventory>
export type TabCapacity = Record<InventoryTab, number>
/** Change to each tab's capacity; a missing tab doesn't change. */
export type SlotDeltas = Partial<Record<SlotTab, number>>

/** What callers hand in; type and default tier come from ITEM_DATA. */
export interface ItemStack {
  id: ItemID
  amount: number
  tier?: ItemTier
}

/** The tab an item is stored in. */
export function tabOf(id: ItemID): InventoryTab {
  const item = ITEM_DATA[id]
  switch (item.type) {
    case ItemType.equipment:
      return (item as EquipmentItem).slot === EquipmentSlot.pet ? 'pets' : 'gear'
    case ItemType.resource:
      return 'materials'
    case ItemType.quest:
      return 'quest'
    case ItemType.food:
    case ItemType.potion:
    case ItemType.recipe:
    case ItemType.spellScroll:
    case ItemType.book:
    case ItemType.rewardsStats:
    case ItemType.chest:
    // Station gear installs on pickup; only an upgrade that arrived out of order is kept, to be installed later.
    case ItemType.stationUpgrade:
      return 'consumables'
  }
}

const PET_SPECIES = (Object.keys(ITEM_DATA).map(Number) as ItemID[]).filter(id => tabOf(id) === 'pets').length

const BASE_CAPACITY: TabCapacity = {
  gear: statsInitialState.inventorySlots,
  consumables: statsInitialState.inventorySlots,
  materials: statsInitialState.inventorySlots,
  pets: PET_SPECIES,
  quest: Infinity,
}

/**
 * Each tab's capacity change from `gained` minus `lost` modifiers. `inventorySlots` is one stat keyed by tab:
 * a modifier with a `tab` grows that tab only, one without grows every slot tab.
 * shortcut: percent `inventorySlots` modifiers are ignored (none exist); handle them here if one is added.
 */
export function slotDeltas(gained: StatModifier[], lost: StatModifier[] = []): SlotDeltas {
  const deltas: SlotDeltas = {}
  const apply = (modifiers: StatModifier[], sign: number) => {
    for (const { stat, amount, percent, tab } of modifiers) {
      if (stat !== 'inventorySlots' || percent) continue
      for (const slotTab of tab ? [tab] : SLOT_TABS) deltas[slotTab] = (deltas[slotTab] ?? 0) + sign * amount
    }
  }
  apply(gained, 1)
  apply(lost, -1)
  return deltas
}

export function withSlotDeltas(capacity: TabCapacity, deltas: SlotDeltas): TabCapacity {
  const result = { ...capacity }
  for (const tab of SLOT_TABS) result[tab] += deltas[tab] ?? 0
  return result
}

/** Every tab's capacity: the base plus the `inventorySlots` modifiers. */
export const inventoryCapacity = (modifiers: StatModifier[]): TabCapacity => withSlotDeltas(BASE_CAPACITY, slotDeltas(modifiers))

const createInventory = (capacity: number): Inventory => Number.isFinite(capacity) ? new Array(capacity).fill(null) : []

export const createInventories = (): Inventories =>
  Object.fromEntries(INVENTORY_TABS.map(tab => [tab, createInventory(BASE_CAPACITY[tab])])) as Inventories

/** Grows a tab to `capacity` slots; never shrinks. An unlimited tab grows as items arrive instead. */
const resizeTab = (inventory: Inventory, capacity: number): Inventory =>
  inventory.length >= capacity || !Number.isFinite(capacity) ? inventory : [...inventory, ...createInventory(capacity - inventory.length)]

/** Grows every tab to its capacity; the same object when nothing grew. */
export function resizeInventory(inventories: Inventories, capacity: TabCapacity): Inventories {
  let result = inventories
  for (const tab of INVENTORY_TABS) {
    const resized = resizeTab(inventories[tab], capacity[tab])
    if (resized !== inventories[tab]) result = { ...result, [tab]: resized }
  }
  return result
}

/** Items grouped by their tab, in the order given. */
function byTab<T extends ItemStack>(items: T[]): Partial<Record<InventoryTab, T[]>> {
  const groups: Partial<Record<InventoryTab, T[]>> = {}
  for (const item of items) (groups[tabOf(item.id)] ??= []).push(item)
  return groups
}

const tabEntries = <T>(groups: Partial<Record<InventoryTab, T>>) => Object.entries(groups) as [InventoryTab, T][]

/**
 * Splits a save's flat inventory (save version 1) into tabs, in slot order. Never drops an item: a tab with more
 * items than its capacity keeps them past capacity, in locked slots, until they are taken out.
 */
export function splitInventory(flat: Inventory): Inventories {
  const result = Object.fromEntries(INVENTORY_TABS.map(tab => [tab, [] as Inventory])) as Inventories
  for (const slot of flat) if (slot) result[tabOf(slot.id)].push(slot)
  return result
}

const findStackIndex = (inventory: Inventory, id: ItemID, tier: ItemTier): number =>
  inventory.findIndex(slot => slot?.id === id && slot.tier === tier)

export const countItem = (inventories: Inventories, id: ItemID): number =>
  inventories[tabOf(id)].reduce((sum, slot) => (slot?.id === id ? sum + slot.amount : sum), 0)

export const hasItems = (inventories: Inventories, items: ItemStack[]): boolean =>
  items.every(({ id, amount }) => countItem(inventories, id) >= amount)

/** How many times `items` can be paid in full from the inventory. */
export const maxAffordable = (inventories: Inventories, items: ItemStack[]): number =>
  Math.min(...items.map(({ id, amount }) => Math.floor(countItem(inventories, id) / amount)))

function addToTab(inventory: Inventory, capacity: number, items: ItemStack[]): Inventory {
  const result = resizeTab([...inventory], capacity)

  for (const { id, amount, tier } of items) {
    const itemData = ITEM_DATA[id]
    const itemTier = tier ?? itemData.tier
    // The array never shrinks, so slots past `capacity` are locked and must stay untouched.
    const usable = result.slice(0, capacity)
    const stackIndex = findStackIndex(usable, id, itemTier)

    if (stackIndex !== -1) {
      const stack = result[stackIndex]!
      result[stackIndex] = { ...stack, amount: stack.amount + amount }
      continue
    }

    const newStack = { id, type: itemData.type, tier: itemTier, amount }
    const emptyIndex = usable.findIndex(slot => slot === null)
    if (emptyIndex !== -1) result[emptyIndex] = newStack
    else if (result.length < capacity) result.push(newStack)
  }

  return result
}

/** Stacks per id + tier, each in its own tab. Only a tab's first `capacity` slots are used; items that do not fit are discarded. */
export function addItems(inventories: Inventories, capacity: TabCapacity, items: ItemStack[]): Inventories {
  const result = { ...inventories }
  for (const [tab, stacks] of tabEntries(byTab(items))) result[tab] = addToTab(result[tab], capacity[tab], stacks)
  return result
}

function removeFromTab(inventory: Inventory, items: ItemStack[]): Inventory {
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

/** Takes across every stack of an id (any tier); stops at what is owned. */
export function removeItems(inventories: Inventories, items: ItemStack[]): Inventories {
  const result = { ...inventories }
  for (const [tab, stacks] of tabEntries(byTab(items))) result[tab] = removeFromTab(result[tab], stacks)
  return result
}

/** Empty usable slots of one tab; Infinity for an unlimited tab. */
export const countFreeSlots = (inventory: Inventory, capacity: number): number =>
  Number.isFinite(capacity)
    ? inventory.slice(0, capacity).filter(slot => slot === null).length + Math.max(0, capacity - inventory.length)
    : Infinity

/** Per tab: slots still to free before `adding` fits, once `removing` has been taken out first. Tabs that fit are left out. */
function missingSlotsByTab(inventories: Inventories, capacity: TabCapacity, adding: ItemStack[], removing: ItemStack[] = []): Partial<Record<InventoryTab, number>> {
  const after = removeItems(inventories, removing)
  const missing: Partial<Record<InventoryTab, number>> = {}

  for (const [tab, stacks] of tabEntries(byTab(adding))) {
    const usable = after[tab].slice(0, capacity[tab])
    const newStacks = new Set<string>()
    for (const { id, tier } of stacks) {
      const itemTier = tier ?? ITEM_DATA[id].tier
      if (findStackIndex(usable, id, itemTier) === -1) newStacks.add(`${id}:${itemTier}`)
    }
    const short = newStacks.size - countFreeSlots(after[tab], capacity[tab])
    if (short > 0) missing[tab] = short
  }

  return missing
}

/** Slots still to free, over all tabs, before `adding` fits once `removing` has been taken out first. */
export const missingSlots = (inventories: Inventories, capacity: TabCapacity, adding: ItemStack[], removing: ItemStack[] = []): number =>
  Object.values(missingSlotsByTab(inventories, capacity, adding, removing)).reduce((sum, n) => sum + n, 0)

/** True when `adding` fits, each item in its tab, once `removing` has been taken out first. */
export const canFit = (inventories: Inventories, capacity: TabCapacity, adding: ItemStack[], removing: ItemStack[] = []): boolean =>
  missingSlots(inventories, capacity, adding, removing) === 0

/** True when no tab has an item at or beyond its capacity. */
export const fitsCapacity = (inventories: Inventories, capacity: TabCapacity): boolean =>
  INVENTORY_TABS.every(tab => inventories[tab].every((slot, i) => slot === null || i < capacity[tab]))

/** A Page is a 40-slot view of one tab. */
export const INVENTORY_PAGE_SIZE = 40

export const pageCount = (slots: number): number => Math.max(1, Math.ceil(slots / INVENTORY_PAGE_SIZE))

/** What of `items` would not fit when added, per id + tier (one entry each, as rolled drops are). Tab per `tabOf`. */
export function lostItems(inventories: Inventories, capacity: TabCapacity, items: ItemStack[]): ItemStack[] {
  const after = addItems(inventories, capacity, items)
  const owned = (inventory: Inventories, id: ItemID, tier: ItemTier) =>
    inventory[tabOf(id)].reduce((sum, slot) => slot?.id === id && slot.tier === tier ? sum + slot.amount : sum, 0)
  return items.flatMap(({ id, amount, tier = ITEM_DATA[id].tier }) => {
    const lost = amount - (owned(after, id, tier) - owned(inventories, id, tier))
    return lost > 0 ? [{ id, tier, amount: lost }] : []
  })
}
