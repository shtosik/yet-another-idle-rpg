/** Gear upgrading tuning. Chances are indexed by the resulting upgrade level. */
export const UPGRADE_LEVEL_CAP = 5
export const UPGRADE_BONUS_PER_LEVEL = 0.1
export const UPGRADE_MILESTONE_LEVEL = 5
export const UPGRADE_MILESTONE_BONUS = 0.25
export const UPGRADE_COST_FACTOR = 1
/** Percent of eligible gear drops that arrive at +1 after registering Pathfinder's Seal. */
export const PATHFINDERS_SEAL_UPGRADED_DROP_CHANCE = 10
export const UPGRADE_CHANCES: Readonly<Record<number, number>> = {
  1: 1, 2: 0.9, 3: 0.8, 4: 0.7, 5: 0.6,
  6: 0.5, 7: 0.4, 8: 0.3, 9: 0.2, 10: 0.1,
}
