# Combat Arena

## Purpose
A timed gauntlet in Lirold: 20 fixed Waves against one clock, for a gold fee. Clearing it pays the Molten Cape and an Arena Chest every time, and 2 Skill Point Books the first time. The fee is 10,000 gold. It doesn't scale with the player. Design and later batches (boss abilities, the Arena Chest): `docs/ideas/combat-arena.md`.

## Key files
- `src/data/arena-data.ts:ARENA`: fee, time limit, respawn delay, the 20 waves (enemy pool and kill count each), clear rewards, background.
- `src/app/services/arena-bosses.service.ts` and `ARENA_BOSSES` in `arena-data.ts`: the champions' abilities.
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

## Entry cooldown, drops and the chest
- **Cooldown**: 30 minutes from one entry to the next (`ARENA.entryCooldownMs`, saved `arenaReadyAt`, owner decision). `ArenaService.isReady` gates `enter`; Ludo's fight option falls back to a "come back later" node.
- **Champion pets**: in the Arena Chest only (owner decision), about 1 in 47 per chest for each of the four; never shiny, since the arena rolls no shinies.
- **Arena Chest** (every clear): 4 picks, and opening needs 4 empty slots (one per pick, the most new stacks it can give); gold 3,000–6,000, Elder Silk, Harpy Feathers, Ancient Wood, mana potions, runes, the Hunter's Feast recipe, and two rare chest-only rewards: the War Cry Scroll (buff spell, +25% melee damage for 15 s) and Patron's Gloves (+10% gold and XP; a drops-and-progress choice against power gloves). Sized so a clear pays more than the fee.

## Champions' abilities
`ArenaService.tick` runs `ArenaBossesService.tick` every game tick; a champion fight starts its timers when the champion is first seen alive. `doDamage` skips a hit on a burrowed champion and passes every other arena hit through `modifyHit` (after `resolveHit`). Numbers live in `ARENA_BOSSES`.
- **The Brute** (wave 5): a weak point shows on the sprite 5 s in, for 3 s; clicking it gives +50% damage for 10 s. The next one comes 30 s after it was clicked or expired.
- **The Arcanist** (wave 10): each magic hit (spells and damage-over-time ticks; staff auto-attacks are physical and don't count) takes 0.2 s of run time per damage point, at most 5 s per hit and 60 s per fight (`BattleStore.shortenArenaRun`). The nav bar shows the time lost.
- **The Burrower** (wave 15): every 20 s it burrows and 3 mounds show, the right one shaking (a yellow ring with reduced motion). The right pick within 4 s stuns it (+50% damage taken for 5 s); a wrong pick or none heals it 10% of max HP. While burrowed nothing hits it, but the fight goes on, so a damage-over-time spell's ticks are spent (owner decision).
- **Yad** (wave 20): every 5–10 s after the last shield broke, a shield of fire, air or water (never the same twice running), shown as a coloured aura and a label. While it's up, hits of any other element land 0 (an Ambush crit too, and it uses its charge); the first hit of the shield's element hurts Yad and breaks the shield (owner decision: any one hit, no threshold).
- Timers aren't saved: a reload mid-fight restarts the champion's timers (and the Arcanist's per-fight cap).

## Invariants & gotchas
- **The clock is wall time** (`Date.now()`), saved as `startedAt`/`endsAt`, so it runs while the game is closed and a run that expired offline ends on the first tick back (owner decision). A changed system clock moves it too.
- **Offline**: a run that ran out while away ends as a timeout at its `endsAt`, and the rest of the absence is claimed as normal offline progress in the Zone the player entered from (`currentZoneId`/`currentWave` stay on it during a run; owner decision: no lost progress). A claim while the run is still going earns nothing. Spell and buff timers still run out.
- `currentZoneId`/`currentWave` stay the Zone the player came from during a run; code that reads them for rewards must check `arenaRun` first.
- A Leave or timeout keeps the XP and gold already paid per kill; the fee is never refunded.

## How to extend
- Retune: edit `ARENA` and the arena enemies' `maxHp`/`experience`/`gold`. Sized for a player just past the Harpy Matriarch; check run time against the bosses' mechanics once they exist.
- A new champion ability: a case in `ArenaBossesService.tick` (and `modifyHit` if it changes hits), its numbers in `ARENA_BOSSES`, its overlay in `enemy.component.html`.
