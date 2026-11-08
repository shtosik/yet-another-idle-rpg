import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ItemID } from '../../enums/ids/item-id.enum'
import { QuestID } from '../../enums/ids/quest-id.enum'
import { NpcID } from '../../enums/map/npc-id.enum'
import { orderKey } from '../store/quests/turn-in-cooldown'
import { canAdvanceQuest, getQuestDropLimits } from './quest-status'
import { TurnInCooldownService } from './turn-in-cooldown.service'

describe('quest status', () => {
  it('caps drops at what an Order asks for', () => {
    const orders = { [QuestID.marthasOrder]: { requirements: [{ itemId: ItemID.turnip, amount: 12 }], rewards: { reputation: 0, gold: 0, farmingXp: 0 } } }
    const limits = getQuestDropLimits({ [QuestID.marthasOrder]: 1 }, orders, () => 5)
    expect(limits.get(QuestID.marthasOrder)?.get(ItemID.turnip)).toBe(7)
  })

  it('does not throw for a saved step past the last one', () => {
    expect(canAdvanceQuest({ [QuestID.marthasOrder]: 50 }, QuestID.marthasOrder, () => false)).toBeFalse()
  })
})

describe('NPC turn-in keys', () => {
  it('include the Orders the NPC takes in', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    const cooldowns = TestBed.inject(TurnInCooldownService)
    expect(cooldowns.keysOf(NpcID.farmWarden)).toContain(orderKey(QuestID.marthasOrder))
    expect(cooldowns.keysOf(NpcID.farmDrover)).toContain(orderKey(QuestID.wicksOrder))
  })
})
