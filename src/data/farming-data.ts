import { ItemID } from '../enums/ids/item-id.enum'

const MINUTE = 60_000

/** What planting a seed does (docs/ideas/farm-and-husbandry.md §7, §7a). */
export interface FarmSeed {
  /** An `ITEM_DATA` entry of `ItemType.seed`; one count is used per planting. */
  seedId: ItemID
  /** Item granted on harvest. */
  cropId: ItemID
  tier: number
  /** Grow time at no reduction. */
  growMs: number
  /** Crops per harvest before the double and bonus rolls. */
  yield: number
  /** Farming expertise needed to plant it. */
  requiredLevel: number
  /** Farming XP per harvested plot. */
  xp: number
}

// Tiers 3-7 (Silverleaf, Apple, Glowcap, Heartroot, Canopy Blossom) come with the content commit.
export const FARM_SEEDS: Partial<Record<ItemID, FarmSeed>> = {
  [ItemID.turnipSeeds]: { seedId: ItemID.turnipSeeds, cropId: ItemID.turnip, tier: 1, growMs: 15 * MINUTE, yield: 4, requiredLevel: 1, xp: 3 },
  [ItemID.wheatSeeds]: { seedId: ItemID.wheatSeeds, cropId: ItemID.wheat, tier: 2, growMs: 45 * MINUTE, yield: 5, requiredLevel: 2, xp: 8 },
}
