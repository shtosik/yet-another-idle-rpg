import { EquipmentSlotKey } from 'enums/equipment-slot.enum'
import { ItemID } from 'enums/ids/item-id.enum'
import { ItemTier } from 'enums/items/item-tier.enum'

export type EquipmentType = Record<EquipmentSlotKey, EquipmentItem | null>

export type EquipmentItem = { id: ItemID, tier: ItemTier, upgradeLevel?: number }
