import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { PlayerStore } from './player.store'
import { reputationProgress, reputationTier } from './reputation'
import { TownID } from '../../../enums/map/town-id.enum'
import { ReputationTier } from '../../../enums/reputation-tier.enum'
import { NpcID } from '../../../enums/map/npc-id.enum'
import { TitleID } from '../../../enums/ids/title-id.enum'
import { turnInBundles, turnInFor } from '../../../data/reputation-turn-ins'

describe('town reputation', () => {
  it('derives the tier from cumulative points', () => {
    expect(reputationTier(0)).toBe(ReputationTier.neutral)
    expect(reputationTier(49)).toBe(ReputationTier.neutral)
    expect(reputationTier(50)).toBe(ReputationTier.friendly)
    expect(reputationTier(599)).toBe(ReputationTier.honored)
    expect(reputationTier(99999)).toBe(ReputationTier.exalted)
  })

  it('measures progress from the current tier to the next', () => {
    expect(reputationProgress(140)).toEqual({ tier: ReputationTier.friendly, current: 90, needed: 150, nextThreshold: 200 })
    expect(reputationProgress(1500).nextThreshold).toBeNull()
  })

  it('hands over one full bundle or all of them, never a partial one', () => {
    const turnIn = turnInFor(NpcID.laHarparBartender)!
    expect(turnInBundles(turnIn, 19, 'one')).toBe(0)
    expect(turnInBundles(turnIn, 59, 'one')).toBe(1)
    expect(turnInBundles(turnIn, 59, 'all')).toBe(2)
  })

  describe('PlayerStore.addReputation', () => {
    let store: InstanceType<typeof PlayerStore>

    beforeEach(() => {
      localStorage.clear()
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
      store = TestBed.inject(PlayerStore)
    })

    afterEach(() => localStorage.clear())

    it('reports one tier-up per town, at the highest tier reached', () => {
      const tierUps = store.addReputation([
        { townId: TownID.mawood, amount: 150 },
        { townId: TownID.mawood, amount: 100 },
        { townId: TownID.laHarpar, amount: 10 },
      ])

      expect(tierUps).toEqual([{ townId: TownID.mawood, tier: ReputationTier.honored }])
      expect(store.reputation()).toEqual({ [TownID.mawood]: 250, [TownID.laHarpar]: 10 })
      expect(store.addReputation([{ townId: TownID.mawood, amount: 1 }])).toEqual([])
    })

    it('earns titles from tiers and only lets an earned one be shown', () => {
      store.selectTitle(TitleID.mawoodFriendly)
      expect(store.selectedTitle()).toBeNull()

      store.addReputation([{ townId: TownID.mawood, amount: 50 }])
      expect(store.earnedTitles()).toEqual([TitleID.mawoodFriendly])
      store.selectTitle(TitleID.mawoodFriendly)
      expect(store.selectedTitle()).toBe(TitleID.mawoodFriendly)
    })
  })
})
