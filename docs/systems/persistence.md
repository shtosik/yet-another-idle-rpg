# Persistence

## Purpose
Saves game state to `localStorage` (at most once a second per store) and restores it on load. There is no backend and no save file.

## Key files
- `src/app/store/helpers/with-game-state-sync.hook.ts:withGameStateSync` — the whole mechanism.
- Stores that use it, each under its own `localStorage` key (`STORE_KEY` constant in the store file):

| Key | Store | Holds |
|---|---|---|
| `playerStore` | `src/app/store/player/player.store.ts:PlayerStore` | resources, permanent bonuses, inventory, equipment, unlocked nodes, stations, recipes, tasks, unlocked content |
| `battleStore` | `src/app/store/battle/battle.store.ts:BattleStore` | current zone/wave/enemy, spells, buffs, consumable slots |
| `questsStore` | `src/app/store/quests/quests.store.ts:QuestsStore` | quest step progression (completion is step 9999), dialogue flags |
| `townsStore` | `src/app/store/towns/towns.store.ts:TownsStore` | selected town/building, open shop |
| `shopStore` | `src/app/store/shop/shop.store.ts:ShopStore` | stock and refresh timers |
| `campStore` | `src/app/store/camp/camp.store.ts:CampStore` | Camp tab UI selection |
| `offlineStore` | `src/app/store/offline/offline.store.ts:OfflineStore` | `lastSeenAt` (host time, high-water mark), the kill window (recent online kill intervals on one zone and wave, `offline-progress.md`) |

## Data flow
1. Store `onInit`: read `localStorage[key]`, decode it if it starts with `z:` (see Save format), `JSON.parse`, keep only top-level keys that exist in `initialState`, drop `transientKeys`, then `merge({}, initialState, parsed)` (lodash deep merge) and `patchState`.
2. An `effect` marks the store dirty on every state change; a 1 s interval writes `JSON.stringify` of the state without `transientKeys`, inside `try/catch`. Up to 1 s of progress is lost on close. `saveGameStateNow()` writes every store at once, skipping the interval (used by the offline claim).
3. `GameComponent.resetState` calls `resetState()` on every store, which patches `initialState` back in.

## Save format
- **Dev builds** (`isDevMode()`): plain JSON, readable and editable in DevTools.
- **Production builds**: `z:` + lz-string `compressToUTF16(json)`. It keeps casual edits out and makes saves smaller. It is obfuscation, not protection: the decoder ships in the bundle.
- **No DevTools in production.** `angular.json` `fileReplacements` swaps `store/helpers/devtools.ts` for `devtools.prod.ts`: `withDevToolsStub` and no `provideStoreDevtools`, so Redux DevTools can't read or edit state and its code isn't bundled.
- Loading accepts both formats in either build, so a dev save opens in prod and the other way round. The next save rewrites it in the build's own format.

## Invariants & gotchas
- **Pre-release: save compatibility is not required.** Renames and renumbers are allowed. After a breaking state change, clear `localStorage` (DevTools → Application → Local Storage).
- **Removed top-level keys are dropped on load.** Renamed or removed keys nested deeper (inside an object in state) still linger, because the merge keeps them.
- **New keys pick up defaults.** A key added to `initialState` appears in old saves with its initial value, because of the merge.
- **Arrays merge by index**, not replace. If `initialState` has a non-empty array and the save has a shorter one, the tail of the initial array survives. Keep initial arrays empty (or accept the effect).
- **Enum values are what get saved**, never enum names. Renumbering an enum quietly points saved data at different entities.
- **Transient state**: pass per-tick timers as `transientKeys` (`withGameStateSync(KEY, initialState, ['manaRegenTimer'])`) or keep them outside stores (the attack and respawn timers live on `GameIntervalService`).
- Clearing `localStorage` by hand: reload within a second, or the next save writes the old state back.

## Known issues
- No save version or migration step. Corrupt values (`NaN`, `null`) are never repaired.
- A store whose save can't be read (bad JSON, failed decode, not an object) logs an error, runs from `initialState` and doesn't save for that session, so the unreadable save is never overwritten. "reset state" doesn't save that store either until a reload.

## Pre-release TODO
- Add a save version per store and a migration table before the first public release; drop junk keys during migration.

## How to extend
New persisted store: follow the `signalStore(withState, withGameStateSync(KEY, initialState), withDevtools(KEY), …)` pattern (import `withDevtools` from `store/helpers/devtools.ts`, never from the toolkit), add a `resetState()` method, and call it from `GameComponent.resetState`.
