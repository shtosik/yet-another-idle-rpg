import { provideZonelessChangeDetection } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import i18next from 'i18next'
import { FarmPlotsComponent, formatDuration } from './farm-plots.component'
import { PlayerStore } from '../../../store/player/player.store'
import { ProfessionService } from '../../../services/profession.service'
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
  const locks = () => [...element.querySelectorAll('.actions__item[aria-label]')].map(lock => lock.getAttribute('aria-label'))
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
    expect(locks()).toEqual(['Requires Honored reputation', 'Requires Friendly reputation'])
    expect([...element.querySelectorAll<HTMLButtonElement>('.actions__button')].every(button => button.disabled)).toBeTrue()
    expect(element.querySelector('.actions')?.textContent).not.toContain('Requires')
  })

  it('drops a lock tooltip once its tier is reached', async () => {
    store.addReputation([{ reputationId: ReputationID.farmingGuild, amount: 60 }])
    await render()

    expect(locks()).toEqual(['Requires Honored reputation'])
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

  it('shows current / needed on both bars and only the bonus expertise gives so far', async () => {
    store.addReputation([{ reputationId: ReputationID.farmingGuild, amount: 60 }])
    store.unlockProfession(ProfessionID.farming)
    TestBed.inject(ProfessionService).gainXp(ProfessionID.farming, 620)
    await render()

    expect([...element.querySelectorAll('.meter__bar-text')].map(text => text.textContent?.trim())).toEqual(['10 / 150', '20 / 500'])
    expect(element.querySelector('.meter__detail')?.textContent).toBe('1.5% faster growth time, +10% Seed Save Chance')
  })

  it('shows no bonus line at expertise 1, which gives none yet', async () => {
    store.unlockProfession(ProfessionID.farming)
    await render()

    expect(element.querySelector('.meter__detail')).toBeNull()
  })

  it('floats a harvest popup from the click point; Harvest all from its button', async () => {
    growTurnip()
    await render()
    const panel = element.getBoundingClientRect()
    element.querySelector('.plot--ready')?.dispatchEvent(new MouseEvent('click', { clientX: panel.left + 70, clientY: panel.top + 90, detail: 1 }))
    await render()

    const popup = element.querySelector<HTMLElement>('.toast')
    expect(parseFloat(popup?.style.left ?? '')).toBeCloseTo(70, 3)
    expect(parseFloat(popup?.style.top ?? '')).toBeCloseTo(90, 3)
    expect(popup?.textContent).toContain('+3 Farming XP')

    store.addReputation([{ reputationId: ReputationID.farmingGuild, amount: 60 }])
    store.addItems([{ id: ItemID.turnipSeeds, amount: 1 }])
    store.plantSeed(ItemID.turnipSeeds, 3, 0)
    store.growAllPlots()
    await render()
    const button = element.querySelectorAll<HTMLButtonElement>('.actions__button')[1]
    button.dispatchEvent(new MouseEvent('click', { clientX: 1, clientY: 1, detail: 1 }))
    await render()

    const rect = button.getBoundingClientRect()
    const popups = element.querySelectorAll<HTMLElement>('.toast')
    expect(parseFloat(popups[1].style.left)).toBeCloseTo(rect.left + rect.width / 2 - panel.left, 0)
  })

  it('formats timers', () => {
    expect([formatDuration(45_000), formatDuration(14.5 * 60_000), formatDuration(2 * 3_600_000 + 5 * 60_000)]).toEqual(['45s', '14m 30s', '2h 5m'])
  })
})
