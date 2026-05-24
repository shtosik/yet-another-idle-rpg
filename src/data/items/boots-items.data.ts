import { ItemID } from '../../enums/ids/item-id.enum'
import { Item } from '../../interfaces/item.interface'
import { ItemTier } from '../../enums/items/item-tier.enum'
import { ItemType } from '../../enums/items/item-type.enum'
import { EquipmentSlot } from '../../enums/equipment-slot.enum'

export const BootsItemsData: Partial<Record<ItemID, Item>> = {
  [ItemID.turtleShellBoots]: {
    id: ItemID.turtleShellBoots,
    tier: ItemTier.uncommon,
    url: './assets/img/items/turtleShellBoots.png',
    value: 20,
    type: ItemType.equipment,
    slot: EquipmentSlot.boots,
    stats: [
      {
        id: 'attackPower',
        amount: 1,
      },
    ],
  },
}
