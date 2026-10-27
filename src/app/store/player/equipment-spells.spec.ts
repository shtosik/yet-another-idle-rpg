import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { PlayerStore } from './player.store'
import { BattleStore } from '../battle/battle.store'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { ItemTier } from '../../../enums/items/item-tier.enum'
import { SpellID } from '../../../enums/ids/spell-id.enum'

describe('PlayerStore spells from equipment', () => {
  let store: InstanceType<typeof PlayerStore>
  let battleStore: InstanceType<typeof BattleStore>

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    store = TestBed.inject(PlayerStore)
    battleStore = TestBed.inject(BattleStore)
  })

  afterEach(() => localStorage.clear())

  const equipStormcaller = () => {
    store.addItems([{ id: ItemID.stormcaller, tier: ItemTier.legendary, amount: 1 }])
    store.equipItem(store.inventory().find(slot => slot?.id === ItemID.stormcaller)!)
  }

  it('knows the spell only while the item is equipped', () => {
    expect(store.knownSpellIds()).toEqual([])
    equipStormcaller()
    expect(store.knownSpellIds()).toEqual([SpellID.thunderstorm])
    store.unequipItem('weapon')
    expect(store.knownSpellIds()).toEqual([])
  })

  const onBar = () => battleStore.equippedSpells().some(slot => slot?.spellId === SpellID.thunderstorm)

  it('takes the spell off the spell bar when the item is unequipped', () => {
    equipStormcaller()
    battleStore.addSpell({ spellId: SpellID.thunderstorm, cooldownRemainingMs: 0 })
    TestBed.tick()
    expect(onBar()).toBeTrue()

    store.unequipItem('weapon')
    TestBed.tick()
    expect(onBar()).toBeFalse()
  })

  it('keeps the spell in its slot until its cooldown ends, so the slot cannot take another spell', () => {
    equipStormcaller()
    battleStore.addSpell({ spellId: SpellID.thunderstorm, cooldownRemainingMs: 5000 })
    store.unequipItem('weapon')
    TestBed.tick()
    expect(onBar()).toBeTrue()

    battleStore.tickSpellTimers(5000)
    TestBed.tick()
    expect(onBar()).toBeFalse()
  })
})
