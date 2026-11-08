# Zones, waves and unlocks

## Purpose
Zones are the combat areas; each has waves of regular enemies ending in a boss. Progress opens new zones, towns and features (Camp, skill tree, world map).

## Key files
- `src/data/zones-data.ts:ZONES_DATA` — per zone: background `url`, `enemies` (regulars), `bossEnemyId`, `maxWave`, `enemiesPerWave`, `nextZoneId`, `previousZoneId`, `tier` (progression order; a side zone takes its place in the quest line: Trader's Basement 1, Deepwood 6, Upper Canopy 7), `masteryReward` (chest per mastery star).
- `src/app/store/player/zone-mastery.ts` — `ZONE_STARS`, `zoneStarProgress`, `masteryModifiers`; `PlayerStore.zoneMastery`, `canClaimZoneStar`, `claimZoneStar`; header stars in `src/app/components/game/battle/battle-nav-bar/zone-mastery/`.
- `src/app/store/battle/wave-scaling.ts:waveMultipliers` — per-wave HP and reward multipliers.
- `src/enums/ids/zone-id.enum.ts:ZoneID`.
- `src/data/unlock-conditions.ts:UNLOCK_RULES` — town and feature unlocks (condition → target → optional notification); `ZONE_UNLOCK_NOTIFICATIONS` — popup per newly opened zone.
- `src/app/store/battle/waves.ts` — the Wave rules, shared by online play and the offline claim: `waveEnemies`, `rollSpawn` (enemy, then shiny, scaled HP), `requiredKills`, and `nextWave` / `previousWave` (where a move leads, or null: a regular wave needs `enemiesPerWave` kills, the boss wave leads only into an unlocked next zone).
- `src/app/store/battle/battle.store.ts` — `currentZoneId`, `currentWave`, `goToWave` (moves without checking), `setZone`, `requiredKillCountOnCurrentWave`.
- `src/app/services/battle-manager.service.ts` — `changeWave(next)`, the only way the wave arrows and auto wave progression move, and `canMoveToNextWave` / `canMoveToPreviousWave`, all from `nextWave` / `previousWave`. A boss kill grants `nextZoneId` through `UnlockService` from Kill resolution (`kill-resolution.service.ts`), online and in an offline claim.
- `src/app/services/unlock.service.ts:UnlockService` (**Unlocks**) — the only owner of what is unlocked and of its notices. `grant(target)` is a no-op for an unlocked target, else sets the flag and shows the target's notice, found from the rule's `notification`, `ZONE_UNLOCK_NOTIFICATIONS` or the `unlocks:sites.<Site>` key. An effect grants every newly met `UNLOCK_RULES` target and town-entrance zone whenever the state it reads changes; `replayOnLoad()` (run once when the service is created, after the stores load) applies them silently.
- `src/app/store/player/player.store.ts` — `zonesProgression` (kills per zone per wave), `unlockedContent` (`zones`, `towns`, `sites`), `campUnlocked`, `skillTreeUnlocked`, `mapUnlocked`, `isZoneUnlocked`, `isSiteUnlocked`, `unlockSite`, `isUnlockTargetUnlocked`, `applyUnlockTarget` (sets a flag with no notice; the writer `grant` uses).
- `src/data/helpers/enemy-zones.ts:ZONES_BY_ENEMY` — reverse lookup (bestiary).

## Data flow
**Waves**: waves `1..maxWave-1` spawn random regulars and need `enemiesPerWave` kills to unlock the next wave. The last wave spawns only the boss and needs 1 kill. Kills are counted in `zonesProgression[zone][wave]`. The battle nav arrows move between waves; past the last wave they cross into `nextZoneId` (if unlocked), before wave 1 into `previousZoneId` (last wave). Auto wave progression (node + toggle) advances after each kill once the count is met.

**Wave scaling** (`waveMultipliers`): with `t = (wave - 1) / (lastRegularWave - 1)`, HP is `× (1 + WAVE_HP_SCALING·t)` and XP/gold `× (1 + WAVE_REWARD_SCALING·t)` (1.0 and 1.2: the last regular wave has ×2 HP and ×2.2 rewards, so pushing waves pays per second). `startBattle` saves the scaled `maxHp` on the enemy; `killReward` (Kill resolution) applies the reward multiplier. Not scaled: the boss wave, drop chances, the shiny chance and shiny rewards (a shiny pays ×5 XP / ×10 gold of the unscaled base), so low waves are where materials and shinies come from. The multipliers aren't shown in the UI (owner decision: too much info for the nav bar).

**Zone chain**: each tier's mean regular-enemy HP, XP and gold is ×1, ×3, ×6, ×12, ×24, ×48, ×96 of Horseshoe Beach's (4 HP, 6 XP, 3 gold); a boss has 25× its zone's mean HP and 10× its rewards. No enemy is shared between zones. Tune with `npm run sim` (`docs/ideas/progression-pacing.md`; `-- --reputation` adds town reputation pacing).

`npm run sim -- --upgrades` adds a gold-cost table for every non-unique equipment item other than pets. It uses the game's `mergeCost` helper and `UPGRADE_COST_FACTOR` (`k` in `src/data/upgrade-data.ts`), printing each single attempt from +0 → +1 through +4 → +5. The total to build one +5 from 32 +0 copies includes making the sacrifices: 16, 8, 4, 2 and 1 attempts respectively, for `80 × value × k` gold. The five single-attempt prices alone sum to `31 × value × k`.

**Zone unlocks**, two paths:
1. **Chain**: killing the boss of a zone adds its `nextZoneId` to `unlockedContent.zones` and shows `ZONE_UNLOCK_NOTIFICATIONS[next]` (`UnlockService.grant` with a `zone` target). Chain: Horseshoe Beach → Plains → The Long Path → Mountain Pass → Elderwood Wilds.
2. **Town entrance**: a town building with `zoneId` and `questRequirement` sends the player straight into that zone (`setZone`). Starting the quest adds the zone to `unlockedContent.zones` (`UnlockService` watches `QuestsStore.questStepProgression` against `src/data/helpers/entrance-zones.ts:ENTRANCE_ZONES_BY_QUEST`; re-applied on load). Trader's Basement (La Harpar, Rats Were Rats), Deepwood (Mawood, The Sap That Burns), Upper Canopy (Mawood, Feathers for a Kite). Deepwood and Upper Canopy also get world map markers once unlocked; Trader's Basement has none on purpose (it's a basement under the La Harpar market, reached only through the town). `npm run validate` errors on an entrance building without `questRequirement`.

**Zone mastery**: every zone has 3 stars. **Conqueror**: kill the zone boss 10 times (`enemyKillCounts[bossEnemyId]`). **Hunter**: every regular enemy and the boss at bestiary ★ or better (`bestiaryRank`). **Shiny Hunter**: kill 10 shinies in the zone (`PlayerState.shinyKillsByZone`, counted by Kill resolution in `applyKillBatch`). Conqueror and Hunter are derived from kill counts; only shiny kills and claims (`PlayerState.claimedZoneStars`) are saved. A finished star is claimed by clicking it next to the zone name (its tooltip shows the goal, progress and chest); the claim pays the zone's `masteryReward` (gold, Explorer Tokens, zone resources) once and is refused while the items don't fit (the tooltip names the tab and slots to free, `PlayerStore.missingSlotsByTab`). Each zone with all 3 stars claimed adds +0.02 to `goldCoinsMultiplier` through the `mastery` stat source (`masteryModifiers`, derived from the claims, ADR 0002). Zone markers on the world map show the claimed stars. Rewards are placeholders (gold 50 × tier², tokens 3 × tier).

**Town and feature unlocks** (`UNLOCK_RULES`), checked whenever the state they read changes:
- `hasItem` Turtle Shell → Camp; `levelReached` 2 → skill tree;
- `waveReached` Horseshoe Beach 5 → La Harpar (+ world map); Elderwood Wilds 4 → Mawood; Upper Canopy 15 (the Harpy Matriarch, after the Mawood Zones) → Lirold, reached from the map's town buttons (no marker yet).
- `questCompleted` (`questId`) is also available, checked against `QuestsStore`. No rule uses it yet.
On load, `UnlockService.replayOnLoad` re-applies every rule already met and every started quest's entrance zone, silently, so new rules reach old saves.

**Navbar** (`src/app/components/game/game-menu/`): tabs in a fixed order (Battle, Skill tree, Camp, Spellbook, Map, Bestiary, Settings). A locked feature keeps its slot, greyed with a lock and `aria-disabled` (still focusable, clicks ignored, a hidden "Locked" label for screen readers), so the bar doesn't shift as features unlock: Map ← `mapUnlocked`, Skill tree ← `skillTreeUnlocked`, Camp ← `campUnlocked`, Spellbook ← `spellbookUnlocked`; Battle, Bestiary and Settings are always open. The open tab (`GameNavigationService.tab`) is highlighted; inside a town the Map tab stays lit, since towns are reached through the map. Badges: unspent skill points on Skill tree, `unseenEnemyCount` on Bestiary, `unseenSpellCount` on Spellbook. A slim resource strip under the tabs (`player-hud/`) shows, left-aligned, level, the XP bar and currencies: gold, plus Explorer Tokens once the player has earned any (`totalTasksCompleted > 0` or tokens above 0). Player actions float `+N` (green) or `−N` (red) just below the currency they changed (`CurrencyFeedService`; same-currency, same-sign changes within 400 ms merge): gold on shop buy and sell, tokens on a token-shop buy and on claiming Guild tasks. Kill gold doesn't float.

## Battle header and controls
- The zone name and three framed mastery stars occupy the header, followed by kills, wave number and a progress strip showing kills toward the wave requirement (capped at full while farming). Mastery goals, reward tooltips and claim rules are unchanged.
- Wave arrows are a consistent framed pair in the right-side control rail, using yellow CSS shapes without an image background (up for previous, down for next). Unavailable arrows stay visible and disabled; tooltips name previous/next wave and crossing a zone boundary. In the Arena the pair is hidden.
- Unlocked auto wave progression and auto-eat toggles form a separate group, with pressed states, lit indicators and tooltips naming their on/off state. Toggling and progression rules are unchanged.
- Task rows stay under the header in a bounded scrolling list. Completed tasks support mouse, Enter and Space navigation to Marvin.

## Invariants & gotchas
- `UNLOCK_RULES` only target towns, Sites and features; the `zone` `UnlockTarget` is granted only by the boss chain and town entrances; the farm Site has no rule and opens through the `unlockSite` dialogue effect (`UnlockService.grant`, popup `unlocks:sites.farm`, shown once), or `dev.unlockSite` (silent). Opening a Site also unlocks the Map tab; zones unlock by the boss chain or a town entrance.
- A zone's boss must not be listed in its `enemies` (`npm run validate` warns).
- Horseshoe Beach is always unlocked (initial state and the `?? [horseshoeBeach]` fallbacks).
- `waveReached` means "killed something on that wave or a later one of the zone" (`zonesProgression`), the same on load and during play. Rules react to any change (kills, loot, quest XP), not only kills.

## Known issues
- Unlock rules are only evaluated on kills; a level-up from a quest reward unlocks nothing until the next kill.
- Waves inside a zone have the same enemy pool (no elites or mixed boss waves yet, `docs/ideas/wave-variety.md`).
- `elderwoodWilds` has no `nextZoneId`; Deepwood and Upper Canopy are reached only through Mawood.

## How to extend
New zone or enemy: the `add-enemy-and-zone` skill. New town or feature unlock: add an `UnlockRule` (extend `UnlockCondition`/`UnlockTarget` and the switches in `UnlockService` and `PlayerStore` if needed) and its `unlocks:` i18n keys.
