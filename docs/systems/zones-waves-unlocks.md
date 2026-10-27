# Zones, waves and unlocks

## Purpose
Zones are the combat areas; each has waves of regular enemies ending in a boss. Progress opens new zones, towns and features (Camp, skill tree, world map).

## Key files
- `src/data/zones-data.ts:ZONES_DATA` — per zone: background `url`, `enemies` (regulars), `bossEnemyId`, `maxWave`, `enemiesPerWave`, `nextZoneId`, `previousZoneId`, `tier` (progression order; a side zone takes its place in the quest line: Traders' Basement 1, Deepwood 6, Upper Canopy 7), `masteryReward` (chest per mastery star).
- `src/app/store/player/zone-mastery.ts` — `ZONE_STARS`, `zoneStarProgress`, `masteryModifiers`; `PlayerStore.zoneMastery`, `canClaimZoneStar`, `claimZoneStar`; header stars in `src/app/components/game/battle/battle-nav-bar/zone-mastery/`.
- `src/app/store/battle/wave-scaling.ts:waveMultipliers` — per-wave HP and reward multipliers.
- `src/enums/ids/zone-id.enum.ts:ZoneID`.
- `src/data/unlock-conditions.ts:UNLOCK_RULES` — town and feature unlocks (condition → target → optional notification); `ZONE_UNLOCK_NOTIFICATIONS` — popup per newly opened zone.
- `src/app/store/battle/battle.store.ts` — `currentZoneId`, `currentWave`, `changeWave`, `setZone`, `requiredKillCountOnCurrentWave`.
- `src/app/services/battle-manager.service.ts` — `canMoveToNextWave`, `canMoveToPreviousWave`, `unlockNextZone` (boss kill opens `nextZoneId`).
- `src/app/services/unlock.service.ts:UnlockService` — applies `UNLOCK_RULES` with their notification whenever the player state they read changes.
- `src/app/store/player/player.store.ts` — `zonesProgression` (kills per zone per wave), `unlockedContent` (`zones`, `towns`), `campUnlocked`, `skillTreeUnlocked`, `mapUnlocked`, `isUnlockTargetUnlocked`, `applyUnlockTarget`, `isUnlockConditionMet` (also re-applies rules silently on load).
- `src/data/helpers/enemy-zones.ts:ZONES_BY_ENEMY` — reverse lookup (bestiary).

## Data flow
**Waves**: waves `1..maxWave-1` spawn random regulars and need `enemiesPerWave` kills to unlock the next wave. The last wave spawns only the boss and needs 1 kill. Kills are counted in `zonesProgression[zone][wave]`. The battle nav arrows move between waves; past the last wave they cross into `nextZoneId` (if unlocked), before wave 1 into `previousZoneId` (last wave). Auto wave progression (node + toggle) advances after each kill once the count is met.

**Wave scaling** (`waveMultipliers`): with `t = (wave - 1) / (lastRegularWave - 1)`, HP is `× (1 + WAVE_HP_SCALING·t)` and XP/gold `× (1 + WAVE_REWARD_SCALING·t)` (1.0 and 1.2: the last regular wave has ×2 HP and ×2.2 rewards, so pushing waves pays per second). `startBattle` saves the scaled `maxHp` on the enemy; `processBattleEnd` applies the reward multiplier. Not scaled: the boss wave, drop chances, the shiny chance and shiny rewards (a shiny pays ×5 XP / ×10 gold of the unscaled base), so low waves are where materials and shinies come from. The multipliers aren't shown in the UI (owner decision: too much info for the nav bar).

**Zone chain**: each tier's mean regular-enemy HP, XP and gold is ×1, ×3, ×6, ×12, ×24, ×48, ×96 of Horseshoe Beach's (4 HP, 6 XP, 3 gold); a boss has 25× its zone's mean HP and 10× its rewards. No enemy is shared between zones. Tune with `npm run sim` (`docs/ideas/progression-pacing.md`).

**Zone unlocks**, two paths:
1. **Chain**: killing the boss of a zone adds its `nextZoneId` to `unlockedContent.zones` and shows `ZONE_UNLOCK_NOTIFICATIONS[next]`. Chain: Horseshoe Beach → Plains → The Long Path → Mountain Pass → Elderwood Wilds.
2. **Town entrance**: a town building with `zoneId` and `questRequirement` sends the player straight into that zone (`setZone`). Starting the quest adds the zone to `unlockedContent.zones` (`QuestsStore.startQuest` via `src/data/helpers/entrance-zones.ts:ENTRANCE_ZONES_BY_QUEST`; re-applied on load). Traders' Basement (La Harpar, Rats Were Rats), Deepwood (Mawood, The Sap That Burns), Upper Canopy (Mawood, Feathers for a Kite). Deepwood and Upper Canopy also get world map markers once unlocked; Traders' Basement has none on purpose (it's a basement under the La Harpar market, reached only through the town). `npm run validate` errors on an entrance building without `questRequirement`.

**Zone mastery**: every zone has 3 stars. **Conqueror**: kill the zone boss 10 times (`enemyKillCounts[bossEnemyId]`). **Hunter**: every regular enemy and the boss at bestiary ★ or better (`bestiaryRank`). **Shiny Hunter**: kill 10 shinies in the zone (`PlayerState.shinyKillsByZone`, counted in `processBattleEnd` and `applyKillBatch` from the offline `shinies`). Conqueror and Hunter are derived from kill counts; only shiny kills and claims (`PlayerState.claimedZoneStars`) are saved. A finished star is claimed by clicking it next to the zone name (its tooltip shows the goal, progress and chest); the claim pays the zone's `masteryReward` (gold, Explorer Tokens, zone resources) once and is refused while the items don't fit. Each zone with all 3 stars claimed adds +0.02 to `goldCoinsMultiplier` through the `mastery` stat source (`masteryModifiers`, derived from the claims, ADR 0002). Zone markers on the world map show the claimed stars. Rewards are placeholders (gold 50 × tier², tokens 3 × tier).

**Town and feature unlocks** (`UNLOCK_RULES`), checked after every kill:
- `hasItem` Turtle Shell → Camp; `levelReached` 2 → skill tree;
- `waveReached` Horseshoe Beach 5 → La Harpar (+ world map); Elderwood Wilds 4 → Mawood.
- `questCompleted` (`questId`) is also available: `UnlockService` checks it against `QuestsStore`, since `PlayerStore` can't read quests. No rule uses it yet.
On load, `PlayerStore.onInit` re-applies every rule already met, silently, so new rules reach old saves. `questCompleted` rules are skipped there; a target they unlocked is already saved, and a new one fires (with its notification) once the game runs.

**Navbar** (`src/app/components/game/game-menu/`): tabs in a fixed order (Battle, Skill tree, Camp, Spellbook, Map, Bestiary, Settings). A locked feature keeps its slot, greyed with a lock and `aria-disabled` (still focusable, clicks ignored, a hidden "Locked" label for screen readers), so the bar doesn't shift as features unlock: Map ← `mapUnlocked`, Skill tree ← `skillTreeUnlocked`, Camp ← `campUnlocked`, Spellbook ← `spellbookUnlocked`; Battle, Bestiary and Settings are always open. The open tab (`GameNavigationService.tab`) is highlighted; inside a town the Map tab stays lit, since towns are reached through the map. Badges: unspent skill points on Skill tree, `unseenEnemyCount` on Bestiary, `unseenSpellCount` on Spellbook. A slim resource strip under the tabs (`player-hud/`) shows, left-aligned, level, the XP bar and currencies: gold, plus Explorer Tokens once the player has earned any (`totalTasksCompleted > 0` or tokens above 0). Player actions float `+N` (green) or `−N` (red) just below the currency they changed (`CurrencyFeedService`; same-currency, same-sign changes within 400 ms merge): gold on shop buy and sell, tokens on a token-shop buy and on claiming Guild tasks. Kill gold doesn't float.

## Invariants & gotchas
- `UNLOCK_RULES` only target towns and features (`UnlockTarget`); zones unlock by the boss chain or a town entrance.
- A zone's boss must not be listed in its `enemies` (`npm run validate` warns).
- Horseshoe Beach is always unlocked (initial state and the `?? [horseshoeBeach]` fallbacks).
- `waveReached` means "killed something on that wave or a later one of the zone" (`zonesProgression`), the same on load and during play. Rules react to any change (kills, loot, quest XP), not only kills.

## Known issues
- Unlock rules are only evaluated on kills; a level-up from a quest reward unlocks nothing until the next kill.
- Waves inside a zone have the same enemy pool (no elites or mixed boss waves yet, `docs/ideas/wave-variety.md`).
- `elderwoodWilds` has no `nextZoneId`; Deepwood and Upper Canopy are reached only through Mawood.

## How to extend
New zone or enemy: the `add-enemy-and-zone` skill. New town or feature unlock: add an `UnlockRule` (extend `UnlockCondition`/`UnlockTarget` and the switches in `PlayerStore` if needed) and its `unlocks:` i18n keys.
