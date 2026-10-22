import { isStationUpgradeItem, StationUpgradeItem } from '../../../interfaces/item.interface'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { StationID } from '../../../enums/ids/station-id.enum'
import { RecipeID } from '../../../enums/ids/recipe-id.enum'
import { CraftingRecipe } from '../../../data/recipes-data'
import ITEM_DATA from '../../../data/items-data'
import { canFit, Inventory, ItemStack, maxAffordable } from './inventory'

/** Installed level per station; a missing key means the station is not owned. */
export type Stations = Partial<Record<StationID, number>>

export type CraftBlockReason = 'stationLevel' | 'missingItems' | 'inventoryFull' | 'stationOrder'

export interface RecipeEvaluation {
  /** Station owned, scroll used (if needed) and, for station gear, not installed yet. */
  visible: boolean
  maxCraftable: number
  blockReason: CraftBlockReason | null
}

export const stationLevel = (stations: Stations, id: StationID): number => stations[id] ?? 0

export const stationUpgradeOf = (id: ItemID): StationUpgradeItem | null => {
  const item = ITEM_DATA[id]
  return item && isStationUpgradeItem(item) ? item : null
}

export const isInstalled = (stations: Stations, item: StationUpgradeItem): boolean =>
  stationLevel(stations, item.stationId) >= item.level

/** Upgrades are sequential: level N needs the station at N - 1. */
export const canInstall = (stations: Stations, item: StationUpgradeItem): boolean =>
  stationLevel(stations, item.stationId) === item.level - 1

/**
 * Installs every station upgrade it can and returns what still goes to the inventory.
 * An upgrade that can't be installed yet stays in the inventory, to be used later.
 */
export function installStations(stations: Stations, items: ItemStack[]): { stations: Stations, rest: ItemStack[], installed: ItemID[] } {
  let result = stations
  const rest: ItemStack[] = []
  const installed: ItemID[] = []

  for (const stack of items) {
    const upgrade = stationUpgradeOf(stack.id)
    if (!upgrade) {
      rest.push(stack)
      continue
    }
    if (isInstalled(result, upgrade)) continue
    if (!canInstall(result, upgrade)) {
      rest.push(stack)
      continue
    }
    result = { ...result, [upgrade.stationId]: upgrade.level }
    installed.push(stack.id)
  }

  return { stations: result, rest, installed }
}

export function evaluateRecipe(
  recipe: CraftingRecipe,
  inventory: Inventory,
  capacity: number,
  stations: Stations,
  unlockedRecipes: RecipeID[],
): RecipeEvaluation {
  const level = stationLevel(stations, recipe.stationId)
  const upgrade = stationUpgradeOf(recipe.itemId)
  const visible = level > 0
    && (!recipe.requiresUnlock || unlockedRecipes.includes(recipe.id))
    && !(upgrade && isInstalled(stations, upgrade))

  const affordable = maxAffordable(inventory, recipe.itemsNeeded)
  const maxCraftable = upgrade ? Math.min(affordable, 1) : affordable

  let blockReason: CraftBlockReason | null = null
  if (recipe.stationLevel > level) blockReason = 'stationLevel'
  else if (upgrade && !canInstall(stations, upgrade)) blockReason = 'stationOrder'
  else if (maxCraftable < 1) blockReason = 'missingItems'
  // Station gear never takes a slot. Paying for one craft can free a slot, so check after paying.
  else if (!upgrade && !canFit(inventory, capacity, [{ id: recipe.itemId, amount: 1 }], recipe.itemsNeeded)) blockReason = 'inventoryFull'

  return { visible, maxCraftable: blockReason ? 0 : maxCraftable, blockReason }
}
