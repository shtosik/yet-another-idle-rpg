# Game loop and combat

## Purpose
The idle core: a 100 ms tick that advances the game by the real time elapsed, auto-attacks the current enemy, spawns the next one after a respawn delay, regenerates mana and ticks spell and consumable timers. Enemies never hit back; there is no player HP.

## Key files
- `src/app/services/game-interval.service.ts:GameIntervalService` — the tick, attack and respawn timers. Uses `worker-timers` so the loop keeps running in background tabs.
- `src/app/services/combat-step.ts` — `stepCombat` (pure online timer math: respawn, attack carry, kill drops leftover, `MAX_ATTACKS_PER_TICK`; `spawn` and `attack` callbacks are the seam to the stores) plus `TICK_DURATION_IN_MS`, `RESPAWN_DELAY_IN_MS`, `timePerAttackMs` (shared with the offline simulation, which keeps its own whole-kill loop).
- `src/app/services/battle-manager.service.ts:BattleManagerService` — `doDamage`, `castSpell`, `useConsumable`, `tickSpells`, `tickConsumables`, enemy death, zone and feature unlock checks.
- `src/app/services/hit-resolution.ts:resolveHit` — pure damage formula (crit, weakness, damage-vs-type). Takes an `rng` for testing.
- `src/app/store/battle/battle.store.ts:BattleStore` — current zone, wave, enemy, HP, spells, buffs, consumable slots.
- `src/app/services/kill-resolution.service.ts:resolveKills` — Kill resolution: XP, gold, drops, kill counters, task progress, zone progress and the next-zone unlock, for online kills (a batch of one) and offline claims alike; rolled by `rollKill` / `rollKills` (`store/player/kill-rewards.ts`) and written only by `PlayerStore.applyKillBatch`. Drops lost to a full inventory tab raise a toast (see `player-stats-inventory-equipment.md`). Arena kills are paid separately (ADR 0003).

## Data flow
Every tick (`TICK_DURATION_IN_MS` = 100) measures the real time since the last tick with `performance.now()`, capped at `MAX_TICK_DELTA_IN_MS` (1 s), and advances everything by that delta. A gap over `SLEEP_GAP_IN_MS` (60 s, on `performance.now()` or `Date.now()`) is a sleeping device: the tick skips it and starts an offline claim instead (`offline-progress.md`).
1. **Combat** (`stepCombat`, applied by `GameIntervalService.advanceCombat`):
   - No enemy: the respawn timer runs. After `RESPAWN_DELAY_IN_MS` (2 s) an enemy **spawns** (`BattleStore.startBattle`); leftover time goes to the attack timer.
   - Enemy alive: the attack timer runs. Each time it passes `stats.attackSpeed × 1000` the player **attacks** (`doDamage`) and the overshoot carries over. At most `MAX_ATTACKS_PER_TICK` (10) attacks per tick.
   - A kill drops leftover attack time; the respawn delay starts at the kill.
2. `PlayerStore.regenMana(delta)`.
3. `tickSpells(delta)`: spell cooldowns and buffs count down in ms.
4. `tickDamageOverTime(delta)`: while an enemy is alive, running damage-over-time spells advance hit by hit and each hit is a `doDamage`; a kill stops their clock there (`spells-and-buffs.md`).
5. For each full second elapsed: consumable slots tick, auto-eat runs, shop timers tick, `lastSeenAt` is marked.

The attack, respawn and second timers are plain fields on `GameIntervalService`, not saved; a reload costs at most one attack interval or respawn.

Spawning (`startBattle(shinyChance)`, through `rollSpawn` in `store/battle/waves.ts`, which the offline claim also uses): a random enemy from `zone.enemies`, or `zone.bossEnemyId` on the last wave. A shiny roll uses `stats.shinyChance` (percent).

Enemy death (`handleEnemyDeath`):
1. `endBattle`, record the kill interval for the offline rate, then `KillResolutionService.resolveKills` with one kill (rewards from `kill-rewards.ts`): XP `ceil(experience × xpMultiplier × waveReward)` and gold `ceil(gold × goldCoinsMultiplier × waveReward)` (a shiny uses ×5 XP / ×10 gold instead of `waveReward`, see `zones-waves-unlocks.md`), drop rolls (10 if shiny), wave kill count, enemy kill count, task progress (Bounty Mark rolled with the same rng), and on the boss wave the next zone (`UnlockService.grant`).
2. Killing the boss on the last wave unlocks `zone.nextZoneId` (+ notification from `ZONE_UNLOCK_NOTIFICATIONS`).
3. `UNLOCK_RULES` are checked (towns and features, see `zones-waves-unlocks.md`).
4. With auto wave progression on and the wave's kill count met, move to the next wave.

Damage (`resolveHit`), in order, kept fractional throughout:
1. Base: `attackPower` (melee hits `× meleeDamageMultiplier`, ranged hits `× rangedDamageMultiplier`), or for magic `(spellDamage + magicDamage) × magicDamageMultiplier`.
2. Crit: `critChance` percent, `× critMulti`. Spells crit only with the `spellCrit` node.
3. Weakness: if the `weaknesses` node is unlocked and the hit's element matches the enemy's weakness, `× extra<Element>DamageMultiplier`.
4. Damage vs type: `× (1 + sum of damageVs<Type>)` over the enemy's `enemyTypes`.
5. Rounded once: `max(1, round(damage))`.

## Battle panel presentation
- The panel stays in the left game-grid column across both rows. The zone (or arena) background is a Scene (`docs/systems/scene.md`) spanning the whole panel: shown whole at 1:2, centred, over a blurred Scene fill. The header, fight space and footer lie over it; effects and task lists scroll within their sections when needed.
- The enemy sprite stands in `ENEMY_SPRITE_AREA` on the Scene and scales with it (a half-size sprite at 1536 wide). The enemy name sits over a compact HP meter at a fixed size, pinned to the top of the fight space under the header (`app-enemy`; the sprite is `app-enemy-sprite`), centred and clear of the right-hand controls, with numeric current/max HP and an accessible progress label. On the enemy, only the arena buttons and the weakness chips (for their hints) take the pointer. Boss waves and shinies have explicit badges. Enemies have no level field and the player has no HP meter.
- Spawns fade and rise into place; positive-damage events briefly recoil the sprite. Damage popups stack at a fixed point in the fight space, with separate Crit and Strong labels; they never intercept clicks on arena targets or controls. Reduced motion removes recoil and spawn motion and uses a simple popup fade.
- Between fights, a pulsing gold marker and “Next enemy incoming…” label represent the existing respawn delay. No attack or respawn timing changes.
- Weaknesses keep their skill gate and show one shared “Weak to” prefix followed by element-colored icon/name chips with hints. Chips wrap within the available width; the combat model still supplies one weakness per enemy. Arena shield, damage-boost and stun messages remain separate from weaknesses; there is no generic enemy debuff collection.

## Invariants & gotchas
- **`attackSpeed` is seconds per attack.** Lower is faster. Positive amounts in data lower it (inverted in `deriveStats`), so "+0.3 attack speed" makes attacks faster. Attack time never drops below one tick (100 ms).
- **Respawn delay is fixed at 2 s** (0.5 s in an arena run, `arena.md`) and independent of `attackSpeed`. The first attack on a new enemy lands one full attack interval after it spawns.
- Changing wave or zone clears the enemy; the next one spawns after the respawn delay.
- Buff and consumable durations in data are **seconds**; buffs and spell cooldowns count down in ms at runtime, consumables in whole seconds. `manaRegenRate` and `shopRefreshCooldown` are in **ms**.
- Of the current enemy, `BattleState` saves only `enemyId`, `isShinyEnemy` and `currentEnemyHp`; the computed `BattleStore.enemy` rebuilds it from `ENEMIES_DATA` with the wave-scaled max HP and shiny sprite, so data edits apply to a saved fight. On load, a fight whose `enemyId` no longer exists in the data is ended (`enemy` is `null`; combat would stall otherwise), and HP above the rebuilt max HP is clamped.
- In an arena run, `doDamage` skips hits on a burrowed champion and passes the rest through `ArenaBossesService.modifyHit` (shields, bonuses, the Arcanist's toll; `arena.md`).
- The weapon's `damageType` sets the auto-attack element (`PlayerStore.equippedWeaponDamageType`, default physical).
- The weapon's `weaponCategory` (`WeaponCategory`: melee, ranged or magic; unset or no weapon = melee, `PlayerStore.equippedWeaponCategory`) decides if an auto-attack (or weapon spell) is a **melee hit** (`meleeDamageMultiplier`) or a **ranged hit** (`rangedDamageMultiplier`); magic spells use neither. Double Attack requires an equipped melee weapon and resolves two separate hits; Volley requires a ranged weapon and resolves three. Both stop on death, with no carry-over to another enemy. Ranged and magic-weapon (staff, wand) auto-attacks use plain `attackPower`, not `magicDamage` (owner decision).
- Stats are derived from their sources (equipment, nodes, buffs, consumables), see `player-stats-inventory-equipment.md`.

## Known issues
- No fail state: auto wave progression can stall forever on a boss the player can't kill.

## How to extend
Elemental weaknesses and damage types: the `add-monster-weakness` skill. New enemies or zones: `add-enemy-and-zone`. New spells: `spells-and-buffs.md`. Overkill (shorter or no respawn delay): `skill-tree.md`.
