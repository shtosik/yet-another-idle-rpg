# Plan: inventory tabs

Implementation plan for `docs/ideas/inventory-tabs.md` (the design and its reasons). One PR into `staging` per step, each from its own worktree off `origin/staging`. Caller references are from `staging` at `0d7f04f` (2026-10-31); re-check line numbers when a step starts.

## Decisions (owner, 2026-10-31)

| Topic | Decision |
|---|---|
| Tabs | Gear, Consumables, Materials, Pets, Quest. No "All" view. |
| Start capacity | Gear 20, Consumables 20, Materials 20. Pets: one slot per pet species (never fills). Quest: unlimited. |
| Capacity stat | `inventorySlots` keyed by tab (one stat, a value per tab), not one stat per tab. |
| Guild Satchel | +2 slots to Gear, Consumables and Materials each. Guild store stock 1 (was 3). |
| Skill tree | Hub → 3 tab nodes (Gear, Consumables, Materials) → capstone (+slots to all three). No nodes for Pets or Quest. |
| Respec | Blocked when a tab would shrink below its used slots; the reason names the tab. |
| Migration | Real migration from the flat inventory, through a migration table (test of the mechanism). Never deletes items. |
| Destroy | Confirm popup from tier X up (default: every tier). Quest items can't be destroyed. Setting lives in a new settings store. |
| Zone collections | Deferred; design kept in `docs/ideas/pet-leveling-collection.md`. |
| Chests | Roll first; only the rolled items need room. A roll that doesn't fit is kept and saved at once until it does. |
| Parked | Extra pet copies, loot rules, shiny sets. |

## Tab mapping (`tabOf(item)`)

| Tab | `ItemType` / slot |
|---|---|
| Gear | `equipment` except `slot: pet` |
| Consumables | `food`, `potion`, `recipe`, `spellScroll`, `book`, `rewardsStats`, `chest` |
| Materials | `resource` |
| Pets | `equipment` with `slot: pet` |
| Quest | `quest` |
| none | `stationUpgrade` (installed on pickup, never stored) |

## Steps

Status (2026-10-31): steps 1–4b and the chest rule are in PR #82 (step 3 was built inside 4a); step 5 is PR #83, stacked on #82; step 6 is deferred.

Steps 1–3 don't depend on each other. Step 4 waits for 1–3. Step 5 needs 4.

### 1. Online "drop lost" toast (S, Sonnet)
- `PlayerStore.addItems` (`player.store.ts:323`) returns what didn't fit; online kill drops (`player.store.ts:483`) show a toast "Inventory full: X lost". Offline already counts `lostDrops` (`:497-541`).
- Find the existing toast/notification pattern before adding one.
- Docs: `docs/systems/player-stats-inventory-equipment.md`. `CHANGELOG.md` entry.

### 2. Destroy items + settings store (S-M, Sonnet)
- New settings signal store, persisted like the others (`with-game-state-sync.hook.ts`, `docs/systems/persistence.md`). One setting: confirm-from tier (`ItemTier`), default `trash`.
- Destroy action in the inventory UI (`inventory.component.ts`, `inventory-slot/`), confirm dialog (Angular Material), calls `PlayerStore.removeItems` (`:332`). Hidden for `ItemType.quest`.
- Setting control: wherever game options live today (check the game menu).
- i18n, docs, changelog.

### 3. Save migration mechanism (S, Sonnet)
- Today an older save version is discarded (`docs/systems/persistence.md`). Add a migration table per store (version → transform) run in `readSave` (`with-game-state-sync.hook.ts`) before the version check, and in `checkImportedSave` (`save-transfer.service.ts`).
- One spec with a test migration. No real migration yet.
- Docs: `persistence.md`.

### 4. Inventory tabs (M-L, Opus, plan mode; split 4a / 4b)

**4a: model, callers, migration**
- `inventory.ts`: state becomes `Record<InventoryTab, Inventory>`; `addItems`, `removeItems`, `missingSlots`, `canFit`, `fitsCapacity`, `resizeInventory`, `countItem` work per tab via `tabOf`. Pets capacity = number of pet ids; Quest unlimited.
- `inventorySlots` keyed by tab: decide how a keyed stat fits the modifier shape (`stats.ts`, `player.store.ts:152`) before writing code. Initial values in `player.ts:44` (now 40) become 20/20/20.
- Satchel: `rewards-items.data.ts:90` (+2 per tab), `shops-data.ts:94` (`maxStock: 1`).
- Every caller, per tab:

| Caller | Where |
|---|---|
| store add / remove / fit / missing | `player.store.ts:323-353` |
| can change slots (respec, slot gear) | `player.store.ts:350`, `canUnequip` `:437`, `canEquip` `:446` |
| zone mastery claim | `player.store.ts:458` |
| online kill drops | `player.store.ts:483` |
| offline kill batch | `player.store.ts:497-541` |
| reward grant | `player.store.ts:550` |
| sell | `player.store.ts:561-565` |
| equip / unequip | `player.store.ts:577-632` |
| open chest (empty-slot count) | `player.store.ts:639` |
| craft | `player.store.ts:677-682`, `camp.ts:83`, `camp.component.ts:54`, `recipe-detail.component.ts:68-91` |
| item count / has-item condition | `player.store.ts:687`, `:780` |
| inventory grows with stat | `player.store.ts:795-798` |
| quest rewards / turn-in | `quests.store.ts:71`, `:82` |
| dialogue give / take, missing slots | `dialogue-manager.service.ts:81-103`, `:273-275`, `dialogue.component.ts:163` |
| shop buy / sell list | `shop.component.ts:79`, `:112`, `:201` |
| arena rewards | `arena.service.ts:41`, `:85` |
| consumable use | `battle-manager.service.ts:231` |
| skill refund / respec | `skill-tree.service.ts:65-145` |
| offline summary | `offline-progress.service.ts:164` |
| stat row | `stat-rows.ts:56` |
| dev cheats | `dev-cheats.component.ts:66-176` |

- Migration (via step 3): split the flat inventory by `tabOf`; a tab over capacity keeps its items past capacity.
- Specs: one per caller group above, per tab (fits in one tab while another is full).

**4b: UI**
- Tabs in `inventory.component.*`, free slots per tab, shop "full" badge per tab, toast text names the tab.
- Docs: `player-stats-inventory-equipment.md`, `persistence.md`, `towns-shops-guild.md` (Satchel), changelog.

### 5. Skill tree slot nodes (S-M, Sonnet) — done: hub +1, pouches +2/level × 3, capstone +4 (owner, 2026-10-31)
- `skill-tree-data.ts`: hub → Gear / Consumables / Materials nodes → capstone. Placement and costs in the tree to be decided in the session.
- `skill-tree.service.ts:65-145`: refund and respec guards check every tab the node grows; the reason names the tab.
- Docs: `skill-tree.md`.

### 6. Zone pet collections — deferred
Dropped from this plan (owner, 2026-10-31). The design is in `docs/ideas/pet-leveling-collection.md` → Zone collections.

## Checks per step
Done checks (`npm run validate`, `npm run lint`, `npm run test:ci`, `npx ng build`) plus a spec for new logic. `/code-review` on step 4 only.
