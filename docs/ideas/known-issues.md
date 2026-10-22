# Known issues

**Status:** Open · collected 2026-10-21 during the AI docs overhaul (from code reading and the October repo audit). Per-system details also live in each doc's "Known issues" section under `docs/systems/`.

## Quests and dialogue
1–11 fixed 2026-10-22 (`fix/quest-dialogue`): in-progress branches, hub order, start gating, store guards, step kill baselines, turn-ins consume `QUEST_DATA` step items, one result resolver, `many*` labels, dead ends, `started` filter.

## Owner decisions not enforced yet
12. Gold can go negative via dialogue fees (Bartender, Josh); the Bartender charges 40 gold each time the Meat Shortage offer is opened.
13. Full inventory destroys items on unequip, quest item rewards, and dialogue `give` effects.
14. Buying the Spellbook is blocked on a full inventory although it never enters the inventory.

## Economy and progression
15. `goldCoinsMultiplier` is never applied (flat 1 gold per kill); the `goldGain` node grants `goldCoins` instead of the multiplier.
16. Skill tree: ctrl-click buying a cost-0 node with 0 points saves `NaN`; `manaRegen` node is negligible (−2 ms on 30 000 ms); auto wave progression survives refund/respec.
17. Unlock rules run only on kills; `waveReached` uses `==` on load and `>=` at runtime.
18. `explorerTokens` and `totalTasksCompleted` are never spent or read; Marvin promises unlocks every 5 tasks.
19. Balance: shop prices far above income; XP curve uses the cumulative formula as a per-level delta; waves within a zone identical; HP/XP not monotonic across zones; Haste and Fire Strike weak; 11 loot items have no use; Harpy Matriarch plume drops every kill.
20. Mountain Pass enemies (mountain bat, goat, goblin scavenger) have no pets or shinies.

## Combat and spells
21. Respawn waits a full attack interval (roughly halves kill rate; spells blocked meanwhile). No offline progress or wall-clock delta. Attack overshoot dropped (timer resets to 0).
22. `Math.ceil` at each damage step inflates small hits (1 × 1.2 crit = 2).
23. Re-equipping a spell resets its cooldown; `castSpell` has no guards of its own; cooldown can go negative; buff/cooldown timing off by up to 1 s; mana can stay above `maxMana`.
24. Stats are accumulated: rebalanced items/nodes leave old deltas on saves; `statsInitialState` changes never reach saves; float drift (`attackSpeed` 2.7000000000000006).

## Persistence and performance
25. `localStorage` written up to 10×/s (attack timer, mana regen, cooldowns in persisted state); `stats` replaced every tick so every reader re-runs at 10 Hz; no save throttling or `try/catch` on `setItem`.
26. No save version or migrations; full enemy object persisted (stale after data edits); `activeShopId` persisted; `withDevtools` on in production.

**Possible fixes** (reviewed 2026-10-22). `feat/combat-fixes` (uncommitted when reviewed) already moves the attack/respawn timers to `GameIntervalService`, makes `manaRegenTimer` a transient key, throttles saves to 1 s with `try/catch`, and drops unknown top-level keys on load. Still open after it lands:
- **Buffs recompute `stats` at 10 Hz.** `tickSpellTimers` rewrites `activeBuffs` (`msRemaining`) every tick and derived `stats` reads it, so every `stats()` reader re-runs while a buff is active. Store `expiresAt` instead of a countdown, or feed `buffModifiers` from a buff-id list with an `equal` check.
- **Persist ids, not data.** `battleStore` saves `enemyId` + `isShiny` + HP and rebuilds the enemy from `ENEMIES_DATA`; `townsStore` saves a building id instead of `selectedTownBuilding` and stops saving `activeShopId`. Add an optional `persist` projection to `withGameStateSync`.
- **Save version.** Save `{ v, state }`; on mismatch reset that store to `initialState` (pre-release), later a migration table. Replaces "clear `localStorage` and reload within a second".
- **Devtools stub.** One helper exporting `isDevMode() ? withDevtools : withDevToolsStub`, imported by every store.
- **Mana regen timer** still dirties `playerStore` (the largest store) once a second while mana regenerates; move it to `GameIntervalService` like the attack timer.

## UI, build and platform
27. Damage popups lost when several hits land in one tick; popup array mutated in place; popup ids wrap at 100 (duplicate track keys).
28. Dialogue and shop templates call functions per change detection; a few components lack OnPush (battle-side-buttons, dialogue, quest-completed, damage-popup); all pipes `pure: false`.
29. Hard-coded English: skill tree tooltips, dialogue labels, battle nav, spellbook, world map marker labels; map points of interest show raw `i18nKey`; quest step descriptions not i18n; spell/skill descriptions hard-code numbers from data; no item descriptions.
30. Map source art (`source.png` 4 MB, `.kra` 10 MB) ships; backgrounds 28 MB of PNG (convert to webp); initial bundle 902 kB vs 500 kB budget (`@defer` heavy tabs); ~20 unused asset files.
31. Debug buttons in production (guard with `isDevMode()`); no responsive layout; no keyboard, ARIA or touch support (clickable divs, right-click-only item use).
32. Stores open dialogs directly with no dialog queue; `setTimeout` never cleared (world map, skill tree); `app.config` has deprecated `APP_INITIALIZER`, a no-op `importProvidersFrom`, unused `@ngrx/store`/effects/store-devtools and an empty router; `@Input`/`@Output` decorators remain in older components; town picker hard-codes La Harpar; `strictNullChecks`/`noImplicitAny` off; no ESLint.
