import { ItemID } from '../../enums/ids/item-id.enum'
import { Item } from '../../interfaces/item.interface'
import { ItemTier } from '../../enums/items/item-tier.enum'
import { ItemType } from '../../enums/items/item-type.enum'
import { RecipeID } from '../../enums/ids/recipe-id.enum'

const MINUTE = 60

// Icons are placeholders until the asset pipeline generates real art.
export const ConsumablesItemsData: Partial<Record<ItemID, Item>> = {
  [ItemID.grilledFish]: {
    id: ItemID.grilledFish,
    tier: ItemTier.normal,
    url: './assets/img/items/fishMeat.png',
    value: 25,
    type: ItemType.food,
    effect: {
      slot: 'food',
      duration: 10 * MINUTE,
      cooldown: 15 * MINUTE,
      stats: [{ stat: 'attackPower', amount: 2 }],
    },
  },
  [ItemID.bakedApple]: {
    id: ItemID.bakedApple,
    tier: ItemTier.normal,
    url: './assets/img/items/apple.png',
    value: 60,
    type: ItemType.food,
    effect: {
      slot: 'food',
      duration: 10 * MINUTE,
      cooldown: 15 * MINUTE,
      stats: [{ stat: 'xpMultiplier', amount: 0.1 }],
    },
  },
  [ItemID.crabStew]: {
    id: ItemID.crabStew,
    tier: ItemTier.normal,
    url: './assets/img/items/crabMeat.png',
    value: 30,
    type: ItemType.food,
    effect: {
      slot: 'food',
      duration: 10 * MINUTE,
      cooldown: 15 * MINUTE,
      stats: [{ stat: 'goldCoinsMultiplier', amount: 0.1 }],
    },
  },
  [ItemID.cheesePlatter]: {
    id: ItemID.cheesePlatter,
    tier: ItemTier.normal,
    url: './assets/img/items/cheese.png',
    value: 40,
    type: ItemType.food,
    effect: {
      slot: 'food',
      duration: 10 * MINUTE,
      cooldown: 15 * MINUTE,
      stats: [{ stat: 'critChance', amount: 3 }],
    },
  },
  [ItemID.fishApplePie]: {
    id: ItemID.fishApplePie,
    tier: ItemTier.uncommon,
    url: './assets/img/items/apple.png',
    value: 90,
    type: ItemType.food,
    effect: {
      slot: 'food',
      duration: 10 * MINUTE,
      cooldown: 15 * MINUTE,
      stats: [{ stat: 'attackSpeed', amount: 0.1 }],
    },
  },
  [ItemID.huntersFeast]: {
    id: ItemID.huntersFeast,
    tier: ItemTier.uncommon,
    url: './assets/img/items/crabMeat.png',
    value: 120,
    type: ItemType.food,
    effect: {
      slot: 'food',
      duration: 15 * MINUTE,
      cooldown: 20 * MINUTE,
      stats: [
        { stat: 'attackPower', amount: 4 },
        { stat: 'xpMultiplier', amount: 0.1 },
      ],
    },
  },
  [ItemID.minorManaPotion]: {
    id: ItemID.minorManaPotion,
    tier: ItemTier.normal,
    url: './assets/img/items/vialOfWater.png',
    value: 30,
    type: ItemType.potion,
    effect: {
      slot: 'potion',
      cooldown: 2 * MINUTE,
      manaRestore: 5,
    },
  },
  [ItemID.crabStewRecipe]: {
    id: ItemID.crabStewRecipe,
    tier: ItemTier.uncommon,
    url: './assets/img/items/earthRuneRecipe.png',
    value: 100,
    type: ItemType.recipe,
    recipeId: RecipeID.crabStew,
  },
  [ItemID.cheesePlatterRecipe]: {
    id: ItemID.cheesePlatterRecipe,
    tier: ItemTier.uncommon,
    url: './assets/img/items/earthRuneRecipe.png',
    value: 100,
    type: ItemType.recipe,
    recipeId: RecipeID.cheesePlatter,
  },
  [ItemID.fishApplePieRecipe]: {
    id: ItemID.fishApplePieRecipe,
    tier: ItemTier.uncommon,
    url: './assets/img/items/earthRuneRecipe.png',
    value: 150,
    type: ItemType.recipe,
    recipeId: RecipeID.fishApplePie,
  },
  [ItemID.huntersFeastRecipe]: {
    id: ItemID.huntersFeastRecipe,
    tier: ItemTier.rare,
    url: './assets/img/items/earthRuneRecipe.png',
    value: 250,
    type: ItemType.recipe,
    recipeId: RecipeID.huntersFeast,
  },
}
