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
}
