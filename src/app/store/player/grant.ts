import { BookItem, InventoryItem } from '../../../interfaces/item.interface'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { ItemTier } from '../../../enums/items/item-tier.enum'
import { ItemType } from '../../../enums/items/item-type.enum'
import ITEM_DATA from '../../../data/items-data'
import { installStations, Stations } from './camp'
import { addSeeds, seedStacks, takeSeeds } from './farm'
import { addItems, countItem, Inventories, ItemStack, MissingSlots, missingSlotsByTab, removeItems, stackKey, TabCapacity } from './inventory'

/** What an Item grant reads and writes: the tabs, the camp stations, the seed store and the spellbook unlock. */
export interface GrantState {
  inventory: Inventories
  stations: Stations
  seeds: Partial<Record<ItemID, number>>
  spellbookUnlocked: boolean
}

/** Atomic: all or nothing. Lossy: what fits lands, the rest is lost (kills only). */
export type GrantMode = 'atomic' | 'lossy'

export interface GrantReport {
  /** What landed, in a tab or the seed store: one entry per stack key, tier filled in. */
  received: InventoryItem[]
  /** Lossy only: what didn't fit and was thrown away. */
  lost: ItemStack[]
  /** Station gear installed by this grant. */
  installed: ItemID[]
  /** Slots still to free per tab for everything to fit; `{}` when it all fits. */
  missing: MissingSlots
}

/** Seeds go to the seed store, books unlock their feature, station gear installs; only `stored` needs tab slots. */
function routeGrant(stations: Stations, items: ItemStack[]) {
  const { seeds, rest } = takeSeeds(items)
  const isBook = ({ id }: ItemStack) => ITEM_DATA[id].type === ItemType.book
  const installs = installStations(stations, rest.filter(stack => !isBook(stack)))
  const unlocksSpellbook = rest.filter(isBook).some(({ id }) => (ITEM_DATA[id] as BookItem).unlocks === 'spellbook')
  return { seeds, unlocksSpellbook, stations: installs.stations, installed: installs.installed, stored: installs.rest }
}

/** Slots still to free per tab before `items` can be granted, once `removing` has been taken out first. */
export const grantMissing = (state: Pick<GrantState, 'inventory' | 'stations'>, capacity: TabCapacity, items: ItemStack[], removing: ItemStack[] = []): MissingSlots =>
  missingSlotsByTab(state.inventory, capacity, routeGrant(state.stations, items).stored, removing)

/** Whether an atomic grant of `items` would go through, once `removing` has been taken out first. */
export const canGrant = (state: Pick<GrantState, 'inventory' | 'stations'>, capacity: TabCapacity, items: ItemStack[], removing: ItemStack[] = []): boolean =>
  Object.keys(grantMissing(state, capacity, items, removing)).length === 0

/** One entry per stack key, amounts summed, tier filled in; first-seen order. */
function mergeStacks(items: ItemStack[]): (ItemStack & { tier: ItemTier })[] {
  const merged = new Map<string, ItemStack & { tier: ItemTier }>()
  for (const { id, amount, tier = ITEM_DATA[id].tier, upgradeLevel } of items) {
    const key = stackKey({ id, tier, upgradeLevel })
    const existing = merged.get(key)
    if (existing) existing.amount += amount
    else merged.set(key, { id, amount, tier, ...(upgradeLevel === undefined ? {} : { upgradeLevel }) })
  }
  return [...merged.values()]
}

/**
 * The Item grant: how items reach the player. `removing` is taken out first (a chest, ingredients, the gear being
 * equipped). Atomic returns `state` unchanged, with `missing`, when anything doesn't fit; lossy lands what fits.
 */
export function grantItems(state: GrantState, capacity: TabCapacity, items: ItemStack[], mode: GrantMode, removing: ItemStack[] = []): GrantReport & { state: GrantState } {
  const route = routeGrant(state.stations, items)
  const missing = missingSlotsByTab(state.inventory, capacity, route.stored, removing)
  if (mode === 'atomic' && Object.keys(missing).length > 0) return { state, received: [], lost: [], installed: [], missing }

  const before = removeItems(state.inventory, removing)
  const inventory = addItems(before, capacity, route.stored)
  const received: InventoryItem[] = []
  const lost: ItemStack[] = []
  for (const stack of mergeStacks(route.stored)) {
    const landed = countItem(inventory, stack.id, stack.tier, stack.upgradeLevel) - countItem(before, stack.id, stack.tier, stack.upgradeLevel)
    if (landed > 0) received.push({ ...stack, type: ITEM_DATA[stack.id].type, amount: landed })
    if (landed < stack.amount) lost.push({ ...stack, amount: stack.amount - landed })
  }
  for (const { id, amount } of seedStacks(route.seeds)) received.push({ id, type: ItemType.seed, tier: ITEM_DATA[id].tier, amount })

  return {
    state: {
      inventory,
      stations: route.stations,
      seeds: addSeeds(state.seeds, route.seeds),
      spellbookUnlocked: state.spellbookUnlocked || route.unlocksSpellbook,
    },
    received,
    lost,
    installed: route.installed,
    missing,
  }
}
