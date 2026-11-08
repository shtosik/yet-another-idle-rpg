import { DialogueContext, EFFECT_HANDLERS } from './dialogue-effect-handlers'
import { ItemID } from '../../enums/ids/item-id.enum'
import { QuestID } from '../../enums/ids/quest-id.enum'
import { NpcID } from '../../enums/map/npc-id.enum'
import { QuestProgression } from '../../types/quests/quest-progression.type'
import { ItemStack } from '../store/player/inventory'

/** A context with only the state the cost and canApply checks read. */
function fakeContext(state: {
  progression?: QuestProgression
  held?: Partial<Record<ItemID, number>>
  arenaRewards?: ItemStack[]
  cooling?: boolean
  canRegisterSeal?: boolean
} = {}): DialogueContext {
  return {
    player: {
      itemCount: (id: ItemID) => state.held?.[id] ?? 0,
      canRegisterPathfindersSeal: () => state.canRegisterSeal ?? false,
    },
    quests: { questStepProgression: () => state.progression ?? {}, orders: () => ({}) },
    battle: { arenaRewards: () => state.arenaRewards ?? [] },
    cooldowns: { remainingMs: () => state.cooling ? 1000 : 0 },
  } as unknown as DialogueContext
}

describe('dialogue effect handlers', () => {
  describe('stat', () => {
    it('costs the gold a deduct takes, and nothing for other stats or awards', () => {
      const cost = EFFECT_HANDLERS.stat.cost!
      const ctx = fakeContext()
      expect(cost({ type: 'stat', action: 'deduct', stats: [{ stat: 'goldCoins', amount: 30 }, { stat: 'experience', amount: 5 }] }, ctx).gold).toBe(30)
      expect(cost({ type: 'stat', action: 'award', stats: [{ stat: 'goldCoins', amount: 30 }] }, ctx).gold).toBe(0)
    })

    describe('apply', () => {
      const run = (gold: number) => {
        const player = jasmine.createSpyObj('PlayerStore', ['spend', 'updatePlayerStats'])
        player.spend.and.callFake((_: string, amount: number) => gold >= amount)
        EFFECT_HANDLERS.stat.apply(
          { type: 'stat', action: 'deduct', stats: [{ stat: 'goldCoins', amount: 20 }, { stat: 'experience', amount: 5 }] },
          { player } as unknown as DialogueContext,
        )
        return player
      }

      it('pays a gold fee once through spend and deducts the other stats', () => {
        const player = run(100)
        expect(player.spend).toHaveBeenCalledOnceWith('gold', 20)
        expect(player.updatePlayerStats).toHaveBeenCalledOnceWith([{ stat: 'experience', amount: -5 }])
      })

      it('applies nothing when the fee is refused', () => {
        expect(run(10).updatePlayerStats).not.toHaveBeenCalled()
      })
    })
  })

  describe('item', () => {
    it('adds what it gives and removes what it takes', () => {
      const cost = EFFECT_HANDLERS.item.cost!
      const items = [{ itemId: ItemID.crabMeat, amount: 2 }]
      expect(cost({ type: 'item', action: 'give', items }, fakeContext())).toEqual({ adds: [{ id: ItemID.crabMeat, amount: 2 }] })
      expect(cost({ type: 'item', action: 'take', items }, fakeContext())).toEqual({ removes: [{ id: ItemID.crabMeat, amount: 2 }] })
    })
  })

  describe('quest', () => {
    const cost = EFFECT_HANDLERS.quest.cost!

    it('costs nothing to start or for a quest that is not active', () => {
      expect(cost({ type: 'quest', questId: QuestID.meatShortage, action: 'start' }, fakeContext())).toEqual({})
      expect(cost({ type: 'quest', questId: QuestID.meatShortage, action: 'advance' }, fakeContext())).toEqual({})
    })

    it('removes the step items of an active quest', () => {
      const ctx = fakeContext({ progression: { [QuestID.meatShortage]: 1 } })
      expect(cost({ type: 'quest', questId: QuestID.meatShortage, action: 'advance' }, ctx).removes)
        .toEqual([{ id: ItemID.crabMeat, amount: 30 }])
    })

    it('adds the item rewards of the step that completes the quest', () => {
      const ctx = fakeContext({ progression: { [QuestID.clearingOutTheBeach]: 1 } })
      expect(cost({ type: 'quest', questId: QuestID.clearingOutTheBeach, action: 'advance' }, ctx).adds)
        .toEqual([{ id: ItemID.joshsHeirloom, amount: 1 }])
    })
  })

  describe('arena', () => {
    it('adds the waiting rewards on claim, nothing on enter', () => {
      const rewards = [{ id: ItemID.crabMeat, amount: 3 }]
      const ctx = fakeContext({ arenaRewards: rewards })
      expect(EFFECT_HANDLERS.arena.cost!({ type: 'arena', action: 'claim' }, ctx)).toEqual({ adds: rewards })
      expect(EFFECT_HANDLERS.arena.cost!({ type: 'arena', action: 'enter' }, ctx)).toEqual({})
    })
  })

  describe('registerPathfindersSeal', () => {
    it('applies only while the Seal can be registered', () => {
      const canApply = EFFECT_HANDLERS.registerPathfindersSeal.canApply!
      expect(canApply({ type: 'registerPathfindersSeal' }, fakeContext({ canRegisterSeal: true }))).toBeTrue()
      expect(canApply({ type: 'registerPathfindersSeal' }, fakeContext({ canRegisterSeal: false }))).toBeFalse()
    })
  })

  describe('reputationTurnIn', () => {
    const canApply = EFFECT_HANDLERS.reputationTurnIn.canApply!
    const effect = { type: 'reputationTurnIn', npcId: NpcID.laHarparBartender } as const

    it('applies with a full bundle beyond what active quests keep back', () => {
      expect(canApply(effect, fakeContext({ held: { [ItemID.crabMeat]: 20 } }))).toBeTrue()
      expect(canApply(effect, fakeContext({ held: { [ItemID.crabMeat]: 19 } }))).toBeFalse()
      // Meat Shortage keeps 30 crab meat back.
      expect(canApply(effect, fakeContext({ held: { [ItemID.crabMeat]: 49 }, progression: { [QuestID.meatShortage]: 1 } }))).toBeFalse()
    })

    it('does not apply while the bundle cools down', () => {
      expect(canApply(effect, fakeContext({ held: { [ItemID.crabMeat]: 20 }, cooling: true }))).toBeFalse()
    })
  })
})
