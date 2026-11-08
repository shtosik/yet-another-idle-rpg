import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import i18next from 'i18next'
import { ItemUseService } from './item-use.service'
import { ModalService } from './modal.service'
import { BattleStore } from '../store/battle/battle.store'
import { PlayerStore } from '../store/player/player.store'
import ITEM_DATA from '../../data/items-data'
import { ItemID } from '../../enums/ids/item-id.enum'
import { SpellID } from '../../enums/ids/spell-id.enum'
import { InventoryItem } from '../../interfaces/item.interface'

describe('ItemUseService', () => {
  let itemUse: ItemUseService
  let player: InstanceType<typeof PlayerStore>
  let battle: InstanceType<typeof BattleStore>
  let modal: jasmine.SpyObj<ModalService>

  beforeAll(async () => {
    await i18next.init({ lng: 'en', resources: {} })
  })

  beforeEach(() => {
    localStorage.clear()
    modal = jasmine.createSpyObj<ModalService>('ModalService', ['openChestOpened', 'openStationInstalled'])
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), { provide: ModalService, useValue: modal }] })
    itemUse = TestBed.inject(ItemUseService)
    player = TestBed.inject(PlayerStore)
    battle = TestBed.inject(BattleStore)
  })

  afterEach(() => localStorage.clear())

  const give = (id: ItemID): InventoryItem => {
    const { tier, type } = ITEM_DATA[id]
    player.grant([{ id, tier, amount: 1 }], 'lossy')
    return { id, tier, type, amount: 1 }
  }
  const onBar = (spellId: SpellID) => battle.equippedSpells().filter(slot => slot?.spellId === spellId).length

  it('uses consumables, scrolls and chests, not gear or materials', () => {
    expect(itemUse.canUse(ItemID.ambushScroll)).toBeTrue()
    expect(itemUse.canUse(ItemID.arenaChest)).toBeTrue()
    expect(itemUse.canUse(ItemID.woodenBow)).toBeFalse()
    expect(itemUse.canUse(ItemID.crabMeat)).toBeFalse()
  })

  it('a spell scroll teaches the spell and puts it on the bar once', () => {
    itemUse.use(give(ItemID.ambushScroll))
    expect(player.knownSpellIds()).toContain(SpellID.ambush)
    expect(onBar(SpellID.ambush)).toBe(1)

    battle.setAllEquippedSpells(battle.equippedSpells().map(() => null))
    itemUse.use(give(ItemID.ambushScroll))
    expect(onBar(SpellID.ambush)).toBe(0)
    expect(player.itemCount(ItemID.ambushScroll)).toBe(1)
  })

  it('opening a chest shows what it gave', () => {
    itemUse.use(give(ItemID.arenaChest))
    expect(modal.openChestOpened).toHaveBeenCalledTimes(1)
    expect(player.itemCount(ItemID.arenaChest)).toBe(0)
  })
})
