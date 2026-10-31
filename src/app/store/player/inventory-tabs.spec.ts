import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { PlayerStore } from './player.store'
import { InventoryTab, lostItems, tabOf } from './inventory'
import ITEM_DATA from '../../../data/items-data'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { ItemTier } from '../../../enums/items/item-tier.enum'
import { ShopID } from '../../../enums/ids/shop-id.enum'
import { ZoneID } from '../../../enums/ids/zone-id.enum'
import { EquipmentItem, InventoryItem } from '../../../interfaces/item.interface'
import { EquipmentSlot } from '../../../enums/equipment-slot.enum'
import { sellPrice } from '../shop/shop-prices'

const allIds = Object.keys(ITEM_DATA).map(Number) as ItemID[]
const idsIn = (tab: InventoryTab) => allIds.filter(id => tabOf(id) === tab)
const slot = (id: ItemID, amount = 1): InventoryItem => ({ id, type: ITEM_DATA[id].type, tier: ITEM_DATA[id].tier, amount })

describe('PlayerStore inventory tabs', () => {
  let store: InstanceType<typeof PlayerStore>

  const create = () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    store = TestBed.inject(PlayerStore)
  }
  /** Fills a tab to capacity with items other than `except`. */
  const fill = (tab: InventoryTab, except: ItemID[] = []) => {
    const ids = idsIn(tab).filter(id => !except.includes(id)).slice(0, store.inventoryCapacity()[tab])
    store.addItems(ids.map(id => ({ id, amount: 1 })))
    expect(store.inventory()[tab].every(s => s !== null)).toBeTrue()
  }

  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  describe('save migration from the flat inventory (version 1)', () => {
    it('splits the items by tab and keeps a tab\'s items past its capacity', () => {
      const materials = idsIn('materials').slice(0, 25).map(id => slot(id))
      const flat = [slot(ItemID.woodenBow), null, ...materials, slot(ItemID.ambushScroll, 2)]
      localStorage.setItem('playerStore', JSON.stringify({ inventory: flat, explorerTokens: 7 }))
      create()

      expect(store.explorerTokens()).toBe(7)
      expect(store.inventory().gear[0]).toEqual(slot(ItemID.woodenBow))
      expect(store.inventory().consumables[0]).toEqual(slot(ItemID.ambushScroll, 2))
      expect(store.inventory().materials.filter(Boolean).length).toBe(25)
      expect(store.inventory().gear.length).toBe(store.inventoryCapacity().gear)
    })

    it('turns used version 1 Guild Satchels (+5 slots each) into +2 slots per tab', () => {
      localStorage.setItem('playerStore', JSON.stringify({ inventory: [], permanentBonuses: { inventorySlots: 5, maxMana: 10 } }))
      create()

      expect(store.permanentBonuses()).toEqual({ inventorySlots: 2, maxMana: 10 })
      expect(store.inventoryCapacity().materials).toBe(22)
    })
  })

  describe('add / fit / missing', () => {
    beforeEach(create)

    it('fits in one tab while another is full', () => {
      fill('materials', [ItemID.stone])

      expect(store.canFitItems([{ id: ItemID.woodenBow, amount: 1 }])).toBeTrue()
      expect(store.canFitItems([{ id: ItemID.stone, amount: 1 }])).toBeFalse()
      expect(store.missingSlotsFor([{ id: ItemID.stone, amount: 1 }, { id: ItemID.woodenBow, amount: 1 }])).toBe(1)
    })

    it('the Guild Satchel adds 2 slots to each slot tab', () => {
      const before = store.inventoryCapacity()
      store.useItem(slot(ItemID.guildSatchel))

      const after = store.inventoryCapacity()
      expect([after.gear, after.consumables, after.materials]).toEqual([before.gear + 2, before.consumables + 2, before.materials + 2])
      expect(after.pets).toBe(before.pets)
      TestBed.tick()
      expect(store.inventory().gear.length).toBe(after.gear)
    })

    it('counts an item in its tab (item count, has-item unlock condition)', () => {
      store.addItems([{ id: ItemID.stone, amount: 3 }, { id: ItemID.stone, tier: ItemTier.rare, amount: 2 }])

      expect(store.itemCount(ItemID.stone)).toBe(5)
      expect(store.isUnlockConditionMet({ type: 'hasItem', itemId: ItemID.stone })).toBeTrue()
      expect(store.isUnlockConditionMet({ type: 'hasItem', itemId: ItemID.woodenBow })).toBeFalse()
    })
  })

  describe('kill drops', () => {
    beforeEach(create)

    it('loses a drop only when its own tab is full, offline', () => {
      fill('materials', [ItemID.stone])
      const result = store.applyKillBatch({
        zoneId: ZoneID.horseshoeBeach, wave: 1, kills: 2, shinies: 0, killsByEnemy: {}, taskCountsByEnemy: {}, experience: 0, gold: 0,
        items: [slot(ItemID.stone, 4), slot(ItemID.woodenBow)],
      })

      expect(result.lostDrops).toBe(4)
      expect(result.receivedItems).toEqual([slot(ItemID.woodenBow)])
      expect(store.itemCount(ItemID.woodenBow)).toBe(1)
    })

    it('reports as lost only the drops whose own tab is full, online', () => {
      fill('materials', [ItemID.stone])
      const lost = lostItems(store.inventory(), store.inventoryCapacity(), [
        { id: ItemID.stone, amount: 4 }, { id: ItemID.woodenBow, amount: 1 },
      ])

      expect(lost).toEqual([{ id: ItemID.stone, tier: ITEM_DATA[ItemID.stone].tier, amount: 4 }])
    })

    it('does not report a drop that stacks onto an existing stack in a full tab', () => {
      fill('materials')
      const stacked = idsIn('materials')[0]

      expect(lostItems(store.inventory(), store.inventoryCapacity(), [{ id: stacked, amount: 3 }])).toEqual([])
    })
  })

  describe('can change slots (respec, refund, slot gear)', () => {
    beforeEach(create)

    it('blocks shrinking only when a tab would strand items', () => {
      fill('materials')

      expect(store.canChangeInventorySlots({ gear: -5, consumables: -5 })).toBeTrue()
      expect(store.canChangeInventorySlots({ materials: -1 })).toBeFalse()
    })
  })

  describe('equip / unequip', () => {
    beforeEach(create)

    it('unequips while another tab is full, not while Gear is', () => {
      store.addItems([{ id: ItemID.woodenBow, amount: 1 }])
      store.equipItem(store.inventory().gear[0]!)
      fill('materials')
      expect(store.canUnequip('weapon')).toBeTrue()

      fill('gear', [ItemID.woodenBow])
      expect(store.canUnequip('weapon')).toBeFalse()
    })

    it('swaps gear from a full Gear tab', () => {
      const weapons = idsIn('gear').filter(id => (ITEM_DATA[id] as EquipmentItem).slot === EquipmentSlot.weapon).slice(0, 2)
      store.addItems(weapons.map(id => ({ id, amount: 1 })))
      store.equipItem(store.inventory().gear[0]!)
      fill('gear', weapons)
      const second = store.inventory().gear.find(s => s?.id === weapons[1])!

      expect(store.canEquip(second)).toBeTrue()
      store.equipItem(second)
      expect(store.equipment().weapon?.id).toBe(weapons[1])
      expect(store.itemCount(weapons[0])).toBe(1)
    })
  })

  describe('sell', () => {
    beforeEach(create)

    it('sells from the item\'s tab', () => {
      const shop = Object.values(ShopID).find(id => typeof id === 'number' && sellPrice(id, ItemID.stone) > 0) as ShopID
      store.addItems([{ id: ItemID.stone, amount: 3 }])
      store.sellItem(slot(ItemID.stone, 3), shop, 2)

      expect(store.itemCount(ItemID.stone)).toBe(1)
    })
  })
})
