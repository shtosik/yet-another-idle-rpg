# Offline progress

**Scope:** M · **Status:** Accepted (2026-10-23)

On load, simulate the time since the last save as kills in the current zone and wave, at a fraction of the player's kill rate, capped at 24 h. Show a "welcome back" modal with an XP / gold / loot / kills summary.

## Why
Biggest gap for an idle game (repo audit 2.8: no wall-clock delta).

## Decisions (owner, 2026-10-23)

### Cap and rate
- **Cap: 24 h** of elapsed time per claim (constant).
- **Offline rate is a `PlayerStat`** (`offlineProgressRate`, base 0.5). Skill nodes, buildings or gear raise it later; it goes into the `stats` computed like every other source (ADR 0002).
- Kill rate = the player's online kill rate at the current wave (attack speed, damage vs the wave's enemies, respawn delay) × `offlineProgressRate`. To stop gear swaps before closing the tab, use `min(theoretical rate from current stats, rolling average of recent online kills)`.

### What is simulated
- **Everything is rolled per kill**, the same way an online kill is: XP, gold, item drops, recipe scrolls, quest drops, shinies and pet drops. No expected-value shortcut.
- **Auto wave progression is off while offline.** The player keeps farming the wave they left on. Zone unlocks from a boss kill still apply if they left on the boss wave.
- **Kills count everywhere an online kill counts:** zone kill counts, quest kill steps, bestiary and Exploration Guild tasks. Quest turn-ins stay manual.
- A full inventory drops loot as it does online (owner decision). The modal shows how many drops were lost.

### Buffs
- **Consumable buffs and slot locks tick down offline.** The rate is computed in segments: with a buff until it expires, without it after. Spell buffs expire the same way.
- **Auto-eat doesn't run offline.** Re-eating food offline is a future unlock (skill node or similar); until then a buff that expires offline stays expired.

### Spells
- No spells are cast offline: the offline rate is auto-attack damage only, and mana isn't spent. There's no auto-cast yet; when it's added it is an upgrade, and casting offline is a further upgrade on top of it.

### Background tab
- No offline path needed for a hidden tab: the game loop uses `worker-timers`, which browser timer throttling doesn't affect.
- A **sleeping device** still loses time: `MAX_TICK_DELTA_IN_MS` (1 s) in `game-interval.service.ts` drops any longer gap. A tick delta above a threshold (e.g. 60 s) should run the same offline claim instead of being clamped away.

## Anti-cheat

There's no server, so cheating can't be prevented, only made not worth it. The game is single player with no leaderboard, trading or payments, so a cheater only spoils their own game. Rules:
- **Protect the clock and the save to the same level.** The save is plain JSON in `localStorage` and `withDevtools` runs in prod, so editing gold takes seconds. Clock checks stronger than that gain nothing.
- **Never wipe or punish on a failed check.** A bug would hit honest players. At most skip the offline claim.

| Vector | Fix |
|---|---|
| Clock moved forward | Read time from the host: `fetch(location.origin, { method: 'HEAD', cache: 'no-store' })` and parse the response's `Date` header. No game server or third-party API needed. If the fetch fails, keep the claim **pending** until it succeeds; don't fall back to the local clock. |
| Clock moved back, then forward (double count) | High-water mark: `lastSeen = max(lastSeen, now)`; a negative delta claims 0. |
| Clock changed mid-session | Compare the change in `Date.now()` with the change in `performance.now()` (monotonic); ignore the gap if they diverge. |
| Reload to reroll offline loot | Seed the offline RNG from `lastSeen`, and save rewards plus the new `lastSeen` immediately (skip the 1 s batch) before opening the modal. |
| Save editing | Sanity-clamp values on load (also fixes `NaN`/`null` saves; fits the planned save version and migration step). Optional: compress the save (lz-string). Remove `withDevtools` from prod builds. A checksum with a key in the bundle isn't worth it. |

## Performance
24 h at a fast kill rate is 100k+ kills. Calling `processBattleEnd` per kill means 100k+ `patchState` calls. Instead, run the simulation as a pure function over accumulators (XP, gold, item counts, kill counts per enemy, shiny count, task and quest progress) and apply the result in one batched store update. Level-ups during the claim don't change the rate (stats are read once at the start).

## Open questions
- Hosting isn't chosen yet. The `Date` header check works on any HTTP server (the `ng serve` dev server sends it too), so it can be built now. Pick a host that sends `Date` (GitHub Pages, Netlify and Vercel all do), and recheck the header there before release.

## Touch-points
- `lastSeen` (high-water mark) saved via `with-game-state-sync.hook.ts`, written immediately on claim.
- `offlineProgressRate` in `src/types/player/player-stat.type.ts` and the `PlayerStore.stats` computed.
- Kill-rate calculator from current stats and the wave's enemy pool; rolling online kill-rate tracker in `BattleManagerService`.
- Batched kill simulation reusing `calculateEnemyDrops` and the kill/task/quest counters behind `PlayerStore.processBattleEnd`.
- Sleep-gap hook in `GameIntervalService.tick`.
- "Welcome back" modal via `ModalService`.
- Update `docs/systems/persistence.md` and `docs/systems/game-loop-and-combat.md` when implemented.
