# Known issues

**Status:** Open · collected 2026-10-21 during the AI docs overhaul (from code reading and the October repo audit). Per-system details also live in each doc's "Known issues" section under `docs/systems/`.

## Quests and dialogue
1–11 fixed 2026-10-22 (`fix/quest-dialogue`): in-progress branches, hub order, start gating, store guards, step kill baselines, turn-ins consume `QUEST_DATA` step items, one result resolver, `many*` labels, dead ends, `started` filter.

## Owner decisions not enforced yet
12–14 fixed 2026-10-23: dialogue gold fees are blocked when unaffordable ("N more gold needed") and the Bartender's Meat Shortage tip is paid once (`flag` condition); unequip, quest item rewards, dialogue `give` and the Spellbook purchase were already guarded.

## Economy and progression
15. Fixed 2026-10-22 (`feat/gold-selling`): enemies drop their own `gold` with `goldCoinsMultiplier` applied; `goldGain` grants the multiplier; loot sells at shops.
16. Fixed 2026-10-23: buy-max on a free node, `manaRegen` is 10% faster regen per level, auto wave and auto eat toggles go off with their node.
17. Fixed 2026-10-23: `UnlockService` applies unlock rules on any state change; one `waveReached` rule (that wave or later) for load and play.
18. Fixed 2026-10-22 (`feat/gold-selling`): Guild rank, rank-gated task pool, tier-scaled tokens and the Guild store.
19. Balance: XP curve uses the cumulative formula as a per-level delta (kept on purpose for now); Fire Strike weak; Harpy Matriarch plume drops every kill; gold shop prices not re-tuned. Fixed 2026-10-22: wave scaling, zone chain rescale, Haste as a percentage.
20. Fixed 2026-10-22: Mountain Pass enemies have pets and shiny pets.

Remaining plans: `progression-pacing.md` (tuning with `npm run sim`).

## Combat and spells
21. Fixed 2026-10-23: offline progress (`docs/systems/offline-progress.md`), including the sleeping-device gap.

(22–25 fixed 2026-10-22: 2 s respawn delay with wall-clock ticks, single damage rounding, spell guards and slot cooldown lock, derived stats, throttled saves.)

## Persistence and performance
26. Fixed 2026-10-23: `withDevtools` stubbed in production; saves versioned (`{ v, state }`, a version bump resets that store); enemy and town building saved as ids; `activeShopId` not saved; transient keys (mana regen timer) no longer trigger saves. Still open: a migration table before release (`persistence.md`).

(Buffs no longer recompute `stats` every tick: `PlayerStore` reads buff and consumable ids through `sameIds` equality checks.)

## UI, build and platform
27. Damage popups lost when several hits land in one tick; popup array mutated in place; popup ids wrap at 100 (duplicate track keys).
28. Dialogue and shop templates call functions per change detection; a few components lack OnPush (battle-side-buttons, dialogue, quest-completed, damage-popup); all pipes `pure: false`.
29. Hard-coded English: skill tree tooltips, dialogue labels, battle nav, spellbook, world map marker labels; map points of interest show raw `i18nKey`; quest step descriptions not i18n; spell/skill descriptions hard-code numbers from data; no item descriptions.
30. Map source art (`source.png` 4 MB, `.kra` 10 MB) ships; backgrounds 28 MB of PNG (convert to webp); initial bundle 902 kB vs 500 kB budget (`@defer` heavy tabs); ~20 unused asset files.
31. Debug buttons in production (guard with `isDevMode()`); no responsive layout; no keyboard, ARIA or touch support (clickable divs, right-click-only item use).
32. Stores open dialogs directly with no dialog queue; `setTimeout` never cleared (world map, skill tree); `app.config` has deprecated `APP_INITIALIZER`, a no-op `importProvidersFrom`, unused `@ngrx/store`/effects/store-devtools (store-devtools is dev-only since 2026-10-23) and an empty router; `@Input`/`@Output` decorators remain in older components; town picker hard-codes La Harpar; `strictNullChecks`/`noImplicitAny` off; no ESLint.
