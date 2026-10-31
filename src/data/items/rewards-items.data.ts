import { SpellID } from '../../enums/ids/spell-id.enum'
import { RecipeID } from '../../enums/ids/recipe-id.enum'
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
    value: 500,
    type: ItemType.spellScroll,
    spellId: SpellID.ambush,
  },
  // Arena Chest only. Icon: the shared scroll art.
  [ItemID.warCryScroll]: {
    id: ItemID.warCryScroll,
    tier: ItemTier.epic,
    url: './assets/img/items/ambushScroll.png',
    value: 500,
    type: ItemType.spellScroll,
    spellId: SpellID.warCry,
  },
  // Arena Chest only. Icon: the cooking recipe's art until a workbench scroll is drawn.
  [ItemID.gladiatorHelmRecipe]: {
    id: ItemID.gladiatorHelmRecipe,
    tier: ItemTier.rare,
    url: './assets/img/items/cookingRecipe.png',
    value: 150,
    type: ItemType.recipe,
    recipeId: RecipeID.gladiatorHelm,
  },
  // Combat Arena clear reward.
  [ItemID.arenaChest]: {
    id: ItemID.arenaChest,
    tier: ItemTier.epic,
    url: './assets/img/items/arenaChest.png',
    value: -1,
    type: ItemType.chest,
    rolls: 4,
    loot: [
      { weight: 300, gold: [6000, 12000] },
      { weight: 200, itemId: ItemID.elderSilk, amount: [4, 8] },
      { weight: 200, itemId: ItemID.harpyFeather, amount: [4, 8] },
      { weight: 150, itemId: ItemID.ancientWood, amount: [2, 6] },
      { weight: 150, itemId: ItemID.minorManaPotion, amount: [4, 6] },
      { weight: 60, itemId: ItemID.fireRune, amount: [3, 6] },
      { weight: 60, itemId: ItemID.airRune, amount: [3, 6] },
      { weight: 60, itemId: ItemID.earthRune, amount: [3, 6] },
      { weight: 50, itemId: ItemID.gladiatorHelmRecipe, amount: [1, 1] },
      { weight: 30, itemId: ItemID.warCryScroll, amount: [1, 1] },
      { weight: 30, itemId: ItemID.patronGloves, amount: [1, 1] },
      // Champion pets: about 1 in 47 per chest each (never shiny).
      { weight: 7, itemId: ItemID.petArenaBrute, amount: [1, 1] },
      { weight: 7, itemId: ItemID.petArenaArcanist, amount: [1, 1] },
      { weight: 7, itemId: ItemID.petArenaBurrower, amount: [1, 1] },
      { weight: 7, itemId: ItemID.petArenaYad, amount: [1, 1] },
    ],
  },
  // Explorer Token shop upgrades. Icons are placeholders until their art is generated.
  [ItemID.guildSatchel]: {
    id: ItemID.guildSatchel,
    tier: ItemTier.rare,
    url: './assets/img/items/silk.png',
    value: -1,
    type: ItemType.rewardsStats,
    stats: [{ id: 'inventorySlots', amount: 2 }],
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
