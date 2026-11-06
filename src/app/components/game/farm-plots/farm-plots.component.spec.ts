import { provideZonelessChangeDetection } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import i18next from 'i18next'
import { FarmPlotsComponent, formatDuration } from './farm-plots.component'
import { PlayerStore } from '../../../store/player/player.store'
import { PLOT_SLOTS } from '../../../store/player/farm'
import { tabOf } from '../../../store/player/inventory'
import ITEM_DATA from '../../../../data/items-data'
import { ItemID } from '../../../../enums/ids/item-id.enum'
import { ProfessionID } from '../../../../enums/ids/profession-id.enum'
import { ReputationID } from '../../../../enums/reputation-id.enum'
import appText from '../../../../assets/locales/en/app.json'
import mapText from '../../../../assets/locales/en/map.json'
import questsText from '../../../../assets/locales/en/quests.json'
import itemsText from '../../../../assets/locales/en/items.json'

describe('FarmPlotsComponent', () => {
  let fixture: ComponentFixture<FarmPlotsComponent>
  let store: InstanceType<typeof PlayerStore>
  let element: HTMLElement

  beforeAll(async () => {
    await i18next.init({ lng: 'en', resources: { en: { app: appText, map: mapText, quests: questsText, items: itemsText } } })
  })

  beforeEach(async () => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    store = TestBed.inject(PlayerStore)
    fixture = TestBed.createComponent(FarmPlotsComponent)
    element = fixture.nativeElement
    await fixture.whenStable()
  })

  afterEach(() => localStorage.clear())

  const render = async () => {
    await fixture.whenStable()
    fixture.detectChanges()
  }
  const locks = () => [...element.querySelectorAll('.footer__lock')].map(lock => lock.textContent?.trim())
  const growTurnip = () => {
    store.unlockProfession(ProfessionID.farming)
    store.addItems([{ id: ItemID.turnipSeeds, amount: 1 }])
    store.plantSeed(ItemID.turnipSeeds, 3, 0)
    store.growAllPlots()
  }

  it('shows 9 slots, 3 of them usable at the start', () => {
    expect(element.querySelectorAll('.plot').length).toBe(PLOT_SLOTS)
    expect(element.querySelectorAll('.plot--empty').length).toBe(3)
    expect(element.querySelectorAll('.plot--locked').length).toBe(6)
  })

  it('locks Plant all and Harvest all with the Guild tier they need', () => {
    expect(locks()).toEqual(['Requires Farming Guild Honored — 0/200', 'Requires Farming Guild Friendly — 0/50'])
    expect([...element.querySelectorAll<HTMLButtonElement>('.footer__button')].every(button => button.disabled)).toBeTrue()
  })

  it('drops a lock text once its tier is reached', async () => {
    store.addReputation([{ reputationId: ReputationID.farmingGuild, amount: 60 }])
    await render()

    expect(locks()).toEqual(['Requires Farming Guild Honored — 60/200'])
  })

  it('tags a ready plot with the slots its harvest needs when the Materials tab is full', async () => {
    growTurnip()
    await render()
    expect(element.querySelector('.plot--ready')).not.toBeNull()
    expect(element.querySelector('.plot__missing')).toBeNull()

    for (const item of Object.values(ITEM_DATA)) {
      if (tabOf(item.id) === 'materials' && item.id !== ItemID.turnip && store.canFitItems([{ id: item.id, amount: 1 }])) store.addItems([{ id: item.id, amount: 1 }])
    }
    expect(store.canFitItems([{ id: ItemID.turnip, amount: 1 }])).toBeFalse()
    await render()

    expect(element.querySelector('.plot__missing')?.textContent?.trim()).toBe('1 Materials slot needed')
  })

  it('formats timers', () => {
    expect([formatDuration(45_000), formatDuration(14.5 * 60_000), formatDuration(2 * 3_600_000 + 5 * 60_000)]).toEqual(['45s', '14m 30s', '2h 5m'])
  })
})
