# Inventory tabs, zone pet collections & destroy

**Scope:** M-L · **Status:** Accepted design (owner, 2026-10-31)

The inventory fills too easily. 40 slots, capped at 55 (3 Guild Satchels). About 70+ non-pet item ids plus 68 pets (32 normal + 32 shiny + 4 Arena champion pets) can each take a slot. Pets sell (500 / shiny 2500) but are rare enough that players keep them, and nothing can be destroyed, so every pet species kept holds a slot. Materials fill the grid early (3–6 new ids per zone), and the next rare pet is then lost silently on a full inventory.

Owner rejected a separate Pet Stable: equipping some items from the inventory and others from another menu is bad UX. Tabs keep one place to equip from.

## 1. Inventory tabs with their own capacity

Each tab has its own slot count. Tabs that only filter one shared grid don't solve filling.

| Tab | Holds (by `ItemType` / slot) | Start capacity |
|---|---|---|
| Gear | `equipment` except `slot: pet` | 20 |
| Consumables | `food`, `potion`, `recipe`, `spellScroll`, `book`, `rewardsStats`, `chest` | 20 |
| Materials | `resource` | 20 |
| Pets | `equipment` with `slot: pet` | one per pet species (never fills) |
| Quest | `quest` | unlimited |

- No "All" view.
- `stationUpgrade` still never enters the inventory (installed on pickup).
- Capacity is one `inventorySlots` stat keyed by tab, not a stat per tab.
- Guild Satchel: +2 slots to Gear, Consumables and Materials each; Guild store stock 1.
- Implementation steps: `docs/plans/inventory-tabs.md`.

### Owner rules, now per tab
- Drops are lost when **their** tab is full (intended). Other tabs are unaffected.
- Unequip blocked when the Gear (or Pets) tab is full. Pets tab never fills, so in practice only Gear.
- Craft blocked when the result's tab is full; a craft that frees materials counts the freed slots in the Materials tab only.
- Quest turn-in blocked when a reward's tab is full.
- Opening a chest rolls first and needs room only for what was rolled; a roll that doesn't fit is kept (and saved) until it does, so it can't be re-rolled (owner, 2026-10-31). Zone mastery claims (`zone-mastery.ts`) check the Materials tab.
- Shop buy blocked per tab ("full" badge per tab).

## 2. Inventory slots in the skill tree

One path: a hub node branches to **3 tab nodes** (+N slots each for Gear, Consumables, Materials), which converge on a **capstone** that gives +N slots to all three. No nodes for Pets or Quest, since those tabs never fill.

**Respec guard (critical).** Respec and node refunds must be blocked when removing the slots would strand items. A guard already exists for the single stat: `PlayerStore.canChangeInventorySlots` (`player.store.ts:350` on staging), used by `skill-tree.service.ts:65` (single refund) and `:129-145` (full respec). It must become per tab: shrinking any tab below its used slots blocks the refund, and the block reason names the tab. The capstone shrinks all tabs at once, so its refund checks every tab. The same per-tab check covers equipping and unequipping gear that grants slots (`canEquip` / `canUnequip` in `player.store.ts`).

## 3. Save migration (first migration step)

Game is in production with no players yet. Do a real migration anyway, as a test of the mechanism. Saves already carry a per-store version (`{ v, state }`, `docs/systems/persistence.md`), but an **older** version is discarded and the store starts fresh. This adds the first migration step instead.

- Bump the player store's save version.
- Old → new: split the flat `inventory: (InventoryItem | null)[]` into per-tab arrays by item type. If a tab overflows its new capacity, keep everything (grow that tab's array past capacity until items are removed) rather than delete items.
- Migration table keyed by version, run in `readSave` before the version check discards the save. Import (`checkImportedSave`) should migrate too instead of counting the store as "starts fresh".

## 4. Zone pet collections

A zone's set = the pets of every enemy in its `enemies` list **plus its boss**. Every zone with monsters counts (Traders' Basement too: rat + Giant Rat). Today no zone repeats an enemy; if a later zone reuses one, its pet counts toward both sets.

- Arena champion pets belong to no zone set (could be their own Arena set later).
- Separate from zone mastery (`masteryReward`, a one-time claim); the collection bonus is permanent.
- Completing a zone's normal set gives a **global permanent bonus**: gold find or XP (alternate per zone, small, e.g. +2%).
- Shiny sets: parked until shiny pet rates are fixed (currently ~1 shiny pet per 200,000 kills at 1% shiny chance).
- Owned pets are read from the Pets tab plus the equipped pet; no new state.
- Progress shown in the bestiary per zone (owned / total).
- Bonus is a new source in the `stats` computed (ADR 0002), not stored.

## 5. Destroy items

- Destroy action on inventory items, with a confirmation popup.
- Player setting: "Ask before destroying items of tier ≥ X" (`ItemTier`, trash → legendary). Default: trash, so every tier asks.
- **Quest items can't be destroyed.**
- No settings store exists yet: this adds one (small signal store persisted to `localStorage`, `docs/systems/persistence.md`).

## 6. Online "drop lost" notice

`addItems` already drops what doesn't fit silently while online (offline counts `lostDrops` for the welcome-back modal). Return the lost items and show a toast: "Materials full: Wolf Pelt lost".

## Parked
- Extra pet copies giving a bonus (see `pet-leveling-collection.md`).
- Loot rules / auto-sell (see `automation-loot-rules.md`).
- Sort / compact button (small QoL, can ride along with tabs).

## Touch-points
`src/app/store/player/inventory.ts` (`addItems`, `canFit`, `missingSlots` per tab), `player.store.ts` (state, `addItems`, `applyKillBatch`, equip/unequip guards, `canChangeInventorySlots`, `sellItem`), `player.ts` (initial state, capacity stats per tab), `skill-tree.service.ts` (refund guards), `skill-tree-data.ts` (nodes), `camp.ts` (`evaluateRecipe`), shop component (full badge), inventory component (tabs, destroy), bestiary component (zone sets), `stats.ts` (collection bonus), new settings store, persistence (save version + migration), i18n. Docs: `docs/systems/player-stats-inventory-equipment.md`, `persistence.md`, `skill-tree.md`, `enemies-shiny-pets-bestiary.md`.
