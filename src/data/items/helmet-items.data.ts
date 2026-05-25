import { ItemID } from '../../enums/ids/item-id.enum'
import { Item } from '../../interfaces/item.interface'
import { ItemTier } from '../../enums/items/item-tier.enum'
import { ItemType } from '../../enums/items/item-type.enum'
import { EquipmentSlot } from '../../enums/equipment-slot.enum'

export const HelmetItemsData: Partial<Record<ItemID, Item>> = {
  [ItemID.slimeGoldenCrown]: {
    id: ItemID.slimeGoldenCrown,
    tier: ItemTier.uncommon,
    url: './assets/img/items/slimeGoldenCrown.png',
    value: 250,
    type: ItemType.equipment,
    slot: EquipmentSlot.helmet,
    stats: [
      {
        id: 'goldCoinsMultiplier',
        amount: 0.5,
      },
      {
        id: 'attackPower',
        amount: 1,
      },
    ],
  },
  [ItemID.turtleShellHelmet]: {
    id: ItemID.turtleShellHelmet,
    tier: ItemTier.uncommon,
    url: './assets/img/items/turtleShellHelmet.png',
    value: 20,
    type: ItemType.equipment,
    slot: EquipmentSlot.helmet,
    stats: [
      {
        id: 'attackPower',
        amount: 1,
      },
    ],
  },
  [ItemID.harpyCrown]: {
    id: ItemID.harpyCrown,
    tier: ItemTier.rare,
    url: './assets/img/items/harpyCrown.png',
    value: 5000,
    type: ItemType.equipment,
    slot: EquipmentSlot.helmet,
    stats: [
      {
        id: 'attackPower',
        amount: 5,
      },
      {
        id: 'critChance',
        amount: 3,
      },
      {
        id: 'damageVsHarpy',
        amount: 0.3,
      },
    ],
  },
}
