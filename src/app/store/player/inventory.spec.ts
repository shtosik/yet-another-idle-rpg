import {
  addItems,
  blockedTab,
  canFit,
  countItem,
  createInventories,
  Inventories,
  inventoryCapacity,
  missingSlots,
  missingSlotsByTab,
  removeItems,
  resizeInventory,
  slotDeltas,
  splitInventory,
  TabCapacity,
  tabOf,
} from './inventory'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { ItemType } from '../../../enums/items/item-type.enum'
import { ItemTier } from '../../../enums/items/item-tier.enum'
import ITEM_DATA from '../../../data/items-data'

const capacity = (slots: Partial<TabCapacity> = {}): TabCapacity => ({ ...inventoryCapacity([]), ...slots })
const stack = (id: ItemID, amount = 1) => ({ id, type: ITEM_DATA[id].type, tier: ITEM_DATA[id].tier, amount })
const allIds = Object.keys(ITEM_DATA).map(Number) as ItemID[]
const idsIn = (tab: string) => allIds.filter(id => tabOf(id) === tab)

describe('inventory', () => {
  describe('tabOf', () => {
    it('stores each item in its tab', () => {
      expect(tabOf(ItemID.stone)).toBe('materials')
      expect(tabOf(ItemID.woodenBow)).toBe('gear')
      expect(tabOf(ItemID.petArenaYad)).toBe('pets')
      expect(tabOf(ItemID.ambushScroll)).toBe('consumables')
      expect(tabOf(ItemID.arenaChest)).toBe('consumables')
      expect(idsIn('quest').every(id => ITEM_DATA[id].type === ItemType.quest)).toBeTrue()
    })
  })

  describe('capacity', () => {
    it('starts at 20 per slot tab, one Pets slot per pet species and an unlimited Quest tab', () => {
      const base = inventoryCapacity([])
      expect([base.gear, base.consumables, base.materials]).toEqual([20, 20, 20])
      expect(base.pets).toBe(idsIn('pets').length)
      expect(base.quest).toBe(Infinity)
    })

    it('grows every slot tab for an untabbed modifier and one tab for a tabbed one', () => {
      const result = inventoryCapacity([{ stat: 'inventorySlots', amount: 2 }, { stat: 'inventorySlots', amount: 3, tab: 'gear' }])
      expect([result.gear, result.consumables, result.materials]).toEqual([25, 22, 22])
      expect(slotDeltas([], [{ stat: 'inventorySlots', amount: 2 }])).toEqual({ gear: -2, consumables: -2, materials: -2 })
    })
  })

  describe('addItems', () => {
    // A 3-slot Materials tab whose capacity later dropped to 2 leaves slot 2 empty but locked.
    const shrunk = () => addItems({ ...createInventories(), materials: [null, null, null] }, capacity({ materials: 3 }),
      [{ id: ItemID.stone, amount: 1 }, { id: ItemID.stick, amount: 1 }])

    it('never fills slots past capacity', () => {
      const result = addItems(shrunk(), capacity({ materials: 2 }), [{ id: ItemID.fishMeat, amount: 1 }])

      expect(result.materials[2]).toBeNull()
      expect(countItem(result, ItemID.fishMeat)).toBe(0)
    })

    it('still stacks onto a usable stack', () => {
      const result = addItems(shrunk(), capacity({ materials: 2 }), [{ id: ItemID.stone, amount: 4 }])

      expect(result.materials[0]?.amount).toBe(5)
    })

    it('puts each item in its own tab, so a full tab only loses its own items', () => {
      const others = idsIn('materials').filter(id => id !== ItemID.fishMeat).slice(0, 20)
      const fullMaterials = { ...createInventories(), materials: others.map(id => stack(id)) }
      const result = addItems(fullMaterials, capacity(), [{ id: ItemID.woodenBow, amount: 1 }, { id: ItemID.fishMeat, amount: 1 }])

      expect(result.gear[0]?.id).toBe(ItemID.woodenBow)
      expect(countItem(result, ItemID.fishMeat)).toBe(0)
    })

    it('grows the unlimited Quest tab as items arrive', () => {
      const quest = idsIn('quest').slice(0, 2)
      const result = addItems(createInventories(), capacity(), quest.map(id => ({ id, amount: 1 })))

      expect(result.quest.map(s => s?.id)).toEqual(quest)
    })
  })

  describe('removeItems', () => {
    it('takes from the item\'s tab, also from slots past capacity', () => {
      const over: Inventories = { ...createInventories(), materials: [stack(ItemID.stick), stack(ItemID.stone, 3)] }
      const result = removeItems(over, [{ id: ItemID.stone, amount: 3 }])

      expect(result.materials).toEqual([stack(ItemID.stick), null])
      expect(result.gear).toBe(over.gear)
    })
  })

  describe('canFit / missingSlots', () => {
    const fullMaterials = (): Inventories => ({ ...createInventories(), materials: idsIn('materials').slice(1, 21).map(id => stack(id)) })
    const newMaterial = idsIn('materials')[0]

    it('ignores free slots past capacity', () => {
      const inventory = { ...createInventories(), materials: [stack(ItemID.stone), stack(ItemID.stick), null] }
      expect(canFit(inventory, capacity({ materials: 2 }), [{ id: ItemID.fishMeat, amount: 1 }])).toBeFalse()
      expect(canFit(inventory, capacity({ materials: 3 }), [{ id: ItemID.fishMeat, amount: 1 }])).toBeTrue()
    })

    it('fits in one tab while another is full', () => {
      expect(canFit(fullMaterials(), capacity(), [{ id: ItemID.woodenBow, amount: 1 }])).toBeTrue()
      expect(canFit(fullMaterials(), capacity(), [{ id: newMaterial, amount: 1 }])).toBeFalse()
    })

    it('counts slots freed only in the tab they are freed in', () => {
      const inventory = fullMaterials()
      const freed = [{ id: inventory.materials[0]!.id, amount: 1 }]
      const fullGear = { ...inventory, gear: idsIn('gear').slice(1, 21).map(id => stack(id)) }

      expect(canFit(inventory, capacity(), [{ id: newMaterial, amount: 1 }], freed)).toBeTrue()
      expect(missingSlots(fullGear, capacity(), [{ id: idsIn('gear')[0], amount: 1 }], freed)).toBe(1)
    })

    it('adds up what is missing over tabs', () => {
      const full = { ...fullMaterials(), gear: idsIn('gear').slice(1, 21).map(id => stack(id)) }
      expect(missingSlots(full, capacity(), [{ id: newMaterial, amount: 1 }, { id: idsIn('gear')[0], amount: 1 }])).toBe(2)
    })

    it('names each tab that is short, so messages can say which', () => {
      const full = { ...fullMaterials(), gear: idsIn('gear').slice(1, 21).map(id => stack(id)) }
      const adding = [{ id: newMaterial, amount: 1 }, { id: idsIn('materials')[21], amount: 1 }, { id: ItemID.ambushScroll, amount: 1 }]
      expect(missingSlotsByTab(full, capacity(), adding)).toEqual({ materials: 2 })
      expect(missingSlotsByTab(full, capacity(), [{ id: idsIn('gear')[0], amount: 1 }])).toEqual({ gear: 1 })
      expect(missingSlotsByTab(fullMaterials(), capacity(), [{ id: ItemID.woodenBow, amount: 1 }])).toEqual({})
    })
  })

  describe('blockedTab / resizeInventory', () => {
    it('checks every tab against its own capacity and names the one that strands items', () => {
      const inventory = { ...createInventories(), consumables: [null, stack(ItemID.ambushScroll)] }
      const two = capacity({ consumables: 2 })
      expect(blockedTab(inventory, two, two)).toBeNull()
      expect(blockedTab(inventory, two, capacity({ consumables: 1 }))).toBe('consumables')
      // Taking the stranded item out first lifts the block.
      expect(blockedTab(inventory, two, capacity({ consumables: 1 }), [], [{ id: ItemID.ambushScroll, amount: 1 }])).toBeNull()
    })

    it('names the tab with no room for what is added', () => {
      const fullGear = { ...createInventories(), gear: idsIn('gear').slice(1, 21).map(id => stack(id)) }
      expect(blockedTab(fullGear, capacity(), capacity(), [{ id: idsIn('gear')[0], amount: 1 }])).toBe('gear')
    })

    it('grows a tab to its capacity, never shrinks, and keeps the same object when nothing grew', () => {
      const inventory = createInventories()
      expect(resizeInventory(inventory, capacity())).toBe(inventory)
      expect(resizeInventory(inventory, capacity({ gear: 22 })).gear.length).toBe(22)
      expect(resizeInventory(inventory, capacity({ gear: 5 })).gear.length).toBe(20)
    })
  })

  describe('splitInventory (save migration)', () => {
    it('splits the flat inventory by tab in slot order', () => {
      const flat = [stack(ItemID.stone, 5), null, stack(ItemID.woodenBow), stack(ItemID.ambushScroll), stack(ItemID.petArenaYad)]
      const result = splitInventory(flat)

      expect(result.materials).toEqual([stack(ItemID.stone, 5)])
      expect(result.gear).toEqual([stack(ItemID.woodenBow)])
      expect(result.consumables).toEqual([stack(ItemID.ambushScroll)])
      expect(result.pets).toEqual([stack(ItemID.petArenaYad)])
      expect(result.quest).toEqual([])
    })

    it('never deletes items: a tab over capacity keeps them, locked, until taken out', () => {
      const flat = idsIn('materials').slice(0, 25).map(id => ({ ...stack(id), tier: ItemTier.normal }))
      const result = splitInventory(flat)

      expect(result.materials.length).toBe(25)
      // Items already past capacity don't block unrelated changes; shrinking the tab further still does.
      expect(blockedTab(result, capacity(), capacity({ gear: 18 }))).toBeNull()
      expect(blockedTab(result, capacity(), capacity({ materials: 19 }))).toBe('materials')
      // The resize after loading never shrinks it.
      expect(resizeInventory(result, capacity()).materials.length).toBe(25)
    })
  })
})
