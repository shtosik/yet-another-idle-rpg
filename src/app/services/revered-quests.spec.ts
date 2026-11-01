import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { DialogueManagerService } from './dialogue-manager.service'
import { ModalService } from './modal.service'
import { PlayerStore } from '../store/player/player.store'
import { QuestsStore } from '../store/quests/quests.store'
import { DialogueNode } from '../../interfaces/dialogues/dialogue-node.interface'
import { DialogueOption } from '../../interfaces/dialogues/dialogue-option.type'
import { QUEST_STEP_AFTER_COMPLETED } from '../../data/quests-data'
import { QuestID } from '../../enums/ids/quest-id.enum'
import { EnemyID } from '../../enums/ids/enemy-id.enum'
import { ItemID } from '../../enums/ids/item-id.enum'
import { TownID } from '../../enums/map/town-id.enum'
import LA_HARPAR_TRADER, { TraderDialogue } from '../../data/dialogues/laHarparTown/laHarparTrader'
import LA_HARPAR_BARTENDER, { BartenderDialogue } from '../../data/dialogues/laHarparTown/laHarparBartender'
import MAWOOD_SYLVIE, { SylvieDialogue } from '../../data/dialogues/mawoodTown/mawoodSylvie'

const option = (node: DialogueNode<number>, key: string): DialogueOption<number> =>
  node.options.find(o => o.responseKey.endsWith(key))!

describe('Revered quests in dialogue', () => {
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
    playerStore.addReputation([{ townId: TownID.laHarpar, amount: 600 }])
  })

  afterEach(() => localStorage.clear())

  it('plays Safe Passage from the Trader to Sylvie and credits both towns', () => {
    questsStore.startQuest(QuestID.silkAndWater)
    questsStore.endQuest(QuestID.silkAndWater)
    const mawood = playerStore.reputation()[TownID.mawood] ?? 0
    const askTrader = option(LA_HARPAR_TRADER[TraderDialogue.default], 'default.opt6')

    expect(dialogue.getActiveResult(askTrader)?.next).toBe(TraderDialogue.questSafePassage)
    dialogue.selectOption(option(LA_HARPAR_TRADER[TraderDialogue.questSafePassage], 'questSafePassage.opt1'))

    playerStore.updateEnemyKillCount(EnemyID.troll, 3)
    playerStore.updateEnemyKillCount(EnemyID.goblinScavenger, 40)
    expect(dialogue.getActiveResult(askTrader)?.next).toBe(TraderDialogue.questSafePassageStep1Complete)
    dialogue.selectOption(option(LA_HARPAR_TRADER[TraderDialogue.questSafePassageStep1Complete], 'questSafePassageStep1Complete.opt1'))

    // The talk step is ready at once: the Trader reminds, Sylvie completes it.
    expect(dialogue.getActiveResult(askTrader)?.next).toBe(TraderDialogue.questSafePassageStep2)
    const tellSylvie = option(MAWOOD_SYLVIE[SylvieDialogue.default], 'default.safePassage')
    expect(dialogue.getActiveResult(tellSylvie)?.next).toBe(SylvieDialogue.safePassageComplete)
    dialogue.selectOption(option(MAWOOD_SYLVIE[SylvieDialogue.safePassageComplete], 'safePassageComplete.opt1'))

    expect(questsStore.getQuestStep(QuestID.safePassage)).toBe(QUEST_STEP_AFTER_COMPLETED)
    expect(playerStore.reputation()[TownID.laHarpar]).toBe(700)
    expect(playerStore.reputation()[TownID.mawood]).toBe(mawood + 25)
  })

  it('gives the town pet once at Exalted', () => {
    const askCat = option(LA_HARPAR_BARTENDER[BartenderDialogue.default], 'default.tavernCat')
    expect(dialogue.getActiveResult(askCat)).toBeUndefined()

    playerStore.addReputation([{ townId: TownID.laHarpar, amount: 900 }])
    expect(dialogue.getActiveResult(askCat)?.next).toBe(BartenderDialogue.tavernCat)
    dialogue.selectOption(option(LA_HARPAR_BARTENDER[BartenderDialogue.tavernCat], 'tavernCat.opt1'))

    expect(playerStore.itemCount(ItemID.petLaHarparCat)).toBe(1)
    expect(dialogue.getActiveResult(askCat)).toBeUndefined()
  })

  it('does not complete a hand-in when an item is gone before confirming', () => {
    questsStore.startQuest(QuestID.lastOrders)
    playerStore.addItems([{ id: ItemID.venisonRoast, amount: 10 }, { id: ItemID.fishApplePie, amount: 10 }])
    const askWork = option(LA_HARPAR_BARTENDER[BartenderDialogue.default], 'default.anyWork')
    expect(dialogue.getActiveResult(askWork)?.next).toBe(BartenderDialogue.questLastOrdersComplete)

    playerStore.removeItems([{ id: ItemID.fishApplePie, amount: 1 }])
    dialogue.selectOption(option(LA_HARPAR_BARTENDER[BartenderDialogue.questLastOrdersComplete], 'questLastOrdersComplete.opt1'))

    expect(questsStore.getQuestStep(QuestID.lastOrders)).toBe(1)
    expect(playerStore.itemCount(ItemID.venisonRoast)).toBe(10)
  })

  it('does not end a quest from dialogue when an item is gone before confirming', () => {
    questsStore.startQuest(QuestID.silkAndWater)
    playerStore.addItems([{ id: ItemID.spiderSilk, amount: 14 }, { id: ItemID.vialOfWater, amount: 10 }])
    dialogue.selectOption(option(MAWOOD_SYLVIE[SylvieDialogue.questSilkWaterComplete], 'questSilkWaterComplete.opt1'))

    expect(questsStore.getQuestStep(QuestID.silkAndWater)).toBe(1)
    expect(playerStore.itemCount(ItemID.vialOfWater)).toBe(10)
  })
})
