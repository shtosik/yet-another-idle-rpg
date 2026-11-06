# Farming

## Purpose
The farm's pure rules and seed storage. Design: `docs/ideas/farm-and-husbandry.md` (player behaviour, wins on conflict) and `docs/ideas/seed-storage.md`. Built so far (plan commits C5 to C9): seed storage, the plot rules, the farm home screen (`SiteComponent`, see `towns-shops-guild.md`) and the plots panel. NPCs and the quest chain follow (C10), so no player reaches the farm yet.

## Key files
- `src/app/store/player/farm.ts` — `FarmState`, `takeSeeds`, `plotCount`, `syncPlots`, `isReady`, `plant`, `plantAll`, `harvest`, `harvestAll`, `isFarmUnlocked`. Pure, with `farm.spec.ts` and `seed-routing.spec.ts`.
- `src/data/farming-data.ts` — `FARM_SEEDS`: seed id → crop, tier, grow time, yield, required expertise, XP per harvest.
- `src/data/items/farm-items.data.ts` — the seed and crop items. All seven seeds, six crops (Apple is the existing item) and the Guild Letter, with placeholder icons.
- `src/app/components/game/farm-plots/` — the plots panel (`GameTab.farmPlots`, class `.farm` on the map footprint): header (Farming Guild reputation bar, Farming expertise bar, plot count, close button back to the farm home), seed list, 3x3 grid, Plant all and Harvest all. A 1 s display tick redraws the timers; growth itself runs on the clock.
- `src/app/services/farm.service.ts` — `plotLimit` (`plotCount` from the Guild tier and `PLOT_GRANT_QUEST_IDS`, empty until C10), the active seed (cleared when it runs out or its expertise is missing), and the plot actions with their harvest toast (`map:farm`).
- `src/app/store/player/player.store.ts` — `PlayerState.farm`, `syncFarm`, `plantSeed`, `harvestPlots`, `growAllPlots` (cheat) and the seed split in `addItems`, `processBattleEnd`, `applyKillBatch`.

## Data flow
- **Seeds** are `ITEM_DATA` entries of `ItemType.seed` counted in `farm.seeds`; see `player-stats-inventory-equipment.md`.
- **Plots** are `farm.plots`: a fixed array of 9 (`null` = empty or locked). `plotCount(reputationTierIndex, grantQuestsDone)` (3 + tier + quests, max 9) says how many are usable; it is derived, never saved.
- **Growth is time spent growing, at the rate in force.** Each plot stores `progressMs` (in base grow-time ms) and `syncedAt`. `syncPlots(plots, now, seedGrowthTimeReduction)` adds `max(0, now − syncedAt) / (1 − reduction)`, capped at the seed's `growMs`, and sets `syncedAt = now`. `PlayerStore.syncFarm` runs it on load and before anything that changes the reduction (`equipItem`, `unequipItem`, `applyProfessionXp`), so a new rate only covers the time after the change, offline time counts at the saved rate, a clock set backwards counts as no time, and a ready crop stays ready.
- **Planting** (`plant`) uses one seed; the seed-save roll (`farmSeedSaveChance`) happens once per successful planting. A blocked planting (no seed, expertise too low, locked or busy plot) rolls nothing and returns null.
- **Harvest** (`harvest`): yield = base, ×2 on the double roll (`farmDoubleHarvestChance`), +1 on an independent bonus roll (`farmBonusCropChance`); XP = seed XP × (1 + `farmXpMultiplier`), once per plot. If the crops do not fit (`fits`), the plot stays, pays no XP and keeps its roll in `rolledYield`, which every retry reuses. `harvestAll` stops at the first blocked plot and checks fit against everything harvested so far.
- **Plots panel actions:** `PlayerStore.plantSeed` and `harvestPlots` call `syncFarm` first and persist the returned `FarmState`, also after a blocked harvest (it saved the roll). The crops go through `addItems`; `FarmService.harvest` pays the XP through `ProfessionService.gainXp` (so a level-up toasts). A blocked harvest pays nothing, keeps the plot and shows "Harvest blocked: 1 Materials slot needed"; a ready plot also carries that tag whenever its crops would not fit.
- **Convenience buttons:** Harvest all needs Farming Guild Friendly, Plant all needs Honored; locked, they show `reputationLockText`. Planting uses the active seed (click a seed in the list; again to deselect). A seed above the player's Farming expertise is listed locked.
- **Found-seed toast:** `BattleManagerService` shows "Found: Turnip Seeds x1" under the drops-lost toast for the `foundSeeds` that `processBattleEnd` returns (empty before the farm unlocks).
- **Cheats:** `dev.plantAll(seed?)` fills every plot (grants the seeds and the profession), `dev.growAll()` makes planted plots ready.

## Invariants & gotchas
- Seeds are never in the inventory, never in `lostDrops`, and counted silently before the farm unlocks. `isFarmUnlocked` reads `unlockedContent.sites` (an optional list; the Site unlock effect arrives with C6).
- No quest `item` step or recipe may need a seed (validate).
- `harvest` and `plant` do not sync: call `syncPlots` first.

## How to extend
- A seed: an `ItemType.seed` item (value -1), a `FARM_SEEDS` entry, a crop item and a drop or shop source; `npm run validate` checks the mapping.

## Content (C9)
- Seeds and tiers follow `docs/ideas/farm-and-husbandry.md` §7: Turnip 15 min, Wheat 45 min, Silverleaf 2 h, Apple 4 h, Glowcap 8 h, Heartroot 12 h, Canopy Blossom 24 h; expertise 1, 2, 5, 8, 12, 17, 22.
- Sources: enemy drops (`enemies-data.ts`, listed in `enemies-shiny-pets-bestiary.md`), the Arena Chest (`arena.md`) and Marta's shop (`towns-shops-guild.md`). Recipes: `consumables-camp-crafting.md`.
- `NpcID.farmWarden` and `farmDrover` are stubs (placeholder avatars, one-node dialogues) so the shop opens; C10 writes the trees.
- Art still to draw: seed and crop icons, the Terrace Hare icon, the Guild Letter, recipe scrolls, Turnip Stew, Farmer's Bread, Harvest Pie, Mushroom Stew, Silverleaf Tonic, Glowcap Elixir icons, two portraits (C11).
