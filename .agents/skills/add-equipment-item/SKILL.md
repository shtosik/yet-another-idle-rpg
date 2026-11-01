---
name: add-equipment-item
description: Use when adding or rebalancing equipment — weapon, armor, ring, amulet, belt, cape, gloves — that grants stats when equipped, and wiring how the player gets it (drop, shop, quest, recipe). Triggers on "add a new sword", "create a ring that gives crit", "make a legendary helmet", "balance the wooden bow", "give the troll a chance to drop a club", "add a belt with gold find".
---

# Add an equipment item

Background: `docs/systems/player-stats-inventory-equipment.md` (stat units, derived stats). Pets: use `add-shiny-variant`. Weapon elements: `add-monster-weakness`.

## Steps

1. **ItemID** — append the next value to `src/enums/ids/item-id.enum.ts:ItemID`. The key name (camelCase) is the i18n key and icon file name.

2. **Data entry** — add it to the slot's file in `src/data/items/`: `weapons-items.data.ts`, `helmet-`, `chest-`, `legs-`, `boots-`, `gloves-`, `belt-`, `neck-` (amulet), `rings-items.data.ts`. Shape (`src/interfaces/item.interface.ts:EquipmentItem`):
   ```ts
   [ItemID.flameSword]: {
     id: ItemID.flameSword,
     tier: ItemTier.rare,
     url: './assets/img/items/flameSword.png',
     value: 2000,                      // -1 = cannot be sold (quest rewards, uniques)
     type: ItemType.equipment,
     slot: EquipmentSlot.weapon,
     damageType: DamageElement.fire,   // weapons only; omitted = physical
     stats: [{ id: 'attackPower', amount: 8 }, { id: 'critChance', amount: 3 }],
   },
   ```
   `src/data/items-data.ts` merges the files; it needs no change unless you add a new file.

3. **Stats** — `stats[].id` is a `PlayerStat` (`src/types/player/player-stat.type.ts`). Units:
   - multipliers (`critMulti`, `xpMultiplier`, `extra<Element>DamageMultiplier`, …): fraction added to a base of 1 — `0.25` = +25%;
   - `critChance`, `shinyChance`: percent points — `2` = +2%;
   - `damageVs<Type>`: additive fraction — `0.2` = +20%;
   - `attackSpeed`: positive = faster (seconds per attack go down);
   - everything else: raw (`attackPower` 5 = +5).
   A new stat needs: the `PlayerStat` union, a display list if it's a percent, `statsInitialState` in `src/app/store/player/player.ts`, `app:playerStats.<stat>`, and code that reads it.

4. **i18n** — `items:names.<itemKey>` in `src/assets/locales/en/items.json`.

5. **Icon** — `/generate-2d-asset` for `src/assets/img/items/<itemKey>.png`.

6. **Source** — at least one, so the item is reachable:
   - **Drop**: in `src/data/enemies-data.ts`, add `drop(ItemID.flameSword, 1, 1, 50)` to the enemy's `drops` (`chance` 50 = 1 in 50 per roll; one roll per kill, ten for shinies).
   - **Shop**: a `SHOPS_DATA` entry (see `add-shop`).
   - **Quest reward**: `{ type: 'item', itemId: ItemID.flameSword, amount: 1 }` in the quest's `rewards` in `src/data/quests-data.ts`.
   - **Recipe**: see `add-recipe-or-consumable`.

7. **Rebalancing an existing item**: change `stats` in place. Stats are derived, so saves pick up the new values immediately.

Done when `npm run validate` and `npx ng build` pass, and in the dev server equipping then unequipping the item returns every stat to its previous value.
