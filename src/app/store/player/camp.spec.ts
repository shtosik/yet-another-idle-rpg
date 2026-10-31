import { addItems, createInventories, inventoryCapacity, TabCapacity } from './inventory'
import { evaluateRecipe, installStations, Stations } from './camp'
import RECIPES_DATA from '../../../data/recipes-data'
import { RecipeID } from '../../../enums/ids/recipe-id.enum'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { StationID } from '../../../enums/ids/station-id.enum'

/** `count` slots in every slot tab. */
const slots = (count: number): TabCapacity => ({ ...inventoryCapacity([]), gear: count, consumables: count, materials: count })

const inventoryWith = (items: { id: ItemID, amount: number }[], capacity = 10) =>
  addItems(createInventories(), slots(capacity), items)

describe('camp', () => {
  describe('installStations', () => {
    it('installs the next level and keeps it out of the inventory', () => {
      const { stations, rest, installed } = installStations({ [StationID.workbench]: 1 }, [
        { id: ItemID.firePit, amount: 1 },
        { id: ItemID.stone, amount: 3 },
      ])

      expect(stations[StationID.cooking]).toBe(1)
      expect(installed).toEqual([ItemID.firePit])
      expect(rest).toEqual([{ id: ItemID.stone, amount: 3 }])
    })

    it('keeps gear that arrives out of order', () => {
      const { stations, rest, installed } = installStations({}, [{ id: ItemID.cookingPot, amount: 1 }])

      expect(stations[StationID.cooking]).toBeUndefined()
      expect(installed).toEqual([])
      expect(rest).toEqual([{ id: ItemID.cookingPot, amount: 1 }])
    })

    it('drops gear that is already installed', () => {
      const { rest, installed } = installStations({ [StationID.cooking]: 2 }, [{ id: ItemID.firePit, amount: 1 }])

      expect(installed).toEqual([])
      expect(rest).toEqual([])
    })
  })

  describe('evaluateRecipe', () => {
    const stations: Stations = { [StationID.workbench]: 1, [StationID.cooking]: 2 }

    it('counts how many can be crafted', () => {
      const result = evaluateRecipe(RECIPES_DATA[RecipeID.grilledFish]!, inventoryWith([{ id: ItemID.fishMeat, amount: 7 }]), slots(10), stations, [])

      expect(result).toEqual({ visible: true, maxCraftable: 3, blockReason: null })
    })

    it('shows level-locked recipes with the station level as the reason', () => {
      const result = evaluateRecipe(RECIPES_DATA[RecipeID.huntersFeast]!, createInventories(), slots(40), stations, [RecipeID.huntersFeast])

      expect(result.visible).toBeTrue()
      expect(result.blockReason).toBe('stationLevel')
    })

    it('hides recipes of stations the player does not own', () => {
      const result = evaluateRecipe(RECIPES_DATA[RecipeID.minorManaPotion]!, createInventories(), slots(40), stations, [])

      expect(result.visible).toBeFalse()
    })

    it('hides scroll recipes until the scroll is used', () => {
      const result = evaluateRecipe(RECIPES_DATA[RecipeID.crabStew]!, createInventories(), slots(40), stations, [])

      expect(result.visible).toBeFalse()
    })

    it('hides station gear that is already installed', () => {
      const result = evaluateRecipe(RECIPES_DATA[RecipeID.firePit]!, createInventories(), slots(40), stations, [])

      expect(result.visible).toBeFalse()
    })

    it('caps station gear at one and ignores a full inventory', () => {
      const full = inventoryWith([{ id: ItemID.stone, amount: 30 }, { id: ItemID.stick, amount: 30 }], 2)
      const result = evaluateRecipe(RECIPES_DATA[RecipeID.firePit]!, full, slots(2), { [StationID.workbench]: 1 }, [])

      expect(result).toEqual({ visible: true, maxCraftable: 1, blockReason: null })
    })

    it('blocks when the result\'s tab is full, even when paying frees a slot in another tab', () => {
      // Paying the 2 fish meat frees a Materials slot; the Consumables tab (2 usable of its 20 slots) stays full.
      const full = inventoryWith([{ id: ItemID.fishMeat, amount: 2 }, { id: ItemID.minorManaPotion, amount: 1 }, { id: ItemID.ambushScroll, amount: 1 }], 2)
      const result = evaluateRecipe(RECIPES_DATA[RecipeID.grilledFish]!, full, slots(2), stations, [])

      expect(result.blockReason).toBe('inventoryFull')
      expect(result.maxCraftable).toBe(0)
    })

    it('crafts into a tab with room while another tab is full', () => {
      const fullMaterials = inventoryWith([{ id: ItemID.fishMeat, amount: 4 }, { id: ItemID.stone, amount: 1 }], 2)
      const result = evaluateRecipe(RECIPES_DATA[RecipeID.grilledFish]!, fullMaterials, slots(2), stations, [])

      expect(result.blockReason).toBeNull()
      expect(result.maxCraftable).toBe(2)
    })
  })
})
