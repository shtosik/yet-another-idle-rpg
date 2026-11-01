# Equip gear

The player clicks a gear item in the inventory to equip it; it moves into its equipment slot and leaves the inventory. Clicking the equipped item returns it to the inventory. The equipment is saved.

## Sub-features

- `equip-click` left-click on an inventory gear item equips it.
- `equip-unequip` left-click on an equipped item puts it back in the inventory.
- `equip-persist` equipment survives a reload.

## How to get to it (user POV)

- Inventory panel (`Gear` tab of the inventory), visible on `Battle`, `Camp`, `Map`, `Spellbook` and `Settings` tabs.
- Equipment panel, slots labelled `weapon`, `cape`, `belt`, `gloves`, `helmet`, `chest`, `legs`, `boots`, `amulet`, `ring`, `pet` while empty.

## Driving it with the built-in browser

Preconditions:

- Doctor passes; `Battle` tab active.
- Nothing equipped in `weapon`: `JSON.parse(localStorage.getItem('playerStore')).state.equipment.weapon` is `null`.
- One machete in the inventory: `dev.giveItem(26)` (`ItemID.machete`), or the cheat bar's `give machete` button.

- **Before.** `javascript_tool`: `({ inv: document.querySelectorAll('app-inventory .item').length, slots: [...document.querySelectorAll('app-equipment-slot')].map(s => s.querySelector('.item') ? 'ITEM' : s.textContent.trim()) })`. `inv` is 1, first slot reads `weapon`.
- **Equip.** Get the click point for `app-inventory .item` with the scroll-and-scale snippet in SKILL.md (Drive), take a screenshot, then `computer` `left_click` that coordinate. Re-read: `inv` is 0, first slot is `ITEM`; the Combat stats `Attack power` is higher than before.
- **Saved.** `JSON.parse(localStorage.getItem('playerStore')).state.equipment.weapon` is `{ id: 26, tier: 2 }`.
- **Reload.** `navigate` to the same URL, wait 3 s; the weapon slot still holds the item.
- **Unequip.** Same snippet for `app-equipment-slot .item`, screenshot, click. The slot reads `weapon` again and the inventory has 1 item.
- **Proof.** Before/after/reload readings to `tmp/verify/<run-id>/equip-gear.txt`; screenshot after equip to `tmp/verify/<run-id>/equip-gear.jpg`.

## Gotchas

- Items are unlabelled `div.item`s (image `alt=""`), so `find` cannot reach them; click by coordinate.
- Hovering an item opens a tooltip that can cover neighbours; take the before reading first, then click.
- Right-click on an inventory item is a different action (context use/destroy), not equip.
- The equipment panel is off-screen at the pane's default width: scroll it into view before computing the click (SKILL.md, Drive).
- The saved `equipment` lags the screen by up to 1 s (batched saves); poll before failing.
