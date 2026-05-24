import { ItemID } from '../../enums/ids/item-id.enum'
import { Item } from '../../interfaces/item.interface'
import { ItemTier } from '../../enums/items/item-tier.enum'
import { ItemType } from '../../enums/items/item-type.enum'
import { EquipmentSlot } from '../../enums/equipment-slot.enum'

export const RingsItemsData: Partial<Record<ItemID, Item>> = {
  [ItemID.joshsHeirloom]: {
    id: ItemID.joshsHeirloom,
    tier: ItemTier.uncommon,
    url: './assets/img/items/joshsHeirloom.png',
    value: -1,
    type: ItemType.equipment,
    slot: EquipmentSlot.ring,
    stats: [
      {
        id: 'attackPower',
        amount: 1,
      },
      {
        id: 'attackSpeed',
        amount: 0.1,
      },
      {
        id: 'xpMultiplier',
        amount: 0.1,
      },
    ],
  },
}
