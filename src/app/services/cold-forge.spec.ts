import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { DialogueManagerService } from './dialogue-manager.service'
import { ModalService } from './modal.service'
import { PlayerStore } from '../store/player/player.store'
import { QuestsStore } from '../store/quests/quests.store'
import { TownsStore } from '../store/towns/towns.store'
import { calculateXp } from '../store/player/experience'
import { DialogueNode } from '../../interfaces/dialogues/dialogue-node.interface'
import { QUEST_STEP_AFTER_COMPLETED } from '../../data/quests-data'
import { QuestID } from '../../enums/ids/quest-id.enum'
import { ItemID } from '../../enums/ids/item-id.enum'
import PHURGO, { PhurgoDialogue } from '../../data/dialogues/liroldTown/liroldPhurgo'
import LUDO, { ArenaMasterDialogue } from '../../data/dialogues/liroldTown/liroldArenaMaster'
import MARVIN, { MarvinDialogue } from '../../data/dialogues/laHarparTown/laHarparMarvin'

function option(node: DialogueNode<number>, key: string) {
  const found = node.options.find(candidate => candidate.responseKey.endsWith(key))
  if (!found) throw new Error(`Missing dialogue option ${key}`)
  return found
}

describe('The Cold Forge dialogue', () => {
  let dialogue: DialogueManagerService
  let player: InstanceType<typeof PlayerStore>
  let quests: InstanceType<typeof QuestsStore>
  let towns: InstanceType<typeof TownsStore>

  const forgeOptions = () => [
    option(PHURGO[PhurgoDialogue.default], 'default.opt6'),
    option(PHURGO[PhurgoDialogue.aboutForgeRestored], 'aboutForgeRestored.opt1'),
    option(PHURGO[PhurgoDialogue.coldForgeComplete], 'coldForgeComplete.opt1'),
  ]

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    spyOn(TestBed.inject(ModalService), 'openQuestCompleted')
    dialogue = TestBed.inject(DialogueManagerService)
    player = TestBed.inject(PlayerStore)
    quests = TestBed.inject(QuestsStore)
    towns = TestBed.inject(TownsStore)
  })

  afterEach(() => localStorage.clear())

  it('delivers all three items once, advances talk steps at their NPCs, and unlocks the Forge', () => {
    const ludo = option(LUDO[ArenaMasterDialogue.default], 'default.coldForge')
    const marvin = option(MARVIN[MarvinDialogue.default], 'default.coldForge')
    const reminder = option(PHURGO[PhurgoDialogue.default], 'default.opt4')
    for (const service of forgeOptions()) expect(dialogue.getActiveResult(service)).toBeUndefined()
    expect(dialogue.getActiveResult(ludo)).toBeUndefined()
    expect(dialogue.getActiveResult(marvin)).toBeUndefined()

    dialogue.selectOption(option(PHURGO[PhurgoDialogue.coldForgeOffer], 'coldForgeOffer.opt1'))
    expect(quests.getQuestStep(QuestID.theColdForge)).toBe(1)
    expect(dialogue.getActiveResult(reminder)?.next).toBe(PhurgoDialogue.coldForgeProgressOne)
    dialogue.selectOption(reminder)
    expect(quests.getQuestStep(QuestID.theColdForge)).toBe(1)
    dialogue.selectOption(ludo)
    expect(quests.getQuestStep(QuestID.theColdForge)).toBe(2)
    expect(dialogue.getActiveResult(ludo)).toBeUndefined()

    const tongs = option(PHURGO[PhurgoDialogue.default], 'default.opt3')
    expect(dialogue.getActiveResult(tongs)).toBeUndefined()
    expect(dialogue.getActiveResult(reminder)?.next).toBe(PhurgoDialogue.coldForgeProgressTwo)
    player.addItems([{ id: ItemID.phurgosForgeTongs, amount: 1 }])
    expect(dialogue.getActiveResult(reminder)).toBeUndefined()
    dialogue.selectOption(tongs)
    expect(player.itemCount(ItemID.phurgosForgeTongs)).toBe(0)
    expect(quests.getQuestStep(QuestID.theColdForge)).toBe(3)
    expect(dialogue.getActiveResult(reminder)?.next).toBe(PhurgoDialogue.coldForgeProgressThree)
    dialogue.selectOption(reminder)
    expect(quests.getQuestStep(QuestID.theColdForge)).toBe(3)
    dialogue.selectOption(marvin)
    expect(quests.getQuestStep(QuestID.theColdForge)).toBe(4)
    expect(dialogue.getActiveResult(marvin)).toBeUndefined()

    const pie = option(PHURGO[PhurgoDialogue.default], 'default.opt2')
    expect(dialogue.getActiveResult(pie)).toBeUndefined()
    player.addItems([{ id: ItemID.fishApplePie, amount: 2 }])
    dialogue.selectOption(pie)
    expect(player.itemCount(ItemID.fishApplePie)).toBe(1)
    expect(quests.getQuestStep(QuestID.theColdForge)).toBe(5)
    for (const service of forgeOptions()) expect(dialogue.getActiveResult(service)).toBeUndefined()

    const wood = option(PHURGO[PhurgoDialogue.default], 'default.opt1')
    player.addItems([{ id: ItemID.ancientWood, amount: 9 }])
    expect(dialogue.getActiveResult(wood)).toBeUndefined()
    player.addItems([{ id: ItemID.ancientWood, amount: 2 }])
    const gold = player.stats().goldCoins
    dialogue.selectOption(wood)
    expect(player.itemCount(ItemID.ancientWood)).toBe(1)
    expect(player.stats().goldCoins).toBe(gold + 400)
    let awardedXp = player.stats().experience
    for (let level = 2; level <= player.stats().level; level++) awardedXp += calculateXp(level)
    expect(awardedXp).toBe(2000)
    expect(quests.getQuestStep(QuestID.theColdForge)).toBe(QUEST_STEP_AFTER_COMPLETED)
    expect(TestBed.inject(ModalService).openQuestCompleted).toHaveBeenCalledTimes(1)
    expect(dialogue.getActiveResult(wood)).toBeUndefined()
    for (const service of forgeOptions()) expect(dialogue.getActiveResult(service)).toBeDefined()
    dialogue.selectOption(forgeOptions()[0])
    expect(towns.forgeOpen()).toBeTrue()
  })

  it('keeps the lore link usable while hiding repeat offers', () => {
    const help = option(PHURGO[PhurgoDialogue.aboutForge], 'aboutForge.opt1')
    expect(dialogue.getActiveResult(help)?.next).toBe(PhurgoDialogue.coldForgeOffer)
    dialogue.selectOption(option(PHURGO[PhurgoDialogue.coldForgeOffer], 'coldForgeOffer.opt1'))
    expect(dialogue.getActiveResult(help)?.next).toBe(PhurgoDialogue.default)
    expect(dialogue.getActiveResult(option(PHURGO[PhurgoDialogue.default], 'default.opt5'))).toBeUndefined()
  })
})
