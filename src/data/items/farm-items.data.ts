import { ItemID } from '../../enums/ids/item-id.enum'
import { Item } from '../../interfaces/item.interface'
import { ItemTier } from '../../enums/items/item-tier.enum'
import { ItemType } from '../../enums/items/item-type.enum'

// Placeholder icons until the farm art lands (C9). Only the two shop seeds and their crops exist so far; the other
// five seeds and crops (docs/ideas/farm-and-husbandry.md §7) come with the content commit.
export const FarmItemsData: Partial<Record<ItemID, Item>> = {
  [ItemID.turnipSeeds]: {
    id: ItemID.turnipSeeds,
    tier: ItemTier.normal,
    url: './assets/img/items/stick.png',
    value: -1,
    type: ItemType.seed,
  },
  [ItemID.wheatSeeds]: {
    id: ItemID.wheatSeeds,
    tier: ItemTier.normal,
    url: './assets/img/items/stick.png',
    value: -1,
    type: ItemType.seed,
  },
  [ItemID.turnip]: {
    id: ItemID.turnip,
    tier: ItemTier.normal,
    url: './assets/img/items/apple.png',
    value: 4,
    type: ItemType.resource,
  },
  [ItemID.wheat]: {
    id: ItemID.wheat,
    tier: ItemTier.normal,
    url: './assets/img/items/apple.png',
    value: 8,
    type: ItemType.resource,
  },
}
