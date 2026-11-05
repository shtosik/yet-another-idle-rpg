import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { DialogueManagerService } from './dialogue-manager.service'
import { TownsStore } from '../store/towns/towns.store'
import { TownsComponent } from '../components/game/town/towns.component'
import { DialogueComponent } from '../components/game/dialogue/dialogue.component'
import { DialogueOption } from '../../interfaces/dialogues/dialogue-option.type'
import { TownID } from '../../enums/map/town-id.enum'
import { NpcID } from '../../enums/map/npc-id.enum'
import { ShopID } from '../../enums/ids/shop-id.enum'
import TOWNS_DATA from '../../data/towns-data'
import { saveGameStateNow } from '../store/helpers/with-game-state-sync.hook'
import i18next from 'i18next'
import forgeText from '../../assets/locales/en/forge.json'

describe('forge dialogue effect', () => {
  let dialogue: DialogueManagerService
  let towns: InstanceType<typeof TownsStore>
  const option: DialogueOption<number> = {
    responseKey: 'forge:open', results: [{ effects: [{ type: 'forge' }] }],
  }

  beforeEach(async () => {
    localStorage.clear()
    await i18next.init({ lng: 'en', resources: { en: { forge: forgeText } } })
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    dialogue = TestBed.inject(DialogueManagerService)
    towns = TestBed.inject(TownsStore)
    towns.selectTown(TownID.laHarpar)
    towns.selectTownBuilding(TOWNS_DATA[TownID.laHarpar].buildings[0])
  })
  afterEach(() => localStorage.clear())

  it('opens inline from an effect, closes the building dialogue, and returns on close', async () => {
    const fixture = TestBed.createComponent(TownsComponent)
    dialogue.startDialogue(NpcID.laHarparBartender)
    await fixture.whenStable()
    expect(dialogue.activeNpc()).not.toBeNull()
    dialogue.selectOption(option)
    await fixture.whenStable()
    expect(towns.forgeOpen()).toBeTrue()
    expect(fixture.debugElement.nativeElement.querySelector('app-forge')).not.toBeNull()
    expect(dialogue.activeNpc()).toBeNull()
    fixture.debugElement.nativeElement.querySelector('app-forge button.forge__close').click()
    await fixture.whenStable()
    expect(towns.forgeOpen()).toBeFalse()
    expect(fixture.debugElement.nativeElement.querySelector('app-town-building')).not.toBeNull()
  })

  it('labels the effect with the registered translation', () => {
    const component = TestBed.createComponent(DialogueComponent).componentInstance
    expect(component.getEffectLabel({ type: 'forge' })).toBe('Open Forge')
  })

  it('keeps shop and Forge mutually exclusive', () => {
    towns.openShop(ShopID.laHarparShop)
    dialogue.selectOption(option)
    expect(towns.activeShopId()).toBeNull()
    expect(towns.forgeOpen()).toBeTrue()
    towns.openShop(ShopID.laHarparShop)
    expect(towns.forgeOpen()).toBeFalse()
  })

  it('closes when leaving a building, town or town tab', () => {
    towns.openForge()
    towns.selectTownBuilding(null)
    expect(towns.forgeOpen()).toBeFalse()
    towns.openForge()
    towns.selectTown(TownID.lirold)
    expect(towns.forgeOpen()).toBeFalse()
    const fixture = TestBed.createComponent(TownsComponent)
    towns.openForge()
    fixture.destroy()
    expect(towns.forgeOpen()).toBeFalse()
  })

  it('never saves whether the panel is open', () => {
    dialogue.selectOption(option)
    TestBed.flushEffects()
    saveGameStateNow()
    expect(localStorage.getItem('townsStore')).not.toBeNull()
    expect(localStorage.getItem('townsStore')).not.toContain('forgeOpen')
    TestBed.resetTestingModule()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    expect(TestBed.inject(TownsStore).forgeOpen()).toBeFalse()
  })
})
