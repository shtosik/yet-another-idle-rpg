import { ItemID } from '../../../enums/ids/item-id.enum'
import { ZoneID } from '../../../enums/ids/zone-id.enum'
import { TownID } from '../../../enums/map/town-id.enum'
import { ItemTier } from '../../../enums/items/item-tier.enum'
import { EquipmentItem, InventoryItem } from '../../../interfaces/item.interface'
import { UnlockedContent } from '../../../types/player/unlocked-content.type'
import ITEM_DATA from '../../../data/items-data'
import { planEquip, planUnequip } from './equipment'
import { blockedTab, createInventories, inventoryCapacity, withSlotDeltas } from './inventory'
import { isUnlocked, unlockedOf, withUnlocked } from './unlocked-content'

const stack = (id: ItemID, upgradeLevel?: number): InventoryItem =>
  ({ id, type: ITEM_DATA[id].type, tier: ITEM_DATA[id].tier, amount: 1, upgradeLevel })

describe('Gear plan', () => {
  const bow = stack(ItemID.woodenBow)
  const machete = { id: ItemID.machete, tier: ItemTier.uncommon }

  it('equips into an empty slot: the item leaves the inventory, nothing returns, the slot holds it', () => {
    const plan = planEquip(bow, {})!
    expect(plan.slot).toBe('weapon')
    expect(plan.removing).toEqual([{ id: bow.id, tier: bow.tier, upgradeLevel: undefined, amount: 1 }])
    expect(plan.returning).toEqual([])
    expect(plan.equipped).toEqual({ id: bow.id, tier: bow.tier, upgradeLevel: undefined })
  })

  it('swaps: the worn gear comes back and keeps its upgrade level', () => {
    const plan = planEquip(bow, { weapon: { ...machete, upgradeLevel: 3 } })!
    expect(plan.returning).toEqual([{ ...machete, upgradeLevel: 3, amount: 1 }])
  })

  it('swaps into a full tab: the worn gear takes the slot the new item frees', () => {
    const inventories = createInventories()
    const capacity = inventoryCapacity([])
    inventories.gear = inventories.gear.map(() => ({ ...bow }))
    const plan = planEquip(bow, { weapon: machete })!
    expect(blockedTab(inventories, capacity, withSlotDeltas(capacity, plan.deltas), plan.returning, plan.removing)).toBeNull()
    expect(blockedTab(inventories, capacity, capacity, plan.returning)).toBe('gear')
  })

  it('has no plan for an item without an equipment slot, or an empty slot', () => {
    expect(planEquip(stack(ItemID.stone), {})).toBeNull()
    expect(planUnequip('weapon', { weapon: null })).toBeNull()
  })

  it('unequips: the gear returns and the slot empties', () => {
    const plan = planUnequip('weapon', { weapon: machete })!
    expect(plan.removing).toEqual([])
    expect(plan.returning.length).toBe(1)
    expect(plan.equipped).toBeNull()
  })

  describe('with a slot bonus on the gear', () => {
    const data = ITEM_DATA[ItemID.woodenBow] as EquipmentItem
    const original = data.stats
    beforeEach(() => { data.stats = [...original, { id: 'inventorySlots', amount: 2 }] })
    afterEach(() => { data.stats = original })

    it('unequip is blocked when the lost slots hold items', () => {
      const inventories = createInventories()
      const capacity = inventoryCapacity([{ stat: 'inventorySlots', amount: 2 }])
      inventories.gear = [...inventories.gear, null, null].map(() => ({ ...bow }))
      const plan = planUnequip('weapon', { weapon: { id: ItemID.woodenBow, tier: bow.tier } })!
      expect(plan.deltas).toEqual({ gear: -2, consumables: -2, materials: -2 })
      expect(blockedTab(inventories, capacity, withSlotDeltas(capacity, plan.deltas), plan.returning, plan.removing)).toBe('gear')
    })

    it('equip carries the gained slots, minus the worn gear\'s', () => {
      expect(planEquip(bow, {})!.deltas).toEqual({ gear: 2, consumables: 2, materials: 2 })
      expect(planEquip(bow, { weapon: { id: ItemID.woodenBow, tier: bow.tier } })!.deltas).toEqual({ gear: 0, consumables: 0, materials: 0 })
    })
  })
})

describe('unlocked content', () => {
  const old = { zones: undefined, towns: undefined } as unknown as UnlockedContent

  it('defaults zones to Horseshoe Beach and the rest to empty when a list is missing', () => {
    expect(unlockedOf(old, 'zones')).toEqual([ZoneID.horseshoeBeach])
    expect(unlockedOf(old, 'towns')).toEqual([])
    expect(isUnlocked(old, 'zones', ZoneID.horseshoeBeach)).toBeTrue()
  })

  it('appends once and keeps the default zone when the list was missing', () => {
    const once = withUnlocked(old, 'zones', ZoneID.plains)
    expect(once.zones).toEqual([ZoneID.horseshoeBeach, ZoneID.plains])
    expect(withUnlocked(once, 'zones', ZoneID.plains)).toBe(once)
    expect(withUnlocked(once, 'towns', TownID.laHarpar).towns).toEqual([TownID.laHarpar])
  })
})
