---
name: add-equipment-item
description: Use when adding a new piece of equipment — a weapon, armor piece, ring, amulet, belt, cape, gloves, or pet — that grants stats when equipped. Walks every touch-point: ItemID, ItemType.equipment entry, allowed `slot`, `stats[]` from the `PlayerStat` union, weapon `damageType`, i18n, asset, and the drop/shop/quest source that puts it in the player's hands. Triggers on phrases like "add a new sword", "create a ring that gives crit", "make a legendary helmet", "balance the wooden bow", "give the troll a chance to drop a club", "add a belt with gold find".
---

# Add an Equipment Item

Equipment is one slot of `ItemType.equipment` data with a `stats[]` array. When the player equips it, `PlayerStore.equipItem` adds each stat to their character; unequip subtracts it. The data model is dead simple — the work is picking the right slot, the right stats from the `PlayerStat` union, and wiring the source (drop / shop / quest reward) so the item is actually reachable.

## Prerequisites — read first

- `src/enums/ids/item-id.enum.ts` — numeric `ItemID` enum. **Append new IDs; never renumber** (save files store these as numbers).
- `src/enums/equipment-slot.enum.ts` — the 11 slots: `amulet, ring, weapon, helmet, chest, legs, boots, cape, gloves, belt, pet`. Closed set; do not invent new slots without a UI change.
- `src/enums/items/item-tier.enum.ts` — `trash, normal, uncommon, rare, epic, legendary` (drives the tier border colour + tooltip label).
- `src/data/items-data.ts` — every entry typed against `Item`. Equipment entries use `type: ItemType.equipment` and the shape from `EquipmentItem`.
- `src/interfaces/item.interface.ts` — `EquipmentItem` shape and `EquipmentItemPossibleStat` (`{ id: PlayerStat, amount: number }`).
- `src/types/player/player-stat.type.ts` — **the only legal `stats[].id` values**. Classified into `multiplierStats` / `percentageState` / `additivePercentStats` for tooltip rendering (see Step 3).
- `src/app/store/player/player.store.ts` — `equipItem` (lines ~333) and `unequipItem` (~365). The stat math is symmetric: equip adds `amount`, unequip subtracts it. If you add a new stat, also extend the union in `player-stat.type.ts` and `statsInitialState` in `src/app/store/player/player.ts`.
- `src/assets/locales/en/items.json` — `names.<itemKey>` for the name shown in tooltip and inventory.

Related skills:
- `add-shiny-variant` — adds an `EquipmentSlot.pet` with `damageVs<Type>: 0.4`. Pet conventions live there; do not duplicate.
- `add-monster-weakness` — covers `damageType` on weapons and the elemental multiplier system.
- `add-shop` — if the source for the new item is a shopkeeper.

## How a piece of equipment behaves at runtime

`PlayerStore.equipItem(inventoryItem)`:
1. Reads `ITEM_DATA[id]` as `EquipmentItem`.
2. For each entry in `stats[]`, queues `{ stat: s.id, amount: s.amount }`.
3. Looks up the current item in the target slot. If present, subtracts **its** stats and returns it to inventory.
4. Removes the new item from inventory, writes it into `equipment[slotKey]`, applies all stat deltas in one `updatePlayerStats` call.

Consequences:
- A stat with `amount: 0.5` doesn't mean "50%" — the meaning depends on which bucket the stat falls into (multiplier vs additive %, see Step 3).
- Two items in different slots that share a stat **stack additively**. There is no diminishing return.
- A "set bonus" (3 turtle-shell pieces → +X) is not in the engine. Each piece's contribution is its own `stats[]` entry, period.

## Step 1 — Register the ItemID

`src/enums/ids/item-id.enum.ts` — append after the last entry:

```ts
shinyPetTroll = 58,
flameSword   = 59,   // ← new
```

**Never renumber.** Saved inventories and saved `equipment[slot]` entries reference these numbers directly.

## Step 2 — Pick the slot

| Slot         | Typical use                                | Notes                                                |
| ------------ | ------------------------------------------ | ---------------------------------------------------- |
| `weapon`     | Sword, bow, club, staff                    | **Must** declare `damageType` (Step 5)               |
| `helmet`     | Head armour                                |                                                      |
| `chest`      | Body armour                                |                                                      |
| `legs`       | Leg armour                                 |                                                      |
| `boots`      | Foot armour                                |                                                      |
| `gloves`     | Hand armour                                |                                                      |
| `cape`       | Back slot                                  | Currently used by `stoneArrow` — also a flex slot    |
| `belt`       | Waist accessory                            | Strong slot for utility (gold find, crit) per `ratCatcher` |
| `amulet`     | Neck accessory                             | Themed for XP/gold per `trophyNecklace`              |
| `ring`       | Finger accessory                           | Themed for offensive / hybrid per `joshsHeirloom`    |
| `pet`        | Companion granting `damageVs<Type>`        | See `add-shiny-variant`; non-shiny pets are `tier: rare, amount: 0.2`, shiny `legendary, 0.4` |

One slot per item; you cannot put a sword in `helmet`. The slot is enforced only at the data shape level — there's no validation that "weapon-shaped items must give `attackPower`". Keep theme and slot aligned.

## Step 3 — Pick the stats

`stats[]` is `{ id: PlayerStat, amount: number }[]`. The `id` **must** be a value from the `PlayerStat` union in `src/types/player/player-stat.type.ts`. The `amount` is added directly to the player's stat — but the *unit* depends on which list the stat belongs to:

| Bucket (defined in `player-stat.type.ts`)        | Meaning of `amount`                              | Tooltip render (`StatToPercentagePipe`)            |
| ------------------------------------------------ | ------------------------------------------------ | -------------------------------------------------- |
| `multiplierStats` (`critMulti`, `xpMultiplier`, `goldCoinsMultiplier`, `extra<Element>DamageMultiplier`) | Fraction — `0.5` adds +50% to a base of 1.0 | `Math.floor(amount * 100) + '%'` → `50%`           |
| `percentageState` (`critChance`)                 | Raw percentage points — `2` = +2%                | `${amount}%` → `2%`                                |
| `additivePercentStats` (`damageVs<Type>`)        | Fraction added on top of damage — `0.2` = +20%   | `+${Math.floor(amount * 100)}%` → `+20%`           |
| Anything else (`attackPower`, `attackSpeed`, `maxMana`, `magicDamage`, `spellCooldownReduction`, `increasedSpellDuration`, `shinyChance`, raw resources) | Raw additive — `3` = +3 of that stat             | `amount` shown unchanged                           |

Worked examples from shipped items:

```ts
// Weapon — physical, decent damage, slight crit
[ItemID.machete]: {
  // ...
  slot: EquipmentSlot.weapon,
  damageType: DamageElement.physical,
  stats: [
    { id: 'attackPower', amount: 5 },     // raw +5
    { id: 'critChance',  amount: 2 },     // +2% crit
    { id: 'critMulti',   amount: 0.25 },  // +25% crit damage
  ],
},

// Ring — hybrid utility
[ItemID.joshsHeirloom]: {
  slot: EquipmentSlot.ring,
  stats: [
    { id: 'attackPower',  amount: 1 },
    { id: 'attackSpeed',  amount: 0.1 },   // raw +0.1 attacks/sec
    { id: 'xpMultiplier', amount: 0.1 },   // +10% XP
  ],
},

// Belt — gold + crit theme
[ItemID.ratCatcher]: {
  slot: EquipmentSlot.belt,
  stats: [
    { id: 'attackPower',         amount: 1 },
    { id: 'critChance',          amount: 2 },
    { id: 'goldCoinsMultiplier', amount: 0.15 },
  ],
},
```

If you need a stat that doesn't exist yet (e.g. `dodgeChance`, `lifeSteal`):

1. Add it to the `PlayerStat` union in `src/types/player/player-stat.type.ts`.
2. Classify it — append to `multiplierStats`, `percentageState`, or `additivePercentStats` if it fits one of those tooltip formats. If it's raw additive, no list change needed.
3. Add `<stat>: <base value>` to `statsInitialState` in `src/app/store/player/player.ts`. **The base matters** — for multipliers, `1.0` means "no bonus"; for raw additive, `0`.
4. Add `<stat>: "Display Name"` under `playerStats` in `src/assets/locales/en/app.json`.
5. Make sure the stat is actually *consumed* somewhere (e.g. `BattleManagerService.doDamage`). The data won't fail typecheck if it's dangling, but the player won't see any effect.

## Step 4 — Add the data entry

`src/data/items-data.ts`:

```ts
[ItemID.flameSword]: {
  id: ItemID.flameSword,
  tier: ItemTier.rare,
  url: './assets/img/items/flameSword.png',
  value: 2000,
  type: ItemType.equipment,
  slot: EquipmentSlot.weapon,
  damageType: DamageElement.fire,        // weapon-only; see Step 5
  stats: [
    { id: 'attackPower', amount: 8 },
    { id: 'critChance',  amount: 3 },
  ],
},
```

Required fields recap:

- `id` — must equal the key. Easy to get wrong on copy-paste (see `feather` at items-data.ts:25, which mistakenly points at `ItemID.crabMeat`). Double-check.
- `tier` — drives the border colour, tooltip tag, and (for crafting) recipe expectations. Pick by power: `normal/uncommon` for early game, `rare` for mid, `epic/legendary` for endgame and pets.
- `value` — gold for selling. Use **`-1`** for "cannot be sold" (quest rewards, unique items, all pets). Any positive number = sellable for that amount of gold.
- `url` — relative path to the inventory icon (Step 6).
- `type: ItemType.equipment` — discriminator; the union narrows on this.
- `slot` — from Step 2.
- `stats` — from Step 3. May be empty (`[]`) for a cosmetic-only piece, but every shipped item has at least one stat.

## Step 5 — `damageType` (weapons only)

Every entry with `slot: EquipmentSlot.weapon` should declare `damageType`. Omitting it silently defaults to `DamageElement.physical` because `equippedWeaponDamageType` in `player.store.ts:131` falls back to `?? DamageElement.physical`. That's correct for plain weapons but easy to forget on themed ones — set it explicitly.

```ts
slot: EquipmentSlot.weapon,
damageType: DamageElement.fire,   // matters for monster weaknesses
```

Non-weapon equipment must **not** set `damageType` — the interface allows it, but nothing reads it for armour. If you want a ring to grant fire-elemental damage, use a `stats[]` entry: `{ id: 'extraFireDamageMultiplier', amount: 0.1 }` (= +10% on hits against fire-weak enemies).

Full details on the weakness triangle: see `add-monster-weakness` skill.

## Step 6 — i18n

`src/assets/locales/en/items.json` under `names`:

```json
"flameSword": "Flame Sword"
```

Key = the camelCase `ItemID` name. Title case for the display string. No description key is read by the equipment tooltip (tooltip renders the name, tier label, and each stat with its `app:playerStats.<id>` translation). If you add a brand-new `PlayerStat`, add **its** label under `playerStats` (see Step 3.4).

## Step 7 — Drop the asset

`src/assets/img/items/<itemKey>.png` — convention is 48×48 (the inventory slot is sized for it). PNG with transparent background.

The inventory and equipment slot both use Angular's `NgOptimizedImage` (`ngSrc`), which will warn loudly if the asset 404s or if dimensions don't match. Test in the browser, not just `tsc`.

For pets, use `src/assets/img/items/pets/<itemKey>.png` (the shipped pets all live in that subfolder).

## Step 8 — Wire a source

The item exists in `ITEM_DATA` but the player can't reach it yet. Pick one (or more) source:

### A. Enemy drop

`src/data/enemies-data.ts`:

```ts
[EnemyID.firePhoenix]: {
  // ...
  drops: [
    generateItem(ItemID.feather, 1, 2, 2),
    generateItem(ItemID.flameSword, 1, 1, 50),   // ← 1 in 50 roll
  ],
},
```

`generateItem(id, minAmount, maxAmount, chance)` — `chance` is a **denominator**: `chance: 50` = 1-in-50 = 2% per kill. `chance: 1` = guaranteed. Equipment items are always `amount: 1, 1` — stacking equipment in inventory is supported but has no use (`equipItem` uses one and leaves the rest).

Recall: regular drops are rolled **10 times** per kill in `PlayerStore.processBattleEnd` (`dropRolls = 1` normally, `10` for shiny). At `chance: 50`, you get ~20% expected per kill from a normal enemy.

### B. Shop entry

`src/data/shops-data.ts` — add an entry for the keeper. See `add-shop` skill.

### C. Quest reward

`src/data/quests-data.ts` — `rewards.items: [{ id: ItemID.flameSword, tier: ItemTier.rare, amount: 1 }]`. Quest items are typically `value: -1` and `tier: legendary`.

### D. Crafting recipe

`src/data/recipes-data.ts` — `result: { id: ItemID.flameSword, tier: ItemTier.rare, amount: 1 }, itemsNeeded: [...]`. The output tier is hard-coded into the recipe, not pulled from `ITEM_DATA[id].tier` (so an item can have a "base" tier and be crafted as a different one — but conventionally they match).

You can ship the same item across multiple sources. Just don't make the drop chance trivial **and** put it in a starter shop — players will only ever buy.

## Step 9 — Smoke test

1. `npx tsc --noEmit` passes (catches missing `ItemID`, wrong `slot`, mistyped `PlayerStat`).
2. `npm start`, give yourself the item via devtools:
   ```ts
   playerStore.updatePlayerInventory([{ id: ItemID.flameSword, tier: ItemTier.rare, type: ItemType.equipment, amount: 1 }])
   ```
3. Inventory tab: hover the item — tooltip shows the name, the tier badge with correct colour, and each stat formatted per its bucket (see Step 3 table). If `+50%` shows where you wanted `50`, your stat is in the wrong bucket.
4. Click the item — it moves to the matching equipment slot, and the player stat block reflects the additions.
5. Click the equipped slot — it returns to inventory and stats subtract exactly. (A mismatch here means you queued an asymmetric delta — usually a missing entry in one of the `forEach` branches.)
6. Equip something else into the same slot — the previous item should return to inventory and its stats should subtract.
7. If it's a weapon with a non-physical `damageType`, fight an enemy with the matching `weakness` and confirm "(strong)" appears (see `add-monster-weakness`).
8. If it's a drop, set the enemy's drop `chance` to `1` temporarily to confirm the drop pipeline works; revert before committing.

## Common mistakes

- **Renumbering `ItemID`** — corrupts every save file. Always append.
- **Mismatched `id` and key** (`[ItemID.foo]: { id: ItemID.bar, … }`) — equip flow uses the *key* to look up `ITEM_DATA`, but other code reads `item.id`. Two bugs at once; fix the data. (See `feather` at items-data.ts:25 — pre-existing.)
- **Using a stat name that isn't in the `PlayerStat` union** — TypeScript will refuse to compile. Don't @ts-ignore it; add the stat properly (Step 3).
- **Putting `amount: 50` on `critChance` thinking it's a fraction** — `critChance` is in `percentageState`, so `50` means +50% crit. Conversely, `amount: 0.5` on `goldCoinsMultiplier` is +50%, not +0.5 gold. Cross-check the bucket.
- **Forgetting `damageType` on a themed weapon** — the flame sword silently does physical damage and the player wonders why fire-weak enemies don't take extra. Set it explicitly.
- **Setting `value` to a positive number on a quest reward or shiny pet** — players sell it for gold. All "cannot be sold" items use `value: -1`.
- **Adding a new `PlayerStat` but skipping `statsInitialState`** — the stat is `undefined`, `updatePlayerStats` does `undefined + amount` = `NaN`, and the player's stat permanently breaks until they reset.
- **Adding the entry but no source** — item exists in `ITEM_DATA` but no enemy drops it, no shop sells it, no quest rewards it. It's unreachable. Grep `ITEM_DATA[ItemID.yourItem]` references; if it's only the definition, you forgot Step 8.

## When you DON'T need this skill

- **Adding a shiny pet** → use `add-shiny-variant`. Same data shape, but the pet has special drop wiring (`shinyDrops` on the enemy) and naming conventions.
- **Adding a new shop selling existing items** → use `add-shop`.
- **Tuning weakness damage multipliers** → not equipment data — change `extra<X>DamageMultiplier` in `statsInitialState` or grant it via a skill node. See `add-monster-weakness`.
- **Changing the equipment grid layout / slot order** → that's `equipment.component.html` + the iteration order of `initialEquipmentState`, not item data.
- **Adding a "set bonus"** — not supported by the engine. You'd be adding a new system, not a new item.
