import { ItemID } from '../../enums/ids/item-id.enum'
import { Item } from '../../interfaces/item.interface'
import { ItemTier } from '../../enums/items/item-tier.enum'
import { ItemType } from '../../enums/items/item-type.enum'
import { EquipmentSlot } from '../../enums/equipment-slot.enum'

export const BeltItemsData: Partial<Record<ItemID, Item>> = {
  [ItemID.ratCatcher]: {
    id: ItemID.ratCatcher,
    tier: ItemTier.uncommon,
    url: './assets/img/items/ratCatcher.png',
    value: 1000,
    type: ItemType.equipment,
    slot: EquipmentSlot.belt,
    stats: [
      {
        id: 'attackPower',
        amount: 1,
      },
      {
        id: 'critChance',
        amount: 2,
      },
      {
        id: 'goldCoinsMultiplier',
        amount: 0.15,
      },
    ],
  },
}
