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
    playerStore.grant([{ id: ItemID.guildLetter, amount: 1 }], 'lossy')
    dialogue.startDialogue(NpcID.farmWarden)

    expect(dialogue.activeNode()?.id).toBe(WardenDialogue.intro1)
    dialogue.selectOption(option(FARM_WARDEN[WardenDialogue.intro1], 'intro1.letter'))
    dialogue.selectOption(option(FARM_WARDEN[WardenDialogue.introLetter], 'introLetter.opt1'))

    expect(dialogue.activeNode()?.id).toBe(WardenDialogue.introNoSeeds)
    expect(questsStore.getQuestStep(QuestID.seedsFromTheTerrace)).toBe(QUEST_STEP_AFTER_COMPLETED)
    expect(playerStore.itemCount(ItemID.guildLetter)).toBe(0)
  })

  it('hands the letter over on the very first open, whichever opening line is picked, and never greets again', () => {
    questsStore.startQuest(QuestID.silkAndWater)
    questsStore.endQuest(QuestID.silkAndWater)
    questsStore.startQuest(QuestID.seedsFromTheTerrace)
    playerStore.grant([{ id: ItemID.guildLetter, amount: 1 }], 'lossy')
    dialogue.startDialogue(NpcID.farmWarden)

    const intro = FARM_WARDEN[WardenDialogue.intro1]
    expect(dialogue.getActiveResult(option(intro, 'intro1.letter'))).toBeDefined()
    dialogue.selectOption(option(intro, 'intro1.teach'))

    expect(questsStore.getQuestStep(QuestID.seedsFromTheTerrace)).toBe(QUEST_STEP_AFTER_COMPLETED)
    expect(playerStore.itemCount(ItemID.guildLetter)).toBe(0)
    dialogue.closeDialogue()
    dialogue.startDialogue(NpcID.farmWarden)
    expect(dialogue.activeNode()?.id).toBe(WardenDialogue.default)
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

    playerStore.grant([{ id: ItemID.turnip, amount: 4 }], 'lossy')
    expect(dialogue.getActiveResult(option(hub, 'default.furrowProgress'))).toBeUndefined()
    expect(dialogue.getActiveResult(option(hub, 'default.furrowTurnIn'))?.next).toBe(WardenDialogue.questFurrowComplete)
  })

  it('pays The First Furrow with the Turnip Stew Recipe, which The Growers\' Table needs', () => {
    questsStore.startQuest(QuestID.theFirstFurrow)
    playerStore.grant([{ id: ItemID.turnip, amount: 4 }], 'lossy')
    dialogue.startDialogue(NpcID.farmWarden)

    dialogue.selectOption(option(FARM_WARDEN[WardenDialogue.default], 'default.furrowTurnIn'))
    expect(dialogue.activeNode()?.id).toBe(WardenDialogue.questFurrowComplete)
    dialogue.selectOption(option(FARM_WARDEN[WardenDialogue.questFurrowComplete], 'questFurrowComplete.opt1'))

    expect(dialogue.activeNode()?.id).toBe(WardenDialogue.questFurrowAfter)
    expect(playerStore.itemCount(ItemID.turnipStewRecipe)).toBe(1)
  })

  it('goes back to the hub without ending the quest if the items were spent during the turn-in', () => {
    questsStore.startQuest(QuestID.theFirstFurrow)
    dialogue.startDialogue(NpcID.farmWarden)

    dialogue.selectOption(option(FARM_WARDEN[WardenDialogue.questFurrowComplete], 'questFurrowComplete.opt1'))

    expect(dialogue.activeNode()?.id).toBe(WardenDialogue.default)
    expect(questsStore.getQuestStep(QuestID.theFirstFurrow)).toBe(1)
    expect(playerStore.itemCount(ItemID.turnipStewRecipe)).toBe(0)
  })

  it('explains the seed stall once, then opens it straight away', () => {
    questsStore.startQuest(QuestID.theFirstFurrow)
    const shop = option(FARM_WARDEN[WardenDialogue.default], 'default.shop')
    expect(dialogue.getActiveResult(shop)?.next).toBe(WardenDialogue.shopFirst)

    const explained = option(FARM_WARDEN[WardenDialogue.shopFirst], 'shopFirst.opt1')
    expect(dialogue.getActiveResult(explained)?.effects?.some(e => e.type === 'shop')).toBeTrue()
    dialogue.startDialogue(NpcID.farmWarden)
    dialogue.selectOption(explained)

    expect(dialogue.getActiveResult(shop)?.effects?.some(e => e.type === 'shop')).toBeTrue()
  })
})
