import { ItemID } from '../../enums/ids/item-id.enum'
import { Item } from '../../interfaces/item.interface'
import { ItemTier } from '../../enums/items/item-tier.enum'
import { ItemType } from '../../enums/items/item-type.enum'
import { EquipmentSlot } from '../../enums/equipment-slot.enum'

export const LegsItemsData: Partial<Record<ItemID, Item>> = {
  [ItemID.turtleShellLegs]: {
    id: ItemID.turtleShellLegs,
    tier: ItemTier.uncommon,
    url: './assets/img/items/turtleShellLegs.png',
    value: 40,
    type: ItemType.equipment,
    slot: EquipmentSlot.legs,
    stats: [
      {
        id: 'attackPower',
        amount: 1,
      },
    ],
  },
  [ItemID.leatherPants]: {
    id: ItemID.leatherPants,
    tier: ItemTier.normal,
    url: './assets/img/items/leatherPants.png',
    value: 18,
    type: ItemType.equipment,
    slot: EquipmentSlot.legs,
    stats: [
      { id: 'attackPower', amount: 1 },
      { id: 'critChance', amount: 1 },
    ],
  },
  [ItemID.silkweaveLegs]: {
    id: ItemID.silkweaveLegs,
    tier: ItemTier.rare,
    url: './assets/img/items/silkweaveLegs.png',
    value: 180,
    type: ItemType.equipment,
    slot: EquipmentSlot.legs,
    stats: [
      { id: 'attackPower', amount: 3 },
      { id: 'attackSpeed', amount: 0.1 },
    ],
  },
}
