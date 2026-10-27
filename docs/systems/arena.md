# Combat Arena

## Purpose
A timed gauntlet in Lirold: 20 fixed Waves against one clock, for a gold fee. Clearing it pays the Molten Cape every time and 2 Skill Point Books the first time. It doesn't scale with the player. Design and later batches (boss abilities, the Arena Chest): `docs/ideas/combat-arena.md`.

## Key files
- `src/data/arena-data.ts:ARENA`: fee, time limit, respawn delay, the 20 waves (enemy pool and kill count each), clear rewards, background.
- `src/app/services/arena.service.ts`: `enter`, `onKill`, `tick`, `leave`, `claimRewards`; how a run ends (`finish`) and the result modal.
- `src/app/store/battle/battle.store.ts`: saved `arenaRun`, `arenaClears`, `arenaBestTimeMs`, `arenaRewards`; `startArenaRun`, `recordArenaKill`, `endArenaRun`; `startBattle` and `enemy` read the run.
- `src/app/components/modals/arena-result/`: the result modal with the Claim button.
- `src/data/dialogues/liroldTown/liroldArenaMaster.ts`: the Arena Master, who takes the fee and starts runs (`arena` effect and condition, `dialogue.md`).
- Arena enemies: `EnemyID.arenaBrute`, `arenaArcanist`, `arenaBurrower`, `arenaYad` in `enemies-data.ts` (no drops, never in a Zone).

## Data flow
1. **Enter**: the Arena Master's fight option deducts `ARENA.entryFee` (blocked when the player can't afford it), then the `arena` `enter` effect calls `ArenaService.enter`: `BattleStore.startArenaRun(now)` drops the zone fight and the game switches to the Battle tab.
2. **Fight**: while `arenaRun` is set, `startBattle` picks from the current arena wave's pool (no shinies), `enemy` skips wave scaling, the respawn delay is `ARENA.respawnDelayMs` (0.5 s) and the battle panel shows the arena background, wave, kills, countdown and a Leave button. Wave arrows are hidden, and `setZone`/`changeWave` do nothing, so the map, town entrances and dev cheats can't move the fight.
3. **Kill**: `handleEnemyDeath` hands arena kills to `ArenaService.onKill`: XP and gold (`× xpMultiplier` / `goldCoinsMultiplier`, no wave or shiny multiplier), no drops, Zone progress, kill counts, tasks or offline kill rate. `recordArenaKill` moves to the next wave once the wave's `count` is reached; past wave 20 the run is cleared.
4. **End**: cleared, `timeout` (`tick` sees `now >= endsAt`) or `left` (Leave). `endArenaRun` clears the run (the zone fight respawns where the player left it); a clear counts in `arenaClears`, may set `arenaBestTimeMs`, and adds the clear rewards (plus the first-clear books) to `arenaRewards`. The result modal shows time, kills, XP, gold and the rewards.
5. **Claim**: the modal's Claim, or the Arena Master's claim option (`arena` `claim` effect), moves `arenaRewards` into the inventory, only when all of it fits (owner rule). Rewards wait, saved, until then.

## Invariants & gotchas
- **The clock is wall time** (`Date.now()`), saved as `startedAt`/`endsAt`, so it runs while the game is closed and a run that expired offline ends on the first tick back (owner decision). A changed system clock moves it too.
- **No offline progress for an arena run**: `OfflineProgressService.claim` skips the simulation while `arenaRun` is set, so the time away earns no Zone kills (owner decision). Spell and buff timers still run out.
- `currentZoneId`/`currentWave` stay the Zone the player came from during a run; code that reads them for rewards must check `arenaRun` first.
- A Leave or timeout keeps the XP and gold already paid per kill; the fee is never refunded.

## How to extend
- Retune: edit `ARENA` and the arena enemies' `maxHp`/`experience`/`gold`. Sized for a player just past the Harpy Matriarch; check run time against the bosses' mechanics once they exist.
- A boss ability (batch 3) belongs with the arena enemy; the run state lives on `arenaRun`.
