import { ItemID } from '../../enums/ids/item-id.enum'
import { Item } from '../../interfaces/item.interface'
import { ItemTier } from '../../enums/items/item-tier.enum'
import { ItemType } from '../../enums/items/item-type.enum'
import { EquipmentSlot } from '../../enums/equipment-slot.enum'
import { DamageElement } from '../../enums/damage-element.enum'

export const WeaponsItemsData: Partial<Record<ItemID, Item>> = {
  [ItemID.machete]: {
    id: ItemID.machete,
    tier: ItemTier.uncommon,
    url: './assets/img/items/machete.png',
    value: 1000,
    type: ItemType.equipment,
    slot: EquipmentSlot.weapon,
    damageType: DamageElement.physical,
    stats: [
      {
        id: 'attackPower',
        amount: 5,
      },
      {
        id: 'critChance',
        amount: 2,
      },
      {
        id: 'critMulti',
        amount: 0.25,
      },
    ],
  },
  [ItemID.stoneArrow]: {
    id: ItemID.stoneArrow,
    tier: ItemTier.normal,
    url: './assets/img/items/stoneArrow.png',
    value: 4,
    type: ItemType.equipment,
    slot: EquipmentSlot.cape,
    stats: [
      {
        id: 'attackPower',
        amount: 2,
      },
    ],
  },
  [ItemID.woodenBow]: {
    id: ItemID.woodenBow,
    tier: ItemTier.uncommon,
    url: './assets/img/items/woodenBow.png',
    value: 500,
    type: ItemType.equipment,
    slot: EquipmentSlot.weapon,
    damageType: DamageElement.physical,
    stats: [
      {
        id: 'attackPower',
        amount: 3,
      },
      {
        id: 'critChance',
        amount: 4,
      },
    ],
  },
  [ItemID.makeshiftClub]: {
    id: ItemID.makeshiftClub,
    tier: ItemTier.normal,
    url: './assets/img/items/makeshiftClub.png',
    value: 10,
    type: ItemType.equipment,
    slot: EquipmentSlot.weapon,
    damageType: DamageElement.physical,
    stats: [
      {
        id: 'attackPower',
        amount: 1,
      },
    ],
  },
  [ItemID.knife]: {
    id: ItemID.knife,
    tier: ItemTier.uncommon,
    url: './assets/img/items/knife.png',
    value: 150,
    type: ItemType.equipment,
    slot: EquipmentSlot.weapon,
    damageType: DamageElement.physical,
    stats: [
      {
        id: 'attackPower',
        amount: 3,
      },
    ],
  },
  [ItemID.ashwoodBow]: {
    id: ItemID.ashwoodBow,
    tier: ItemTier.uncommon,
    url: './assets/img/items/ashwoodBow.png',
    value: 1200,
    type: ItemType.equipment,
    slot: EquipmentSlot.weapon,
    damageType: DamageElement.physical,
    stats: [
      {
        id: 'attackPower',
        amount: 6,
      },
      {
        id: 'critChance',
        amount: 5,
      },
    ],
  },
  [ItemID.magicStaff]: {
    id: ItemID.magicStaff,
    tier: ItemTier.uncommon,
    url: './assets/img/items/magicStaff.png',
    value: 800,
    type: ItemType.equipment,
    slot: EquipmentSlot.weapon,
    damageType: DamageElement.physical,
    stats: [
      {
        id: 'attackPower',
        amount: 2,
      },
      {
        id: 'magicDamage',
        amount: 5,
      },
      {
        id: 'magicDamageMultiplier',
        amount: 0.05,
      },
    ],
  },
}
