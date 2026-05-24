import { ItemID } from '../../enums/ids/item-id.enum'
import { Item } from '../../interfaces/item.interface'
import { ItemTier } from '../../enums/items/item-tier.enum'
import { ItemType } from '../../enums/items/item-type.enum'

export const RewardsItemsData: Partial<Record<ItemID, Item>> = {
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
}
