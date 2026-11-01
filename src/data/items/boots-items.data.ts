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
  [ItemID.leatherBoots]: {
    id: ItemID.leatherBoots,
    tier: ItemTier.normal,
    url: './assets/img/items/leatherBoots.png',
    value: 12,
    type: ItemType.equipment,
    slot: EquipmentSlot.boots,
    stats: [
      { id: 'attackPower', amount: 1 },
      { id: 'critChance', amount: 1 },
    ],
  },
  // Sold at La Harpar Honored
  [ItemID.wharfRunnersBoots]: {
    id: ItemID.wharfRunnersBoots,
    tier: ItemTier.rare,
    url: './assets/img/items/wharfRunnersBoots.png',
    value: 1000,
    type: ItemType.equipment,
    slot: EquipmentSlot.boots,
    stats: [
      { id: 'attackPower', amount: 2 },
      { id: 'goldCoinsMultiplier', amount: 0.05 },
    ],
  },
  // Sold at Mawood Honored
  [ItemID.rootwalkerBoots]: {
    id: ItemID.rootwalkerBoots,
    tier: ItemTier.rare,
    url: './assets/img/items/rootwalkerBoots.png',
    value: 2000,
    type: ItemType.equipment,
    slot: EquipmentSlot.boots,
    stats: [
      { id: 'magicDamage', amount: 3 },
      { id: 'maxMana', amount: 3 },
    ],
  },
}
