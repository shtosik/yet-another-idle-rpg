import { ProfessionID } from '../enums/ids/profession-id.enum'
import { PlayerStat } from '../types/player/player-stat.type'

/** A stat a profession's expertise grants. `amount` is a data amount (positive = better). */
export interface ExpertiseReward {
  stat: PlayerStat
  amount: number
}

/** A profession as the player sees it: "Farming expertise 7". Name: `app:professions.<ProfessionID key>`. */
export interface Profession {
  id: ProfessionID
  maxLevel: number
  /** Every level from 2 that is not a milestone gives this. Past `maxLevel` it keeps applying. */
  perLevel: ExpertiseReward
  /** The `perLevel` stat can gain at most this much from expertise. */
  perLevelTotalCap: number
  /** Given instead of `perLevel` at exactly this level; levels above `maxLevel` have none. */
  milestones: Record<number, ExpertiseReward>
}

const PROFESSIONS_DATA: Record<ProfessionID, Profession> = {
  [ProfessionID.farming]: {
    id: ProfessionID.farming,
    maxLevel: 30,
    perLevel: { stat: 'seedGrowthTimeReduction', amount: 0.005 },
    perLevelTotalCap: 0.5,
    milestones: {
      5: { stat: 'farmSeedSaveChance', amount: 0.1 },
      10: { stat: 'farmDoubleHarvestChance', amount: 0.05 },
      15: { stat: 'farmBonusCropChance', amount: 0.2 },
      20: { stat: 'turnInCooldownReduction', amount: 0.1 },
      25: { stat: 'farmXpMultiplier', amount: 0.1 },
      30: { stat: 'seedDropChance', amount: 0.25 },
    },
  },
}

export default PROFESSIONS_DATA
