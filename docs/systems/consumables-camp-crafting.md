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
- `src/app/store/player/player.store.ts` — `stations` and `unlockedRecipes` state, `craftItem`, `grant` (the Item grant, also behind `applyKillBatch`: install gear and show its notice, `ModalService.openStationInstalled`, whatever gave it: craft, shop, chest, quest, kill or the inventory's use action), `useItem` (recipe scrolls), `unlockCamp`.
- `src/app/store/camp/camp.store.ts:CampStore` — Camp tab UI selection only (station, recipe per station, batch size, Craftable filter).
- `src/app/services/battle-manager.service.ts:useConsumable`, `autoEat`; `src/app/store/battle/spell-rules.ts:planConsumable` (the pure rules, covered by `spell-rules.spec.ts`; mana via `manaGain`); `src/app/store/battle/battle.store.ts` — `consumableSlots`, `tickConsumables`.
- `src/app/components/game/camp/` — Camp tab, `recipe-detail/`, `recipe-view.ts`. Recipes show as an icon grid (name in the tooltip; lock + level when the station is too low, dimmed when ingredients are missing); the detail panel does all crafting. The **Craftable** filter (`maxCraftable > 0`) hides the rest. The selected recipe stays in the detail even when a filter hides it.

## Data flow
**Camp unlock**: `UNLOCK_RULES` (holding a Turtle Shell) calls `unlockCamp`, which grants the Workbench at level 1.

**Stations**: station gear never enters the inventory. Whenever the Item grant (`PlayerStore.grant`) receives gear (drop, shop, craft, quest), it installs it if the station is at `level − 1`. Gear that arrives out of order stays in the inventory until it can be installed (`installStationItem`). A station level of 0 (missing key) means not owned.

**Crafting** (`craftItem(recipeId, times)`): `evaluateRecipe` decides:
- visible: station owned, recipe unlocked if `requiresUnlock` (by using its recipe scroll), and gear not already installed;
- blocked: `stationLevel` too low, `stationOrder` (gear out of sequence), `missingItems` (no reason line: the red ingredient counters show what is short), or `inventoryFull` (checked after paying, since paying can free a slot; the reason names the result's tab, e.g. "Gear tab full").
Then ingredients are removed and the result added (×`createsAmount` × count). Batch size comes from `CampStore.batchSize` (number or `'max'`).

**Consumables** (`useConsumable(itemId)`):
1. Refused while the slot is locked, or when it's a pure mana potion at full mana (Minor restores 5, Greater 15; the Greater Mana Potion is crafted at Alchemy level 1 from 1 Vial of Water and 3 Spider Silk once its recipe scroll, sold by Sylvie at Mawood Honored, is used).
2. Locks the slot for `cooldown` seconds with an effect lasting `min(duration, cooldown)` seconds, and restores mana.
3. Each second `tickConsumables` counts down the effect and the lock. While the effect runs, the item's `effect.stats` are part of the derived player stats; they disappear when it ends. Food stats (not potions) are multiplied by `foodEffectMultiplier` (base 1; only gear raises it, read from equipment first by `foodMultiplierOf`), e.g. ×1.5 with the Tavern Cat (`npm run sim -- --food` lists every food alone and with it).
4. **Auto-eat** (needs the `autoEat` node and the toggle): when the food slot's lock ends, eats the same food again if any is left.
5. **While away**: the effect and the lock count down by the whole gap (`tickConsumables(seconds)`) and auto-eat doesn't run, so food that expires offline stays expired (`offline-progress.md`).

## Invariants & gotchas
- One lock per slot: swapping food can't stack effects. The effect never outlasts the lock.
- Active effects read `effect.stats` from current item data, so a rebalance applies immediately, even mid-effect.
- Consumable effects are not **buffs** (see `GLOSSARY.md`); buffs come only from spells.
- Durations in consumable data are seconds (`MINUTE = 60` helper).
- Recipe visibility, not just craftability, depends on station level 0 vs owned.
- Crafted equipment sells for about 1.5× its materials' value, never more than 2× (`npm run validate` checks), so crafting can't print gold from drops or shop-bought runes.

## Known issues
- Raw ingredients (apple, cheese, fish meat, crab meat) are `ItemType.resource`, so they can't be eaten.
- Buying the Spellbook is blocked on a full inventory, although it never enters the inventory.

## How to extend
Farm recipes (`farming.md`): Turnip Stew (Cooking 1; 3 Turnip, 1 Vial of Water), Farmer's Bread (Cooking 1; 4 Wheat), Harvest Pie (Cooking 2; 2 Apple, 3 Wheat, 1 Cheese), Mushroom Stew (Cooking 2; 3 Glowcap, 2 Turnip), Silverleaf Tonic (Alchemy 1; 2 Silverleaf, 1 Vial of Water, 10 mana), Glowcap Elixir (Alchemy 1; 2 Glowcap, 1 Vial of Water, 25 mana). All need their scroll: Harvest Pie and Mushroom Stew from Warden Marta at Farming Guild Honored and Revered, Glowcap Elixir from Sylvie, the other three as quest rewards (C10). Feast of the Wood, Heartroot Elixir and Blossom Draught are deferred until Cooking 3 / Alchemy 2 gear exists.

Viperskin set (The Goat Cleft, `chapter-one-sap-winter.md`): five Workbench 1 recipes, all `requiresUnlock`, from Viperskin, Pack Leather and Viper Venom. Hood 12/6/3, Jerkin 25 Viperskin + 12 Pack Leather, Leggings 20 + 10, Boots 12 + 6, Gloves 10/6/3 (Viperskin/Pack Leather/Viper Venom). Their five Pattern scrolls (`<piece>Pattern`, one shared icon, rare, sell 50) drop from the Goblin Hoarder at 1 in 40 each; Brenna does not teach them. Gear values are 1.5x the materials.

New recipe, food or potion: the `add-recipe-or-consumable` skill. New station gear: a `stationUpgrade` item with the next `level`, a recipe or shop entry that produces it, and `unlocks:stations.<ItemID key>.title`/`.body` keys for the install notification.
