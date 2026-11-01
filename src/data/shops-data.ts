import { ShopID } from '../enums/ids/shop-id.enum'
import { ItemID } from '../enums/ids/item-id.enum'
import { ItemTier } from '../enums/items/item-tier.enum'
import { ItemType } from '../enums/items/item-type.enum'
import { Shop } from '../types/shop/shop.type'
import { TownID } from '../enums/map/town-id.enum'
import { ReputationTier } from '../enums/reputation-tier.enum'

const SHOPS_DATA: Record<ShopID, Shop> = {
  [ShopID.mawoodMagicShop]: {
    id: ShopID.mawoodMagicShop,
    nameKey: 'shop:names.mawoodMagicShop',
    items: [
      { itemId: ItemID.spellbook,       tier: ItemTier.legendary, price: 5000, maxStock: 1,  refreshable: false },
      { itemId: ItemID.runeAltar,       tier: ItemTier.rare,      price: 1000, maxStock: 1,  refreshable: false },
      { itemId: ItemID.earthRune,       tier: ItemTier.normal,    price: 25,   maxStock: 99, refreshable: true  },
      { itemId: ItemID.waterRune,       tier: ItemTier.normal,    price: 25,   maxStock: 99, refreshable: true  },
      { itemId: ItemID.earthRuneRecipe, tier: ItemTier.uncommon,  price: 500,  maxStock: 1,  refreshable: false },
      { itemId: ItemID.magicStaff,      tier: ItemTier.uncommon,  price: 3000, maxStock: 1,  refreshable: false },
      { itemId: ItemID.mysticHood,      tier: ItemTier.uncommon,  price: 4000, maxStock: 1,  refreshable: false },
      { itemId: ItemID.rootwalkerBoots, tier: ItemTier.rare,      price: 6000, maxStock: 1,  refreshable: false, minReputation: { townId: TownID.mawood, tier: ReputationTier.honored } },
    ],
    // A collector of the arcane: runes, gear and rare monster parts, nothing else.
    buys: [ItemType.resource, ItemType.equipment],
    sellMultipliers: {
      items: {
        [ItemID.fireRune]: 1.5,
        [ItemID.airRune]: 1.5,
        [ItemID.earthRune]: 1.5,
        [ItemID.waterRune]: 1.5,
        [ItemID.elderSilk]: 1.5,
        [ItemID.harpyFeather]: 1.5,
        [ItemID.matriarchPlume]: 1.25,
      },
    },
  },
  [ShopID.laHarparShop]: {
    id: ShopID.laHarparShop,
    nameKey: 'shop:names.laHarparShop',
    items: [
      { itemId: ItemID.skillPointBook, tier: ItemTier.legendary, price: 5000, maxStock: 1,  refreshable: false },
      { itemId: ItemID.fishMeat,       tier: ItemTier.normal,    price: 10,   maxStock: 99, refreshable: true  },
      { itemId: ItemID.apple,          tier: ItemTier.normal,    price: 25,   maxStock: 99, refreshable: true  },
      { itemId: ItemID.cookingPot,     tier: ItemTier.uncommon,  price: 400,  maxStock: 1,  refreshable: false },
      { itemId: ItemID.woodenBow,      tier: ItemTier.uncommon,  price: 2500, maxStock: 1,  refreshable: true  },
      { itemId: ItemID.apprenticeRobe, tier: ItemTier.uncommon,  price: 1500, maxStock: 1,  refreshable: false },
      { itemId: ItemID.fireRune,       tier: ItemTier.normal,    price: 20,   maxStock: 99, refreshable: true  },
      { itemId: ItemID.airRune,        tier: ItemTier.normal,    price: 20,   maxStock: 99, refreshable: true  },
      { itemId: ItemID.earthRune,      tier: ItemTier.normal,    price: 20,   maxStock: 99, refreshable: true  },
      { itemId: ItemID.waterRune,      tier: ItemTier.normal,    price: 20,   maxStock: 99, refreshable: true  },
      { itemId: ItemID.fishApplePieRecipe, tier: ItemTier.uncommon, price: 300, maxStock: 1, refreshable: false },
      { itemId: ItemID.cheese,             tier: ItemTier.normal,   price: 30,   maxStock: 99, refreshable: true,  minReputation: { townId: TownID.laHarpar, tier: ReputationTier.honored } },
      { itemId: ItemID.venisonRoastRecipe, tier: ItemTier.uncommon, price: 300,  maxStock: 1,  refreshable: false, minReputation: { townId: TownID.laHarpar, tier: ReputationTier.honored } },
      { itemId: ItemID.wharfRunnersBoots,  tier: ItemTier.rare,     price: 3000, maxStock: 1,  refreshable: false, minReputation: { townId: TownID.laHarpar, tier: ReputationTier.honored } },
    ],
    // A harbour trader: buys anything, pays best for the sea's catch and cooked food.
    sellMultipliers: {
      types: { [ItemType.food]: 1.25 },
      items: {
        [ItemID.fishMeat]: 1.5,
        [ItemID.crabMeat]: 1.5,
        [ItemID.turtleShell]: 1.5,
        [ItemID.feather]: 1.5,
      },
    },
  },
  [ShopID.mawoodApothecary]: {
    id: ShopID.mawoodApothecary,
    nameKey: 'shop:names.mawoodApothecary',
    items: [
      { itemId: ItemID.mortarAndPestle, tier: ItemTier.uncommon, price: 800, maxStock: 1,  refreshable: false },
      { itemId: ItemID.vialOfWater,     tier: ItemTier.normal,   price: 15,  maxStock: 99, refreshable: true  },
      { itemId: ItemID.minorManaPotion,         tier: ItemTier.normal,   price: 60,  maxStock: 20, refreshable: true,  minReputation: { townId: TownID.mawood, tier: ReputationTier.honored } },
      { itemId: ItemID.greaterManaPotionRecipe, tier: ItemTier.uncommon, price: 300, maxStock: 1,  refreshable: false, minReputation: { townId: TownID.mawood, tier: ReputationTier.honored } },
    ],
    // Only ingredients and remedies; reagents and potions pay best.
    buys: [ItemType.resource, ItemType.potion, ItemType.food],
    sellMultipliers: {
      types: { [ItemType.potion]: 1.5 },
      items: {
        [ItemID.slimeResidue]: 2,
        [ItemID.spiderFang]: 1.5,
        [ItemID.spiderSilk]: 1.5,
        [ItemID.ratTail]: 1.5,
        [ItemID.boneFragment]: 1.5,
        [ItemID.ancientWood]: 1.5,
      },
    },
  },
  [ShopID.explorersGuildStore]: {
    id: ShopID.explorersGuildStore,
    nameKey: 'shop:names.explorersGuildStore',
    currency: 'explorerTokens',
    buys: [],
    items: [
      // Rank 0: basics
      { itemId: ItemID.minorManaPotion,     tier: ItemTier.normal,    price: 1,  maxStock: 10, refreshable: true },
      { itemId: ItemID.crabStewRecipe,      tier: ItemTier.uncommon,  price: 4,  maxStock: 1,  refreshable: false },
      { itemId: ItemID.cheesePlatterRecipe, tier: ItemTier.uncommon,  price: 6,  maxStock: 1,  refreshable: false },
      { itemId: ItemID.skillPointBook,      tier: ItemTier.legendary, price: 15, maxStock: 1,  refreshable: true },
      // Rank 1: more space and recipes
      { itemId: ItemID.guildSatchel,        tier: ItemTier.rare,      price: 20, maxStock: 1,  refreshable: false, minRank: 1 },
      { itemId: ItemID.huntersFeastRecipe,  tier: ItemTier.uncommon,  price: 12, maxStock: 1,  refreshable: false, minRank: 1 },
      { itemId: ItemID.ambushScroll,        tier: ItemTier.rare,      price: 25, maxStock: 1,  refreshable: false, minRank: 1 },
      // Rank 2: combat-changers, bought once
      { itemId: ItemID.secondContract,      tier: ItemTier.legendary, price: 40, maxStock: 1,  refreshable: false, minRank: 2 },
      { itemId: ItemID.bountyMark,          tier: ItemTier.legendary, price: 40, maxStock: 1,  refreshable: false, minRank: 2 },
    ],
  },
}

export default SHOPS_DATA
