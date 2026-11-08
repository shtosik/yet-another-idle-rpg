export interface ClaimPlanInput {
  /** Host time of the last `lastSeenAt` write; `null` when the save has none. */
  lastSeen: number | null
  /** Host time where the absence ends. */
  claimEnd: number
  /** Game time left of the arena run when the claim started waiting; `null` without a run. */
  arenaRemaining: number | null
  /** Most time one claim pays for. */
  cap: number
}

export interface ClaimPlan {
  /** Game time that moves: the gap, capped. A clock moved back gives 0. */
  advanceMs: number
  /** True when the arena run ran out within the absence: it ends at its own end time first. */
  arenaEnded: boolean
  /** Part of `advanceMs` the arena run used up. */
  arenaMs: number
  /** Part of `advanceMs` left to simulate as kills (the caller still skips it under the minimum claim). */
  paidMs: number
}

/** Splits the time away into the capped gap, the arena run's share and the time paid as kills. */
export function planClaim({ lastSeen, claimEnd, arenaRemaining, cap }: ClaimPlanInput): ClaimPlan {
  const gapMs = lastSeen === null ? 0 : Math.max(0, claimEnd - lastSeen)
  const advanceMs = Math.min(cap, gapMs)
  const arenaEnded = arenaRemaining !== null && advanceMs >= arenaRemaining
  const arenaMs = arenaEnded ? Math.max(0, arenaRemaining) : 0
  return { advanceMs, arenaEnded, arenaMs, paidMs: advanceMs - arenaMs }
}
