# Plan: codebase deepening 3

Refactors from the third 2026-11-08 architecture review, after `codebase-deepening` (PRs #126, #127). Each step gathers rules that are spread over several places into one module with a small interface, tested through that interface. One branch, `refactor/codebase-deepening-3`, one PR into `staging`, each step a commit (`/run-plan`). Code references are from `staging` at `08d0062`; re-check line numbers when a step starts.

Deferred to a later plan: **store actions return events, one notices module shows them** (the toast timer copied seven times, the currency feed built from caller snapshots, `ModalService` inside `PlayerStore`). Build it on the results Step 2 returns.

## Order

Step 1 first. Steps 2–5 are independent. Step 6 comes before Step 7, which saves Game time in a store listed in `SAVED_STORES`. Step 8 last.

### 1. Small bugs (S, Sonnet) ✅
- `services/quest-status.ts:101` `getQuestDropLimits` calls `getStepItems(questId, status.step)` without `orders`, so the quest drop cap ignores an Order's rolled items. Make `orders` a required parameter of `getStepItems` and pass it everywhere.
- `services/quest-status.ts:40` `isStepReady` reads `steps[status.step - 1].requirements` with no guard; a saved step past the quest's last step throws. Guard it like `getStepItems` does.
- `services/turn-in-cooldown.service.ts:28` `keysOf` skips Order keys, so an NPC's wait time never counts its Orders.
- dev-cheats `unlock('towns')` (`dev-cheats.component.ts:268`) skips `unlockMap`; route every dev unlock through `applyUnlockTarget`. `learnSkill` (`:272-300`) walks prerequisites itself; use the skill tree's rules (`canBuyNode`) instead.
- Dialogue "can select" lives in both `DialogueManagerService.selectOption` (`:131`) and `DialogueComponent.isOptionDisabled` (`dialogue.component.ts:195-201`); add `canSelect(option)` on the manager and use it in both.
- Delete `PlayerStore.updateZoneProgression` (`player.store.ts:393-403`, no callers).
- One spec per bug, where it can be tested. Changelog: `[bug]` for the drop cap and the Order wait time.
- Docs: `quests.md`, `dialogue.md` if they describe these.

### 2. Item grant (M-L, Opus) ✅
One module decides how items reach the player. Seeds go to the seed store, station gear installs, everything else must fit its inventory tab.
- Pure `grantItems(state, items, mode)` in `store/player/inventory.ts`, `mode: 'atomic' | 'lossy'`, returning the new state and `{ received, lost, installed, missing }`. **Atomic** changes nothing when anything doesn't fit and reports `missing`; **lossy** lands what fits and reports `lost`.
- `canGrant(items)` answers the same question without writing, for UI that greys out options. It replaces every `canFitItems` pre-check: `shop.store.ts:122` (keep the spellbook case as data, not a caller rule), `arena.service.ts:41`, `dialogue-manager.service.ts:117-121` (effect `cost.adds/removes`), zone star (`player.store.ts:593`), chest (`:778`), harvest (`:922-925`), `evaluateRecipe` (craft).
- `PlayerStore.grant(items, mode)` is the only writer. Delete `addItems`; `applyKillBatch` (`:607-661`) calls `grant(…, 'lossy')` and stops repeating the seed/station routing.
- Kills are lossy. Everything else is atomic, including quest completion (`quests.store.ts:101` `handleQuestCompleted`, which today calls `addItems` with no check). A quest whose rewards don't fit is refused, never paid partly.
- Specs: `grantItems` table spec (atomic refuse, lossy partial, seeds, station gear, tab placement, locked over-capacity tabs); one spec per caller that its refusal changes nothing; `quest-drop-cap.spec.ts`, `seed-routing.spec.ts`, `station-notice.spec.ts`, `chest.spec.ts` pass.
- Changelog: `[bug] Quest rewards are never lost to a full inventory.`
- Docs: `player-stats-inventory-equipment.md`, `quests.md`.

### 3. Spell bar (M, Opus) ✅
- **Known spells are derived from their sources** (skill nodes, used spell scrolls, equipped gear), like stats in ADR 0002, instead of per-source counts going up and down. A skill refund or respec no longer unequips a spell that a scroll or gear still teaches, and buy-max can't drift from refund.
- Pure `store/battle/spell-bar.ts`: `place(bar, spell, slot)` (swap, displace, cooldown lock), `remove(bar, spell)`, `prune(bar, known)`. One slot count, `SPELL_BAR_SLOTS`; delete `SPELL_SLOT_COUNT` (`battle-footer.component.ts:16`).
- `BattleStore` keeps the slots and calls the module. The footer (`:71-98`) keeps only the drag events. `BattleManagerService` (`:103-200`), `spellbook.component.ts:33-36`, `skill-tree.service.ts:51-55, 89-92, 143-146`, `item-use.service.ts:55` call it. The `PlayerStore` hook that removes gear spells (`player.store.ts:1077-1088`) becomes one effect: `prune(bar, knownSpells())`.
- Save: if the per-source counts are saved, derive them and drop the field with a migration (version bump, migration spec).
- Specs: `spell-bar.spec.ts` (each placement rule, the lock, prune); a spell taught by a scroll and a node survives the node's refund; `equipment-spells.spec.ts`, `weapon-spells.spec.ts` pass.
- Docs: `spells-and-buffs.md`, `skill-tree.md`.

### 4. Combat step (S, Sonnet) ✅
- Lift `GameIntervalService.advanceCombat` (`game-interval.service.ts:84-109`) into a pure `stepCombat(timers, deltaMs, timing) → { timers, spawn, attacks }`: the respawn delay (zone or arena), one attack per `timePerAttack` carrying leftover time, leftover lost on a kill, at most `MAX_ATTACKS_PER_TICK`. The service applies the result. Fold the constants of `combat-timing.ts` into it and delete that file if nothing else stays.
- The offline simulation keeps its own whole-kill loop: it differs in shape (segments, rate scaling, no ticks).
- Specs (first for the online loop): respawn, carried time, kill drops leftover, the cap, arena delay.
- Docs: `game-loop-and-combat.md`.

### 5. Task module (M, Sonnet) ✅
- Pure `store/player/tasks.ts`: `rollTask(ctx, rng)`, `acceptTask` (checks for a free slot, today only `ExplorationGuildService` does), `claimTasks`, `abandonTask`, `progressTasks(kills)`, guild rank and slot count. Move the type, `isTaskDone` and `TASKS_PER_GUILD_RANK` out of `player.store.ts:100-119`.
- State stays in the `PlayerStore` slice; the save shape doesn't change. `ExplorationGuildService` passes the rng; Kill resolution, dialogue handlers and `shop.store.ts:109` call the module.
- A kill counts for a task in any zone, as documented; `Task.zoneId` only sets the reward tier.
- Specs, seeded: roll, accept with a full slot refused, claim, abandon, progress with the Bounty Mark double kill, rank.
- Docs: `towns-shops-guild.md`.

### 6. Saved stores and the slot guard (S-M, Sonnet) ✅
- A declared `SAVED_STORES` list in `with-game-state-sync.hook.ts` replaces the registry that fills as stores are created (`:29`). Export, import and reset read it; `dev-cheats.component.ts:307-316` stops listing stores by hand, and `GameComponent` (`:68-76`) stops injecting stores only so they register.
- Spec: a store that uses the sync hook but is missing from `SAVED_STORES` fails.
- Spec pinning the total `inventorySlots` bonus (base `player.ts:43`, `rewards-items.data.ts:98`, `skill-tree-data.ts:112-170`), so lowering it fails a check. Add a row to the Enforced rules table in `AGENTS.md`.
- Fix `persistence.md:63`, which points at a `GameComponent.resetState` that doesn't exist.
- Docs: `persistence.md`.

### 7. Game time (L, Opus, plan mode) ✅
Rules stop reading the device clock. **Game time** only moves forward: online by the tick (its capped delta), offline by the claim, `min(OFFLINE_CAP_IN_MS, host gap)`.
- `GameClock` (`services/game-clock.service.ts`), a non-saved root service that injects only `OfflineStore`. Interface: `nowMs()` (exact, untracked, for rules), `second` (a signal that changes at most once per game second, for UI countdowns and computeds), `advance(ms)` (ignores `ms <= 0`), called only by `GameIntervalService.tick` (before combat) and the offline claim.
- **Saved as `gameMs` in `OfflineStore`, next to `lastSeenAt`**: `setLastSeen(at, gameMs)` writes both in one patch (one `localStorage` key), from `markSeen` and the claim, so they never disagree after a reload. The clock starts from `gameMs ?? lastSeenAt ?? 0`.
- **No migration or version bump.** A save without `gameMs` starts the clock at its `lastSeenAt`, so its device-clock timestamps (`lastTurnInAt`, farm `plantedAt`/`syncedAt`, `arenaReadyAt`, the run's `startedAt`/`endsAt`) are already on the game timeline and load unchanged.
- **Everything is bound by the offline cap**: the claim advances the clock by `advanceMs = min(cap, gap)`; kills get `advanceMs − arenaMs`, and `tickTimers(advanceMs)` runs buffs and consumables on the capped gap.
- Moved to game time: turn-in and Order cooldowns (`dialogue-effect-handlers.ts` `recordTurnIn` through a `clock` in the dialogue context, `quests.store.ts` cooldown checks and `completeOrder`), farm (`player.store.ts` `syncFarm` and the planting ctx), arena (`arena.service.ts` defaults and `tick`). The arena rule stays: a run whose remaining game time (`endsAt − nowMs`) is within `advanceMs` ends at its own end time and the rest is claimed in the zone it was entered from.
- The 1 s `now` signals and their `setInterval`s (`farm-plots.component.ts`, `notification-bar.component.ts`, `arena.service.ts`, `turn-in-cooldown.service.ts` with its `tick`) read `second`.
- The host time stays as it is: `lastSeenAt` and the claim gap come from the host's `Date` header; `Date.now()` in the tick is only the sleep detector.
- **Date.now allowlist**: check 16 in `scripts/validate-data.mjs` fails on `Date.now(` in `src` (specs excluded) outside `currency-feed.service.ts`, `exploration-guild.service.ts` (task id), `dev-stub.ts` and `game-interval.service.ts` (sleep detector). Row in Enforced rules in `AGENTS.md`.
- Specs: `game-clock.service.spec.ts` (start from `gameMs`/`lastSeenAt`/0, advance and `second`, negative advance, `markSeen` writes both; an old save without `gameMs` loads every cooldown and plot unchanged; a 48 h claim moves crops, a cooldown and the arena wait by 24 h only; a `Date.now` moved 3 h changes nothing while `advance` does); `arena.service.spec.ts` (a run with 1 min left ends at its end time, kills cover the rest of the capped gap); specs that relied on `Date.now()` drive `GameClock.advance`.
- Changelog: `[feature] Changed how the in-game time is calculated.`
- Docs: `offline-progress.md`, `farming.md`, `arena.md`, `quests.md`, `persistence.md`; **Game time** in `GLOSSARY.md` is `GameClock`.

### 8. Wrap-up (S)
- Re-read the system doc each step touched against the final code.
- Run `/blast-radius` on the whole branch (stores, save shape, migrations and timing are touched).
- Run `verify-yari` for Steps 2, 3 and 7 (full-inventory quest turn-in, spell bar drag and refund, farm and cooldown countdowns after a reload) and put the evidence path in the PR body.
