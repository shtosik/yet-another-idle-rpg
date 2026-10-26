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
  [ItemID.apprenticeRobe]: {
    id: ItemID.apprenticeRobe,
    tier: ItemTier.uncommon,
    url: './assets/img/items/apprenticeRobe.png',
    value: 500,
    type: ItemType.equipment,
    slot: EquipmentSlot.chest,
    stats: [
      { id: 'maxMana', amount: 2 },
      { id: 'magicDamage', amount: 2 },
    ],
  },
  [ItemID.sageRobe]: {
    id: ItemID.sageRobe,
    tier: ItemTier.rare,
    url: './assets/img/items/sageRobe.png',
    value: 330,
    type: ItemType.equipment,
    slot: EquipmentSlot.chest,
    stats: [
      { id: 'maxMana', amount: 3 },
      { id: 'magicDamage', amount: 5 },
      { id: 'magicDamageMultiplier', amount: 0.1 },
    ],
  },
  [ItemID.leatherVest]: {
    id: ItemID.leatherVest,
    tier: ItemTier.normal,
    url: './assets/img/items/leatherVest.png',
    value: 23,
    type: ItemType.equipment,
    slot: EquipmentSlot.chest,
    stats: [
      { id: 'attackPower', amount: 2 },
      { id: 'critChance', amount: 2 },
    ],
  },
  [ItemID.trollHideVest]: {
    id: ItemID.trollHideVest,
    tier: ItemTier.rare,
    url: './assets/img/items/trollHideVest.png',
    value: 2000,
    type: ItemType.equipment,
    slot: EquipmentSlot.chest,
    stats: [
      { id: 'attackPower', amount: 3 },
      { id: 'critMulti', amount: 0.15 },
    ],
  },
}
