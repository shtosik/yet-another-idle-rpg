# Equip gear

The player right-clicks (or presses Enter on) a gear item in the inventory to equip it; it moves into its equipment slot and leaves the inventory, swapping out anything already there. Right-clicking the equipped item returns it to the inventory, if there is room. A plain left-click does nothing on either panel. The equipment is saved.

## Sub-features

- `equip-click` right-click (or Enter/Space on its focused button) on an inventory gear item equips it; a mouse left-click is inert.
- `equip-unequip` right-click (or Enter/Space on the focused slot) on a filled equipment slot puts the item back in the inventory.
- `equip-persist` equipment survives a reload.

## How to get to it (user POV)

- Inventory panel (`Gear` tab of the inventory, the default), visible on `Battle`, `Camp`, `Map`, `Spellbook`, `Settings` and in towns.
- Equipment panel (paper doll), visible on `Battle`, `Camp`, `Map`, `Spellbook`, `Bestiary` and in towns. Slots in DOM order: `Head`, `Amulet`, `Chest`, `Cape`, `Weapon`, `Belt`, `Gloves`, `Ring`, `Legs`, `Pet`, `Feet`.

## Driving it with the built-in browser

Preconditions:

- Doctor passes; `Battle` tab active.
- Nothing equipped in the weapon slot: `JSON.parse(localStorage.getItem('playerStore')).state.equipment.weapon` is `null`.
- One machete in the inventory: `dev.giveItem(26)` (`ItemID.machete`), or the cheat bar's `give machete` button.

- **Before.** `javascript_tool`: `({ inv: document.querySelectorAll('app-inventory .item').length, slots: [...document.querySelectorAll('app-equipment-slot button.item')].map(b => b.getAttribute('aria-label')), ap: dev.state().stats.attackPower })`. `inv` is 1, slot 5 is `Weapon: Empty`.
- **Left-click is inert.** `find` "Machete", `left_click` the `button "Machete ×1"` ref. Nothing changes.
- **Equip.** `right_click` the same ref. Re-read: `inv` is 0, slot 5 is `Weapon: Machete`, `ap` is higher (1 to 6 on a fresh save; the stats panel row `Attack Power` agrees).
- **Saved.** `JSON.parse(localStorage.getItem('playerStore')).state.equipment.weapon` is `{ id: 26, tier: 2 }`.
- **Reload.** `navigate` to the same URL, wait 3 s; slot 5 still reads `Weapon: Machete`.
- **Unequip.** `find` "Weapon:", `right_click` the `button "Weapon: Machete"` ref. The slot reads `Weapon: Empty`, the inventory has 1 item, saved `weapon` is `null`.
- **Proof.** Before/after/reload readings to `tmp/verify/<run-id>/equip-gear.txt`; screenshot after equip to `tmp/verify/<run-id>/equip-gear.jpg`.

## Gotchas

- Every equipment slot holds a `button.item`, empty or not; tell them apart by `aria-label` (`<Slot>: Empty`) or the `item--empty` class, not by `.item` presence.
- Right-click also uses usable items (food, potions, books, chests); destroying is the separate `×` button on an inventory item.
- Unequip is refused when the inventory is full.
- Hovering an item opens a tooltip (`find` may also list a `generic "<name>"` from it); take the before reading first.
- The saved `equipment` lags the screen by up to 1 s (batched saves); poll before failing.
