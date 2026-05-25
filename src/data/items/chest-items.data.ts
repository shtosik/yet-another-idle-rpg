import { ItemID } from '../../enums/ids/item-id.enum'
import { Item } from '../../interfaces/item.interface'
import { ItemTier } from '../../enums/items/item-tier.enum'
import { ItemType } from '../../enums/items/item-type.enum'
import { EquipmentSlot } from '../../enums/equipment-slot.enum'

export const ChestItemsData: Partial<Record<ItemID, Item>> = {
  [ItemID.turtleShellChest]: {
    id: ItemID.turtleShellChest,
    tier: ItemTier.uncommon,
    url: './assets/img/items/turtleShellChest.png',
    value: 50,
    type: ItemType.equipment,
    slot: EquipmentSlot.chest,
    stats: [
      {
        id: 'attackPower',
        amount: 1,
      },
    ],
  },
  [ItemID.silverwoodChestplate]: {
    id: ItemID.silverwoodChestplate,
    tier: ItemTier.rare,
    url: './assets/img/items/silverwoodChestplate.png',
    value: 2500,
    type: ItemType.equipment,
    slot: EquipmentSlot.chest,
    stats: [
      {
        id: 'attackPower',
        amount: 4,
      },
      {
        id: 'goldCoinsMultiplier',
        amount: 0.3,
      },
    ],
  },
}
