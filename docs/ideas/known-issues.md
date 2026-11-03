# Known issues

**Status:** Open · collected 2026-10-21 during the AI docs overhaul (from code reading and the October repo audit). Per-system details also live in each doc's "Known issues" section under `docs/systems/`.

Only open issues live here. A PR that fixes one deletes its entry; `git log -- docs/ideas/known-issues.md` has the fixed ones.

## Economy and progression
- Balance: XP curve uses the cumulative formula as a per-level delta (kept on purpose for now); Fire Strike weak; Harpy Matriarch plume drops every kill; gold shop prices not re-tuned. Tuning plan: `progression-pacing.md` (`npm run sim`).
- Nothing upgrades the Workbench: `STATIONS_DATA` allows levels 2 and 3, but no `stationUpgrade` item exists for it, so every Workbench recipe is level 1 (a level 2 recipe could never be crafted). Needs an upgrade item (shop or recipe) before recipes move up (`elemental-spells-gear.md` batch 3).

## UI, build and platform
- Dialogue and shop templates call functions per change detection; a few components lack OnPush (dialogue, quest-completed); all pipes `pure: false`.
- Hard-coded English: skill tree tooltips, dialogue labels, battle nav, spellbook, world map marker labels; map points of interest show raw `i18nKey`; quest step descriptions not i18n; spell/skill descriptions hard-code numbers from data; no item descriptions.
- Map source art (`source.png` 4 MB, `.kra` 10 MB) ships; backgrounds 28 MB of PNG (convert to webp); initial bundle 902 kB vs 500 kB budget (`@defer` heavy tabs); ~20 unused asset files.
- No responsive layout (`responsive-layout.md`).
- Stores open dialogs directly with no dialog queue; `setTimeout` never cleared (world map, skill tree); `app.config` has deprecated `APP_INITIALIZER`, a no-op `importProvidersFrom`, unused `@ngrx/store`/effects/store-devtools and an empty router; `@Input`/`@Output` decorators remain in older components; town picker hard-codes La Harpar; `strictNullChecks`/`noImplicitAny` off.
