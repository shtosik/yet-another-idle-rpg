/** Gear upgrading tuning. Chances are indexed by the resulting upgrade level. */
export const UPGRADE_LEVEL_CAP = 5
export const UPGRADE_BONUS_PER_LEVEL = 0.1
export const UPGRADE_MILESTONE_LEVEL = 5
export const UPGRADE_MILESTONE_BONUS = 0.25
export const UPGRADE_COST_FACTOR = 1
export const UPGRADE_CHANCES: Readonly<Record<number, number>> = {
  1: 1, 2: 1, 3: 1, 4: 1, 5: 1,
  6: 0.9, 7: 0.8, 8: 0.7, 9: 0.6, 10: 0.5,
}
