import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import MARVIN, { MarvinDialogue } from '../../data/dialogues/laHarparTown/laHarparMarvin'
import LUDO, { ArenaMasterDialogue } from '../../data/dialogues/liroldTown/liroldArenaMaster'
import { ItemID } from '../../enums/ids/item-id.enum'
import { NpcID } from '../../enums/map/npc-id.enum'
import { DialogueOption } from '../../interfaces/dialogues/dialogue-option.type'
import { PlayerStore } from '../store/player/player.store'
import { QuestsStore } from '../store/quests/quests.store'
import { DialogueManagerService } from './dialogue-manager.service'

describe("Marvin's Pathfinder's Seal registration", () => {
  let dialogue: DialogueManagerService
  let player: InstanceType<typeof PlayerStore>
  const option = (key: string) => {
    const found = MARVIN[MarvinDialogue.default].options.find(candidate => candidate.responseKey.endsWith(key))
    if (!found) throw new Error(`Missing Marvin option ${key}`)
    return found
  }

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    dialogue = TestBed.inject(DialogueManagerService)
    player = TestBed.inject(PlayerStore)
    TestBed.inject(QuestsStore).setDialogueFlag(`met_${NpcID.laHarparMarvin}`)
    dialogue.startDialogue(NpcID.laHarparMarvin)
  })
  afterEach(() => localStorage.clear())

  it('shows registration only with a Seal, then consumes it and replaces the option with the reminder', () => {
    const register = option('default.registerSeal')
    const reminder = option('default.sealReminder')
    expect(dialogue.getActiveResult(register)).toBeUndefined()
    expect(dialogue.getActiveResult(reminder)).toBeUndefined()
    player.grant([{ id: ItemID.pathfindersSeal, amount: 1 }], 'lossy')
    expect(dialogue.getActiveResult(register)).toBeDefined()
    dialogue.selectOption(register)
    expect(dialogue.activeNode()?.id).toBe(MarvinDialogue.sealRegistered)
    expect(player.itemCount(ItemID.pathfindersSeal)).toBe(0)
    expect(player.stats().upgradedDropChance).toBe(10)
    expect(dialogue.getActiveResult(register)).toBeUndefined()
    dialogue.selectOption(MARVIN[MarvinDialogue.sealRegistered].options[0])
    dialogue.selectOption(reminder)
    expect(dialogue.activeNode()?.id).toBe(MarvinDialogue.sealReminder)
  })

  it('rechecks possession and registration even for an effect without visibility conditions', () => {
    const unguarded: DialogueOption<MarvinDialogue> = {
      responseKey: 'register',
      results: [{ next: MarvinDialogue.sealRegistered, effects: [{ type: 'registerPathfindersSeal' }] }],
    }
    dialogue.selectOption(unguarded)
    expect(dialogue.activeNode()?.id).toBe(MarvinDialogue.default)
    expect(player.stats().upgradedDropChance).toBe(0)
    player.grant([{ id: ItemID.pathfindersSeal, amount: 2 }], 'lossy')
    dialogue.selectOption(unguarded)
    expect(player.itemCount(ItemID.pathfindersSeal)).toBe(1)
    dialogue.selectOption(MARVIN[MarvinDialogue.sealRegistered].options[0])
    dialogue.selectOption(unguarded)
    expect(dialogue.activeNode()?.id).toBe(MarvinDialogue.default)
    expect(player.itemCount(ItemID.pathfindersSeal)).toBe(1)
    expect(player.stats().upgradedDropChance).toBe(10)
  })

  it("lets Ludo explain the Seal only while it's held and unregistered", () => {
    const lore = LUDO[ArenaMasterDialogue.default].options.find(candidate => candidate.responseKey.endsWith('default.pathfindersSeal'))
    if (!lore) throw new Error('Missing Seal lore')
    expect(dialogue.getActiveResult(lore)).toBeUndefined()
    player.grant([{ id: ItemID.pathfindersSeal, amount: 1 }], 'lossy')
    expect(dialogue.getActiveResult(lore)?.next).toBe(ArenaMasterDialogue.pathfindersSealInfo)
    player.registerPathfindersSeal()
    expect(dialogue.getActiveResult(lore)).toBeUndefined()
  })
})
