import { addItems, canFit, createInventory } from './inventory'
import { ItemID } from '../../../enums/ids/item-id.enum'

describe('inventory', () => {
  // A 3-slot array whose capacity later dropped to 2 leaves slot 2 empty but locked.
  const shrunk = () => addItems(createInventory(3), 3, [{ id: ItemID.stone, amount: 1 }, { id: ItemID.stick, amount: 1 }])

  describe('addItems', () => {
    it('never fills slots past capacity', () => {
      const result = addItems(shrunk(), 2, [{ id: ItemID.fishMeat, amount: 1 }])

      expect(result[2]).toBeNull()
      expect(result.some(slot => slot?.id === ItemID.fishMeat)).toBeFalse()
    })

    it('still stacks onto a usable stack', () => {
      const result = addItems(shrunk(), 2, [{ id: ItemID.stone, amount: 4 }])

      expect(result[0]?.amount).toBe(5)
    })
  })

  describe('canFit', () => {
    it('ignores free slots past capacity', () => {
      expect(canFit(shrunk(), 2, [{ id: ItemID.fishMeat, amount: 1 }])).toBeFalse()
    })

    it('fits once capacity covers the free slot', () => {
      expect(canFit(shrunk(), 3, [{ id: ItemID.fishMeat, amount: 1 }])).toBeTrue()
    })
  })
})
