import { SpellID } from '../../enums/ids/spell-id.enum'
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
  // Guild store spell scroll.
  [ItemID.ambushScroll]: {
    id: ItemID.ambushScroll,
    tier: ItemTier.rare,
    url: './assets/img/items/ambushScroll.png',
    value: -1,
    type: ItemType.spellScroll,
    spellId: SpellID.ambush,
  },
  // Combat Arena clear reward.
  [ItemID.arenaChest]: {
    id: ItemID.arenaChest,
    tier: ItemTier.epic,
    url: './assets/img/items/arenaChest.png',
    value: -1,
    type: ItemType.chest,
    rolls: 3,
    loot: [
      { weight: 30, gold: [800, 1500] },
      { weight: 20, itemId: ItemID.elderSilk, amount: [2, 4] },
      { weight: 20, itemId: ItemID.harpyFeather, amount: [2, 4] },
      { weight: 15, itemId: ItemID.ancientWood, amount: [1, 3] },
      { weight: 15, itemId: ItemID.minorManaPotion, amount: [2, 3] },
      { weight: 3, itemId: ItemID.fireRune, amount: [1, 2] },
      { weight: 3, itemId: ItemID.airRune, amount: [1, 2] },
      { weight: 3, itemId: ItemID.earthRune, amount: [1, 2] },
      { weight: 5, itemId: ItemID.huntersFeastRecipe, amount: [1, 1] },
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
