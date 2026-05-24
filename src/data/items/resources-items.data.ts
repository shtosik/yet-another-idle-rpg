import { ItemID } from '../../enums/ids/item-id.enum'
import { Item } from '../../interfaces/item.interface'
import { ItemTier } from '../../enums/items/item-tier.enum'
import { ItemType } from '../../enums/items/item-type.enum'

export const ResourcesItemsData: Partial<Record<ItemID, Item>> = {
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
    id: ItemID.feather,
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
  [ItemID.stick]: {
    id: ItemID.stick,
    tier: ItemTier.normal,
    url: './assets/img/items/stick.png',
    value: 1,
    type: ItemType.resource,
  },
  [ItemID.ratTail]: {
    id: ItemID.ratTail,
    tier: ItemTier.normal,
    url: './assets/img/items/ratTail.png',
    value: 5,
    type: ItemType.resource,
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
  [ItemID.stone]: {
    id: ItemID.stone,
    tier: ItemTier.normal,
    url: './assets/img/items/stone.png',
    value: 1,
    type: ItemType.resource,
  },
}
