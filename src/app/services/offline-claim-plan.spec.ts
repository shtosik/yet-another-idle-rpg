import { MIN_OFFLINE_CLAIM_IN_MS, OFFLINE_CAP_IN_MS } from './offline-progress.service'
import { planClaim } from './offline-claim-plan'

const HOUR = 60 * 60 * 1000
const plan = (gap: number, arenaRemaining: number | null = null, lastSeen: number | null = 1000) =>
  planClaim({ lastSeen, claimEnd: 1000 + gap, arenaRemaining, cap: OFFLINE_CAP_IN_MS })

describe('planClaim', () => {
  it('claims nothing when the clock moved back', () => {
    expect(plan(-HOUR)).toEqual({ advanceMs: 0, arenaEnded: false, arenaMs: 0, paidMs: 0 })
  })

  it('claims nothing without a last seen time', () => {
    expect(plan(HOUR, null, null).advanceMs).toBe(0)
  })

  it('caps the gap', () => {
    const result = plan(OFFLINE_CAP_IN_MS + HOUR)
    expect(result.advanceMs).toBe(OFFLINE_CAP_IN_MS)
    expect(result.paidMs).toBe(OFFLINE_CAP_IN_MS)
  })

  it('ends an arena run that ran out during the absence and pays the rest', () => {
    expect(plan(HOUR, HOUR / 4)).toEqual({ advanceMs: HOUR, arenaEnded: true, arenaMs: HOUR / 4, paidMs: HOUR * 0.75 })
  })

  it('ends a run that was already over when the claim started, with no arena time', () => {
    expect(plan(HOUR, -500)).toEqual({ advanceMs: HOUR, arenaEnded: true, arenaMs: 0, paidMs: HOUR })
  })

  it('leaves a run still going: no arena time, the whole gap in advance', () => {
    const result = plan(HOUR, 2 * HOUR)
    expect(result.arenaEnded).toBe(false)
    expect(result.arenaMs).toBe(0)
    expect(result.paidMs).toBe(HOUR)
  })

  it('reports a gap under the minimum claim as too short to pay', () => {
    expect(plan(MIN_OFFLINE_CLAIM_IN_MS - 1).paidMs).toBeLessThan(MIN_OFFLINE_CLAIM_IN_MS)
  })
})
