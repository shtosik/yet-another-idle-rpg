import { provideZonelessChangeDetection } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import i18next from 'i18next'
import { NotificationBarComponent } from './notification-bar.component'
import { GameNavigationService } from '../../../../services/game-navigation.service'
import { PlayerStore } from '../../../../store/player/player.store'
import { GameTab } from '../../../../../enums/ids/game-tab.enum'
import { ItemID } from '../../../../../enums/ids/item-id.enum'
import { ProfessionID } from '../../../../../enums/ids/profession-id.enum'
import appText from '../../../../../assets/locales/en/app.json'

describe('NotificationBarComponent', () => {
  let fixture: ComponentFixture<NotificationBarComponent>
  let store: InstanceType<typeof PlayerStore>
  let element: HTMLElement

  beforeAll(async () => {
    await i18next.init({ lng: 'en', resources: { en: { app: appText } }, defaultNS: 'app' })
  })

  beforeEach(async () => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    store = TestBed.inject(PlayerStore)
    store.unlockProfession(ProfessionID.farming)
    store.addItems([{ id: ItemID.turnipSeeds, amount: 2 }])
    fixture = TestBed.createComponent(NotificationBarComponent)
    element = fixture.nativeElement
    await fixture.whenStable()
  })

  afterEach(() => localStorage.clear())

  const button = async () => {
    await fixture.whenStable()
    fixture.detectChanges()
    return element.querySelector<HTMLButtonElement>('.notification--harvest')
  }

  it('shows nothing while no plot is ready', async () => {
    store.plantSeed(ItemID.turnipSeeds, 3, 0)
    expect(await button()).toBeNull()
  })

  it('counts the ready plots', async () => {
    store.plantSeed(ItemID.turnipSeeds, 3, 0)
    store.growAllPlots()
    expect((await button())?.textContent).toContain('1 plot ready to harvest')

    store.plantSeed(ItemID.turnipSeeds, 3, 1)
    store.growAllPlots()
    expect((await button())?.textContent).toContain('2 plots ready to harvest')
  })

  it('opens the plots panel', async () => {
    store.plantSeed(ItemID.turnipSeeds, 3, 0)
    store.growAllPlots()
    ;(await button())?.click()
    expect(TestBed.inject(GameNavigationService).tab()).toBe(GameTab.farmPlots)
  })
})
