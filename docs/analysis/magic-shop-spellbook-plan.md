# Magic Shop + Spellbook — Implementation Plan

## Context

The Mawood town has a "Carver's Shop" building (`TownBuildingID.mawoodCarversShop`, id 9)
whose NPC, **Brenn**, only gives two quests (Raw Materials, War Trophies) — it is not an
actual shop. We are repurposing this building into a **Magic Shop** run by a new whimsical
mage NPC. The shop sells: a **spellbook** (unlocks a new Spellbook game tab), **Earth/Water
runes**, a **Recipe item** that unlocks an Earth-rune crafting recipe, and a **magic staff**
(low attack power, but grants magic-damage bonuses).

This also introduces two reusable systems: a **Recipe item type** (right-click to unlock a
crafting recipe) and a **Spellbook tab** with **cross-component drag-and-drop** for equipping
spells onto the battle spellbar — the first manual spell-equip UI (today spells are only
auto-equipped when unlocked in the skill tree via `PlayerManagerService.buySkillPoint`).

### Confirmed decisions (from clarifying questions)

| Topic | Decision |
|---|---|
| Carver NPC | **New mage NPC** (whimsical, magical personality) takes over the building. **Brenn relocates** to another Mawood building, keeping his two quests. |
| Spellbook unlock | **On purchase** — buying the spellbook immediately unlocks the Spellbook tab (no inventory/right-click step). |
| Spell drag-and-drop | **Cross-component**: drag a spell from the Spellbook tab directly onto the battle-footer spellbar; reorder on the bar. (Uses Angular CDK connected drop lists — `@angular/cdk` v20 is installed.) |
| Magic staff stat | **Both** — flat `magicDamage` (existing stat) **and a new `magicDamageMultiplier` stat** (+5%). Requires adding the new stat and wiring it into damage calc. |

---

## Part 1 — New `magicDamageMultiplier` stat

The flat `magicDamage` stat already exists and is applied in `BattleManagerService.doDamage`
(`magicDamage > 0 ? (magicDamage + stats.magicDamage) : stats.attackPower`). Add a *multiplier*
alongside it.

- `src/types/player/player-stat.type.ts` — add `'magicDamageMultiplier'` to the `PlayerStat`
  union and to the `multiplierStats` array (so it renders as a percentage).
- `src/app/store/player/player.ts` — `statsInitialState.magicDamageMultiplier = 1`.
- `src/app/services/battle-manager.service.ts` — in `doDamage`, on the magic branch multiply the
  magic damage by the multiplier, e.g. `damage = Math.ceil((magicDamage + stats.magicDamage) * stats.magicDamageMultiplier)`
  before crit/weakness/type bonuses.
- `src/assets/locales/en/*` + `player-stats.component.html` — optional: display the new stat
  (follow the existing `xpMultiplier` percentage row pattern). `magicDamage` is not currently
  displayed, so this is optional/cosmetic.

## Part 2 — Magic staff (equipment)

A weapon with low `attackPower` plus `magicDamage` (flat) and `magicDamageMultiplier` (+0.05).
Use the existing **`/add-equipment-item`** skill pattern — it covers every touch-point.

- `src/enums/ids/item-id.enum.ts` — `magicStaff = 107`.
- `src/data/items/weapons-items.data.ts` — `EquipmentItem`, `slot: EquipmentSlot.weapon`,
  `stats: [{ id:'attackPower', amount: <low> }, { id:'magicDamage', amount: <flat> }, { id:'magicDamageMultiplier', amount: 0.05 }]`.
- `src/assets/locales/en/items.json` — `magicStaff` name; add a 1×1 placeholder
  `src/assets/img/items/magicStaff.png` (replace with real art later).

## Part 3 — Recipe item type + recipe gating

### New item type
- `src/enums/items/item-type.enum.ts` — add `recipe = 6`.
- `src/interfaces/item.interface.ts` — `RecipeItem extends ItemData { type: ItemType.recipe; recipeId: RecipeID }`,
  add to the `Item` union.
- `src/enums/ids/item-id.enum.ts` — `earthRuneRecipe = 108`.
- New data file (or extend `ResourcesItemsData`): `earthRuneRecipe` → `{ type: ItemType.recipe, recipeId: RecipeID.earthRune, ... }`.
- `src/assets/locales/en/items.json` — name; placeholder icon.

### Right-click to use → unlock recipe
- `src/app/components/game/inventory/inventory-slot/inventory-slot.component.ts` — add
  `ItemType.recipe` to the `isUsable` getter (right-click already calls `useItem.emit()`).
- `src/app/store/player/player.store.ts`:
  - Add state `unlockedRecipes: RecipeID[]` (init `[]`) and method `unlockRecipe(id)`.
  - Extend `useItem(item)` to `switch (itemData.type)`: on `recipe`, call `unlockRecipe(recipeData.recipeId)` then `removeItemFromInventory`. Keep existing `rewardsStats` branch.

### Recipe gating (crafting list currently shows ALL recipes)
`CraftingComponent` uses `Object.values(RECIPES_DATA)` unfiltered, so the Earth-rune recipe (added
in the runes pass) is currently always visible. Gate it:
- `src/data/recipes-data.ts` — `CraftingRecipe` gains `requiresUnlock?: boolean`. Set the
  **earthRune** recipe to `requiresUnlock: true` and change its cost to `itemsNeeded: [{ id: ItemID.stone, amount: 10 }]`.
- `src/app/components/game/crafting/crafting.component.ts` — filter `recipesArray` to
  `recipe => !recipe.requiresUnlock || playerStore.unlockedRecipes().includes(recipe.id)`.
- Note: fire/air/water rune recipes (from the runes pass) stay always-available and unchanged —
  only earthRune is gated per the request. Easy to extend the same flag to the others later.

## Part 4 — Magic Shop (building, NPC, shop wares)

### Repurpose the building
- `src/enums/map/town-tab-id.enum.ts` — rename `mawoodCarversShop` → `mawoodMagicShop` (keep id 9).
  Update references: `src/data/towns-data.ts`, `towns.component.*`, `town-building.component.ts`,
  `src/assets/locales/en/map.json` (building name → "Magic Shop"), and add a magic-shop
  background `src/assets/img/backgrounds/mawoodMagicShop.png`.

### New mage NPC + relocate Brenn
- `src/enums/map/npc-id.enum.ts` — new NPC id (e.g. `mawoodElarion` / whimsical name).
- Use the **`/add-npc-dialogue`** skill for the mage: new dialogue file under
  `src/data/dialogues/mawoodTown/`, NPC registry wiring, i18n. The dialogue's "browse wares"
  option uses an existing `ShopEffect`: `effects: [{ type: 'shop', shopId: ShopID.mawoodMagicShop }]`
  (handled by `DialogueManagerService.applyEffects` → `openShop`).
- In `towns-data.ts`, set the (renamed) magic-shop building's `npcIds` to the new mage, and
  **add `NpcID.mawoodBrenn`** to another Mawood building's `npcIds` (recommend the Hunter Lodge,
  `mawoodHunterLodge`, thematically fits his materials/trophies quests) with a `position`. Brenn's
  dialogue/quests are unchanged.

### Shop data
- `src/enums/ids/shop-id.enum.ts` — `mawoodMagicShop = 1`.
- `src/data/shops-data.ts` — new shop entry with items:
  spellbook (price high, `maxStock: 1`, `refreshable: false`), `earthRune`/`waterRune`
  (refreshable, stocked), `earthRuneRecipe` (`maxStock: 1`, non-refreshable), `magicStaff`
  (`maxStock: 1`). Reuses existing generic shop/buy flow.

### Spellbook = unlock-on-purchase
- `src/enums/ids/item-id.enum.ts` — `spellbook = 109` (a `book`-type item entry + name + icon).
- `src/app/store/player/player.store.ts` — state `spellbookUnlocked: boolean` (init `false`) +
  `unlockSpellbook()`.
- `src/app/components/modals/shop/shop.component.ts` — in `buyItem`, after deducting gold/stock,
  special-case the spellbook: `if (itemId === ItemID.spellbook) { playerStore.unlockSpellbook() }`
  and skip adding it to inventory (otherwise generic flow adds it). Clearly comment this as a
  one-off unlock hook.

## Part 5 — Spellbook game tab + cross-component drag-and-drop

### The tab
- `src/enums/ids/game-tab.enum.ts` — `spellbook = 7`.
- New `src/app/components/game/spellbook/spellbook.component.*`. Content: a **palette** of
  unlocked-but-unequipped spells, derived from `playerStore.unlockedSpells()` minus
  `battleStore.equippedSpells()`. Render each as a draggable spell icon (reuse the spell image +
  tooltip; a lightweight icon, not the cast-enabled `app-spell-slot`).
- `src/app/components/game/game.component.{ts,html}` — import + render `<app-spellbook class="spellbook"/>`
  when `tab === GameTab.spellbook`.
- `src/app/components/game/game.component.sass` — `.spellbook { grid-column: 2 / 4; grid-row: 1 / 1 }`
  (2nd–3rd column, first row only, matching the request and the `.bestiary` precedent).
- `src/app/components/game/game-menu/game-menu.component.html` — show the Spellbook tab
  conditionally `@if (playerStore.spellbookUnlocked())`, mirroring the crafting/map tab pattern;
  add `gameTabs.spellbook` i18n key.

### Drag-and-drop (Angular CDK connected lists)
Because `<app-battle>` (which contains the footer spellbar) is **always rendered**, and the
Spellbook tab occupies cols 2–3 while battle occupies col 1, both drop lists are on-screen
simultaneously → CDK connected lists across components work.

- Import `DragDropModule` (`@angular/cdk/drag-drop`) in both `SpellbookComponent` and
  `BattleFooterComponent`.
- **Spellbar** (`battle-footer.component.{ts,html}`): make `.spell-bar` a `cdkDropList` (id e.g.
  `"equipped-spells"`) whose data is `equippedSpells()`. Iterate equipped spells as `cdkDrag`
  items (each an `app-spell-slot`), padding with empty placeholder slots up to 5. Connect to the
  palette via `[cdkDropListConnectedTo]="['spellbook-available']"`. Add a
  `cdkDropListEnterPredicate` rejecting drops that would exceed 5.
- **Palette** (`spellbook.component`): a `cdkDropList` (id `"spellbook-available"`) connected to
  `"equipped-spells"`, data = available spells.
- **Drop handling**: on `cdkDropListDropped`, compute the new equipped order:
  - reorder within the bar → `moveItemInArray`;
  - palette → bar (equip) → build `EquippedSpell { spellId, cooldownRemaining: 0 }` and insert;
  - bar → palette (unequip) → remove from equipped.
  Commit with the existing `BattleStore.setAllEquippedSpells(newEquipped)` (no new store method
  needed). The palette is derived (computed) from `unlockedSpells − equipped`, so it updates
  automatically; equipping does **not** modify `unlockedSpells`.
- **Click-to-cast coexistence**: `app-spell-slot` keeps its click-to-cast handler; CDK fires a
  click only when there was no drag. Verify a tap still casts and a drag does not (see
  verification).

### DnD trade-off note (analysis the user requested)
Cross-component drag was chosen over the simpler "two columns inside the tab" approach. It is
feasible here specifically because the battle column is always mounted. Risks to watch:
(1) click-vs-drag disambiguation on the cast-enabled slots; (2) modeling the 5 fixed spellbar
slots (some empty) as a `cdkDropList` array; (3) keeping the connected-list IDs stable. These are
contained to `battle-footer` and `spellbook` components and do not affect combat logic.

---

## Files touched (summary)

- **Stats/combat**: `player-stat.type.ts`, `player.ts`, `battle-manager.service.ts`.
- **Items/recipes**: `item-id.enum.ts`, `item-type.enum.ts`, `item.interface.ts`,
  `items/weapons-items.data.ts`, `items/resources-items.data.ts` (or new recipe-items data),
  `recipes-data.ts`, `crafting.component.ts`, `inventory-slot.component.ts`, `items.json`,
  `player.store.ts` (`unlockedRecipes`, `unlockRecipe`, `useItem`, `spellbookUnlocked`,
  `unlockSpellbook`).
- **Town/shop**: `town-tab-id.enum.ts`, `npc-id.enum.ts`, `shop-id.enum.ts`, `towns-data.ts`,
  `shops-data.ts`, new mage dialogue (+ `npc.json`, `map.json`, dialogue json), `shop.component.ts`,
  town/towns components referencing the renamed building, new background asset.
- **Spellbook/DnD**: `game-tab.enum.ts`, new `spellbook.component.*`, `game.component.{ts,html,sass}`,
  `game-menu.component.html`, `app.json`/`gameTabs` i18n.

## Reused existing pieces (do not rebuild)

- Shop open path: dialogue `ShopEffect` → `DialogueManagerService.applyEffects` → `openShop` →
  `TownsStore.openShop` → `ShopComponent`. Generic `ShopComponent.buyItem` already handles
  equipment/special items.
- Spell equip/order: `BattleStore.setAllEquippedSpells` / `addSpell` / `equippedSpells`;
  `BattleManagerService.equipSpell` / `unequipSpell`.
- Item use: `InventoryWindow.useItem` → `PlayerStore.useItem`; right-click already wired in
  `inventory-slot.component`.
- Crafting: `PlayerStore.craftItem`, `CraftingComponent`.
- Skills for boilerplate: `/add-equipment-item`, `/add-npc-dialogue`, `/add-shop`.

## Verification (end-to-end)

1. `npm start`. Use the dev buttons (`give xp`, `give skill points`) and the existing reset
   buttons as needed.
2. **Building/NPC**: open Mawood → the renamed Magic Shop shows the new mage; confirm Brenn now
   appears in the Hunter Lodge and his two quests still start/turn-in.
3. **Shop**: open the mage's shop; buy Earth/Water runes (gold deducts, runes enter inventory),
   buy the magic staff, equip it → attack power drops, magic-damage stats rise; cast `fireStrike`
   and confirm higher magic damage (flat + 5% multiplier).
4. **Recipe item**: buy the Earth-rune recipe; confirm the Earth-rune recipe is **not** in
   Crafting beforehand; right-click the recipe item → it's consumed and the recipe appears; craft
   an Earth rune for 10 stones.
5. **Spellbook unlock**: buy the spellbook → the Spellbook tab appears immediately (no inventory
   item); reload to confirm persistence.
6. **Drag-and-drop**: open the Spellbook tab (battle spellbar visible at left); drag an unlocked
   spell onto a spellbar slot (equips), drag within the bar (reorders), drag a spell off the bar
   back to the palette (unequips). Confirm a plain click on a spellbar slot still **casts** in
   combat and does not get swallowed by drag. Confirm the 6th equip is rejected.
7. `npx tsc --noEmit` clean.
