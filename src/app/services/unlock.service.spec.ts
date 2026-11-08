import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { UnlockService } from './unlock.service'
import { ModalService } from './modal.service'
import { PlayerStore } from '../store/player/player.store'
import { QuestsStore } from '../store/quests/quests.store'
import { UNLOCK_RULES, ZONE_UNLOCK_NOTIFICATIONS } from '../../data/unlock-conditions'
import { emptyKillBatch } from '../store/player/kill-rewards'
import { QuestID } from '../../enums/ids/quest-id.enum'
import { SiteID } from '../../enums/ids/site-id.enum'
import { ZoneID } from '../../enums/ids/zone-id.enum'
import { TownID } from '../../enums/map/town-id.enum'

describe('UnlockService', () => {
  let modal: jasmine.SpyObj<ModalService>
  let player: InstanceType<typeof PlayerStore>
  let quests: InstanceType<typeof QuestsStore>

  const laHarparNotice = UNLOCK_RULES.find(rule => rule.target.type === 'town' && rule.target.townId === TownID.laHarpar)!.notification
  const killOnBeachWave5 = () => player.applyKillBatch({ ...emptyKillBatch(ZoneID.horseshoeBeach, 5), kills: 1 })

  beforeEach(() => {
    localStorage.clear()
    modal = jasmine.createSpyObj<ModalService>('ModalService', ['openUnlockNotification', 'openQuestCompleted'])
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: ModalService, useValue: modal }],
    })
    player = TestBed.inject(PlayerStore)
    quests = TestBed.inject(QuestsStore)
  })

  afterEach(() => localStorage.clear())

  it('shows one notice on a live grant and nothing on a second grant of the same target', () => {
    const unlocks = TestBed.inject(UnlockService)
    unlocks.grant({ type: 'zone', zoneId: ZoneID.plains })
    unlocks.grant({ type: 'zone', zoneId: ZoneID.plains })

    expect(player.isZoneUnlocked(ZoneID.plains)).toBeTrue()
    expect(modal.openUnlockNotification).toHaveBeenCalledOnceWith(ZONE_UNLOCK_NOTIFICATIONS[ZoneID.plains]!)
  })

  it('finds a Site notice from its key', () => {
    TestBed.inject(UnlockService).grant({ type: 'site', siteId: SiteID.farm })

    expect(player.isSiteUnlocked(SiteID.farm)).toBeTrue()
    expect(modal.openUnlockNotification).toHaveBeenCalledOnceWith({ titleKey: 'unlocks:sites.farm.title', bodyKey: 'unlocks:sites.farm.body' })
  })

  it('replays met rules and entrance zones on load without a notice', () => {
    killOnBeachWave5()
    quests.startQuest(QuestID.ratsWereRats)
    expect(player.isTownUnlocked(TownID.laHarpar)).toBeFalse()

    TestBed.inject(UnlockService)
    TestBed.tick()

    expect(player.isTownUnlocked(TownID.laHarpar)).toBeTrue()
    expect(player.isZoneUnlocked(ZoneID.tradersBasement)).toBeTrue()
    expect(modal.openUnlockNotification).not.toHaveBeenCalled()
  })

  it('grants a rule met by kills, with its notice', () => {
    TestBed.inject(UnlockService)
    TestBed.tick()
    killOnBeachWave5()
    TestBed.tick()

    expect(player.isTownUnlocked(TownID.laHarpar)).toBeTrue()
    expect(modal.openUnlockNotification).toHaveBeenCalledWith(laHarparNotice!)
  })

  describe('with a quest-completion rule', () => {
    beforeEach(() => UNLOCK_RULES.push({ condition: { type: 'questCompleted', questId: QuestID.ratsWereRats }, target: { type: 'site', siteId: SiteID.farm } }))
    afterEach(() => UNLOCK_RULES.pop())

    it('grants it when the quest completes', () => {
      TestBed.inject(UnlockService)
      quests.startQuest(QuestID.ratsWereRats)
      TestBed.tick()
      expect(player.isSiteUnlocked(SiteID.farm)).toBeFalse()

      quests.endQuest(QuestID.ratsWereRats)
      TestBed.tick()

      expect(player.isSiteUnlocked(SiteID.farm)).toBeTrue()
      expect(modal.openUnlockNotification).toHaveBeenCalledWith({ titleKey: 'unlocks:sites.farm.title', bodyKey: 'unlocks:sites.farm.body' })
    })
  })

  it('opens an entrance zone when its quest starts', () => {
    TestBed.inject(UnlockService)
    TestBed.tick()
    quests.startQuest(QuestID.ratsWereRats)
    TestBed.tick()

    expect(player.isZoneUnlocked(ZoneID.tradersBasement)).toBeTrue()
  })
})
