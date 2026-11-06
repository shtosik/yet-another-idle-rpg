import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { DialogueManagerService } from './dialogue-manager.service'
import { ModalService } from './modal.service'
import { PlayerStore } from '../store/player/player.store'
import { QuestsStore } from '../store/quests/quests.store'
import { DialogueNode } from '../../interfaces/dialogues/dialogue-node.interface'
import { QUEST_STEP_AFTER_COMPLETED } from '../../data/quests-data'
import { QuestID } from '../../enums/ids/quest-id.enum'
import { ItemID } from '../../enums/ids/item-id.enum'
import { NpcID } from '../../enums/map/npc-id.enum'
import FARM_WARDEN, { WardenDialogue } from '../../data/dialogues/farm/farmWarden'

const option = (node: DialogueNode<number>, key: string) => node.options.find(o => o.responseKey.endsWith(key))!

describe('Marta dialogue', () => {
  let dialogue: DialogueManagerService
  let playerStore: InstanceType<typeof PlayerStore>
  let questsStore: InstanceType<typeof QuestsStore>

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    spyOn(TestBed.inject(ModalService), 'openQuestCompleted')
    dialogue = TestBed.inject(DialogueManagerService)
    playerStore = TestBed.inject(PlayerStore)
    questsStore = TestBed.inject(QuestsStore)
  })

  afterEach(() => localStorage.clear())

  it('hands the letter over and keeps talking into the intro', () => {
    questsStore.startQuest(QuestID.silkAndWater)
    questsStore.endQuest(QuestID.silkAndWater)
    questsStore.startQuest(QuestID.seedsFromTheTerrace)
    playerStore.addItems([{ id: ItemID.guildLetter, amount: 1 }])
    dialogue.startDialogue(NpcID.farmWarden)

    expect(dialogue.activeNode()?.id).toBe(WardenDialogue.intro1)
    dialogue.selectOption(option(FARM_WARDEN[WardenDialogue.intro1], 'intro1.letter'))
    dialogue.selectOption(option(FARM_WARDEN[WardenDialogue.introLetter], 'introLetter.opt1'))

    expect(dialogue.activeNode()?.id).toBe(WardenDialogue.introNoSeeds)
    expect(questsStore.getQuestStep(QuestID.seedsFromTheTerrace)).toBe(QUEST_STEP_AFTER_COMPLETED)
    expect(playerStore.itemCount(ItemID.guildLetter)).toBe(0)
  })

  it('shows a ready quest only as its turn-in, not also as a reminder', () => {
    questsStore.startQuest(QuestID.silkAndWater)
    questsStore.endQuest(QuestID.silkAndWater)
    questsStore.startQuest(QuestID.seedsFromTheTerrace)
    questsStore.endQuest(QuestID.seedsFromTheTerrace)
    questsStore.startQuest(QuestID.theFirstFurrow)
    const hub = FARM_WARDEN[WardenDialogue.default]

    expect(dialogue.getActiveResult(option(hub, 'default.furrowProgress'))?.next).toBe(WardenDialogue.questFurrowProgress)
    expect(dialogue.getActiveResult(option(hub, 'default.furrowTurnIn'))).toBeUndefined()

    playerStore.addItems([{ id: ItemID.turnip, amount: 4 }])
    expect(dialogue.getActiveResult(option(hub, 'default.furrowProgress'))).toBeUndefined()
    expect(dialogue.getActiveResult(option(hub, 'default.furrowTurnIn'))?.next).toBe(WardenDialogue.questFurrowComplete)
  })
})
