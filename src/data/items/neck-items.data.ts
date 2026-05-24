import { Item } from '../../interfaces/item.interface'
import { ItemID } from '../../enums/ids/item-id.enum'
import { ItemTier } from '../../enums/items/item-tier.enum'
import { ItemType } from '../../enums/items/item-type.enum'
import { EquipmentSlot } from '../../enums/equipment-slot.enum'

export const NeckItemsData: Partial<Record<ItemID, Item>> = {
  [ItemID.trophyNecklace]: {
    id: ItemID.trophyNecklace,
    tier: ItemTier.uncommon,
    url: './assets/img/items/trophyNecklace.png',
    value: 1500,
    type: ItemType.equipment,
    slot: EquipmentSlot.amulet,
    stats: [
      {
        id: 'goldCoinsMultiplier',
        amount: 0.5,
      },
      {
        id: 'xpMultiplier',
        amount: 0.25,
      },
    ],
  },
}
