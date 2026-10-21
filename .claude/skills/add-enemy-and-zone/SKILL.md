---
name: add-enemy-and-zone
description: Use when adding an enemy, a boss, or a whole new zone — enemy data and drops, zone waves and boss, how the zone unlocks, background, sprites, map marker and names. Triggers on "add a new monster", "add a boss to X", "create a new zone", "add an area after Mountain Pass", "put a wolf in the plains".
---

# Add an enemy or zone

Background: `docs/systems/zones-waves-unlocks.md` (waves, unlock paths) and `docs/systems/enemies-shiny-pets-bestiary.md` (drops, shinies).

For **an enemy in an existing zone**, do steps 1–4 and add it to that zone's `enemies` (or `bossEnemyId`). For **a new zone**, do every step.

## Steps

1. **EnemyID** — append the next value to `src/enums/ids/enemy-id.enum.ts:EnemyID`.

2. **Enemy data** — add to `src/data/enemies-data.ts:ENEMIES_DATA`: `id`, `maxHp`, `experience`, optional `weakness` (see `add-monster-weakness`), `enemyTypes` (each maps to a `damageVs<Type>` stat; a new `EnemyType` needs that stat too), `url: './assets/img/enemies/<enemyKey>.png'`, and `drops` built with `drop(itemId, min, max, chance)` (`chance` = 1 in N). Quest-only drops add `requiredActiveQuestId`. Keep HP and XP in line with the neighbouring zones.

3. **Pet and shiny** (recommended for regulars) — run `add-shiny-variant`.

4. **Name and sprite** — `enemies:names.<enemyKey>` in `src/assets/locales/en/enemies.json`; sprite via `/generate-2d-asset` (enemies use the `enemy-pixel` family; give the Size tier). Brief all enemies of one zone as one batch.

5. **ZoneID and zone data** — append to `src/enums/ids/zone-id.enum.ts:ZoneID`; add to `src/data/zones-data.ts:ZONES_DATA`: `id`, `url` (background), `enemies` (regulars only), `bossEnemyId`, `maxWave`, `enemiesPerWave`.

6. **How it unlocks** — pick one:
   - **Chain**: set `nextZoneId` on the previous zone and `previousZoneId` on the new one; killing the previous boss unlocks it. Add `ZONE_UNLOCK_NOTIFICATIONS[zone]` in `src/data/unlock-conditions.ts` with `unlocks:zones.<zoneKey>.title`/`.body` keys.
   - **Town entrance**: add a building with `zoneId` and `questRequirement` via `add-town-building`; starting that quest unlocks the zone.

7. **Map marker** (chain zones) — add a `zone` marker to `src/data/world-map-data.ts:WORLD_MAP_DATA` at the source-image pixel position (see `docs/systems/world-map.md`).

8. **Zone name and background** — `zones:names.<zoneKey>` in `src/assets/locales/en/zones.json`; background via `/generate-2d-asset` (`zone-pixel` family, 832×1248).

9. **Town or feature unlocked by this zone** (optional) — a `waveReached` rule in `UNLOCK_RULES`.

Done when `npm run validate` and `npx ng build` pass, and in the dev server the zone opens the way step 6 intends and its waves end in the boss.
