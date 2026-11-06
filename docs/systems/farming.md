# Farming

## Purpose
The farm's pure rules and seed storage. Design: `docs/ideas/farm-and-husbandry.md` (player behaviour, wins on conflict) and `docs/ideas/seed-storage.md`. Built so far (plan commit C5): seed storage and the plot rules. The farm home screen (`SiteComponent`, see `towns-shops-guild.md`) opens from the map with its Gate button still a stub; there are no plots UI, NPCs or quests yet, so nothing is reachable by a player; later commits (`docs/ideas/farm-implementation-plan.md`) add them.

## Key files
- `src/app/store/player/farm.ts` — `FarmState`, `takeSeeds`, `plotCount`, `syncPlots`, `isReady`, `plant`, `plantAll`, `harvest`, `harvestAll`, `isFarmUnlocked`. Pure, with `farm.spec.ts` and `seed-routing.spec.ts`.
- `src/data/farming-data.ts` — `FARM_SEEDS`: seed id → crop, tier, grow time, yield, required expertise, XP per harvest.
- `src/data/items/farm-items.data.ts` — the seed and crop items. All seven seeds, six crops (Apple is the existing item) and the Guild Letter, with placeholder icons.
- `src/app/store/player/player.store.ts` — `PlayerState.farm`, `syncFarm`, and the seed split in `addItems`, `processBattleEnd`, `applyKillBatch`.

## Data flow
- **Seeds** are `ITEM_DATA` entries of `ItemType.seed` counted in `farm.seeds`; see `player-stats-inventory-equipment.md`.
- **Plots** are `farm.plots`: a fixed array of 9 (`null` = empty or locked). `plotCount(reputationTierIndex, grantQuestsDone)` (3 + tier + quests, max 9) says how many are usable; it is derived, never saved.
- **Growth is time spent growing, at the rate in force.** Each plot stores `progressMs` (in base grow-time ms) and `syncedAt`. `syncPlots(plots, now, seedGrowthTimeReduction)` adds `max(0, now − syncedAt) / (1 − reduction)`, capped at the seed's `growMs`, and sets `syncedAt = now`. `PlayerStore.syncFarm` runs it on load and before anything that changes the reduction (`equipItem`, `unequipItem`, `applyProfessionXp`), so a new rate only covers the time after the change, offline time counts at the saved rate, a clock set backwards counts as no time, and a ready crop stays ready.
- **Planting** (`plant`) uses one seed; the seed-save roll (`farmSeedSaveChance`) happens once per successful planting. A blocked planting (no seed, expertise too low, locked or busy plot) rolls nothing and returns null.
- **Harvest** (`harvest`): yield = base, ×2 on the double roll (`farmDoubleHarvestChance`), +1 on an independent bonus roll (`farmBonusCropChance`); XP = seed XP × (1 + `farmXpMultiplier`), once per plot. If the crops do not fit (`fits`), the plot stays, pays no XP and keeps its roll in `rolledYield`, which every retry reuses. `harvestAll` stops at the first blocked plot and checks fit against everything harvested so far.
- The callers (store actions for plant and harvest, the UI) arrive in later commits: they must call `syncFarm` first and persist the returned `FarmState`, also after a blocked harvest (it saved the roll).

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
