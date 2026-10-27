# Coding standards

How code is written in this repo. Read before writing or reviewing code.

## Stack

- Standalone components, zoneless change detection, `OnPush` on every component (a few older ones still lack it).
- Readable, modern Angular: signals for state, `inject()` for DI, signal `input()`/`output()` in new code (some older components still use decorators).
- State lives in NgRx Signal Stores (`src/app/store/`), persisted to `localStorage`.
- Dialogs use Angular Material.
- Static game content is typed TS data in `src/data/`, keyed by numeric enums in `src/enums/`.
- **Item data lives in `src/data/items/<category>-items.data.ts`**; `src/data/items-data.ts` only merges them.
