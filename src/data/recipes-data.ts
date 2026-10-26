import { ItemID } from '../enums/ids/item-id.enum'
import { RecipeID } from '../enums/ids/recipe-id.enum'
import { StationID } from '../enums/ids/station-id.enum'

export type CraftingRecipe = {
    id: RecipeID
    stationId: StationID
    stationLevel: number
    itemsNeeded: RecipeCost[]
    createsAmount: number
    itemId: ItemID
    /** Hidden until its recipe scroll is used. */
    requiresUnlock?: boolean
}

export type RecipeCost = {
    id: ItemID
    amount: number
}

const RECIPES_DATA: Partial<Record<RecipeID, CraftingRecipe>> = {
    [RecipeID.firePit]: {
        id: RecipeID.firePit,
        itemId: ItemID.firePit,
        stationId: StationID.workbench,
        stationLevel: 1,
        itemsNeeded: [{ id: ItemID.stone, amount: 10 }, { id: ItemID.stick, amount: 10 }],
        createsAmount: 1,
    },
    [RecipeID.makeshiftClub]: {
        id: RecipeID.makeshiftClub,
        itemId: ItemID.makeshiftClub,
        stationId: StationID.workbench,
        stationLevel: 1,
        itemsNeeded: [{ id: ItemID.stick, amount: 10 }],
        createsAmount: 1,
    },
    [RecipeID.turtleShellChest]: {
        id: RecipeID.turtleShellChest,
        itemId: ItemID.turtleShellChest,
        stationId: StationID.workbench,
        stationLevel: 1,
        itemsNeeded: [{ id: ItemID.turtleShell, amount: 25 }],
        createsAmount: 1,
    },
    [RecipeID.turtleShellLegs]: {
        id: RecipeID.turtleShellLegs,
        itemId: ItemID.turtleShellLegs,
        stationId: StationID.workbench,
        stationLevel: 1,
        itemsNeeded: [{ id: ItemID.turtleShell, amount: 20 }],
        createsAmount: 1,
    },
    [RecipeID.turtleShellBoots]: {
        id: RecipeID.turtleShellBoots,
        itemId: ItemID.turtleShellBoots,
        stationId: StationID.workbench,
        stationLevel: 1,
        itemsNeeded: [{ id: ItemID.turtleShell, amount: 10 }],
        createsAmount: 1,
    },
    [RecipeID.turtleShellGloves]: {
        id: RecipeID.turtleShellGloves,
        itemId: ItemID.turtleShellGloves,
        stationId: StationID.workbench,
        stationLevel: 1,
        itemsNeeded: [{ id: ItemID.turtleShell, amount: 10 }],
        createsAmount: 1,
    },
    [RecipeID.turtleShellHelmet]: {
        id: RecipeID.turtleShellHelmet,
        itemId: ItemID.turtleShellHelmet,
        stationId: StationID.workbench,
        stationLevel: 1,
        itemsNeeded: [{ id: ItemID.turtleShell, amount: 10 }],
        createsAmount: 1,
    },
    [RecipeID.stoneAxe]: {
        id: RecipeID.stoneAxe,
        itemId: ItemID.stoneAxe,
        stationId: StationID.workbench,
        stationLevel: 1,
        itemsNeeded: [{ id: ItemID.stone, amount: 15 }, { id: ItemID.stick, amount: 10 }],
        createsAmount: 1,
    },
    [RecipeID.fangSpear]: {
        id: RecipeID.fangSpear,
        itemId: ItemID.fangSpear,
        stationId: StationID.workbench,
        stationLevel: 1,
        itemsNeeded: [{ id: ItemID.wolfFangs, amount: 15 }, { id: ItemID.stick, amount: 10 }],
        createsAmount: 1,
    },
    [RecipeID.leatherCap]: {
        id: RecipeID.leatherCap,
        itemId: ItemID.leatherCap,
        stationId: StationID.workbench,
        stationLevel: 1,
        itemsNeeded: [{ id: ItemID.deerPelt, amount: 8 }],
        createsAmount: 1,
    },
    [RecipeID.leatherVest]: {
        id: RecipeID.leatherVest,
        itemId: ItemID.leatherVest,
        stationId: StationID.workbench,
        stationLevel: 1,
        itemsNeeded: [{ id: ItemID.deerPelt, amount: 15 }],
        createsAmount: 1,
    },
    [RecipeID.leatherPants]: {
        id: RecipeID.leatherPants,
        itemId: ItemID.leatherPants,
        stationId: StationID.workbench,
        stationLevel: 1,
        itemsNeeded: [{ id: ItemID.deerPelt, amount: 12 }],
        createsAmount: 1,
    },
    [RecipeID.leatherBoots]: {
        id: RecipeID.leatherBoots,
        itemId: ItemID.leatherBoots,
        stationId: StationID.workbench,
        stationLevel: 1,
        itemsNeeded: [{ id: ItemID.deerPelt, amount: 8 }],
        createsAmount: 1,
    },
    [RecipeID.leatherGloves]: {
        id: RecipeID.leatherGloves,
        itemId: ItemID.leatherGloves,
        stationId: StationID.workbench,
        stationLevel: 1,
        itemsNeeded: [{ id: ItemID.deerPelt, amount: 8 }],
        createsAmount: 1,
    },
    [RecipeID.bearhideGloves]: {
        id: RecipeID.bearhideGloves,
        itemId: ItemID.bearhideGloves,
        stationId: StationID.workbench,
        stationLevel: 1,
        itemsNeeded: [{ id: ItemID.bearPelt, amount: 15 }],
        createsAmount: 1,
    },
    [RecipeID.silkweaveLegs]: {
        id: RecipeID.silkweaveLegs,
        itemId: ItemID.silkweaveLegs,
        stationId: StationID.workbench,
        stationLevel: 1,
        itemsNeeded: [{ id: ItemID.elderSilk, amount: 20 }],
        createsAmount: 1,
    },
    [RecipeID.fireRune]: {
        id: RecipeID.fireRune,
        itemId: ItemID.fireRune,
        stationId: StationID.runeAltar,
        stationLevel: 1,
        itemsNeeded: [{ id: ItemID.wolfFangs, amount: 5 }],
        createsAmount: 1,
    },
    [RecipeID.airRune]: {
        id: RecipeID.airRune,
        itemId: ItemID.airRune,
        stationId: StationID.runeAltar,
        stationLevel: 1,
        itemsNeeded: [{ id: ItemID.feather, amount: 5 }],
        createsAmount: 1,
    },
    [RecipeID.earthRune]: {
        id: RecipeID.earthRune,
        itemId: ItemID.earthRune,
        stationId: StationID.runeAltar,
        stationLevel: 1,
        itemsNeeded: [{ id: ItemID.stone, amount: 10 }],
        createsAmount: 1,
        requiresUnlock: true,
    },
    [RecipeID.waterRune]: {
        id: RecipeID.waterRune,
        itemId: ItemID.waterRune,
        stationId: StationID.runeAltar,
        stationLevel: 1,
        itemsNeeded: [{ id: ItemID.slimeResidue, amount: 5 }],
        createsAmount: 1,
    },
    [RecipeID.rootwoodStaff]: {
        id: RecipeID.rootwoodStaff,
        itemId: ItemID.rootwoodStaff,
        stationId: StationID.runeAltar,
        stationLevel: 1,
        itemsNeeded: [{ id: ItemID.ancientWood, amount: 10 }, { id: ItemID.earthRune, amount: 10 }],
        createsAmount: 1,
    },
    [RecipeID.manaRing]: {
        id: RecipeID.manaRing,
        itemId: ItemID.manaRing,
        stationId: StationID.runeAltar,
        stationLevel: 1,
        itemsNeeded: [{ id: ItemID.waterRune, amount: 15 }, { id: ItemID.boneFragment, amount: 10 }],
        createsAmount: 1,
    },
    [RecipeID.sageRobe]: {
        id: RecipeID.sageRobe,
        itemId: ItemID.sageRobe,
        stationId: StationID.runeAltar,
        stationLevel: 1,
        itemsNeeded: [{ id: ItemID.elderSilk, amount: 20 }, { id: ItemID.airRune, amount: 10 }, { id: ItemID.waterRune, amount: 10 }],
        createsAmount: 1,
    },
    [RecipeID.grilledFish]: {
        id: RecipeID.grilledFish,
        itemId: ItemID.grilledFish,
        stationId: StationID.cooking,
        stationLevel: 1,
        itemsNeeded: [{ id: ItemID.fishMeat, amount: 2 }],
        createsAmount: 1,
    },
    [RecipeID.bakedApple]: {
        id: RecipeID.bakedApple,
        itemId: ItemID.bakedApple,
        stationId: StationID.cooking,
        stationLevel: 1,
        itemsNeeded: [{ id: ItemID.apple, amount: 2 }, { id: ItemID.cheese, amount: 1 }],
        createsAmount: 1,
    },
    [RecipeID.minorManaPotion]: {
        id: RecipeID.minorManaPotion,
        itemId: ItemID.minorManaPotion,
        stationId: StationID.alchemy,
        stationLevel: 1,
        itemsNeeded: [{ id: ItemID.vialOfWater, amount: 1 }, { id: ItemID.apple, amount: 1 }],
        createsAmount: 1,
    },
    [RecipeID.crabStew]: {
        id: RecipeID.crabStew,
        itemId: ItemID.crabStew,
        stationId: StationID.cooking,
        stationLevel: 2,
        itemsNeeded: [{ id: ItemID.crabMeat, amount: 3 }, { id: ItemID.vialOfWater, amount: 1 }],
        createsAmount: 1,
        requiresUnlock: true,
    },
    [RecipeID.cheesePlatter]: {
        id: RecipeID.cheesePlatter,
        itemId: ItemID.cheesePlatter,
        stationId: StationID.cooking,
        stationLevel: 1,
        itemsNeeded: [{ id: ItemID.cheese, amount: 3 }, { id: ItemID.apple, amount: 1 }],
        createsAmount: 1,
        requiresUnlock: true,
    },
    [RecipeID.fishApplePie]: {
        id: RecipeID.fishApplePie,
        itemId: ItemID.fishApplePie,
        stationId: StationID.cooking,
        stationLevel: 2,
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
        stationId: StationID.cooking,
        stationLevel: 3,
        itemsNeeded: [
            { id: ItemID.crabMeat, amount: 3 },
            { id: ItemID.fishMeat, amount: 3 },
            { id: ItemID.cheese, amount: 2 },
        ],
        createsAmount: 1,
        requiresUnlock: true,
    },
    [RecipeID.venisonRoast]: {
        id: RecipeID.venisonRoast,
        itemId: ItemID.venisonRoast,
        stationId: StationID.cooking,
        stationLevel: 2,
        itemsNeeded: [{ id: ItemID.venison, amount: 3 }, { id: ItemID.apple, amount: 1 }],
        createsAmount: 1,
        requiresUnlock: true,
    },
}

export default RECIPES_DATA
