# Camp & crafting stations

**Scope:** M · **Status:** Accepted (owner, 2026-10-20)

The Crafting tab becomes **Camp**: a set of crafting stations (Workbench, Cooking, Alchemy, Rune Altar) the player acquires and upgrades through crafting, shops, quests and drops. Each station is a tab; each recipe belongs to one station and needs a minimum station level. Adds lore and gives quests/shops something meaningful to unlock.

Builds on [consumables](consumables-buff-slots.md) and [batch crafting](batch-crafting.md) (both on `feat/consumables`).

## Decisions (owner, 2026-10-20)

- **Name:** the tab is **Camp**. Stations are gear the player carries, which explains why crafting works anywhere.
- **Soft location.** Stations are acquired in the world but used from the Camp tab, anywhere. No travel to craft.
- **Instant crafting.** No timers or queues.
- **Station level only gates recipes.** No crafting bonuses from stations. "Chance to not consume" applies when an item is *used* (consumables doc), not when crafting. Other stats can come from other sources later.
- **Locks may stack** (station owned + station level + recipe scroll + ingredients); each must be readable in the UI.
- **Upgrades are sequential** and lore-friendly: Fire Pit, then Cooking Pot, and so on. Level N needs level N−1.
- **Auto-install.** A station item installs the moment it's acquired (crafted, bought, quest/dialogue reward, drop). It never sits in the inventory.
- **No NPCs in the Camp UI.** Tabs, recipe list, clear crafting info. Full redesign allowed.
- **Pacing:** potions and elixirs unlock in Mawood. Don't hand out stations fast.
- **No save migration.** The game has no external players; regressions are fine.
- **Economy:** ignore for now (see [gold drops](gold-drops-and-selling.md)).

## Visibility rules

| State | UI |
|---|---|
| Station not owned | Tab hidden, all its recipes hidden |
| Recipe needs a scroll the player doesn't have | Hidden |
| Known, station level too low | Visible, dimmed, lock badge with required level |
| Known, missing ingredients | Visible, `×0`, detail lists what's missing |
| Craftable | Visible, `×N` max craftable |

List order: always by `RecipeID`. No auto-sorting by state, so rows never jump around while crafting (owner, 2026-10-20).

## Stations

| Station | Lv 1 | Lv 2 | Lv 3 |
|---|---|---|---|
| Workbench | owned when Camp unlocks | Carpenter's Tools (La Harpar shop) | Carver's Bench (Mawood) |
| Cooking | **Fire Pit**, crafted at the Workbench (stone + stick) | **Cooking Pot**, bought in La Harpar | Smoking Rack, Mawood Hunter Lodge |
| Alchemy | Mortar & Pestle, Mawood Apothecary: potions | Alembic: elixirs | later |
| Rune Altar | bought in the Mawood magic shop next to the spellbook | later | later |

Fire Pit is the first thing a new player builds after Camp unlocks. Its recipe is a default Workbench recipe, which makes it a natural tutorial.

> **Rune Altar is provisional.** It lives in the magic shop for now. Revisit when runes get their own design ([rune socketing](rune-socketing.md), [rune rifts](rune-rifts.md)).

Upgrade item names are per-level i18n. The tab label shows the discipline; the subtitle shows the current gear: "Cooking · Cooking Pot (Lv 2)".

### Mapping existing recipes (placeholder levels)

| Recipe | Station | Lv |
|---|---|---|
| makeshiftClub, turtle set | Workbench | 1 |
| Fire Pit | Workbench | 1 |
| grilledFish, bakedApple, cheesePlatter | Cooking | 1 |
| crabStew, fishApplePie | Cooking | 2 |
| huntersFeast | Cooking | 3 |
| minorManaPotion | Alchemy | 1 (moves to Mawood) |
| fire / air / water / earth rune | Rune Altar | 1 (earthRune keeps its scroll) |

## Data

```ts
enum StationID { workbench, cooking, alchemy, runeAltar }

interface CraftingStation {
  id: StationID
  maxLevel: number
  iconUrl: string                       // tab icon
}

type CraftingRecipe = {
  id: RecipeID
  stationId: StationID
  stationLevel: number
  itemsNeeded: RecipeCost[]
  createsAmount: number
  itemId: ItemID
  requiresUnlock?: boolean              // scroll-gated
}                                       // drop dead `unlockRequirement`

interface StationUpgradeItem extends ItemData {
  type: ItemType.stationUpgrade
  stationId: StationID
  level: number
}
```

- `PlayerStore.stations: Partial<Record<StationID, number>>`. Missing means not owned. Use a Record, not an array: `withGameStateSync` merges arrays by index.
- **Auto-install hook:** every path that adds items (craft, shop buy, quest reward, dialogue `item: give`, drop) goes through `addItems`. Intercept `ItemType.stationUpgrade` there, or in one wrapper around it: install instead of adding.
  - Installs only if `current === level − 1` (or no station and level 1).
  - Out of order: block the purchase or craft with a reason ("You need a Fire Pit first"). Shops should hide or disable the item until it's usable. Quest/drop rewards out of order should be impossible by design. Guard anyway, and keep the item as a fallback.
  - Inventory-full checks must skip station items (they don't take a slot).
- Show an install notification ("Cooking Pot installed: new recipes in Camp"), reusing the unlock notification modal.

## Camp unlock

- Rename `GameTab.crafting` to `camp` and `craftingUnlocked` to `campUnlocked`. Update the `UnlockableFeature` `'crafting'` and `gameTabs.crafting` i18n.
- Rewrite the `unlocks:crafting` notification (title/body in `unlocks.json`). It currently says "Crafting Unlocked! … forge into real gear". New text: Camp is set up, Workbench available, hint to build a Fire Pit.
- Unlock trigger stays on the first turtle shell (owner, 2026-10-20).

## UI (48×20rem panel, full redesign)

**Approved reference mockup (owner, 2026-10-20):** interactive canvas at https://claude.ai/artifact/TAZ3xoPeH4x6eV1U8664Xv (private, owner only). Colours, sizes, states and copy can be read straight from it.

Settled in the mockup:
- **Accent is game yellow** `#eab308` (`palette.$yellow`): selected tab, selected row outline, station header, selected quantity, quick-craft button, Craft button, toast, focus ring.
- **Lock badge and lock reason are orange** `#fb923c`, kept apart from the yellow accent. Craftable `×N` is green `#4ade80`, `×0` is muted `#a3a3a3`, missing ingredients are red `#f87171`.
- **Quick-craft button shows the station's tab icon** (hammer, flame, flask, rune), not a play icon. Its tooltip and `aria-label` read "Craft one X" or "Build X".
- **Rows stay in `RecipeID` order.**
- **List header** shows the station's current gear plus `Lv N / max`. No hint about the next gear.
- **Detail pane:** item name in Silkscreen in its tier colour, a type line (`Food · normal · Owned 4`), effects in green, a duration/cooldown line, ingredients as `owned / needed` scaled to the chosen amount, pills for ×1/×5/×10/Max (only ×1 for station items), the Craft button (`Build Fire Pit` for station items), and a reason line.
- **Toast** at the top centre: `+5 Grilled Fish`, or `Fire Pit built · Cooking unlocked`.
- **Fonts:** Silkscreen for tabs, headers and buttons; Roboto 13px for body text.

```
┌───────────────────────────────────────────────────────────────┐
│ [Workbench 1] [Cooking 2] [Alchemy 1] [Rune Altar 1]          │
├─────────────────────────────────┬─────────────────────────────┤
│ Cooking · Cooking Pot (Lv 2)    │ [ICON] Grilled Fish         │
│ ┌─────────────────────────────┐ │ Food · normal               │
│ │[i] Grilled Fish     ×12  ▶ │ │ +4 Attack Power             │
│ │[i] Baked Apple       ×3  ▶ │ │ Lasts 10m · Cooldown 15m    │
│ │[i] Crab Stew         ×0    │ │ Owned: 4                    │
│ │[i] Hunter's Feast  lock 3  │ │ ─────────────────────────── │
│ └─────────────────────────────┘ │ [i] Fish Meat     24 / 2    │
│                                 │ [×1][×5][×10][Max]          │
│                                 │ [ Craft 5 ]                 │
│                                 │ reason line when blocked    │
└─────────────────────────────────┴─────────────────────────────┘
```

- **Tabs:** owned stations only, icon + level. Remember the last-used tab per viewer.
- **Rows:** tier-coloured icon border, name, ingredient mini-icons, `×N` or lock badge. The station-icon button quick-crafts ×1 without selecting.
- **Detail pane by output type:**
  - equipment: stats, plus a compare with the equipped item
  - consumable: the existing `consumable-effect` component
  - station upgrade: "Unlocks Cooking" for Lv 1 gear, "Upgrades Cooking to Lv 2" after
  - rune: owned count
- **Ingredients:** `owned / needed`, green/red. Hover highlights the item in the inventory panel below.
- **Craft button:** disabled with a reason: missing items, inventory full, station level too low, previous station level missing.
- `@defer` the tab (bundle budget, repo audit).

## Code shape

- `CampComponent`, holding the tabs plus `selectedStation` and `selectedRecipe` signals.
- `RecipeListComponent` and `RecipeDetailComponent`, using `input()`/`output()`.
- One `recipeViews` computed per station: builds the inventory count map once and returns `{ recipe, state, maxCraftable, ingredients[], blockReason }`.
- `PlayerStore.craftItem(recipeId, times)` stays the only validator. Add a station-level check and return a reason (`CraftResult`) instead of `0`.
- Retire `recipe-slot` and the `crafting-background.webp` / `craftingPanel.png` assets once replaced.

## Touch-points

`recipes-data.ts`, new `stations-data.ts` + `StationID` enum, `item.interface.ts` / `item-type.enum.ts` (`stationUpgrade`), `items-data.ts` (station items), `player.store.ts` (`stations`, install, craft guard, rename), `inventory.ts` (`addItems` / `canFit` skip), `shops-data.ts` (Cooking Pot, Carpenter's Tools, Rune Altar, Mortar & Pestle), `unlock-conditions.ts`, `game.component.html` / `game-menu`, `unlocks.json`, `app.json`, new `camp.json` namespace (replaces `crafting.json`), icons for station items and tabs.

## Deferred

- Where Smoking Rack, Carver's Bench and Alembic come from (quest reward vs shop). Decide per item during the content pass.
