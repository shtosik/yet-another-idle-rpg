import { ItemID } from '../enums/ids/item-id.enum'
import { QuestID } from '../enums/ids/quest-id.enum'

const MINUTE = 60_000
const HOUR = 60 * MINUTE

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

export const FARM_SEEDS: Partial<Record<ItemID, FarmSeed>> = {
  [ItemID.turnipSeeds]: { seedId: ItemID.turnipSeeds, cropId: ItemID.turnip, tier: 1, growMs: 15 * MINUTE, yield: 4, requiredLevel: 1, xp: 3 },
  [ItemID.wheatSeeds]: { seedId: ItemID.wheatSeeds, cropId: ItemID.wheat, tier: 2, growMs: 45 * MINUTE, yield: 5, requiredLevel: 2, xp: 8 },
  [ItemID.silverleafSeeds]: { seedId: ItemID.silverleafSeeds, cropId: ItemID.silverleaf, tier: 3, growMs: 2 * HOUR, yield: 4, requiredLevel: 5, xp: 25 },
  [ItemID.appleSeeds]: { seedId: ItemID.appleSeeds, cropId: ItemID.apple, tier: 4, growMs: 4 * HOUR, yield: 6, requiredLevel: 8, xp: 60 },
  [ItemID.glowcapSpores]: { seedId: ItemID.glowcapSpores, cropId: ItemID.glowcap, tier: 5, growMs: 8 * HOUR, yield: 4, requiredLevel: 12, xp: 130 },
  [ItemID.heartrootSeeds]: { seedId: ItemID.heartrootSeeds, cropId: ItemID.heartroot, tier: 6, growMs: 12 * HOUR, yield: 3, requiredLevel: 17, xp: 260 },
  [ItemID.canopyBlossomSeeds]: { seedId: ItemID.canopyBlossomSeeds, cropId: ItemID.canopyBlossom, tier: 7, growMs: 24 * HOUR, yield: 2, requiredLevel: 22, xp: 520 },
}

/** Quests whose completion adds a plot (An Orchard Again, The Growers' Table); the quest chain (plan commit C10) fills it. */
export const PLOT_GRANT_QUEST_IDS: QuestID[] = []
