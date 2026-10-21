# Consumables, Camp and crafting

## Purpose
The **Camp** tab is the player's crafting base. It holds **stations** (Workbench, Cooking, Alchemy, Rune Altar) that craft **recipes** into gear, food and potions. Food and potions go into **consumable slots** for a timed stat effect; **auto-eat** keeps the food slot refilled.

## Key files
- `src/data/stations-data.ts:STATIONS_DATA` — stations and `maxLevel`; object order = Camp tab order.
- `src/data/recipes-data.ts:RECIPES_DATA` — `CraftingRecipe`: `stationId`, `stationLevel`, `itemsNeeded`, `itemId`, `createsAmount`, `requiresUnlock`.
- `src/data/items/station-items.data.ts` — station gear (`ItemType.stationUpgrade`, `stationId`, `level`).
- `src/data/items/consumables-items.data.ts` — food and potions (`effect: ConsumableEffect`) and recipe scrolls (`ItemType.recipe`, `recipeId`).
- `src/interfaces/consumable.interface.ts` — `ConsumableSlot` (`food` / `potion`), `ConsumableEffect`, `ActiveConsumable`.
- `src/app/store/player/camp.ts` — pure rules: `stationLevel`, `canInstall`, `installStations`, `evaluateRecipe` (visibility, max craftable, block reason).
- `src/app/store/player/player.store.ts` — `stations` and `unlockedRecipes` state, `craftItem`, `addItems` (installs gear), `useItem` (recipe scrolls), `unlockCamp`.
- `src/app/store/camp/camp.store.ts:CampStore` — Camp tab UI selection only (station, recipe per station, batch size).
- `src/app/services/battle-manager.service.ts:useConsumable`, `autoEat`; `src/app/store/battle/battle.store.ts` — `consumableSlots`, `tickConsumables`.
- `src/app/components/game/camp/` — Camp tab, `recipe-detail/`, `recipe-view.ts`.

## Data flow
**Camp unlock**: `UNLOCK_RULES` (holding a Turtle Shell) calls `unlockCamp`, which grants the Workbench at level 1.

**Stations**: station gear never enters the inventory. Whenever `PlayerStore.addItems` receives gear (drop, shop, craft, quest), it installs it if the station is at `level − 1`. Gear that arrives out of order stays in the inventory until it can be installed (`installStationItem`). A station level of 0 (missing key) means not owned.

**Crafting** (`craftItem(recipeId, times)`): `evaluateRecipe` decides:
- visible: station owned, recipe unlocked if `requiresUnlock` (by using its recipe scroll), and gear not already installed;
- blocked: `stationLevel` too low, `stationOrder` (gear out of sequence), `missingItems`, or `inventoryFull` (checked after paying, since paying can free a slot).
Then ingredients are removed and the result added (×`createsAmount` × count). Batch size comes from `CampStore.batchSize` (number or `'max'`).

**Consumables** (`useConsumable(itemId)`):
1. Refused while the slot is locked, or when it's a pure mana potion at full mana.
2. Applies `stats` for `min(duration, cooldown)` seconds and restores mana, then locks the slot for `cooldown` seconds.
3. Each second `tickConsumables` counts down the effect and the lock; when the effect ends, its stats are subtracted.
4. **Auto-eat** (needs the `autoEat` node and the toggle): when the food slot's lock ends, eats the same food again if any is left.

## Invariants & gotchas
- One lock per slot: swapping food can't stack effects. The effect never outlasts the lock.
- `ActiveConsumable.stats` is a snapshot of what was applied; expiry subtracts exactly that, even if item data changed.
- Consumable effects are not **buffs** (see `GLOSSARY.md`); buffs come only from spells.
- Durations in consumable data are seconds (`MINUTE = 60` helper).
- Recipe visibility, not just craftability, depends on station level 0 vs owned.

## Known issues
- Raw ingredients (apple, cheese, fish meat, crab meat) are `ItemType.resource`, so they can't be eaten.
- Buying the Spellbook is blocked on a full inventory, although it never enters the inventory.

## How to extend
New recipe, food or potion: the `add-recipe-or-consumable` skill. New station gear: a `stationUpgrade` item with the next `level`, a recipe or shop entry that produces it, and `unlocks:stations.<ItemID key>.title`/`.body` keys for the install notification.
