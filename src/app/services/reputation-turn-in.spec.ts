import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { DialogueManagerService } from './dialogue-manager.service'
import { PlayerStore } from '../store/player/player.store'
import { QuestsStore } from '../store/quests/quests.store'
import { DialogueOption } from '../../interfaces/dialogues/dialogue-option.type'
import { ItemID } from '../../enums/ids/item-id.enum'
import { NpcID } from '../../enums/map/npc-id.enum'
import { QuestID } from '../../enums/ids/quest-id.enum'
import { TownID } from '../../enums/map/town-id.enum'
import { ReputationTier } from '../../enums/reputation-tier.enum'
import { DialogueNode } from '../../interfaces/dialogues/dialogue-node.interface'
import LA_HARPAR_BARTENDER, { BartenderDialogue } from '../../data/dialogues/laHarparTown/laHarparBartender'
import LA_HARPAR_JOSH, { JoshDialogue } from '../../data/dialogues/laHarparTown/laHarparJosh'

describe('reputation turn-ins in dialogue', () => {
  let dialogue: DialogueManagerService
  let playerStore: InstanceType<typeof PlayerStore>

  const option = (bundles: 'one' | 'all'): DialogueOption<number> => ({
    responseKey: 'quests:reputation.turnInOne',
    results: [{ effects: [{ type: 'reputationTurnIn', npcId: NpcID.laHarparBartender, bundles }] }],
  })

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    dialogue = TestBed.inject(DialogueManagerService)
    playerStore = TestBed.inject(PlayerStore)
  })

  afterEach(() => localStorage.clear())

  it('takes every full bundle and pays reputation only', () => {
    playerStore.addItems([{ id: ItemID.crabMeat, amount: 59 }])
    const gold = playerStore.stats().goldCoins

    dialogue.selectOption(option('all'))

    expect(playerStore.itemCount(ItemID.crabMeat)).toBe(19)
    expect(playerStore.reputation()[TownID.laHarpar]).toBe(20)
    expect(playerStore.stats().goldCoins).toBe(gold)
  })

  it('keeps what an active quest step needs', () => {
    TestBed.inject(QuestsStore).startQuest(QuestID.meatShortage) // 30 Crab Meat
    playerStore.addItems([{ id: ItemID.crabMeat, amount: 45 }])

    expect(dialogue.canApplyResult(dialogue.getActiveResult(option('one')))).toBeFalse()

    playerStore.addItems([{ id: ItemID.crabMeat, amount: 5 }])
    dialogue.selectOption(option('all'))

    expect(playerStore.itemCount(ItemID.crabMeat)).toBe(30)
  })

  it('checks a reputation tier condition', () => {
    const honored = { type: 'reputation', townId: TownID.mawood, tier: ReputationTier.honored } as const
    playerStore.addReputation([{ townId: TownID.mawood, amount: 199 }])
    expect(dialogue.checkCondition(honored)).toBeFalse()
    playerStore.addReputation([{ townId: TownID.mawood, amount: 1 }])
    expect(dialogue.checkCondition(honored)).toBeTrue()
  })

  it('answers for free at Friendly instead of charging again', () => {
    const findOption = (node: DialogueNode<number>, key: string) => node.options.find(o => o.responseKey.endsWith(key))!
    const whatIsThisPlace = findOption(LA_HARPAR_BARTENDER[BartenderDialogue.default], 'default.whatIsThisPlace')
    const askJosh = findOption(LA_HARPAR_JOSH[JoshDialogue.default], 'greeting.opt1')
    playerStore.updatePlayerStats([{ stat: 'goldCoins', amount: 100 }])
    playerStore.addReputation([{ townId: TownID.laHarpar, amount: 50 }])
    const gold = playerStore.stats().goldCoins

    dialogue.selectOption(whatIsThisPlace)
    expect(dialogue.getActiveResult(askJosh)?.next).toBe(JoshDialogue.talkFree)
    dialogue.selectOption(askJosh)

    expect(playerStore.stats().goldCoins).toBe(gold)
  })

  it('closes once the town is Exalted', () => {
    playerStore.addItems([{ id: ItemID.crabMeat, amount: 20 }])
    playerStore.addReputation([{ townId: TownID.laHarpar, amount: 1500 }])

    expect(dialogue.getActiveResult(option('one'))).toBeUndefined()
  })
})
