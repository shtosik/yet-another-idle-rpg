# Game loop and combat

## Purpose
The idle core: a fixed 100 ms tick that auto-attacks the current enemy, spawns the next one, regenerates mana and ticks spell and consumable timers. Enemies never hit back; there is no player HP.

## Key files
- `src/app/services/game-interval.service.ts:GameIntervalService` — the tick. Uses `worker-timers` so the loop keeps running in background tabs.
- `src/app/services/battle-manager.service.ts:BattleManagerService` — `doDamage`, `castSpell`, `useConsumable`, `tickSpells`, enemy death, zone and feature unlock checks.
- `src/app/services/hit-resolution.ts:resolveHit` — pure damage formula (crit, double attack, weakness, damage-vs-type). Takes an `rng` for testing.
- `src/app/store/battle/battle.store.ts:BattleStore` — current zone, wave, enemy, HP, attack timer, spells, buffs, consumable slots.
- `src/app/store/player/player.store.ts:processBattleEnd` — XP, gold, drops, kill counters, task progress.

## Data flow
Every tick (`TICK_DURATION_IN_MS` = 100):
1. `attackTimer += 100`. When it reaches `stats.attackSpeed * 1000`: reset it, then **spawn** an enemy if none is alive (`BattleStore.startBattle`), otherwise **attack** (`BattleManagerService.doDamage`).
2. `PlayerStore.regenMana(100)`.
3. Once per second: spell cooldowns and buffs tick (`tickSpells`), consumable slots tick, auto-eat runs, shop timers tick.

Spawning (`startBattle`): a random enemy from `zone.enemies`, or `zone.bossEnemyId` on the last wave. A shiny roll uses `stats.shinyChance` (percent).

Enemy death (`handleEnemyDeath`):
1. `endBattle`, then `processBattleEnd`: XP `experience × xpMultiplier` (×5 if shiny), 1 gold (×10 if shiny), drop rolls (10 if shiny), wave kill count, enemy kill count, task progress.
2. Killing the boss on the last wave unlocks `zone.nextZoneId` (+ notification from `ZONE_UNLOCK_NOTIFICATIONS`).
3. `UNLOCK_RULES` are checked (towns and features, see `zones-waves-unlocks.md`).
4. With auto wave progression on and the wave's kill count met, move to the next wave.

Damage (`resolveHit`), in order:
1. Base: `attackPower`, or for magic `ceil((spellDamage + magicDamage) × magicDamageMultiplier)`.
2. Crit: `critChance` percent, `× critMulti`. Spells crit only with the `spellCrit` node.
3. Double attack spell: `× 2`.
4. Weakness: if the `weaknesses` node is unlocked and the hit's element matches the enemy's weakness, `× extra<Element>DamageMultiplier`.
5. Damage vs type: `× (1 + sum of damageVs<Type>)` over the enemy's `enemyTypes`.

## Invariants & gotchas
- **`attackSpeed` is seconds per attack.** Lower is faster. `updatePlayerStats` subtracts positive amounts for `attackSpeed`, `manaRegenRate` and `shopRefreshCooldown`, so "+0.3 attack speed" in data makes attacks faster.
- **Spawning costs one full attack interval.** After a kill, the next enemy appears on the next attack tick, not immediately. (The planned Overkill node changes this, see `skill-tree.md`.)
- Buff and consumable durations are in **seconds** (they tick once per second); `manaRegenRate` and `shopRefreshCooldown` are in **ms**.
- `BattleState.enemy` stores a full copy of the enemy data, and it is saved. After editing `ENEMIES_DATA`, the enemy alive in a save keeps the old values until it dies.
- The weapon's `damageType` sets the auto-attack element (`PlayerStore.equippedWeaponDamageType`, default physical).
- Stats are applied by mutating persisted `stats` (`+=` on gain, `-=` on expiry), not derived. See `player-stats-inventory-equipment.md`.

## Known issues
- `goldCoinsMultiplier` is never applied: every kill gives a flat 1 gold (×10 shiny), even though items and food grant the stat.
- Every tick writes to `BattleStore` (attack timer) and usually `PlayerStore` (mana regen timer), so both stores are serialized to `localStorage` 10 times a second, and every `stats()` reader re-runs at 10 Hz.
- Respawn downtime: spawning waits a full attack interval, roughly halving kill rate; spells can't be cast meanwhile.
- No offline progress and no wall-clock delta: the loop adds a fixed 100 ms per tick, so throttled or sleeping tabs make no progress.
- Attack overshoot is dropped (timer resets to 0), so the real interval rounds up to the next 100 ms.
- `Math.ceil` at each step inflates small hits (1 damage × 1.2 crit = 2).
- `castSpell` has no guards of its own (cooldown, enemy alive); they live only in the UI.
- No fail state: auto wave progression can stall forever on a boss the player can't kill.

## How to extend
Elemental weaknesses and damage types: the `add-monster-weakness` skill. New enemies or zones: `add-enemy-and-zone`. New spells: `spells-and-buffs.md`.
