import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import ITEM_DATA from '../../../data/items-data'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { ItemTier } from '../../../enums/items/item-tier.enum'
import { ShopID } from '../../../enums/ids/shop-id.enum'
import { ZoneID } from '../../../enums/ids/zone-id.enum'
import { InventoryItem } from '../../../interfaces/item.interface'
import { saveGameStateNow } from '../helpers/with-game-state-sync.hook'
import { sellPrice } from '../shop/shop-prices'
import { addItems, canFit, countItem, createInventories, hasItems, inventoryCapacity, lostItems, maxAffordable, missingSlots, removeItems, stackKey, tabOf } from './inventory'
import { rollDropList } from './kill-rewards'
import { initialEquipmentState, statsInitialState } from './player'
import { PlayerStore } from './player.store'
import { deriveStats, equipmentModifiers, initialResources, upgradedStatAmount } from './stats'

const id = ItemID.woodenBow
const tier = ITEM_DATA[id].tier
const stack = (upgradeLevel?: number, amount = 1): InventoryItem => ({
  id, tier, type: ITEM_DATA[id].type, amount,
  ...(upgradeLevel === undefined ? {} : { upgradeLevel }),
})

describe('upgrade level stack identity', () => {
  const capacity = { ...inventoryCapacity([]), gear: 3 }

  it('stacks missing and explicit +0 together, separating levels and rarities', () => {
    const inventory = addItems(createInventories(), inventoryCapacity([]), [
      stack(undefined, 2), stack(0, 3), stack(1, 4), stack(2, 5), { ...stack(1), tier: ItemTier.legendary },
    ])
    expect(inventory.gear.filter(Boolean).map(item => item!.amount)).toEqual([5, 4, 5, 1])
    expect(countItem(inventory, id)).toBe(5)
    expect(countItem(inventory, id, tier, 1)).toBe(4)
    expect(hasItems(inventory, [stack(2, 6)])).toBeFalse()
    expect(maxAffordable(inventory, [stack(1, 2)])).toBe(2)
    expect(countItem(removeItems(inventory, [stack(1, 3)]), id, tier, 1)).toBe(1)
    expect(countItem(removeItems(inventory, [stack(undefined, 99)]), id, tier, 1)).toBe(4)
  })

  it('checks space, freed slots and lost drops at the requested level', () => {
    const inventory = addItems(createInventories(), capacity, [stack(0, 2), stack(1, 2), stack(2, 2)])
    expect(canFit(inventory, capacity, [stack(1, 3)])).toBeTrue()
    expect(canFit(inventory, capacity, [stack(3)])).toBeFalse()
    expect(missingSlots(inventory, capacity, [stack(3), stack(3), stack(4)])).toBe(2)
    expect(canFit(inventory, capacity, [stack(3)], [stack(1, 2)])).toBeTrue()
    expect(canFit(inventory, capacity, [stack(3)], [stack(4, 2)])).toBeFalse()
    expect(lostItems(inventory, capacity, [stack(1, 3), stack(3, 4)])).toEqual([
      { id, tier, upgradeLevel: 3, amount: 4 },
    ])
  })

  it('accumulates new +0 drops separately from upgraded drops already in the map', () => {
    const upgraded = stack(1, 7)
    const drops = new Map([[stackKey(upgraded), upgraded]])
    rollDropList([{ id, minAmount: 1, maxAmount: 1, chance: 1 }], 2, 0, drops, undefined, () => 0.5)
    expect(drops.get(stackKey(stack()))?.amount).toBe(2)
    expect(drops.get(stackKey(upgraded))?.amount).toBe(7)
  })
})

describe('upgrade level stats', () => {
  it('scales base stats by 10% per level, adding 25% of base at +5', () => {
    expect([0, 1, 2, 3, 4, 5].map(level => upgradedStatAmount(10, level))).toEqual([10, 11, 12, 13, 14, 17.5])
    expect(upgradedStatAmount(0.1, 1)).toBe(0.11)
    expect(upgradedStatAmount(0.123456, 3)).toBe(0.160493)
    expect(upgradedStatAmount(0.123456789)).toBe(0.123456789)
  })

  it('uses scaled modifiers in derived stats, including fractional inverted stats', () => {
    const equipment = { ...initialEquipmentState, ring: { id: ItemID.joshsHeirloom, tier: ItemTier.uncommon, upgradeLevel: 5 } }
    const stats = deriveStats(initialResources(), equipmentModifiers(equipment))
    expect(stats.attackPower).toBe(statsInitialState.attackPower + 1.75)
    expect(stats.attackSpeed).toBe(statsInitialState.attackSpeed - 0.175)
  })

  it('doubles the existing shop price per level, retaining unsellable rules', () => {
    for (const shop of [ShopID.laHarparShop, ShopID.mawoodMagicShop]) {
      expect(sellPrice(shop, id, 5)).toBe(sellPrice(shop, id) * 32)
    }
    expect(sellPrice(ShopID.laHarparShop, ItemID.arenaChest, 5)).toBe(0)
    expect(sellPrice(ShopID.explorersGuildStore, id, 5)).toBe(0)
    expect(sellPrice(ShopID.mawoodMagicShop, ItemID.fireRune, 2)).toBe(sellPrice(ShopID.mawoodMagicShop, ItemID.fireRune) * 4)
  })
})

describe('PlayerStore upgrade level', () => {
  let store: InstanceType<typeof PlayerStore>

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    store = TestBed.inject(PlayerStore)
  })
  afterEach(() => localStorage.clear())

  it('preserves levels through equip, swaps and unequip', () => {
    store.grant([stack(), stack(1, 2), stack(5)], 'lossy')
    store.equipItem(stack(1))
    expect(store.equipment().weapon).toEqual({ id, tier, upgradeLevel: 1 })
    expect(store.itemCount(id, tier, 1)).toBe(1)
    store.equipItem(stack(5))
    expect(store.equipment().weapon).toEqual({ id, tier, upgradeLevel: 5 })
    expect(store.itemCount(id, tier, 1)).toBe(2)
    store.unequipItem('weapon')
    expect(store.itemCount(id, tier, 5)).toBe(1)
    expect(store.itemCount(id)).toBe(1)
    expect(store.equipment().weapon).toBeNull()
  })

  it('does not unequip into another level in a full inventory', () => {
    store.grant([stack(5)], 'lossy')
    store.equipItem(stack(5))
    const filling = Object.values(ITEM_DATA).filter(item => tabOf(item.id) === 'gear').slice(0, 20)
    store.grant(filling.map(item => ({ id: item.id, amount: 1 })), 'lossy')
    expect(store.canUnequip('weapon')).toBeFalse()
    store.unequipItem('weapon')
    expect(store.equipment().weapon?.upgradeLevel).toBe(5)
    store.removeItems([{ id: filling[0].id, amount: 1 }])
    expect(store.canUnequip('weapon')).toBeTrue()
  })

  it('sells only the selected level and caps the sale to its owned amount', () => {
    store.grant([stack(undefined, 4), stack(2, 3), stack(5, 2)], 'lossy')
    store.sellItem(stack(2), ShopID.laHarparShop, 99)
    expect(store.stats().goldCoins).toBe(sellPrice(ShopID.laHarparShop, id) * 4 * 3)
    expect(store.itemCount(id, tier, 2)).toBe(0)
    expect(store.itemCount(id)).toBe(4)
    expect(store.itemCount(id, tier, 5)).toBe(2)
    store.sellItem(stack(2), ShopID.laHarparShop, 1)
    expect(store.stats().goldCoins).toBe(sellPrice(ShopID.laHarparShop, id) * 12)
  })

  it('destroys only the selected level', () => {
    store.grant([stack(undefined, 4), stack(2, 3)], 'lossy')
    store.destroyItem(stack(2, 3))
    expect(store.itemCount(id, tier, 2)).toBe(0)
    expect(store.itemCount(id)).toBe(4)
  })

  it('keeps offline receipts separate by upgrade level', () => {
    const result = store.applyKillBatch({
      zoneId: ZoneID.horseshoeBeach, wave: 1, kills: 0, shinies: 0, killsByEnemy: {}, taskCountsByEnemy: {}, experience: 0, gold: 0,
      items: [stack(undefined, 2), stack(1, 3)],
    })
    expect(result.receivedItems).toEqual([stack(undefined, 2), stack(1, 3)])
    expect(result.lostDrops).toBe(0)
  })

  it('preserves upgraded chest contents and leaves existing +0 gear separate', () => {
    TestBed.resetTestingModule()
    const inventory = addItems(createInventories(), inventoryCapacity([]), [stack(), { id: ItemID.arenaChest, amount: 1 }])
    localStorage.setItem('playerStore', JSON.stringify({ v: 2, state: {
      inventory, rolledChests: { [ItemID.arenaChest]: { gold: 0, items: [stack(2)] } },
    } }))
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    store = TestBed.inject(PlayerStore)
    store.openChest(store.inventory().consumables.find(item => item?.id === ItemID.arenaChest)!)
    expect(store.itemCount(id)).toBe(1)
    expect(store.itemCount(id, tier, 2)).toBe(1)
  })

  it('loads a version 2 save without upgradeLevel unchanged, treating items as +0', () => {
    TestBed.resetTestingModule()
    const inventory = createInventories()
    inventory.gear[0] = stack(undefined, 3)
    const equipment = { ...initialEquipmentState, ring: { id: ItemID.joshsHeirloom, tier: ItemTier.uncommon } }
    localStorage.setItem('playerStore', JSON.stringify({ v: 2, state: { inventory, equipment } }))
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    store = TestBed.inject(PlayerStore)
    expect(store.inventory().gear[0]).toEqual(stack(undefined, 3))
    expect(store.equipment().ring).toEqual(equipment.ring)
    expect(store.stats().attackSpeed).toBe(2.9)
    store.grant([stack(0, 2)], 'lossy')
    expect(store.inventory().gear.filter(Boolean)).toEqual([stack(undefined, 5)])
    expect(store.stats().attackPower).toBe(statsInitialState.attackPower + 1)
  })

  it('persists and reloads upgraded inventory and equipment without a version bump', () => {
    store.grant([stack(2, 3), stack(5)], 'lossy')
    store.equipItem(stack(5))
    saveGameStateNow()
    TestBed.resetTestingModule()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    store = TestBed.inject(PlayerStore)
    expect(store.itemCount(id, tier, 2)).toBe(3)
    expect(store.equipment().weapon?.upgradeLevel).toBe(5)
  })
})
