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

  it('closes once the town is Exalted', () => {
    playerStore.addItems([{ id: ItemID.crabMeat, amount: 20 }])
    playerStore.addReputation([{ townId: TownID.laHarpar, amount: 1500 }])

    expect(dialogue.getActiveResult(option('one'))).toBeUndefined()
  })
})
