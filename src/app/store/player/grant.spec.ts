import { canGrant, GrantMode, GrantState, grantItems } from './grant'
import { createInventories, inventoryCapacity, ItemStack, TabCapacity, tabOf } from './inventory'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { StationID } from '../../../enums/ids/station-id.enum'
import ITEM_DATA from '../../../data/items-data'

const capacity = (slots: Partial<TabCapacity> = {}): TabCapacity => ({ ...inventoryCapacity([]), ...slots })
const fresh = (): GrantState => ({ inventory: createInventories(), stations: {}, seeds: {}, spellbookUnlocked: false })
const materials = (Object.keys(ITEM_DATA).map(Number) as ItemID[]).filter(id => tabOf(id) === 'materials')
/** A Materials tab with `slots` slots, all holding one other material. */
const fullMaterials = (slots: number): GrantState => ({
  ...fresh(),
  inventory: { ...createInventories(), materials: materials.filter(id => id !== ItemID.stone && id !== ItemID.stick).slice(0, slots).map(id => ({ id, type: ITEM_DATA[id].type, tier: ITEM_DATA[id].tier, amount: 1 })) },
})

describe('grantItems', () => {
  const cases: { name: string, state: () => GrantState, cap: TabCapacity, items: ItemStack[], mode: GrantMode, expect: (r: ReturnType<typeof grantItems>, before: GrantState) => void }[] = [
    {
      name: 'atomic refuses and changes nothing when one stack does not fit',
      state: () => fullMaterials(2), cap: capacity({ materials: 2 }), mode: 'atomic',
      items: [{ id: ItemID.woodenBow, amount: 1 }, { id: ItemID.stone, amount: 1 }],
      expect: (r, before) => {
        expect(r.state).toBe(before)
        expect(r.missing).toEqual({ materials: 1 })
        expect(r.received).toEqual([])
      },
    },
    {
      name: 'lossy lands what fits and reports the rest as lost',
      state: () => fullMaterials(2), cap: capacity({ materials: 2 }), mode: 'lossy',
      items: [{ id: ItemID.woodenBow, amount: 1 }, { id: ItemID.stone, amount: 3 }],
      expect: r => {
        expect(r.received.map(i => i.id)).toEqual([ItemID.woodenBow])
        expect(r.lost).toEqual([{ id: ItemID.stone, tier: ITEM_DATA[ItemID.stone].tier, amount: 3 }])
        expect(r.state.inventory.gear[0]?.id).toBe(ItemID.woodenBow)
      },
    },
    {
      name: 'seeds go to the seed store and never need a slot',
      state: () => fullMaterials(0), cap: capacity({ materials: 0 }), mode: 'atomic',
      items: [{ id: ItemID.turnipSeeds, amount: 4 }],
      expect: r => {
        expect(r.missing).toEqual({})
        expect(r.state.seeds[ItemID.turnipSeeds]).toBe(4)
        expect(r.received.map(i => [i.id, i.amount])).toEqual([[ItemID.turnipSeeds, 4]])
      },
    },
    {
      name: 'station gear installs without a slot; out-of-order gear needs one',
      state: fresh, cap: capacity({ consumables: 0 }), mode: 'atomic',
      items: [{ id: ItemID.firePit, amount: 1 }],
      expect: r => {
        expect(r.installed).toEqual([ItemID.firePit])
        expect(r.state.stations[StationID.cooking]).toBe(1)
        expect(canGrant(fresh(), capacity({ consumables: 0 }), [{ id: ItemID.cookingPot, amount: 1 }])).toBeFalse()
      },
    },
    {
      name: 'the spellbook unlocks its tab and never enters the inventory',
      state: fresh, cap: capacity({ consumables: 0 }), mode: 'atomic',
      items: [{ id: ItemID.spellbook, amount: 1 }],
      expect: r => {
        expect(r.missing).toEqual({})
        expect(r.state.spellbookUnlocked).toBeTrue()
        expect(r.state.inventory.consumables.every(slot => slot === null)).toBeTrue()
      },
    },
    {
      name: 'each item lands in its own tab',
      state: fresh, cap: capacity(), mode: 'atomic',
      items: [{ id: ItemID.woodenBow, amount: 1 }, { id: ItemID.stone, amount: 2 }, { id: ItemID.ambushScroll, amount: 1 }],
      expect: r => {
        expect(r.state.inventory.gear[0]?.id).toBe(ItemID.woodenBow)
        expect(r.state.inventory.materials[0]?.id).toBe(ItemID.stone)
        expect(r.state.inventory.consumables[0]?.id).toBe(ItemID.ambushScroll)
      },
    },
    {
      name: 'locked slots past capacity stay untouched; a usable stack still grows',
      state: () => ({ ...fresh(), inventory: { ...createInventories(), materials: [{ id: ItemID.stone, type: ITEM_DATA[ItemID.stone].type, tier: ITEM_DATA[ItemID.stone].tier, amount: 1 }, null] } }),
      cap: capacity({ materials: 1 }), mode: 'atomic',
      items: [{ id: ItemID.stone, amount: 2 }],
      expect: r => {
        expect(r.state.inventory.materials[0]?.amount).toBe(3)
        expect(r.state.inventory.materials[1]).toBeNull()
        expect(grantItems(r.state, capacity({ materials: 1 }), [{ id: ItemID.stick, amount: 1 }], 'atomic').missing).toEqual({ materials: 1 })
      },
    },
    {
      name: 'removing frees its slot first',
      state: () => fullMaterials(1), cap: capacity({ materials: 1 }), mode: 'atomic',
      items: [{ id: ItemID.stone, amount: 1 }],
      expect: (r, before) => {
        const held = before.inventory.materials[0]!
        const freed = grantItems(before, capacity({ materials: 1 }), [{ id: ItemID.stone, amount: 1 }], 'atomic', [{ id: held.id, amount: 1 }])
        expect(r.missing).toEqual({ materials: 1 })
        expect(freed.missing).toEqual({})
        expect(freed.state.inventory.materials[0]?.id).toBe(ItemID.stone)
      },
    },
  ]

  for (const c of cases) {
    it(c.name, () => {
      const before = c.state()
      c.expect(grantItems(before, c.cap, c.items, c.mode), before)
    })
  }

  it('canGrant answers what an atomic grant would do', () => {
    const state = fullMaterials(2)
    expect(canGrant(state, capacity({ materials: 2 }), [{ id: ItemID.stone, amount: 1 }])).toBeFalse()
    expect(canGrant(state, capacity({ materials: 3 }), [{ id: ItemID.stone, amount: 1 }])).toBeTrue()
  })
})
