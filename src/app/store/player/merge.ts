import ITEM_DATA from '../../../data/items-data'
import { UPGRADE_CHANCES, UPGRADE_COST_FACTOR, UPGRADE_LEVEL_CAP } from '../../../data/upgrade-data'
import { EquipmentSlot, EquipmentSlotKey } from '../../../enums/equipment-slot.enum'
import { ItemType } from '../../../enums/items/item-type.enum'
import { EquipmentItem, EquipmentType } from '../../../interfaces/player/equipment.type'
import { addItems, blockedTab, countItem, Inventories, InventoryTab, ItemStack, removeItems, slotDeltas, stackKey, TabCapacity, withSlotDeltas } from './inventory'
import { equipmentModifiers } from './stats'

export type MergeSource =
  | { from: 'inventory'; item: EquipmentItem }
  | { from: 'equipped'; slot: EquipmentSlotKey }

export type MergeRefusal =
  | { status: 'refused'; reason: 'missingCopy' | 'mismatch' | 'notEquipment' | 'unique' | 'pet' | 'atCap' | 'notEnoughGold' }
  | { status: 'refused'; reason: 'inventoryFull'; tab: InventoryTab }

export type MergeResult = MergeRefusal | { status: 'success' | 'failure'; cost: number }

interface MergeState {
  inventory: Inventories
  equipment: EquipmentType
  goldCoins: number
}

export interface MergeContext extends MergeState {
  capacity: TabCapacity
  base: MergeSource
  sacrifice: MergeSource
}

interface MergePlan {
  status: 'ready'
  cost: number
  chance: number
  success: MergeState
  failure: MergeState
}

/** Gold for a single +N -> +N+1 attempt, using the item's base value. */
export const mergeCost = (value: number, upgradeLevel = 0): number => value * 2 ** upgradeLevel * UPGRADE_COST_FACTOR

function resolveSource(source: MergeSource, context: MergeContext): EquipmentItem | null {
  if (source.from === 'equipped') return context.equipment[source.slot]
  const { item } = source
  return countItem(context.inventory, item.id, item.tier, item.upgradeLevel) > 0 ? item : null
}

/** Pure preview shared by the store and Forge panel. Both possible outcomes must be safe before spending or rolling. */
export function evaluateMerge(context: MergeContext, levelCap: number = UPGRADE_LEVEL_CAP): MergePlan | MergeRefusal {
  const base = resolveSource(context.base, context)
  const sacrifice = resolveSource(context.sacrifice, context)
  if (!base || !sacrifice) return { status: 'refused', reason: 'missingCopy' }
  if (stackKey(base) !== stackKey(sacrifice)) return { status: 'refused', reason: 'mismatch' }
  if (context.base.from === 'equipped' && context.sacrifice.from === 'equipped' && context.base.slot === context.sacrifice.slot) {
    return { status: 'refused', reason: 'missingCopy' }
  }
  const bothInventory = context.base.from === 'inventory' && context.sacrifice.from === 'inventory'
  if (bothInventory && countItem(context.inventory, base.id, base.tier, base.upgradeLevel) < 2) {
    return { status: 'refused', reason: 'missingCopy' }
  }
  const data = ITEM_DATA[base.id]
  if (data.type !== ItemType.equipment) return { status: 'refused', reason: 'notEquipment' }
  if (data.slot === EquipmentSlot.pet) return { status: 'refused', reason: 'pet' }
  if (data.unique) return { status: 'refused', reason: 'unique' }
  const level = base.upgradeLevel ?? 0
  if (level >= levelCap) return { status: 'refused', reason: 'atCap' }
  const cost = mergeCost(data.value, level)
  if (context.goldCoins < cost) return { status: 'refused', reason: 'notEnoughGold' }

  const upgraded = { ...base, upgradeLevel: level + 1 }
  const successEquipment = { ...context.equipment }
  const failureEquipment = { ...context.equipment }
  const successRemoving: ItemStack[] = []
  const failureRemoving: ItemStack[] = []
  const adding: ItemStack[] = []
  if (context.sacrifice.from === 'inventory') {
    const removed = { ...sacrifice, amount: 1 }
    successRemoving.push(removed)
    failureRemoving.push(removed)
  } else {
    successEquipment[context.sacrifice.slot] = null
    failureEquipment[context.sacrifice.slot] = null
  }
  if (context.base.from === 'inventory') {
    successRemoving.push({ ...base, amount: 1 })
    adding.push({ ...upgraded, amount: 1 })
  } else {
    successEquipment[context.base.slot] = upgraded
  }

  const capacityFor = (equipment: EquipmentType) => withSlotDeltas(context.capacity,
    slotDeltas(equipmentModifiers(equipment), equipmentModifiers(context.equipment)))
  const successCapacity = capacityFor(successEquipment)
  const successBlocked = blockedTab(context.inventory, context.capacity, successCapacity, adding, successRemoving)
  if (successBlocked) return { status: 'refused', reason: 'inventoryFull', tab: successBlocked }
  const chance = UPGRADE_CHANCES[level + 1] ?? 0
  if (chance < 1) {
    const failureBlocked = blockedTab(context.inventory, context.capacity, capacityFor(failureEquipment), [], failureRemoving)
    if (failureBlocked) return { status: 'refused', reason: 'inventoryFull', tab: failureBlocked }
  }

  const goldCoins = context.goldCoins - cost
  return {
    status: 'ready', cost, chance,
    success: {
      inventory: addItems(removeItems(context.inventory, successRemoving), successCapacity, adding),
      equipment: successEquipment, goldCoins,
    },
    failure: { inventory: removeItems(context.inventory, failureRemoving), equipment: failureEquipment, goldCoins },
  }
}

/** RNG follows Math.random's [0, 1) contract; injectable so later-level failures can be tested. */
export function rollMerge(plan: MergePlan, rng: () => number = Math.random): { result: MergeResult; state: MergeState } {
  if (rng() < plan.chance) return { result: { status: 'success', cost: plan.cost }, state: plan.success }
  return { result: { status: 'failure', cost: plan.cost }, state: plan.failure }
}
