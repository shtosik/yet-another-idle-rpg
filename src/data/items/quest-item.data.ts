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
}
