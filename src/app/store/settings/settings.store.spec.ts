import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ItemTier } from '../../../enums/items/item-tier.enum'
import { saveGameStateNow } from '../helpers/with-game-state-sync.hook'
import { needsDestroyConfirm, SettingsStore } from './settings.store'

describe('SettingsStore', () => {
  const configure = () => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })

  beforeEach(() => {
    localStorage.clear()
    configure()
  })

  it('asks before destroying any tier by default', () => {
    const store = TestBed.inject(SettingsStore)

    expect(store.confirmDestroyFromTier()).toBe(ItemTier.trash)
    for (const tier of [ItemTier.trash, ItemTier.normal, ItemTier.legendary]) {
      expect(needsDestroyConfirm(tier, store.confirmDestroyFromTier())).toBeTrue()
    }
  })

  it('asks only from the chosen tier up', () => {
    expect(needsDestroyConfirm(ItemTier.normal, ItemTier.rare)).toBeFalse()
    expect(needsDestroyConfirm(ItemTier.rare, ItemTier.rare)).toBeTrue()
    expect(needsDestroyConfirm(ItemTier.epic, ItemTier.rare)).toBeTrue()
  })

  it('saves the setting and loads it in a new session', () => {
    TestBed.inject(SettingsStore).setConfirmDestroyFromTier(ItemTier.epic)
    TestBed.tick()
    expect(saveGameStateNow()).toBeTrue()

    TestBed.resetTestingModule()
    configure()
    expect(TestBed.inject(SettingsStore).confirmDestroyFromTier()).toBe(ItemTier.epic)
  })
})
