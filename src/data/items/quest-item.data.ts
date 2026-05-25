import { ItemID } from '../../enums/ids/item-id.enum'
import { Item } from '../../interfaces/item.interface'
import { ItemTier } from '../../enums/items/item-tier.enum'
import { ItemType } from '../../enums/items/item-type.enum'

export const QuestItemsData: Partial<Record<ItemID, Item>> = {
  [ItemID.captainsLetter]: {
    id: ItemID.captainsLetter,
    tier: ItemTier.normal,
    url: './assets/img/items/letter.png',
    value: -1,
    type: ItemType.quest,
  },
  [ItemID.corruptedResin]: {
    id: ItemID.corruptedResin,
    tier: ItemTier.normal,
    url: './assets/img/items/corruptedResin.png',
    value: -1,
    type: ItemType.quest,
  },
  [ItemID.blightedFetish]: {
    id: ItemID.blightedFetish,
    tier: ItemTier.normal,
    url: './assets/img/items/blightedFetish.png',
    value: -1,
    type: ItemType.quest,
  },
  [ItemID.cursedSap]: {
    id: ItemID.cursedSap,
    tier: ItemTier.normal,
    url: './assets/img/items/cursedSap.png',
    value: -1,
    type: ItemType.quest,
  },
  [ItemID.blightedHeartwood]: {
    id: ItemID.blightedHeartwood,
    tier: ItemTier.rare,
    url: './assets/img/items/blightedHeartwood.png',
    value: -1,
    type: ItemType.quest,
  },
}
