import { EquipmentSlot, EquipmentSlotKey } from '../../../enums/equipment-slot.enum'
import { EquipmentItem as WornItem } from '../../../interfaces/player/equipment.type'
import { EquipmentItem, InventoryItem } from '../../../interfaces/item.interface'
import ITEM_DATA from '../../../data/items-data'
import { ItemStack, slotDeltas, SlotDeltas } from './inventory'
import { gearModifiers } from './stats'

/**
 * What one equip or unequip does (docs/systems/player-stats-inventory-equipment.md). `canEquip` and `canUnequip`
 * check it and `equipItem` and `unequipItem` write it, so a check and its write can't disagree.
 */
export interface GearPlan {
  slot: EquipmentSlotKey
  /** Taken out of the inventory first, so the returned stack always has a free slot. */
  removing: ItemStack[]
  /** Put back into the inventory: the gear that was worn. */
  returning: ItemStack[]
  /** Change to each tab's capacity: the new gear's slot bonus minus the worn gear's. */
  deltas: SlotDeltas
  /** What the slot holds afterwards. */
  equipped: WornItem | null
}

type Worn = Partial<Record<EquipmentSlotKey, WornItem | null>>

/** The single-item stack of a piece of gear. */
export const gearStack = ({ id, tier, upgradeLevel }: WornItem): ItemStack => ({ id, tier, upgradeLevel, amount: 1 })

/** Equipping `item` over what `worn` holds in its slot; null when `item` has no equipment slot. */
export function planEquip(item: InventoryItem, worn: Worn): GearPlan | null {
  const slot = (ITEM_DATA[item.id] as EquipmentItem).slot
  if (slot === undefined) return null
  const slotKey = EquipmentSlot[slot] as EquipmentSlotKey
  const previous = worn[slotKey] ?? null
  return {
    slot: slotKey,
    removing: [gearStack(item)],
    returning: previous ? [gearStack(previous)] : [],
    deltas: slotDeltas(gearModifiers(item), gearModifiers(previous)),
    equipped: { id: item.id, tier: item.tier, upgradeLevel: item.upgradeLevel },
  }
}

/** Taking `slot`'s gear off; null when the slot is empty. */
export function planUnequip(slot: EquipmentSlotKey, worn: Worn): GearPlan | null {
  const previous = worn[slot]
  if (!previous) return null
  return { slot, removing: [], returning: [gearStack(previous)], deltas: slotDeltas([], gearModifiers(previous)), equipped: null }
}
