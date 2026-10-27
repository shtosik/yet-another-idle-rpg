# Coding standards

How code is written in this repo. Read before writing or reviewing code.

## Stack

- Standalone components, zoneless change detection, `OnPush` on every component (a few older ones still lack it).
- Readable, modern Angular: signals for state, `inject()` for DI, signal `input()`/`output()` in new code (some older components still use decorators).
- State lives in NgRx Signal Stores (`src/app/store/`), persisted to `localStorage`.
- Dialogs use Angular Material.
- Static game content is typed TS data in `src/data/`, keyed by numeric enums in `src/enums/`.

## Gotchas

- **Pre-release: save compatibility is not required.** Rename and renumber freely; clear `localStorage` after a breaking state change.
- **Stats are derived, not stored.** `PlayerStore.stats()` is computed from base + equipment + skill nodes + buffs + consumables + permanent bonuses. `updatePlayerStats` only earns/spends resources or adds a permanent bonus; a new stat source goes into the `stats` computed (ADR 0002).
- **New i18n namespace → register it** in the `translations` list in `src/app/app.config.ts`. Template pipe is `| i18next`.
- **Item data lives in `src/data/items/<category>-items.data.ts`**; `src/data/items-data.ts` only merges them.
- **Quest conditions**: `QuestState.active` = started; `QuestState.readyToAdvance` = started and current step's requirements met (turn-ins).
