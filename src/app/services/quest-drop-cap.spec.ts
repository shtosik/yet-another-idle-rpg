import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { BattleManagerService } from './battle-manager.service'
import { ModalService } from './modal.service'
import { OfflineProgressService } from './offline-progress.service'
import { BattleStore } from '../store/battle/battle.store'
import { OfflineStore } from '../store/offline/offline.store'
import { PlayerStore } from '../store/player/player.store'
import { QuestsStore } from '../store/quests/quests.store'
import { EnemyID } from '../../enums/ids/enemy-id.enum'
import { ItemID } from '../../enums/ids/item-id.enum'
import { QuestID } from '../../enums/ids/quest-id.enum'
import { ZoneID } from '../../enums/ids/zone-id.enum'
import { ItemTier } from '../../enums/items/item-tier.enum'

describe('quest drop caps online and offline', () => {
  let player: InstanceType<typeof PlayerStore>
  let battle: InstanceType<typeof BattleStore>
  let quests: InstanceType<typeof QuestsStore>

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    player = TestBed.inject(PlayerStore)
    battle = TestBed.inject(BattleStore)
    quests = TestBed.inject(QuestsStore)
    battle.setZone(ZoneID.elderwoodWilds)
    quests.startQuest(QuestID.signsOfRot)
    // Held counts include every tier, not just the tier of the enemy drop.
    player.grant([{ id: ItemID.corruptedResin, amount: 2, tier: ItemTier.legendary }], 'lossy')
    player.updatePlayerStats([{ stat: 'attackPower', amount: 1000 }])
  })

  afterEach(() => localStorage.clear())

  it('caps a shiny kill and stops further online kills at the required amount', () => {
    spyOn(Math, 'random').and.returnValue(0.999)
    const manager = TestBed.inject(BattleManagerService)
    for (let i = 0; i < 2; i++) {
      battle.startBattle(100)
      expect(battle.enemyId()).toBe(EnemyID.corruptedSapling)
      manager.doDamage()
      expect(player.itemCount(ItemID.corruptedResin)).toBe(3)
    }
  })

  it('caps the whole offline claim using the held count at claim start', async () => {
    const away = 60 * 60 * 1000
    spyOn(window, 'fetch').and.resolveTo(new Response(null, { headers: { Date: new Date(away).toUTCString() } }))
    const welcomeBack = spyOn(TestBed.inject(ModalService), 'openWelcomeBack')
    TestBed.inject(OfflineStore).setLastSeen(0)

    await TestBed.inject(OfflineProgressService).claim()

    expect(player.enemyKillCounts()[EnemyID.corruptedSapling]).toBeGreaterThan(3)
    expect(player.itemCount(ItemID.corruptedResin)).toBe(3)
    const summary = welcomeBack.calls.mostRecent().args[0]
    expect(summary.items.find(item => item.id === ItemID.corruptedResin)?.amount).toBe(1)
  })
})
