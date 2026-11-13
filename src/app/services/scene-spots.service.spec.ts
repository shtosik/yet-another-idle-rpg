import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { SceneSpot } from '../../data/scene-spots'
import { ItemID } from '../../enums/ids/item-id.enum'
import { QuestID } from '../../enums/ids/quest-id.enum'
import { ZoneID } from '../../enums/ids/zone-id.enum'
import { PlayerStore } from '../store/player/player.store'
import { QuestsStore } from '../store/quests/quests.store'
import { GameNavigationService } from './game-navigation.service'
import { ModalService } from './modal.service'
import { maskColorAt, SceneSpotsService } from './scene-spots.service'

describe('SceneSpotsService', () => {
  let modal: jasmine.SpyObj<ModalService>
  let navigation: jasmine.SpyObj<GameNavigationService>
  let player: InstanceType<typeof PlayerStore>
  let quests: InstanceType<typeof QuestsStore>
  let spots: SceneSpotsService

  const search: SceneSpot = { id: 'probe', color: '#ff0000', when: { questId: QuestID.ratsWereRats, step: 1 }, gives: { itemId: ItemID.guildLetter } }
  const passage: SceneSpot = { id: 'cleft', color: '#00ff00', when: { questId: QuestID.ratsWereRats, step: 1 }, gives: { zoneId: ZoneID.goatCleft } }

  beforeEach(() => {
    localStorage.clear()
    modal = jasmine.createSpyObj<ModalService>('ModalService', ['openUnlockNotification', 'openQuestCompleted'])
    navigation = jasmine.createSpyObj<GameNavigationService>('GameNavigationService', ['fightIn'])
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: ModalService, useValue: modal },
        { provide: GameNavigationService, useValue: navigation },
      ],
    })
    player = TestBed.inject(PlayerStore)
    quests = TestBed.inject(QuestsStore)
    spots = TestBed.inject(SceneSpotsService)
  })

  afterEach(() => localStorage.clear())

  it('is inactive before its step, active during it and inactive once the item is held', () => {
    expect(spots.isActive(search)).toBeFalse()
    quests.startQuest(QuestID.ratsWereRats)
    expect(spots.isActive(search)).toBeTrue()

    spots.use(search)

    expect(player.itemCount(ItemID.guildLetter)).toBe(1)
    expect(modal.openUnlockNotification).toHaveBeenCalledOnceWith({ titleKey: 'map:spots.probe.title', bodyKey: 'map:spots.probe.body' })
    expect(spots.isActive(search)).toBeFalse()
  })

  it('does nothing when used while inactive', () => {
    spots.use(search)
    spots.use(passage)

    expect(player.itemCount(ItemID.guildLetter)).toBe(0)
    expect(player.isZoneUnlocked(ZoneID.goatCleft)).toBeFalse()
    expect(modal.openUnlockNotification).not.toHaveBeenCalled()
    expect(navigation.fightIn).not.toHaveBeenCalled()
  })

  it('a passage unlocks its Zone once and moves the player there', () => {
    quests.startQuest(QuestID.ratsWereRats)

    spots.use(passage)
    spots.use(passage)

    expect(player.isZoneUnlocked(ZoneID.goatCleft)).toBeTrue()
    expect(modal.openUnlockNotification).toHaveBeenCalledTimes(1)
    expect(navigation.fightIn).toHaveBeenCalledOnceWith(ZoneID.goatCleft)
  })
})

describe('maskColorAt', () => {
  // 2×1 mask: a red pixel, then a transparent one.
  const mask = { width: 2, height: 1, data: [255, 0, 0, 255, 0, 0, 0, 0] }

  it('reads the colour of an opaque pixel and nothing from a transparent or outside one', () => {
    expect(maskColorAt(mask, 0.9, 0.5)).toBe('#ff0000')
    expect(maskColorAt(mask, 1.2, 0)).toBeNull()
    expect(maskColorAt(mask, 2, 0)).toBeNull()
    expect(maskColorAt(mask, -1, 0)).toBeNull()
  })
})
