# Zones, waves and unlocks

## Purpose
Zones are the combat areas; each has waves of regular enemies ending in a boss. Progress opens new zones, towns and features (Camp, skill tree, world map).

## Key files
- `src/data/zones-data.ts:ZONES_DATA` — per zone: background `url`, `enemies` (regulars), `bossEnemyId`, `maxWave`, `enemiesPerWave`, `nextZoneId`, `previousZoneId`.
- `src/enums/ids/zone-id.enum.ts:ZoneID`.
- `src/data/unlock-conditions.ts:UNLOCK_RULES` — town and feature unlocks (condition → target → optional notification); `ZONE_UNLOCK_NOTIFICATIONS` — popup per newly opened zone.
- `src/app/store/battle/battle.store.ts` — `currentZoneId`, `currentWave`, `changeWave`, `setZone`, `requiredKillCountOnCurrentWave`.
- `src/app/services/battle-manager.service.ts` — `canMoveToNextWave`, `canMoveToPreviousWave`, `checkUnlocks`, `checkProgressionUnlocks`.
- `src/app/store/player/player.store.ts` — `zonesProgression` (kills per zone per wave), `unlockedContent` (`zones`, `towns`), `campUnlocked`, `skillTreeUnlocked`, `mapUnlocked`, `isUnlockTargetUnlocked`, `applyUnlockTarget`, `isPlayerStateConditionMet`.
- `src/data/helpers/enemy-zones.ts:ZONES_BY_ENEMY` — reverse lookup (bestiary).

## Data flow
**Waves**: waves `1..maxWave-1` spawn random regulars and need `enemiesPerWave` kills to unlock the next wave. The last wave spawns only the boss and needs 1 kill. Kills are counted in `zonesProgression[zone][wave]`. The battle nav arrows move between waves; past the last wave they cross into `nextZoneId` (if unlocked), before wave 1 into `previousZoneId` (last wave). Auto wave progression (node + toggle) advances after each kill once the count is met.

**Zone unlocks**, two paths:
1. **Chain**: killing the boss of a zone adds its `nextZoneId` to `unlockedContent.zones` and shows `ZONE_UNLOCK_NOTIFICATIONS[next]`. Chain: Horseshoe Beach → Plains → The Long Path → Mountain Pass → Elderwood Wilds.
2. **Town entrance**: a town building with `zoneId` and `questRequirement` sends the player straight into that zone (`setZone`). Starting the quest adds the zone to `unlockedContent.zones` (`QuestsStore.startQuest` via `src/data/helpers/entrance-zones.ts:ENTRANCE_ZONES_BY_QUEST`; re-applied on load). Traders' Basement (La Harpar, Rats Were Rats), Deepwood (Mawood, The Sap That Burns), Upper Canopy (Mawood, Feathers for a Kite).

**Town and feature unlocks** (`UNLOCK_RULES`), checked after every kill:
- `hasItem` Turtle Shell → Camp; `levelReached` 2 → skill tree;
- `waveReached` Horseshoe Beach 5 → La Harpar (+ world map); Elderwood Wilds 4 → Mawood.
On load, `PlayerStore.onInit` re-applies every rule already met, silently, so new rules reach old saves.

## Invariants & gotchas
- `UNLOCK_RULES` only target towns and features (`UnlockTarget`); zones unlock by the boss chain or a town entrance.
- A zone's boss must not be listed in its `enemies` (`npm run validate` warns).
- Horseshoe Beach is always unlocked (initial state and the `?? [horseshoeBeach]` fallbacks).
- `waveReached` means "killed something on that wave", measured at kill time in the current zone.

## Known issues
- Unlock rules are only evaluated on kills; a level-up from a quest reward unlocks nothing until the next kill.
- The two `waveReached` checks disagree: on load, kills on exactly that wave; at runtime, any wave `>=` it.
- Waves inside a zone are identical (no per-wave scaling); the HP/XP curve across zones isn't monotonic.
- `elderwoodWilds` has no `nextZoneId`; Deepwood and Upper Canopy are reached only through Mawood.

## How to extend
New zone or enemy: the `add-enemy-and-zone` skill. New town or feature unlock: add an `UnlockRule` (extend `UnlockCondition`/`UnlockTarget` and the switches in `PlayerStore` if needed) and its `unlocks:` i18n keys.
