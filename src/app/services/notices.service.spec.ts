import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { NoticesService } from './notices.service'
import { ModalService } from './modal.service'
import { CurrencyFeedService } from './currency-feed.service'
import { ItemID } from '../../enums/ids/item-id.enum'
import { ReputationID } from '../../enums/reputation-id.enum'
import { ReputationTier } from '../../enums/reputation-tier.enum'
import { NO_GAIN } from '../store/player/resources'
import QUEST_DATA from '../../data/quests-data'
import { QuestID } from '../../enums/ids/quest-id.enum'
import { ProfessionID } from '../../enums/ids/profession-id.enum'

describe('NoticesService', () => {
  let notices: NoticesService
  let modal: jasmine.SpyObj<ModalService>
  let feed: jasmine.SpyObj<CurrencyFeedService>

  beforeEach(() => {
    jasmine.clock().install()
    modal = jasmine.createSpyObj<ModalService>('ModalService', ['openStationInstalled', 'openQuestCompleted'])
    feed = jasmine.createSpyObj<CurrencyFeedService>('CurrencyFeedService', ['show'])
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: ModalService, useValue: modal },
        { provide: CurrencyFeedService, useValue: feed },
      ],
    })
    notices = TestBed.inject(NoticesService)
  })

  afterEach(() => jasmine.clock().uninstall())

  it('shows a toast in its lane for the lane time', () => {
    const camp = notices.toast('camp')
    notices.push({ type: 'crafted', itemId: ItemID.firePit, count: 2 })
    expect(camp()).toBeTruthy()

    jasmine.clock().tick(1799)
    expect(camp()).toBeTruthy()
    jasmine.clock().tick(1)
    expect(camp()).toBeNull()
  })

  it('replaces the toast in a lane and restarts its time', () => {
    const forge = notices.toast('forge')
    const item = { id: ItemID.machete, tier: 0, upgradeLevel: 1 }
    notices.push({ type: 'merged', status: 'failure', item })
    const first = forge()
    jasmine.clock().tick(2000)
    notices.push({ type: 'merged', status: 'success', item })

    expect(forge()).not.toBe(first)
    jasmine.clock().tick(2000)
    expect(forge()).toBeTruthy()
    jasmine.clock().tick(1000)
    expect(forge()).toBeNull()
  })

  it('keeps lanes apart', () => {
    notices.push({ type: 'tierUp', tierUps: [{ reputationId: ReputationID.farmingGuild, tier: ReputationTier.friendly }] })
    notices.push({ type: 'seedsFound', seeds: [{ id: ItemID.turnipSeeds, amount: 1 }] })

    expect(notices.toast('hud')()).toBeTruthy()
    expect(notices.toast('battleBelow')()).toBeTruthy()
    expect(notices.toast('battle')()).toBeNull()
  })

  it('shows nothing for empty reports', () => {
    notices.push({ type: 'tierUp', tierUps: [] })
    notices.push({ type: 'dropsLost', lost: [] })
    notices.push({ type: 'expertiseUp', gain: { professionId: ProfessionID.farming, from: 3, to: 3, skillPoints: 0 } })

    expect(notices.toast('hud')()).toBeNull()
    expect(notices.toast('battle')()).toBeNull()
    expect(notices.toast('hudBelow')()).toBeNull()
  })

  it('opens the station and quest modals', () => {
    notices.push({ type: 'stationInstalled', itemId: ItemID.firePit })
    const quest = Object.values(QUEST_DATA)[0]
    notices.push({ type: 'questCompleted', quest })

    expect(modal.openStationInstalled).toHaveBeenCalledOnceWith(ItemID.firePit)
    expect(modal.openQuestCompleted).toHaveBeenCalledOnceWith(quest)
    expect(QuestID[quest.questId]).toBeDefined()
  })

  it('sends gold and tokens to the currency feed', () => {
    notices.push({ type: 'currency', gain: { ...NO_GAIN, gold: 50, tokens: -3 } })

    expect(feed.show).toHaveBeenCalledWith('gold', 50)
    expect(feed.show).toHaveBeenCalledWith('explorerTokens', -3)
  })
})
