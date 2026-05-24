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
}
