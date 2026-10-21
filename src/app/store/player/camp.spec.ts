import { addItems, createInventory } from './inventory'
import { evaluateRecipe, installStations, Stations } from './camp'
import RECIPES_DATA from '../../../data/recipes-data'
import { RecipeID } from '../../../enums/ids/recipe-id.enum'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { StationID } from '../../../enums/ids/station-id.enum'

const inventoryWith = (items: { id: ItemID, amount: number }[], capacity = 10) =>
  addItems(createInventory(capacity), capacity, items)

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
      const result = evaluateRecipe(RECIPES_DATA[RecipeID.grilledFish]!, inventoryWith([{ id: ItemID.fishMeat, amount: 7 }]), stations, [])

      expect(result).toEqual({ visible: true, maxCraftable: 3, blockReason: null })
    })

    it('shows level-locked recipes with the station level as the reason', () => {
      const result = evaluateRecipe(RECIPES_DATA[RecipeID.huntersFeast]!, createInventory(), stations, [RecipeID.huntersFeast])

      expect(result.visible).toBeTrue()
      expect(result.blockReason).toBe('stationLevel')
    })

    it('hides recipes of stations the player does not own', () => {
      const result = evaluateRecipe(RECIPES_DATA[RecipeID.minorManaPotion]!, createInventory(), stations, [])

      expect(result.visible).toBeFalse()
    })

    it('hides scroll recipes until the scroll is used', () => {
      const result = evaluateRecipe(RECIPES_DATA[RecipeID.crabStew]!, createInventory(), stations, [])

      expect(result.visible).toBeFalse()
    })

    it('hides station gear that is already installed', () => {
      const result = evaluateRecipe(RECIPES_DATA[RecipeID.firePit]!, createInventory(), stations, [])

      expect(result.visible).toBeFalse()
    })

    it('caps station gear at one and ignores a full inventory', () => {
      const full = inventoryWith([{ id: ItemID.stone, amount: 30 }, { id: ItemID.stick, amount: 30 }], 2)
      const result = evaluateRecipe(RECIPES_DATA[RecipeID.firePit]!, full, { [StationID.workbench]: 1 }, [])

      expect(result).toEqual({ visible: true, maxCraftable: 1, blockReason: null })
    })

    it('blocks when the result has no inventory space', () => {
      const full = inventoryWith([{ id: ItemID.fishMeat, amount: 4 }, { id: ItemID.stone, amount: 1 }], 2)
      const result = evaluateRecipe(RECIPES_DATA[RecipeID.grilledFish]!, full, stations, [])

      expect(result.blockReason).toBe('inventoryFull')
      expect(result.maxCraftable).toBe(0)
    })
  })
})
