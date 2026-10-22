/** XP needed to go from `level - 1` to `level` (Tibia's cumulative formula, used here as a per-level delta). */
export const calculateXp = (level: number) => (50 * (Math.pow(level, 3) - 6 * Math.pow(level, 2) + 17 * level - 12)) / 3
