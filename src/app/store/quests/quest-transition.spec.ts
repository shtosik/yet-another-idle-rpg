import { FARM_SEEDS } from '../../../data/farming-data'
import { QUEST_STEP_AFTER_COMPLETED } from '../../../data/quests-data'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { ProfessionID } from '../../../enums/ids/profession-id.enum'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { ReputationID } from '../../../enums/reputation-id.enum'
import { harvest, initialFarm, plantAll, syncPlots } from '../player/farm'
import { statsInitialState } from '../player/player'
import { professionXpMultiplier } from '../player/professions'
import { QuestSlice, questTransition, TransitionContext } from './quest-transition'
import { orderKey } from './turn-in-cooldown'

const ORDER = QuestID.marthasOrder
const QUEST = QuestID.clearingOutTheBeach // one step, pays Josh's Heirloom
const NOW = 10_000_000
const rewards = { reputation: 4, gold: 30, farmingXp: 15 }

const slice = (over: Partial<QuestSlice> = {}): QuestSlice => ({
  questStepProgression: { [QUEST]: 1, [ORDER]: 1 },
  orders: { [ORDER]: { requirements: [{ itemId: ItemID.turnip, amount: 10 }], rewards } },
  lastTurnInAt: {},
  questCompletions: {},
  pinnedQuests: [QUEST, ORDER],
  ...over,
})
const ctx = (over: Partial<TransitionContext> = {}): TransitionContext => ({
  now: NOW, settled: true, stats: statsInitialState, itemCount: () => 99, fits: () => true, ...over,
})

describe('quest transition', () => {
  it('completes the last step: takes nothing extra, pays the data rewards, unpins, drops the baseline', () => {
    const t = questTransition(QUEST, 'advance', slice(), ctx())!
    expect(t.quests.questStepProgression[QUEST]).toBe(QUEST_STEP_AFTER_COMPLETED)
    expect(t.quests.pinnedQuests).toEqual([ORDER])
    expect(t.baselineStep).toBeNull()
    expect(t.payout?.items).toEqual([{ id: ItemID.joshsHeirloom, amount: 1 }])
  })

  it('changes nothing on the last step with a full inventory', () => {
    expect(questTransition(QUEST, 'advance', slice(), ctx({ fits: () => false }))).toBeNull()
    expect(questTransition(QUEST, 'end', slice(), ctx({ fits: () => false }))).toBeNull()
  })

  it('checks the reward fit with the turn-in items already taken out', () => {
    const fits = jasmine.createSpy('fits').and.returnValue(true)
    const t = questTransition(QuestID.meatShortage, 'end', slice({ questStepProgression: { [QuestID.meatShortage]: 1 } }), ctx({ fits }))!
    expect(t.take).toEqual([{ id: ItemID.crabMeat, amount: 30 }])
    expect(fits).toHaveBeenCalledWith(t.payout!.items, t.take)
  })

  it('refuses a quest that is not active', () => {
    expect(questTransition(QUEST, 'end', slice({ questStepProgression: {} }), ctx())).toBeNull()
  })

  it('completes an Order: takes its items, starts the cooldown, counts it, frees the quest', () => {
    const t = questTransition(ORDER, 'advance', slice({ questCompletions: { [ORDER]: 2 } }), ctx())!
    expect(t.take).toEqual([{ id: ItemID.turnip, amount: 10 }])
    expect(t.quests.questStepProgression[ORDER]).toBeUndefined()
    expect(t.quests.orders[ORDER]).toBeUndefined()
    expect(t.quests.lastTurnInAt[orderKey(ORDER)]).toBe(NOW)
    expect(t.quests.questCompletions[ORDER]).toBe(3)
    expect(t.payout).toEqual({
      stats: [{ stat: 'goldCoins', amount: 30 }],
      items: [],
      reputation: [{ reputationId: ReputationID.farmingGuild, amount: 4 }],
      professionXp: [{ professionId: ProfessionID.farming, amount: 15 }],
    })
  })

  it('refuses an Order while its cooldown runs, the clock is unsettled or its items are missing', () => {
    expect(questTransition(ORDER, 'end', slice({ lastTurnInAt: { [orderKey(ORDER)]: NOW - 1000 } }), ctx())).toBeNull()
    expect(questTransition(ORDER, 'end', slice(), ctx({ settled: false }))).toBeNull()
    expect(questTransition(ORDER, 'end', slice(), ctx({ itemCount: () => 9 }))).toBeNull()
  })

  it('refuses an Order whose rewards do not fit: nothing taken, no cooldown', () => {
    expect(questTransition(ORDER, 'end', slice(), ctx({ fits: () => false }))).toBeNull()
  })

  it('multiplies profession XP the same for an Order and a harvest', () => {
    const stats = { ...statsInitialState, farmXpMultiplier: 0.5 }
    const seed = FARM_SEEDS[ItemID.turnipSeeds]!
    const planted = plantAll({ ...initialFarm, seeds: { [ItemID.turnipSeeds]: 1 } }, ItemID.turnipSeeds, { now: 0, level: 30, plotLimit: 1, seedSaveChance: 0 }, () => 1)
    const farm = { ...planted, plots: syncPlots(planted.plots, seed.growMs, 0) }
    const harvested = harvest(farm, 0, { doubleChance: 0, bonusChance: 0, xpMultiplier: professionXpMultiplier(stats, ProfessionID.farming), fits: () => true })

    const order = questTransition(ORDER, 'end', slice({ orders: { [ORDER]: { requirements: [], rewards: { ...rewards, farmingXp: seed.xp } } } }), ctx({ stats }))!

    expect(harvested.xp).toBe(Math.round(seed.xp * 1.5))
    expect(order.payout?.professionXp[0].amount).toBe(harvested.xp)
  })
})
