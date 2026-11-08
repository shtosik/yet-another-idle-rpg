import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { DialogueManagerService } from './dialogue-manager.service'
import { PlayerStore } from '../store/player/player.store'
import { QuestsStore } from '../store/quests/quests.store'
import { DialogueOption } from '../../interfaces/dialogues/dialogue-option.type'
import { ItemID } from '../../enums/ids/item-id.enum'
import { NpcID } from '../../enums/map/npc-id.enum'
import { QuestID } from '../../enums/ids/quest-id.enum'
import { ReputationID } from '../../enums/reputation-id.enum'
import { ReputationTier } from '../../enums/reputation-tier.enum'
import { QuestState } from '../../enums/quest-state.enum'
import { DialogueNode } from '../../interfaces/dialogues/dialogue-node.interface'
import { GameClock } from './game-clock.service'
import { bundleKey } from '../store/quests/turn-in-cooldown'
import LA_HARPAR_BARTENDER, { BartenderDialogue } from '../../data/dialogues/laHarparTown/laHarparBartender'
import LA_HARPAR_JOSH, { JoshDialogue } from '../../data/dialogues/laHarparTown/laHarparJosh'

describe('reputation turn-ins in dialogue', () => {
  let dialogue: DialogueManagerService
  let playerStore: InstanceType<typeof PlayerStore>

  const option = (): DialogueOption<number> => ({
    responseKey: 'quests:reputation.turnIn',
    results: [{ effects: [{ type: 'reputationTurnIn', npcId: NpcID.laHarparBartender }] }],
  })
  const bartenderKey = bundleKey(NpcID.laHarparBartender, ItemID.crabMeat)
  const HOUR = 60 * 60 * 1000

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    dialogue = TestBed.inject(DialogueManagerService)
    playerStore = TestBed.inject(PlayerStore)
  })

  afterEach(() => localStorage.clear())

  it('takes one bundle and pays reputation only', () => {
    playerStore.grant([{ id: ItemID.crabMeat, amount: 59 }], 'lossy')
    const gold = playerStore.stats().goldCoins

    dialogue.selectOption(option())

    expect(playerStore.itemCount(ItemID.crabMeat)).toBe(39)
    expect(playerStore.reputation()[ReputationID.laHarpar]).toBe(10)
    expect(playerStore.stats().goldCoins).toBe(gold)
  })

  it('hands over nothing more until that bundle cools down, then one bundle again', () => {
    playerStore.grant([{ id: ItemID.crabMeat, amount: 60 }], 'lossy')
    dialogue.selectOption(option())
    expect(dialogue.checkCondition({ type: 'turnInCooldown', key: bartenderKey, state: 'cooling' })).toBeTrue()

    dialogue.selectOption(option())
    expect(playerStore.itemCount(ItemID.crabMeat)).toBe(40)

    TestBed.inject(GameClock).advance(2 * HOUR + 1000)
    expect(dialogue.checkCondition({ type: 'turnInCooldown', key: bartenderKey, state: 'ready' })).toBeTrue()
    dialogue.selectOption(option())
    expect(playerStore.itemCount(ItemID.crabMeat)).toBe(20)
    expect(playerStore.reputation()[ReputationID.laHarpar]).toBe(20)
  })

  it("does not cool another NPC's bundle", () => {
    playerStore.grant([{ id: ItemID.crabMeat, amount: 20 }], 'lossy')
    dialogue.selectOption(option())

    expect(dialogue.checkCondition({ type: 'turnInCooldown', key: bundleKey(NpcID.laHarparJosh, ItemID.feather), state: 'ready' })).toBeTrue()
  })

  it('keeps what an active quest step needs', () => {
    TestBed.inject(QuestsStore).startQuest(QuestID.meatShortage) // 30 Crab Meat
    playerStore.grant([{ id: ItemID.crabMeat, amount: 45 }], 'lossy')

    expect(dialogue.canApplyResult(dialogue.getActiveResult(option()))).toBeFalse()

    playerStore.grant([{ id: ItemID.crabMeat, amount: 5 }], 'lossy')
    dialogue.selectOption(option())

    expect(playerStore.itemCount(ItemID.crabMeat)).toBe(30)
  })

  it('checks a reputation tier condition', () => {
    const honored = { type: 'reputation', reputationId: ReputationID.mawood, tier: ReputationTier.honored } as const
    playerStore.addReputation([{ reputationId: ReputationID.mawood, amount: 199 }])
    expect(dialogue.checkCondition(honored)).toBeFalse()
    playerStore.addReputation([{ reputationId: ReputationID.mawood, amount: 1 }])
    expect(dialogue.checkCondition(honored)).toBeTrue()
  })

  it('answers for free at Friendly instead of charging again', () => {
    const findOption = (node: DialogueNode<number>, key: string) => node.options.find(o => o.responseKey.endsWith(key))!
    const whatIsThisPlace = findOption(LA_HARPAR_BARTENDER[BartenderDialogue.default], 'default.whatIsThisPlace')
    const askJosh = findOption(LA_HARPAR_JOSH[JoshDialogue.default], 'greeting.opt1')
    playerStore.updatePlayerStats([{ stat: 'goldCoins', amount: 100 }])
    playerStore.addReputation([{ reputationId: ReputationID.laHarpar, amount: 50 }])
    const gold = playerStore.stats().goldCoins

    dialogue.selectOption(whatIsThisPlace)
    expect(dialogue.getActiveResult(askJosh)?.next).toBe(JoshDialogue.talkFree)
    dialogue.selectOption(askJosh)

    expect(playerStore.stats().goldCoins).toBe(gold)
  })

  it('offers a Revered quest only at Revered', () => {
    const available = { type: 'quest', questId: QuestID.lastOrders, questState: QuestState.available } as const
    playerStore.addReputation([{ reputationId: ReputationID.laHarpar, amount: 599 }])
    expect(dialogue.checkCondition(available)).toBeFalse()
    playerStore.addReputation([{ reputationId: ReputationID.laHarpar, amount: 1 }])
    expect(dialogue.checkCondition(available)).toBeTrue()
  })

  it('closes once the town is Exalted', () => {
    playerStore.grant([{ id: ItemID.crabMeat, amount: 20 }], 'lossy')
    playerStore.addReputation([{ reputationId: ReputationID.laHarpar, amount: 1500 }])

    expect(dialogue.getActiveResult(option())).toBeUndefined()
  })
})
