import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { QuestsStore } from './quests.store'
import { PlayerStore } from '../player/player.store'
import { ModalService } from '../../services/modal.service'
import { emptyKillBatch } from '../player/kill-rewards'
import { tabOf } from '../player/inventory'
import ITEM_DATA from '../../../data/items-data'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { ZoneID } from '../../../enums/ids/zone-id.enum'

// Clearing Out the Beach pays Josh's Heirloom (Gear tab) on its only step: 50 kills on Horseshoe Beach wave 7.
describe('quest completion is an atomic Item grant', () => {
  let quests: InstanceType<typeof QuestsStore>
  let player: InstanceType<typeof PlayerStore>
  const questId = QuestID.clearingOutTheBeach

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    spyOn(TestBed.inject(ModalService), 'openQuestCompleted')
    quests = TestBed.inject(QuestsStore)
    player = TestBed.inject(PlayerStore)
    quests.startQuest(questId)
    player.applyKillBatch({ ...emptyKillBatch(ZoneID.horseshoeBeach, 7), kills: 50 })
  })

  afterEach(() => localStorage.clear())

  const fillGear = () => player.grant((Object.keys(ITEM_DATA).map(Number) as ItemID[])
    .filter(id => tabOf(id) === 'gear' && id !== ItemID.joshsHeirloom)
    .slice(0, player.inventoryCapacity().gear)
    .map(id => ({ id, amount: 1 })), 'atomic')

  const snapshot = () => ({
    step: quests.getQuestStep(questId),
    gold: player.resources().goldCoins,
    xp: player.resources().experience,
    reputation: player.reputation(),
    inventory: player.inventory(),
  })

  for (const route of ['advanceQuest', 'endQuest'] as const) {
    it(`${route} is refused, nothing paid, while the rewards don't fit`, () => {
      fillGear()
      expect(quests.isStepReady(questId)).toBeTrue()
      const before = snapshot()

      quests[route](questId)

      expect(snapshot()).toEqual(before)
    })

    it(`${route} pays everything once there is room`, () => {
      const gold = player.resources().goldCoins
      quests[route](questId)
      expect(player.itemCount(ItemID.joshsHeirloom)).toBe(1)
      expect(player.resources().goldCoins).toBe(gold + 250)
    })
  }
})
