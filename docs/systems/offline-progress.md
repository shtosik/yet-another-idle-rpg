# Offline progress

## Purpose
Pays for time the game wasn't running (tab closed, device asleep) as kills on the wave the player left on, at a fraction of their online kill rate, capped at 24 h per claim. A "welcome back" modal shows the result. Design and owner decisions: `docs/ideas/offline-progress.md`.

## Key files
- `src/app/services/offline-progress.service.ts:OfflineProgressService` — host clock, `claim`, buff segments, applying the result, `OFFLINE_CAP_IN_MS` (24 h), `MIN_OFFLINE_CLAIM_IN_MS` (60 s).
- `src/app/services/offline-simulation.ts:simulateOfflineKills` — pure kill-by-kill simulation over accumulators; `theoreticalKillMs`, `seededRng`.
- `src/app/store/offline/offline.store.ts:OfflineStore` — `lastSeenAt` (high-water mark) and the rolling window of online kill intervals.
- `src/app/store/player/kill-rewards.ts` — `killReward` and `rollEnemyDrops`, shared by online kills (`processBattleEnd`) and the simulation.
- `src/app/store/player/player.store.ts:applyKillBatch` — applies the totals in one state update; `statsFor` gives stats for a given set of buffs.
- `src/app/components/modals/welcome-back/` — the modal (`ModalService.openWelcomeBack`).

## Data flow
1. **Host time.** `claim` reads the time from the `Date` header of `HEAD location.origin` (no local clock). While the request fails the claim stays pending and retries every 30 s; nothing is claimed from the local clock. After an answer, session time is that host time plus `performance.now()` since, so changing the local clock mid-session has no effect.
2. **Marking time.** Once a tick-second, `markSeen` writes the session time to `lastSeenAt` (never backwards). It does nothing while a claim is pending.
3. **Claim.** The claim ends where it started waiting for the host (`pendingSincePerf`), not when the host answers: the game plays online while it waits, so that time isn't paid twice. `elapsed = min(24 h, claimEnd − lastSeenAt)`; a negative gap claims nothing; under 60 s isn't simulated. `lastSeenAt` moves to `hostNow`.
4. **Segments.** The claim is split where a spell buff or consumable effect runs out; each segment gets `PlayerStore.statsFor(active buffs, active consumables)`.
5. **Simulation** (`simulateOfflineKills`), on the current zone and wave only (auto wave progression is off offline), with an RNG seeded from the old `lastSeenAt`:
   - Per kill: random enemy from the wave pool (boss on the boss wave), shiny roll, auto-attack hits rolled with `resolveHit` (no spells, no mana) until it dies, XP / gold / drops rolled as online (bestiary rank drop bonus at the ranks from the claim start, `enemyKillCounts` input), task counts (Bounty Mark double included) for enemies with an unfinished task.
   - Quest-only drops use the current step's missing item counts at claim start (`getQuestDropLimits`), less drops already accumulated across the claim; they stop at the needed amount (see `quests.md`).
   - Kill time = (respawn delay + hits × attack time) × slowdown ÷ `offlineProgressRate`. A segment with a rate of 0 is skipped.
   - Slowdown = `max(1, rolling online ms per kill ÷ theoretical ms per kill)`: the offline rate is never faster than what the player actually achieved recently. With fewer than 5 samples the theoretical rate is used alone.
6. **Apply.** After the simulation, spell timers and consumable effects / slot locks tick down by the whole gap, even one under 60 s (auto-eat doesn't run). A claimed gap (60 s or more) also ends a running damage-over-time spell; a shorter one (a reload) leaves it paused. `applyKillBatch` adds XP (with level-ups), gold, wave and enemy kill counts (which drive quest kill steps and the bestiary), task progress and drops; drops that don't fit are lost and counted; the modal shows only the drops that landed. Drop stacks and receipts use `id + tier + upgradeLevel` (missing level is +0); upgraded receipts show their level in the slot and tooltip. A boss kill unlocks the next zone (`BattleManagerService.unlockNextZone`); town and feature unlocks follow from the new state through `UnlockService`.
7. **Save, then modal.** `saveGameStateNow` writes every store immediately, then the modal opens (only if anything was killed).

Sleeping device: a tick whose `performance.now()` or `Date.now()` gap exceeds 60 s isn't simulated by the tick; it calls `onSleepGap`, which drops the host anchor and runs a claim.

Rolling rate: every online kill calls `OfflineStore.recordKill(performance.now(), zoneId, wave)`. The window holds the last 20 intervals on one zone and wave, and a kill on another wave starts a new window: another wave's rate says nothing about this one. Intervals over 60 s (pauses, sleep) and the first kill after a load or wave change are ignored. A claim uses the window only if it matches the current wave.

## Invariants & gotchas
- **`offlineProgressRate` is a `PlayerStat`** (base 0.5). New sources go into `PlayerStore.stats` like any stat (ADR 0002).
- **Same seed on reload.** A reload before the save lands replays the same rolls, so rerolling offline loot by reloading gains nothing.
- **Seeds:** seed drops are counted in `farm.seeds` (never the inventory, never lost). Once the farm is unlocked (`isFarmUnlocked`), `applyKillBatch` lists them in the receipt's `receivedItems` and the welcome-back modal shows them like any drop; before the unlock they are counted silently. See `farming.md`.
- **Pathfinder's Seal:** segment stats carry the permanent `upgradedDropChance` bonus. Shared `rollEnemyDrops` / `rollDropList` uses the same seeded RNG for each eligible gear copy's +1 roll (10% after registration), never for unique gear, pets or non-equipment. Mixed +0/+1 copies accumulate and land as separate stacks, preserving their levels in receipts.
- Stats are read per segment at claim start; level-ups during the claim don't change the rate.
- The enemy alive when the page closed is untouched; the simulation starts from fresh spawns.
- Shop refresh timers and mana regen don't advance offline.
- **Arena runs**: a run that ran out while away is ended at its `endsAt` first, and only the time after it is simulated, in the Zone the player entered the arena from; a claim during a run still going simulates nothing (`arena.md`).
- Testing (dev build, plain JSON saves): subtract time from `state.lastSeenAt` in `localStorage.offlineStore` (saves are `{ v, state }`) and reload in the same script (the 1 s save would overwrite it otherwise). A plain JSON save also loads in a prod build.

## Known issues
- The host's `Date` header has 1 s resolution and ignores request latency; fine for minutes-to-hours claims.
- Hosting isn't chosen yet: recheck that the production host sends `Date` before release.
