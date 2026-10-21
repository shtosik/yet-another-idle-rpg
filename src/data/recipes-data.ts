import { ItemID } from '../enums/ids/item-id.enum'
import { RecipeID } from '../enums/ids/recipe-id.enum'

export type CraftingRecipe = {
    id: RecipeID
    unlockRequirement: null
    itemsNeeded: RecipeCost[]
    createsAmount: number
    itemId: ItemID
    requiresUnlock?: boolean
}

export type RecipeCost = {
    id: ItemID
    amount: number
}

const RECIPES_DATA: Partial<Record<RecipeID, CraftingRecipe>> = {
    [RecipeID.makeshiftClub]: {
        id: RecipeID.makeshiftClub,
        itemId: ItemID.makeshiftClub,
        unlockRequirement: null,
        itemsNeeded: [{ id: ItemID.stick, amount: 10 }],
        createsAmount: 1,
    },
    [RecipeID.turtleShellChest]: {
        id: RecipeID.turtleShellChest,
        itemId: ItemID.turtleShellChest,
        unlockRequirement: null,
        itemsNeeded: [{ id: ItemID.turtleShell, amount: 25 }],
        createsAmount: 1,
    },
    [RecipeID.turtleShellLegs]: {
        id: RecipeID.turtleShellLegs,
        itemId: ItemID.turtleShellLegs,
        unlockRequirement: null,
        itemsNeeded: [{ id: ItemID.turtleShell, amount: 20 }],
        createsAmount: 1,
    },
    [RecipeID.turtleShellBoots]: {
        id: RecipeID.turtleShellBoots,
        itemId: ItemID.turtleShellBoots,
        unlockRequirement: null,
        itemsNeeded: [{ id: ItemID.turtleShell, amount: 10 }],
        createsAmount: 1,
    },
    [RecipeID.turtleShellGloves]: {
        id: RecipeID.turtleShellGloves,
        itemId: ItemID.turtleShellGloves,
        unlockRequirement: null,
        itemsNeeded: [{ id: ItemID.turtleShell, amount: 10 }],
        createsAmount: 1,
    },
    [RecipeID.turtleShellHelmet]: {
        id: RecipeID.turtleShellHelmet,
        itemId: ItemID.turtleShellHelmet,
        unlockRequirement: null,
        itemsNeeded: [{ id: ItemID.turtleShell, amount: 10 }],
        createsAmount: 1,
    },
    [RecipeID.fireRune]: {
        id: RecipeID.fireRune,
        itemId: ItemID.fireRune,
        unlockRequirement: null,
        itemsNeeded: [{ id: ItemID.wolfFangs, amount: 5 }],
        createsAmount: 1,
    },
    [RecipeID.airRune]: {
        id: RecipeID.airRune,
        itemId: ItemID.airRune,
        unlockRequirement: null,
        itemsNeeded: [{ id: ItemID.feather, amount: 5 }],
        createsAmount: 1,
    },
    [RecipeID.earthRune]: {
        id: RecipeID.earthRune,
        itemId: ItemID.earthRune,
        unlockRequirement: null,
        itemsNeeded: [{ id: ItemID.stone, amount: 10 }],
        createsAmount: 1,
        requiresUnlock: true,
    },
    [RecipeID.waterRune]: {
        id: RecipeID.waterRune,
        itemId: ItemID.waterRune,
        unlockRequirement: null,
        itemsNeeded: [{ id: ItemID.slimeResidue, amount: 5 }],
        createsAmount: 1,
    },
    [RecipeID.grilledFish]: {
        id: RecipeID.grilledFish,
        itemId: ItemID.grilledFish,
        unlockRequirement: null,
        itemsNeeded: [{ id: ItemID.fishMeat, amount: 2 }],
        createsAmount: 1,
    },
    [RecipeID.bakedApple]: {
        id: RecipeID.bakedApple,
        itemId: ItemID.bakedApple,
        unlockRequirement: null,
        itemsNeeded: [{ id: ItemID.apple, amount: 2 }, { id: ItemID.cheese, amount: 1 }],
        createsAmount: 1,
    },
    [RecipeID.minorManaPotion]: {
        id: RecipeID.minorManaPotion,
        itemId: ItemID.minorManaPotion,
        unlockRequirement: null,
        itemsNeeded: [{ id: ItemID.vialOfWater, amount: 1 }, { id: ItemID.apple, amount: 1 }],
        createsAmount: 1,
    },
    [RecipeID.crabStew]: {
        id: RecipeID.crabStew,
        itemId: ItemID.crabStew,
        unlockRequirement: null,
        itemsNeeded: [{ id: ItemID.crabMeat, amount: 3 }, { id: ItemID.vialOfWater, amount: 1 }],
        createsAmount: 1,
        requiresUnlock: true,
    },
    [RecipeID.cheesePlatter]: {
        id: RecipeID.cheesePlatter,
        itemId: ItemID.cheesePlatter,
        unlockRequirement: null,
        itemsNeeded: [{ id: ItemID.cheese, amount: 3 }, { id: ItemID.apple, amount: 1 }],
        createsAmount: 1,
        requiresUnlock: true,
    },
    [RecipeID.fishApplePie]: {
        id: RecipeID.fishApplePie,
        itemId: ItemID.fishApplePie,
        unlockRequirement: null,
        itemsNeeded: [
            { id: ItemID.fishMeat, amount: 2 },
            { id: ItemID.apple, amount: 2 },
            { id: ItemID.cheese, amount: 1 },
        ],
        createsAmount: 1,
        requiresUnlock: true,
    },
    [RecipeID.huntersFeast]: {
        id: RecipeID.huntersFeast,
        itemId: ItemID.huntersFeast,
        unlockRequirement: null,
        itemsNeeded: [
            { id: ItemID.crabMeat, amount: 3 },
            { id: ItemID.fishMeat, amount: 3 },
            { id: ItemID.cheese, amount: 2 },
        ],
        createsAmount: 1,
        requiresUnlock: true,
    },
}

export default RECIPES_DATA
