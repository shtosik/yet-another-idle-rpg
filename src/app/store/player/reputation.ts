import { ReputationTier } from '../../../enums/reputation-tier.enum'
import { TownID } from '../../../enums/map/town-id.enum'

/** Towns that keep reputation; quest rewards may only credit these (`validate` checks). */
export const REPUTATION_TOWNS: TownID[] = [TownID.laHarpar, TownID.mawood]

/** Cumulative points needed for each tier. */
export const REPUTATION_THRESHOLDS: Record<ReputationTier, number> = {
  [ReputationTier.neutral]: 0,
  [ReputationTier.friendly]: 50,
  [ReputationTier.honored]: 200,
  [ReputationTier.revered]: 600,
  [ReputationTier.exalted]: 1500,
}

export interface ReputationGain {
  townId: TownID
  amount: number
}

export interface TierUp {
  townId: TownID
  tier: ReputationTier
}

export const reputationTier = (points: number): ReputationTier => {
  let tier = ReputationTier.neutral
  while (tier < ReputationTier.exalted && points >= REPUTATION_THRESHOLDS[(tier + 1) as ReputationTier]) tier++
  return tier
}

export interface ReputationProgress {
  tier: ReputationTier
  /** Points since the current tier's threshold; at Exalted, equal to `needed` (a full bar). */
  current: number
  needed: number
  /** The next tier's threshold, `null` at Exalted. */
  nextThreshold: number | null
}

export const reputationProgress = (points: number): ReputationProgress => {
  const tier = reputationTier(points)
  if (tier === ReputationTier.exalted) return { tier, current: 1, needed: 1, nextThreshold: null }
  const floor = REPUTATION_THRESHOLDS[tier]
  const next = REPUTATION_THRESHOLDS[(tier + 1) as ReputationTier]
  return { tier, current: points - floor, needed: next - floor, nextThreshold: next }
}
