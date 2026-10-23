import { ItemID } from '../../enums/ids/item-id.enum'
import { Item } from '../../interfaces/item.interface'
import { ItemTier } from '../../enums/items/item-tier.enum'
import { ItemType } from '../../enums/items/item-type.enum'

export const RewardsItemsData: Partial<Record<ItemID, Item>> = {
  [ItemID.spellbook]: {
    id: ItemID.spellbook,
    tier: ItemTier.legendary,
    url: './assets/img/items/spellbook.png',
    value: -1,
    type: ItemType.book,
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
  // Explorer Token shop upgrades. Icons are placeholders until their art is generated.
  [ItemID.guildSatchel]: {
    id: ItemID.guildSatchel,
    tier: ItemTier.rare,
    url: './assets/img/items/silk.png',
    value: -1,
    type: ItemType.rewardsStats,
    stats: [{ id: 'inventorySlots', amount: 5 }],
  },
  [ItemID.secondContract]: {
    id: ItemID.secondContract,
    tier: ItemTier.legendary,
    url: './assets/img/items/letter.png',
    value: -1,
    type: ItemType.rewardsStats,
    stats: [{ id: 'maxTaskSlots', amount: 1 }],
  },
  [ItemID.bountyMark]: {
    id: ItemID.bountyMark,
    tier: ItemTier.legendary,
    url: './assets/img/items/gnollTrophy.png',
    value: -1,
    type: ItemType.rewardsStats,
    stats: [{ id: 'taskDoubleKillChance', amount: 10 }],
  },
}
