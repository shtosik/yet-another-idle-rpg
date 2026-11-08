import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { PlayerStore } from '../player/player.store'
import { orderKey, QuestsStore } from './quests.store'
import { saveGameStateNow } from '../helpers/with-game-state-sync.hook'
import { ModalService } from '../../services/modal.service'
import { DialogueManagerService } from '../../services/dialogue-manager.service'
import { TurnInCooldownService } from '../../services/turn-in-cooldown.service'
import QUEST_DATA, { QuestProps } from '../../../data/quests-data'
import { DialogueOption } from '../../../interfaces/dialogues/dialogue-option.type'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { NpcID } from '../../../enums/map/npc-id.enum'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { ProfessionID } from '../../../enums/ids/profession-id.enum'
import { ReputationID } from '../../../enums/reputation-id.enum'
import { ReputationTier } from '../../../enums/reputation-tier.enum'
import { bundleKey } from './turn-in-cooldown'

const HOUR = 60 * 60 * 1000
const ORDER = QuestID.proveYourAim // borrowed id: the fixture below replaces its data for these specs only
const KEY = orderKey(ORDER)

/** Test-only order (not shipped data): 10-20 of Crab Meat or Feather; with a roll of 0, 10 Crab Meat. */
const FIXTURE: QuestProps = {
  questId: ORDER,
  rewards: [],
  startRequirements: [],
  steps: [{ description: 'Bring the order.', turnInNpc: NpcID.laHarparBartender, requirements: [{ type: 'pickedItems' }] }],
  repeat: {
    reputationId: ReputationID.laHarpar,
    professionId: ProfessionID.farming,
    picks: 1,
    pool: [
      { itemId: ItemID.crabMeat, minTier: ReputationTier.neutral, reputationPer10: 5, goldPerItem: 2, xpPerItem: 3 },
      { itemId: ItemID.feather, minTier: ReputationTier.neutral, reputationPer10: 5, goldPerItem: 2, xpPerItem: 3 },
    ],
  },
}

describe('repeatable orders', () => {
  const original = QUEST_DATA[ORDER]
  let quests: InstanceType<typeof QuestsStore>
  let player: InstanceType<typeof PlayerStore>
  let dialogue: DialogueManagerService
  let cooldowns: TurnInCooldownService
  let clock: number

  const option = (action: 'advance' | 'end'): DialogueOption<number> => ({
    responseKey: 'test.turnIn',
    results: [{ effects: [{ type: 'quest', questId: ORDER, action }] }],
  })
  const snapshot = () => ({
    crab: player.itemCount(ItemID.crabMeat),
    gold: player.stats().goldCoins,
    reputation: player.reputation()[ReputationID.laHarpar] ?? 0,
    xp: player.professions()[ProfessionID.farming]?.experience,
    step: quests.getQuestStep(ORDER),
    order: quests.orders()[ORDER],
    lastTurnInAt: quests.lastTurnInAt()[KEY],
    completions: quests.questCompletions()[ORDER],
  })

  function setUp() {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    quests = TestBed.inject(QuestsStore)
    player = TestBed.inject(PlayerStore)
    dialogue = TestBed.inject(DialogueManagerService)
    cooldowns = TestBed.inject(TurnInCooldownService)
    spyOn(TestBed.inject(ModalService), 'openQuestCompleted')
  }

  beforeEach(() => {
    localStorage.clear()
    QUEST_DATA[ORDER] = FIXTURE
    clock = 1_000_000
    spyOn(Date, 'now').and.callFake(() => clock)
    spyOn(Math, 'random').and.returnValue(0)
    setUp()
    player.unlockProfession(ProfessionID.farming)
  })

  afterEach(() => {
    QUEST_DATA[ORDER] = original
    localStorage.clear()
  })

  it('rolls the pick and its rewards at start, and a reload does not re-roll', () => {
    quests.startQuest(ORDER)
    expect(quests.orders()[ORDER]).toEqual({
      requirements: [{ itemId: ItemID.crabMeat, amount: 10 }],
      rewards: { reputation: 5, gold: 20, farmingXp: 30 },
    })

    saveGameStateNow()
    TestBed.resetTestingModule()
    setUp()
    ;(Math.random as jasmine.Spy).and.returnValue(0.99)

    expect(quests.orders()[ORDER]?.requirements).toEqual([{ itemId: ItemID.crabMeat, amount: 10 }])
    quests.startQuest(ORDER) // already started: no new roll
    expect(quests.orders()[ORDER]?.requirements).toEqual([{ itemId: ItemID.crabMeat, amount: 10 }])
  })

  it('rolls an amount from 10 to 20', () => {
    ;(Math.random as jasmine.Spy).and.returnValue(0.99)
    quests.startQuest(ORDER)
    expect(quests.orders()[ORDER]?.requirements[0].amount).toBe(20)
  })

  it('changes nothing when the completion is rejected', () => {
    quests.startQuest(ORDER)
    player.grant([{ id: ItemID.crabMeat, amount: 9 }], 'lossy')
    const before = snapshot()

    expect(quests.completeOrder(ORDER, clock)).toBeFalse()
    expect(snapshot()).toEqual(before)
    expect(TestBed.inject(ModalService).openQuestCompleted).not.toHaveBeenCalled()

    player.grant([{ id: ItemID.crabMeat, amount: 1 }], 'lossy')
    quests.recordTurnIn(KEY, clock) // a cooling cheat or loaded save still rejects
    const cooling = snapshot()
    expect(quests.completeOrder(ORDER, clock)).toBeFalse()
    expect(snapshot()).toEqual(cooling)
  })

  it('completes atomically: items, rewards, cooldown, history, and the next start is free', () => {
    quests.startQuest(ORDER)
    player.grant([{ id: ItemID.crabMeat, amount: 12 }], 'lossy')
    const before = snapshot()

    expect(quests.completeOrder(ORDER, clock)).toBeTrue()

    expect(snapshot()).toEqual({
      crab: 2,
      gold: before.gold + 20,
      reputation: before.reputation + 5,
      xp: (before.xp ?? 0) + 30,
      step: undefined,
      order: undefined,
      lastTurnInAt: clock,
      completions: 1,
    })
    expect(TestBed.inject(ModalService).openQuestCompleted).toHaveBeenCalledTimes(1)
  })

  it('keeps a bundle from consuming a reserved item', () => {
    const bundle = { type: 'reputationTurnIn', npcId: NpcID.laHarparBartender } as const
    quests.startQuest(ORDER) // reserves 10 Crab Meat; a bundle is 20

    player.grant([{ id: ItemID.crabMeat, amount: 25 }], 'lossy')
    expect(dialogue.turnIn(bundle)).toEqual(jasmine.objectContaining({ kept: 10, bundles: 0 }))

    player.grant([{ id: ItemID.crabMeat, amount: 5 }], 'lossy')
    expect(dialogue.turnIn(bundle).bundles).toBe(1)
  })

  for (const action of ['advance', 'end'] as const) {
    describe(`through the dialogue ${action} route`, () => {
      it('completes the same way', () => {
        quests.startQuest(ORDER)
        player.grant([{ id: ItemID.crabMeat, amount: 10 }], 'lossy')

        dialogue.selectOption(option(action))

        expect(snapshot()).toEqual(jasmine.objectContaining({ crab: 0, step: undefined, order: undefined, lastTurnInAt: clock, completions: 1 }))
      })

      it('rejects the same way', () => {
        quests.startQuest(ORDER)
        player.grant([{ id: ItemID.crabMeat, amount: 9 }], 'lossy')
        const before = snapshot()

        dialogue.selectOption(option(action))

        expect(snapshot()).toEqual(before)
      })
    })
  }

  it('has its own cooldown, per turn-in', () => {
    quests.startQuest(ORDER)
    player.grant([{ id: ItemID.crabMeat, amount: 10 }], 'lossy')
    quests.completeOrder(ORDER, clock)
    cooldowns.tick(clock)

    expect(dialogue.checkCondition({ type: 'turnInCooldown', key: KEY, state: 'cooling' })).toBeTrue()
    expect(dialogue.checkCondition({ type: 'turnInCooldown', key: bundleKey(NpcID.laHarparBartender, ItemID.crabMeat), state: 'ready' })).toBeTrue()
    const offer: DialogueOption<number> = {
      responseKey: 'test.offer',
      results: [{ effects: [{ type: 'quest', questId: ORDER, action: 'start' }] }],
    }
    expect(dialogue.getActiveResult(offer)).toBeUndefined() // not offered while cooling

    quests.startQuest(ORDER) // cooling: no new order
    expect(quests.getQuestStep(ORDER)).toBeUndefined()

    clock += 2 * HOUR + 1000
    cooldowns.tick(clock)
    expect(dialogue.getActiveResult(offer)).toBeDefined()
    quests.startQuest(ORDER)
    expect(quests.getQuestStep(ORDER)).toBe(1)
  })
})
