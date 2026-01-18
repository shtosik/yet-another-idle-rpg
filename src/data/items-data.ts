import { EquipmentSlot } from 'enums/equipment-slot.enum'
import { ItemID } from 'enums/ids/item-id.enum'
import { ItemTier } from 'enums/items/item-tier.enum'
import { ItemType } from 'enums/items/item-type.enum'
import { Item } from 'interfaces/item.interface'


const ITEM_DATA: Record<ItemID, Item> = {
  [ItemID.slimeResidue]: {
    id: ItemID.slimeResidue,
    tier: ItemTier.normal,
    url: './assets/img/items/slimeResidue.png',
    value: 1,
    type: ItemType.resource,
  },
  [ItemID.crabMeat]: {
    id: ItemID.crabMeat,
    tier: ItemTier.normal,
    url: './assets/img/items/crabMeat.png',
    value: 1,
    type: ItemType.resource,
  },
  [ItemID.feather]: {
    id: ItemID.crabMeat,
    tier: ItemTier.normal,
    url: './assets/img/items/feather.png',
    value: 1,
    type: ItemType.resource,
  },
  [ItemID.turtleShell]: {
    id: ItemID.turtleShell,
    tier: ItemTier.normal,
    url: './assets/img/items/turtleShell.png',
    value: 1,
    type: ItemType.resource,
  },
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
  [ItemID.knife]: {
    id: ItemID.knife,
    tier: ItemTier.uncommon,
    url: './assets/img/items/knife.png',
    value: 150,
    type: ItemType.equipment,
    slot: EquipmentSlot.weapon,
    stats: [
      {
        id: 'attackPower',
        amount: 3,
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
  [ItemID.turtleShellLegs]: {
    id: ItemID.turtleShellLegs,
    tier: ItemTier.uncommon,
    url: './assets/img/items/turtleShellLegs.png',
    value: 40,
    type: ItemType.equipment,
    slot: EquipmentSlot.legs,
    stats: [
      {
        id: 'attackPower',
        amount: 1,
      },
    ],
  },
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
  [ItemID.turtleShellGloves]: {
    id: ItemID.turtleShellGloves,
    tier: ItemTier.uncommon,
    url: './assets/img/items/turtleShellGloves.png',
    value: 20,
    type: ItemType.equipment,
    slot: EquipmentSlot.gloves,
    stats: [
      {
        id: 'attackPower',
        amount: 1,
      },
    ],
  },
  [ItemID.stick]: {
    id: ItemID.stick,
    tier: ItemTier.normal,
    url: './assets/img/items/stick.png',
    value: 1,
    type: ItemType.resource,
  },
  [ItemID.makeshiftClub]: {
    id: ItemID.makeshiftClub,
    tier: ItemTier.normal,
    url: './assets/img/items/makeshiftClub.png',
    value: 10,
    type: ItemType.equipment,
    slot: EquipmentSlot.weapon,
    stats: [
      {
        id: 'attackPower',
        amount: 1,
      },
    ],
  },
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
  [ItemID.ratTail]: {
    id: ItemID.ratTail,
    tier: ItemTier.normal,
    url: './assets/img/items/ratTail.png',
    value: 5,
    type: ItemType.resource,
  },
  [ItemID.skillPointBook]: {
    id: ItemID.skillPointBook,
    tier: ItemTier.legendary,
    url: './assets/img/items/skillPointBook.png',
    value: -1,
    type: ItemType.rewardsStats,
    stats: [
      {
        id: 'unspentSkillPoints',
        amount: 1,
      },
    ],
  },
  [ItemID.apple]: {
    id: ItemID.apple,
    tier: ItemTier.normal,
    url: './assets/img/items/apple.png',
    value: 1,
    type: ItemType.resource,
  },
  [ItemID.fishMeat]: {
    id: ItemID.fishMeat,
    tier: ItemTier.normal,
    url: './assets/img/items/fishMeat.png',
    value: 1,
    type: ItemType.resource,
  },
  [ItemID.captainsLetter]: {
    id: ItemID.captainsLetter,
    tier: ItemTier.normal,
    url: './assets/img/items/letter.png',
    value: -1,
    type: ItemType.quest,
  },
  [ItemID.cheese]: {
    id: ItemID.cheese,
    tier: ItemTier.normal,
    url: './assets/img/items/cheese.png',
    value: 1,
    type: ItemType.resource,
  },
  [ItemID.deerPelt]: {
    id: ItemID.deerPelt,
    tier: ItemTier.normal,
    url: './assets/img/items/deerPelt.png',
    value: 1,
    type: ItemType.resource,
  },
  [ItemID.wolfFangs]: {
    id: ItemID.wolfFangs,
    tier: ItemTier.normal,
    url: './assets/img/items/wolfFangs.png',
    value: 1,
    type: ItemType.resource,
  },
  [ItemID.vialOfWater]: {
    id: ItemID.vialOfWater,
    tier: ItemTier.normal,
    url: './assets/img/items/vialOfWater.png',
    value: 1,
    type: ItemType.resource,
  },
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
  [ItemID.woodenBow]: {
    id: ItemID.woodenBow,
    tier: ItemTier.uncommon,
    url: './assets/img/items/woodenBow.png',
    value: 500,
    type: ItemType.equipment,
    slot: EquipmentSlot.weapon,
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
  [ItemID.machete]: {
    id: ItemID.machete,
    tier: ItemTier.uncommon,
    url: './assets/img/items/machete.png',
    value: 1000,
    type: ItemType.equipment,
    slot: EquipmentSlot.weapon,
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
  [ItemID.stone]: {
    id: ItemID.stone,
    tier: ItemTier.normal,
    url: './assets/img/items/stone.png',
    value: 1,
    type: ItemType.resource,
  },
}

export default ITEM_DATA
