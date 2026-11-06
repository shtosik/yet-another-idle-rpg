# Seed storage (where farm seeds live)

**Scope:** S-M · **Status:** Accepted (owner decision 2026-11-06: seeds are removed from the inventory and live in a separate farming store). Player-facing rules live in [farm-and-husbandry.md](farm-and-husbandry.md) §9b and win on any conflict; this doc is the implementation.

Companion to [farm-and-husbandry.md](farm-and-husbandry.md) §7 (tiered seeds that monsters and the Arena Chest drop, a few buyable low tiers). Problem: a Turnip Seed can drop at Horseshoe Beach hours before the farm unlocks (a quest after `silkAndWater`), and seeds must never crowd out other drops or cost a tab.

## Decision

Seeds are **not inventory items**. They are counted per seed type in the player's farming state and shown only in the farming UI's side seed list. Drops, chest rolls, quest rewards, dialogue gifts and shop purchases add to that count **even before the farm unlocks**, silently (see Visibility); Marta explains on the first visit (farm doc §6a). No slots, no tab, no stack to lose.

## How items reach the inventory today (origin/staging)

All paths end in `addItems` (`src/app/store/player/inventory.ts`), which routes by `tabOf(id)` from `ItemType`:

| Path | Code |
|---|---|
| Online kill | `PlayerStore.processBattleEnd` (`player.store.ts`) rolls `rollEnemyDrops` (`kill-rewards.ts`), takes `lostItems` for the toast, then `store.addItems`. |
| Offline kills | `OfflineProgressService` (`offline-progress.service.ts`) calls `PlayerStore.applyKillBatch`, which calls `addItems` directly and returns `receivedItems` (shown by the welcome-back modal) and `lostDrops` (a count). |
| Everything else | `PlayerStore.addItems`: shop purchase (`shop.component.ts` `buyOne`), quest rewards (`quests.store.ts` `handleQuestCompleted`), dialogue gifts (`dialogue-manager.service.ts`), chest contents (`openChest`), Arena rewards (`arena.service.ts`), zone mastery chests (`claimZoneStar`), crafting (`craft`), dev cheats. |
| Precedent for "an item that does not enter the inventory" | `installStations` splits station gear out of the items before `addItems`; it is never counted as lost. |

## Design

### Data

- **Seed items stay `ITEM_DATA` entries** with a new `ItemType.seed`. Enemy `drops`, shop stock, quest `item` rewards, chest loot and dialogue items keep their existing shapes (`id, min, max, chance`), so nothing about authoring changes, `scripts/validate-data.mjs` still checks every drop target, and tooltips, names, icons and the bestiary's drop list keep reading `ITEM_DATA`. No separate drop field.
- **`tabOf`** has an exhaustive switch over `ItemType`; add `case ItemType.seed` that is unreachable for stored items (seeds are split out first, see Pipeline). To keep the compiler honest, return `'materials'` there with a comment, or make `tabOf` take `Exclude<ItemType, seed>`.
- **State**: one new field next to the plots (the plot sketch in the farm doc §8):

```ts
// store/player/farm.ts, saved in PlayerState (player.store.ts)
interface FarmState {
  plots: ({ seedId: ItemID; plantedAt: number } | null)[]
  seeds: Partial<Record<ItemID, number>>   // seed item id -> count held; absent means 0
}
// item.interface.ts: SeedItem { type: ItemType.seed; value: -1 }  (no sell price; validate allows value <= 0)
```

### Pipeline: split seeds out beside `installStations`

One helper `takeSeeds(items: ItemStack[]): { seeds: Partial<Record<ItemID, number>>, rest: ItemStack[] }` in `store/player/farm.ts`, called in the three places that already call `installStations`:

| Place | Change |
|---|---|
| `PlayerStore.addItems` | `takeSeeds` first; add the seed counts to `state.farm.seeds`; the remainder goes to `addItems` as now. Covers shop, quests, dialogue, chests, Arena, mastery, cheats. |
| `processBattleEnd` | `lostItems` is computed on the remainder only, so seeds are never "lost". Return the found seeds as well so the toast can show them. |
| `applyKillBatch` | Split `batch.items`; add seed counts in the same `patchState`; put the seeds into `receivedItems` (as `InventoryItem` entries with `type: ItemType.seed`) once the farm is unlocked, so the welcome-back modal lists them, and always keep them out of `lostDrops`. |

Planting and harvest live beside it: `plantSeed(plotIndex, seedId)` subtracts one from `seeds` and writes the plot (guard: count at least 1, plot empty). `countItem` and `hasItems` do not see seeds, so no quest `item` step and no recipe may require a seed itself; add a `validate` check (crops are fine).

### Cap

**None** (settled, farm doc §9b). A count costs no slot and nothing is ever lost, so `takeSeeds` never clamps.

### Behaviour by feature

| Feature | Behaviour |
|---|---|
| Inventory blocking | None. Seeds never use slots and are never lost. |
| Visibility (farm doc §9b) | **Before the farm unlocks, collection is silent, online and offline**: counts go up, but no toast, no popup and no welcome-back entry. **After the unlock**: a kill that drops a seed shows a small "Found: Turnip Seeds x1" line in the battle view's toast channel (`BattleManagerService`, near `showDropsLost`; today that toast shows lost drops only, so a found line is new), and the welcome-back modal lists seeds in received items. Implementation: `processBattleEnd` and `applyKillBatch` read the unlock (`unlockedContent.sites` has `farm`) at call time and return/report found seeds only when unlocked; the counts are added either way. Marta's first-visit beat (farm doc §6a) covers the silent seeds. No first-seed popup. |
| Offline | Same roll as online (`rollDropList`, seeded RNG). Seeds go into `receivedItems` only once the farm is unlocked; `lostDrops` never counts them. |
| Shops | A seed in stock is bought like any item, with `addItems` routing it to the store. Stock count and price work unchanged. The shop's "inventory full" gate (`canFitItems`/`missingSlots`) must ignore seeds: filter them with the same split. The shop does not list seeds in its sell grid (they are not in the inventory). |
| Quest and dialogue rewards | Unchanged data; `handleQuestCompleted` and the dialogue effect use `addItems`. Reward blocking ("no room") must ignore seeds: the quest/chest fit checks go through `canFit`, so make the seed split part of `missingSlotsByTab` (it should skip seed stacks). |
| Chests | `rollChest` may roll seeds; `openChest` fit check excludes them; contents show in the chest modal as ordinary stacks. The Arena Chest (`rewards-items.data.ts`) keeps seeds as entries in its weighted `loot` table (the farm doc §7 adds them and buffs the gold entry to offset the dilution); its Seal bonus roll is untouched. |
| Item tooltips and drop display | Unchanged, because seeds remain `ITEM_DATA` entries: the bestiary's drop list, shop cards and reward lists render them. The farm side list shows `count x name` and a tooltip with grow time and yield (`FARM_SEEDS`). |
| Side seed list in the plots panel | `computed` over `farm().seeds`, filtered to `count > 0`, plus unlocked-but-empty rows if wanted. Click selects the seed for planting. |
| Sell / destroy | Seeds cannot be sold or destroyed (not in the inventory). Surplus cost nothing, so no UI is needed. |
| Prestige | No dependency: nothing here reads or resets for a rebirth (farm doc §16; `prestige.md` is only a proposal). |

### Save

`PlayerState` gains `farm: { plots, seeds }` (with the plots from the farm doc). A key added to the initial state appears in old saves with its initial value through the load merge (`persistence.md`, "New keys pick up defaults"), so **no migration is needed and the save version stays 2**. No seed exists in any save today, so nothing moves. Slot bonuses are untouched, which respects the owner rule. If the farm state is a separate persisted store instead, follow the persisted-store checklist (`withGameStateSync`, `resetState`, inject in `GameComponent`); same conclusion for the version.

### Touch-points (origin/staging paths)

- `src/enums/items/item-type.enum.ts` (`seed`), `src/app/store/player/inventory.ts` (`tabOf`, `missingSlotsByTab` skipping seeds), `src/interfaces/item.interface.ts` (`SeedItem`), `src/data/items-data` (seed entries), `scripts/validate-data.mjs` (seeds only in the farm table, never required by an `item` step or recipe).
- `src/app/store/player/farm.ts` (`takeSeeds`, `plantSeed`, `FarmState`) with a spec; `src/app/store/player/player.store.ts` (`addItems`, `processBattleEnd`, `applyKillBatch`, state, `resetState`).
- `src/app/services/offline-progress.service.ts` and the welcome-back modal (no change expected: `receivedItems` already lists what it is given; the unlock filter sits in `applyKillBatch`), `src/data/rewards-items.data.ts` (Arena Chest seed entries), `src/app/services/battle-manager.service.ts` (found-seed toast), `src/app/components/game/town/shop/shop.component.ts` (full gate), `src/app/store/quests/quests.store.ts`, `src/app/services/dialogue-manager.service.ts` (no change expected).
- `src/app/components/game/farm/` (side seed list), locales (`app:inventory` toast text, `items` names).
- Docs in the same commit: `docs/systems/player-stats-inventory-equipment.md` (seeds bypass tabs), the farm system doc, `docs/systems/persistence.md` (new key), `GLOSSARY.md` (Seed: a farm item held in the Seeds count, not an Item stack), `CHANGELOG.md`.

## Rejected history

| Option | Why not |
|---|---|
| Seeds tab in the inventory | The owner does not want a tab per feature. |
| Seeds in Materials with a bigger base capacity | Still spends slots (4-5 before the farm opens), shares them with crops and later herbs, ore and fish, and a full tab loses seeds. |
| Gate seed drops until the farm unlocks | Hides the early hint that monsters carry seeds and does not help afterwards. |
| Auto-discard low tiers | Needs a rule setting and UI; unnecessary once seeds cost no slot. |

## Open owner questions

None. Caps, pre-unlock visibility, the loot cue and prestige are settled in the farm doc (§9b, §16). Remaining engineering check: confirm the unlock flag is cheap to read inside `applyKillBatch` and `processBattleEnd` (it is `unlockedContent`, in the same store).
