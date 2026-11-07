import { provideZonelessChangeDetection } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import i18next from 'i18next'
import { WorldMapComponent } from './world-map.component'
import { PlayerStore } from '../../../store/player/player.store'
import { WORLD_MAP_DATA } from 'data/world-map-data'
import { SiteID } from 'enums/ids/site-id.enum'
import mapText from '../../../../assets/locales/en/map.json'

describe('WorldMapComponent Sites', () => {
  let fixture: ComponentFixture<WorldMapComponent>
  let store: InstanceType<typeof PlayerStore>
  let element: HTMLElement

  beforeAll(async () => {
    await i18next.init({ lng: 'en', resources: { en: { map: mapText } } })
  })

  beforeEach(async () => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    store = TestBed.inject(PlayerStore)
    fixture = TestBed.createComponent(WorldMapComponent)
    element = fixture.nativeElement
    await fixture.whenStable()
    // onMapReady finishes in a timeout that must fire before the fixture is destroyed.
    await new Promise(resolve => setTimeout(resolve))
  })

  afterEach(() => localStorage.clear())

  const toggle = () => element.querySelector<HTMLButtonElement>('.sites__toggle')
  const markers = () => [...element.querySelectorAll('.map-marker--site')]

  it('has the farm marker at (1400, 400)', () => {
    const marker = WORLD_MAP_DATA.markers.find(m => m.type === 'site')
    expect(marker?.position).toEqual({ x: 1400, y: 400 })
    expect(marker?.minZoom).toBe(2)
  })

  it('shows no Sites list and no marker while the farm is locked', async () => {
    expect(toggle()).toBeNull()
    expect(markers().length).toBe(0)
    expect(fixture.componentInstance.unlockedSites()).toEqual([])
  })

  it('lists the farm and places its marker once unlocked', async () => {
    store.applyUnlockTarget({ type: 'site', siteId: SiteID.farm })
    expect(store.isSiteUnlocked(SiteID.farm)).toBe(true)
    expect(store.mapUnlocked()).toBe(true)
    await new Promise(resolve => setTimeout(resolve))
    await fixture.whenStable()
    expect(fixture.componentInstance.unlockedSites()).toEqual([SiteID.farm])
    expect(markers().length).toBe(1)

    toggle()?.click()
    await fixture.whenStable()
    const entry = element.querySelector<HTMLButtonElement>('.sites__site')
    expect(entry?.textContent?.trim()).toBe('Farm')

    const selected: SiteID[] = []
    fixture.componentInstance.siteSelected.subscribe(id => selected.push(id))
    entry?.click()
    expect(selected).toEqual([SiteID.farm])
  })
})
