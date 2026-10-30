import { SpellID } from '../../enums/ids/spell-id.enum'
import { ItemID } from '../../enums/ids/item-id.enum'
import { Item } from '../../interfaces/item.interface'
import { ItemTier } from '../../enums/items/item-tier.enum'
import { ItemType } from '../../enums/items/item-type.enum'
import { EquipmentSlot } from '../../enums/equipment-slot.enum'
import { DamageElement } from '../../enums/damage-element.enum'
import { WeaponCategory } from '../../enums/weapon-category.enum'

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
    weaponCategory: WeaponCategory.ranged,
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
    weaponCategory: WeaponCategory.ranged,
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
    weaponCategory: WeaponCategory.magic,
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
  [ItemID.slimeWand]: {
    id: ItemID.slimeWand,
    tier: ItemTier.uncommon,
    url: './assets/img/items/slimeWand.png',
    value: 400,
    type: ItemType.equipment,
    slot: EquipmentSlot.weapon,
    damageType: DamageElement.water,
    weaponCategory: WeaponCategory.magic,
    stats: [
      { id: 'attackPower', amount: 1 },
      { id: 'magicDamage', amount: 2 },
      { id: 'maxMana', amount: 1 },
    ],
  },
  [ItemID.emberWand]: {
    id: ItemID.emberWand,
    tier: ItemTier.uncommon,
    url: './assets/img/items/emberWand.png',
    value: 900,
    type: ItemType.equipment,
    slot: EquipmentSlot.weapon,
    damageType: DamageElement.fire,
    weaponCategory: WeaponCategory.magic,
    stats: [
      { id: 'attackPower', amount: 1 },
      { id: 'magicDamage', amount: 3 },
      { id: 'magicDamageMultiplier', amount: 0.05 },
    ],
  },
  [ItemID.galeStaff]: {
    id: ItemID.galeStaff,
    tier: ItemTier.rare,
    url: './assets/img/items/galeStaff.png',
    value: 2000,
    type: ItemType.equipment,
    slot: EquipmentSlot.weapon,
    damageType: DamageElement.air,
    weaponCategory: WeaponCategory.magic,
    stats: [
      { id: 'attackPower', amount: 2 },
      { id: 'magicDamage', amount: 5 },
      { id: 'spellCooldownReduction', amount: 3 },
    ],
  },
  [ItemID.rootwoodStaff]: {
    id: ItemID.rootwoodStaff,
    tier: ItemTier.rare,
    url: './assets/img/items/rootwoodStaff.png',
    value: 255,
    type: ItemType.equipment,
    slot: EquipmentSlot.weapon,
    damageType: DamageElement.earth,
    weaponCategory: WeaponCategory.magic,
    stats: [
      { id: 'attackPower', amount: 2 },
      { id: 'magicDamage', amount: 7 },
      { id: 'magicDamageMultiplier', amount: 0.1 },
    ],
  },
  [ItemID.stormcaller]: {
    id: ItemID.stormcaller,
    tier: ItemTier.legendary,
    url: './assets/img/items/stormcaller.png',
    value: 8000,
    type: ItemType.equipment,
    slot: EquipmentSlot.weapon,
    damageType: DamageElement.air,
    weaponCategory: WeaponCategory.magic,
    spell: SpellID.thunderstorm,
    stats: [
      { id: 'attackPower', amount: 3 },
      { id: 'magicDamage', amount: 8 },
      { id: 'magicDamageMultiplier', amount: 0.15 },
    ],
  },
  [ItemID.stoneAxe]: {
    id: ItemID.stoneAxe,
    tier: ItemTier.normal,
    url: './assets/img/items/stoneAxe.png',
    value: 38,
    type: ItemType.equipment,
    slot: EquipmentSlot.weapon,
    damageType: DamageElement.physical,
    stats: [
      { id: 'attackPower', amount: 3 },
      { id: 'critMulti', amount: 0.1 },
    ],
  },
  [ItemID.fangSpear]: {
    id: ItemID.fangSpear,
    tier: ItemTier.uncommon,
    url: './assets/img/items/fangSpear.png',
    value: 38,
    type: ItemType.equipment,
    slot: EquipmentSlot.weapon,
    damageType: DamageElement.physical,
    stats: [
      { id: 'attackPower', amount: 5 },
      { id: 'critChance', amount: 3 },
    ],
  },
  [ItemID.goblinFirebrand]: {
    id: ItemID.goblinFirebrand,
    tier: ItemTier.uncommon,
    url: './assets/img/items/goblinFirebrand.png',
    value: 1500,
    type: ItemType.equipment,
    slot: EquipmentSlot.weapon,
    damageType: DamageElement.fire,
    stats: [
      { id: 'attackPower', amount: 7 },
      { id: 'critChance', amount: 2 },
    ],
  },
  [ItemID.trollClub]: {
    id: ItemID.trollClub,
    tier: ItemTier.rare,
    url: './assets/img/items/trollClub.png',
    value: 2500,
    type: ItemType.equipment,
    slot: EquipmentSlot.weapon,
    damageType: DamageElement.physical,
    stats: [
      { id: 'attackPower', amount: 9 },
      { id: 'critMulti', amount: 0.3 },
    ],
  },
  [ItemID.gnollCleaver]: {
    id: ItemID.gnollCleaver,
    tier: ItemTier.rare,
    url: './assets/img/items/gnollCleaver.png',
    value: 4000,
    type: ItemType.equipment,
    slot: EquipmentSlot.weapon,
    damageType: DamageElement.physical,
    stats: [
      { id: 'attackPower', amount: 11 },
      { id: 'critChance', amount: 4 },
    ],
  },
  [ItemID.bogHammer]: {
    id: ItemID.bogHammer,
    tier: ItemTier.rare,
    url: './assets/img/items/bogHammer.png',
    value: 6000,
    type: ItemType.equipment,
    slot: EquipmentSlot.weapon,
    damageType: DamageElement.earth,
    stats: [
      { id: 'attackPower', amount: 14 },
      { id: 'critMulti', amount: 0.2 },
    ],
  },
  [ItemID.talonBlade]: {
    id: ItemID.talonBlade,
    tier: ItemTier.epic,
    url: './assets/img/items/talonBlade.png',
    value: 9000,
    type: ItemType.equipment,
    slot: EquipmentSlot.weapon,
    damageType: DamageElement.air,
    stats: [
      { id: 'attackPower', amount: 17 },
      { id: 'critChance', amount: 5 },
    ],
  },
  // Combat Arena clear reward (arena not built yet).
  [ItemID.moltenCape]: {
    id: ItemID.moltenCape,
    tier: ItemTier.epic,
    url: './assets/img/items/moltenCape.png',
    value: 5000,
    type: ItemType.equipment,
    slot: EquipmentSlot.cape,
    stats: [
      { id: 'attackPower', amount: 20 },
      { id: 'meleeDamageMultiplier', amount: 0.15 },
    ],
  },
}
