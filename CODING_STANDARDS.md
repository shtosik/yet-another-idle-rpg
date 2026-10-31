# Coding standards

Judgement rules for writing and review. Mechanical rules are checks instead: `npm run lint` (`eslint.config.mjs`) and `npm run validate` (`scripts/validate-data.mjs`). A rule that a check could enforce belongs there, not here.

## Stack

- Standalone components, zoneless change detection, `OnPush` on every component (a few older ones still lack it).
- Readable, modern Angular: signals for state, `inject()` for DI, signal `input()`/`output()` in new code (some older components still use decorators).
- State lives in NgRx Signal Stores (`src/app/store/`), persisted to `localStorage`.
- Dialogs use Angular Material.
- Static game content is typed TS data in `src/data/`, keyed by numeric enums in `src/enums/`.
- **Item data lives in `src/data/items/<category>-items.data.ts`**; `src/data/items-data.ts` only merges them.
- **Stats are derived**: a new stat source goes into the `stats` computed in `PlayerStore`; see `docs/systems/player-stats-inventory-equipment.md`.
- **Icons are files** under `src/assets/img/icons/`, used through `<img ngSrc>` with the colour baked into the file.

## Logic

- **Ternaries pick between two simple values** (`selected ? 0 : -1`). Choosing what to compute or call, or combining several conditions, goes in `if`/`switch` inside a small named method. (Nested ternaries in `.ts` files are a lint error; lint doesn't read templates, so check those in review.)
- **Switch over a union or enum with no `default`** when every member needs handling, so a new member (a currency, a stat format) fails to compile until it is handled (`noImplicitReturns` is on). Per-member static values go in a `Record<Union, …>` for the same reason.
- **An explicit data field beats a derived lookup.** If code has to reverse-engineer a fact from other data (which NPC a quest step turns in to), add the field to the data and have `validate` check it.

## Structure

- **One component per tab or panel section.** A template that switches between several large views splits each view into its own component.
- **A component's styles cover only its own template.** The game grid in `game.component.html`/`.sass` places panels by host class (`.stats`, `.inventory`, ...); don't reuse those names inside components.

## Player-facing text

- **Labels match behaviour exactly.** A hint or changelog note says what the code does ("buys up to five" when purchases can stop early), and names the shop's currency rather than assuming gold.
