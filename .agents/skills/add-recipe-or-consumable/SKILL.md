---
name: add-recipe-or-consumable
description: Use when adding a crafting recipe, a food or potion, station gear, or a recipe scroll — recipe data, station and level, the consumable's effect, how the recipe is learned, names and icons. Triggers on "add a new recipe", "add a potion that gives X", "make a new food", "craft a sword at the workbench", "add a recipe scroll drop", "new cooking station level".
---

# Add a recipe or consumable

Background: `docs/systems/consumables-camp-crafting.md` (stations, recipe visibility, slots and locks).

Do the steps that apply: a food or potion usually needs 1, 2, 3 and 5; a crafted weapon 3 and 5 (the item itself via `add-equipment-item`); station gear 1, 3 and 5.

## Steps

1. **Item** (if new) — append to `src/enums/ids/item-id.enum.ts:ItemID` and add to:
   - **Food / potion** → `src/data/items/consumables-items.data.ts` with `type: ItemType.food` or `ItemType.potion` and `effect: { slot: 'food' | 'potion', duration: 10 * MINUTE, cooldown: 15 * MINUTE, stats: [{ stat: 'attackPower', amount: 2 }] }` (seconds; `manaRestore` for mana potions; the effect is capped at the lock `cooldown`).
   - **Station gear** → `src/data/items/station-items.data.ts` with `type: ItemType.stationUpgrade`, `stationId`, `level` (the next level of that station, up to its `maxLevel` in `src/data/stations-data.ts`), plus `unlocks:stations.<itemKey>.title`/`.body` keys for the install popup.

2. **Name and icon** — `items:names.<itemKey>`; icon via `/generate-2d-asset` at `src/assets/img/items/<itemKey>.png`.

3. **Recipe** — append to `src/enums/ids/recipe-id.enum.ts:RecipeID` and add to `src/data/recipes-data.ts:RECIPES_DATA`:
   ```ts
   [RecipeID.grilledFish]: {
     id: RecipeID.grilledFish,
     itemId: ItemID.grilledFish,
     stationId: StationID.cooking,
     stationLevel: 1,
     itemsNeeded: [{ id: ItemID.fishMeat, amount: 2 }],
     createsAmount: 1,
     requiresUnlock: true,   // omit to know it from the start
   },
   ```

4. **Recipe scroll** (if `requiresUnlock`) — an item in `consumables-items.data.ts` with `type: ItemType.recipe`, `recipeId`, `url: './assets/img/items/cookingRecipe.png'` (shared scroll icon), an `items:names` key, and a source: enemy `drop(...)`, a `SHOPS_DATA` entry with `refreshable: false`, or a quest reward.

5. **Ingredients reachable** — every `itemsNeeded` item has a source (drop, shop, or another recipe).

Done when `npm run validate` and `npx ng build` pass, and in the dev server the recipe shows at the right station level, crafts, and (for consumables) the effect applies and expires.
