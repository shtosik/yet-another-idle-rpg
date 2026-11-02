import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import ITEM_DATA from '../../../data/items-data'
import { UPGRADE_COST_FACTOR, UPGRADE_LEVEL_CAP } from '../../../data/upgrade-data'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { ItemTier } from '../../../enums/items/item-tier.enum'
import { ItemType } from '../../../enums/items/item-type.enum'
import { InventoryItem } from '../../../interfaces/item.interface'
import { addItems, countItem, createInventories, inventoryCapacity, tabOf } from './inventory'
import { evaluateMerge, MergeContext, mergeCost, MergeRefusal, MergeSource, rollMerge } from './merge'
import { initialEquipmentState, statsInitialState } from './player'
import { PlayerStore } from './player.store'
import { equipmentModifiers } from './stats'

const id = ItemID.woodenBow
const tier = ITEM_DATA[id].tier
const item = (upgradeLevel?: number, amount = 1, itemId = id): InventoryItem => ({
  id: itemId, tier: ITEM_DATA[itemId].tier, type: ITEM_DATA[itemId].type, amount, upgradeLevel,
})
const inventorySource = (stack = item()): MergeSource => ({ from: 'inventory', item: stack })
const equippedSource: MergeSource = { from: 'equipped', slot: 'weapon' }

describe('PlayerStore.mergeItem', () => {
  let store: InstanceType<typeof PlayerStore>

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    store = TestBed.inject(PlayerStore)
    store.updatePlayerStats([{ stat: 'goldCoins', amount: 100000 }])
  })
  afterEach(() => localStorage.clear())

  function expectRefusal(base: MergeSource, sacrifice: MergeSource, reason: Exclude<MergeRefusal['reason'], 'inventoryFull'>) {
    const before = { inventory: store.inventory(), equipment: store.equipment(), gold: store.resources().goldCoins }
    const rng = jasmine.createSpy('rng').and.returnValue(0)
    expect(store.mergeItem(base, sacrifice, rng)).toEqual({ status: 'refused', reason })
    expect({ inventory: store.inventory(), equipment: store.equipment(), gold: store.resources().goldCoins }).toEqual(before)
    expect(rng).not.toHaveBeenCalled()
  }

  it('takes two copies from one stack, treating missing and explicit +0 alike', () => {
    store.addItems([item(undefined, 4), item(2, 3)])
    const cost = ITEM_DATA[id].value * UPGRADE_COST_FACTOR
    expect(store.mergeItem(inventorySource(), inventorySource(item(0)), () => 0.999)).toEqual({ status: 'success', cost })
    expect(store.itemCount(id, tier)).toBe(2)
    expect(store.itemCount(id, tier, 1)).toBe(1)
    expect(store.itemCount(id, tier, 2)).toBe(3)
    expect(store.resources().goldCoins).toBe(100000 - cost)
  })

  it('requires two owned copies, ignoring the caller-supplied stack amount', () => {
    expectRefusal(inventorySource(), inventorySource(), 'missingCopy')
    store.addItems([item()])
    expectRefusal(inventorySource(item(undefined, 99)), inventorySource(), 'missingCopy')
    store.equipItem(item())
    expectRefusal(equippedSource, equippedSource, 'missingCopy')
  })

  it('upgrades an equipped base in place and derives its stats from the new level', () => {
    store.addItems([item(4, 2)])
    store.equipItem(item(4))
    expect(store.mergeItem(equippedSource, inventorySource(item(4)), () => 0.999).status).toBe('success')
    expect(store.equipment().weapon).toEqual({ id, tier, upgradeLevel: 5 })
    expect(store.itemCount(id, tier, 4)).toBe(0)
    expect(store.stats().attackPower).toBe(statsInitialState.attackPower + 5.25)
    expect(store.resources().goldCoins).toBe(100000 - mergeCost(ITEM_DATA[id].value, 4))
  })

  it('empties an equipped sacrifice slot and returns the upgraded base to the inventory', () => {
    store.addItems([item(1, 3)])
    store.equipItem(item(1))
    expect(store.mergeItem(inventorySource(item(1)), equippedSource, () => 0).status).toBe('success')
    expect(store.equipment().weapon).toBeNull()
    expect(store.itemCount(id, tier, 1)).toBe(1)
    expect(store.itemCount(id, tier, 2)).toBe(1)
    expect(store.stats().attackPower).toBe(statsInitialState.attackPower)
  })

  it('refuses mismatched ids, rarities and upgrade levels', () => {
    store.addItems([item(), item(1), { ...item(), tier: ItemTier.legendary }, item(0, 1, ItemID.makeshiftClub)])
    expectRefusal(inventorySource(), inventorySource(item(1)), 'mismatch')
    expectRefusal(inventorySource(), inventorySource({ ...item(), tier: ItemTier.legendary }), 'mismatch')
    expectRefusal(inventorySource(), inventorySource(item(0, 1, ItemID.makeshiftClub)), 'mismatch')
  })

  it('refuses gold shortfalls and allows spending exactly the cost', () => {
    store.addItems([item(3, 2)])
    const cost = mergeCost(ITEM_DATA[id].value, 3)
    store.updatePlayerStats([{ stat: 'goldCoins', amount: cost - 1 - store.resources().goldCoins }])
    expectRefusal(inventorySource(item(3)), inventorySource(item(3)), 'notEnoughGold')
    store.updatePlayerStats([{ stat: 'goldCoins', amount: 1 }])
    expect(store.mergeItem(inventorySource(item(3)), inventorySource(item(3)), () => 0).status).toBe('success')
    expect(store.resources().goldCoins).toBe(0)
  })

  it('refuses unique gear, pets, non-equipment and items at the cap', () => {
    for (const [itemId, reason] of [
      [ItemID.joshsHeirloom, 'unique'], [ItemID.magicStaff, 'unique'], [ItemID.patronGloves, 'unique'],
      [ItemID.petGreenSlime, 'pet'], [ItemID.stick, 'notEquipment'],
    ] as const) {
      const stack = item(0, 2, itemId)
      store.addItems([stack])
      expectRefusal(inventorySource(stack), inventorySource(stack), reason)
    }
    store.addItems([item(UPGRADE_LEVEL_CAP, 2)])
    expectRefusal(inventorySource(item(UPGRADE_LEVEL_CAP)), inventorySource(item(UPGRADE_LEVEL_CAP)), 'atCap')
  })

  function fillGear() {
    store.addItems(Object.values(ITEM_DATA).filter(data => tabOf(data.id) === 'gear' && data.id !== id)
      .slice(0, store.inventoryCapacity().gear - 1).map(data => ({ id: data.id, amount: 1 })))
  }

  it('refuses a new upgraded stack in a full tab, but can reuse the slot of a consumed stack', () => {
    store.addItems([item(0, 3)])
    fillGear()
    const before = store.inventory()
    expect(store.mergeItem(inventorySource(), inventorySource(), () => 0)).toEqual({ status: 'refused', reason: 'inventoryFull', tab: 'gear' })
    expect(store.inventory()).toEqual(before)
    expect(store.resources().goldCoins).toBe(100000)
    store.removeItems([item()])
    expect(store.mergeItem(inventorySource(), inventorySource(), () => 0).status).toBe('success')
    expect(store.itemCount(id, tier, 1)).toBe(1)
  })

  it('merges into an equipped base with a full Gear tab', () => {
    store.addItems([item(0, 3)])
    store.equipItem(item())
    fillGear()
    expect(store.mergeItem(equippedSource, inventorySource(), () => 0).status).toBe('success')
    expect(store.equipment().weapon?.upgradeLevel).toBe(1)
    expect(store.itemCount(id, tier)).toBe(1)
  })
})

describe('merge preview and later-level rolls', () => {
  function context(level = 5): MergeContext {
    const capacity = inventoryCapacity([])
    return {
      base: inventorySource(item(level)), sacrifice: inventorySource(item(level)),
      inventory: addItems(createInventories(), capacity, [item(level, 3)]),
      equipment: { ...initialEquipmentState }, capacity, goldCoins: 100000,
    }
  }

  it('uses the per-attempt cost for the 80 × value total to build a +5', () => {
    const value = ITEM_DATA[id].value
    expect([0, 1, 2, 3, 4].map(level => mergeCost(value, level))).toEqual([1, 2, 4, 8, 16].map(n => n * value * UPGRADE_COST_FACTOR))
    const total = [0, 1, 2, 3, 4].reduce((sum, level) => sum + mergeCost(value, level) * 2 ** (4 - level), 0)
    expect(total).toBe(80 * value * UPGRADE_COST_FACTOR)
  })

  it('loses only gold and the sacrifice on a forced +6 failure, for each source combination', () => {
    for (const equipped of ['neither', 'base', 'sacrifice']) {
      const input = context()
      if (equipped !== 'neither') {
        input.equipment.weapon = { id, tier, upgradeLevel: 5 }
        input[equipped === 'base' ? 'base' : 'sacrifice'] = equippedSource
      }
      const before = structuredClone(input)
      const plan = evaluateMerge(input, 10)
      expect(input).toEqual(before)
      if (plan.status !== 'ready') throw new Error('Expected merge preview')
      expect(plan.chance).toBe(0.9)
      const { result, state } = rollMerge(plan, () => 0.95)
      expect(result).toEqual({ status: 'failure', cost: mergeCost(ITEM_DATA[id].value, 5) })
      expect(state.goldCoins).toBe(input.goldCoins - mergeCost(ITEM_DATA[id].value, 5))
      expect(countItem(state.inventory, id, tier, 5)).toBe(equipped === 'sacrifice' ? 3 : 2)
      expect(countItem(state.inventory, id, tier, 6)).toBe(0)
      expect(state.equipment.weapon).toEqual(equipped === 'base' ? input.equipment.weapon : null)
      expect(rollMerge(plan, () => 0.89).result.status).toBe('success')
    }
  })

  describe('inventorySlots gear', () => {
    const original = ITEM_DATA[id]
    beforeEach(() => {
      if (original.type !== ItemType.equipment) throw new Error('Expected equipment fixture')
      ITEM_DATA[id] = { ...original, stats: [{ id: 'inventorySlots', amount: 10 }] }
    })
    afterEach(() => { ITEM_DATA[id] = original })

    it('blocks an equipped sacrifice that would lock occupied slots in any tab', () => {
      const input = context(0)
      input.equipment.weapon = { id, tier }
      input.sacrifice = equippedSource
      input.capacity = inventoryCapacity(equipmentModifiers(input.equipment))
      input.inventory.materials[29] = item(0, 1, ItemID.stick)
      expect(evaluateMerge(input)).toEqual({ status: 'refused', reason: 'inventoryFull', tab: 'materials' })
      input.inventory.materials[29] = null
      expect(evaluateMerge(input).status).toBe('ready')
    })

    it('uses the upgraded equipped base bonus when checking capacity', () => {
      const input = context(4)
      input.equipment.weapon = { id, tier, upgradeLevel: 4 }
      input.base = equippedSource
      input.capacity = inventoryCapacity(equipmentModifiers(input.equipment))
      const plan = evaluateMerge(input)
      if (plan.status !== 'ready') throw new Error('Expected merge preview')
      expect(inventoryCapacity(equipmentModifiers(plan.success.equipment)).gear).toBe(37.5)
    })

    it('checks a possible failure before rolling when removing slot gear', () => {
      const input = context()
      input.equipment.weapon = { id, tier, upgradeLevel: 5 }
      input.sacrifice = equippedSource
      input.capacity = inventoryCapacity(equipmentModifiers(input.equipment))
      // Success consumes the base in a slot being locked; failure must retain it there.
      input.inventory.gear = Array.from({ length: 38 }, (_, index) => index === 29 ? item(5) : null)
      expect(evaluateMerge(input, 10)).toEqual({ status: 'refused', reason: 'inventoryFull', tab: 'gear' })
    })
  })
})
