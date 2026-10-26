import { ItemID } from '../../enums/ids/item-id.enum'
import { Item } from '../../interfaces/item.interface'
import { ItemTier } from '../../enums/items/item-tier.enum'
import { ItemType } from '../../enums/items/item-type.enum'
import { EquipmentSlot } from '../../enums/equipment-slot.enum'

export const GlovesItemsData: Partial<Record<ItemID, Item>> = {
  [ItemID.turtleShellGloves]: {
    id: ItemID.turtleShellGloves,
    tier: ItemTier.uncommon,
    url: './assets/img/items/turtleShellGloves.png',
    value: 20,
    type: ItemType.equipment,
    slot: EquipmentSlot.gloves,
    stats: [
      {
        id: 'attackPower',
        amount: 1,
      },
    ],
  },
  [ItemID.leatherGloves]: {
    id: ItemID.leatherGloves,
    tier: ItemTier.normal,
    url: './assets/img/items/leatherGloves.png',
    value: 12,
    type: ItemType.equipment,
    slot: EquipmentSlot.gloves,
    stats: [
      { id: 'attackPower', amount: 1 },
      { id: 'critChance', amount: 1 },
    ],
  },
  [ItemID.bearhideGloves]: {
    id: ItemID.bearhideGloves,
    tier: ItemTier.uncommon,
    url: './assets/img/items/bearhideGloves.png',
    value: 338,
    type: ItemType.equipment,
    slot: EquipmentSlot.gloves,
    stats: [
      { id: 'attackPower', amount: 3 },
      { id: 'critChance', amount: 2 },
    ],
  },
}
