# Persistence

## Purpose
Saves game state to `localStorage` (at most once a second per store) and restores it on load. There is no backend and no save file.

## Key files
- `src/app/store/helpers/with-game-state-sync.hook.ts:withGameStateSync` — the whole mechanism.
- Stores that use it, each under its own `localStorage` key (`STORE_KEY` constant in the store file):

| Key | Store | Holds |
|---|---|---|
| `playerStore` | `src/app/store/player/player.store.ts:PlayerStore` | resources, permanent bonuses, inventory, equipment, unlocked nodes, stations, recipes, tasks, unlocked content |
| `battleStore` (v2) | `src/app/store/battle/battle.store.ts:BattleStore` | current zone/wave, enemy id + shiny + HP, spells, buffs, consumable slots |
| `questsStore` | `src/app/store/quests/quests.store.ts:QuestsStore` | quest step progression (completion is step 9999), dialogue flags |
| `townsStore` (v2) | `src/app/store/towns/towns.store.ts:TownsStore` | selected town and building id (the open shop isn't saved) |
| `shopStore` | `src/app/store/shop/shop.store.ts:ShopStore` | stock and refresh timers |
| `campStore` | `src/app/store/camp/camp.store.ts:CampStore` | Camp tab UI selection |
| `offlineStore` | `src/app/store/offline/offline.store.ts:OfflineStore` | `lastSeenAt` (host time, high-water mark), the kill window (recent online kill intervals on one zone and wave, `offline-progress.md`) |

## Data flow
1. Store `onInit`: read `localStorage[key]`, decode it if it starts with `z:` (see Save format), `JSON.parse` the envelope `{ v, state }`. If `v` matches the store's save version, keep only top-level keys that exist in `initialState`, drop `transientKeys`, then `merge({}, initialState, state)` (lodash deep merge) and `patchState`. An **older** version: the save is ignored, the store starts from `initialState` (`console.info`) and the next save overwrites it. A **newer** version (written by a newer build, for example another worktree on the same localhost port): the store starts from `initialState` but doesn't save this session, so the newer save survives (`console.warn`). The parsing is `readSave` (pure, covered by `with-game-state-sync.hook.spec.ts`).
2. An `effect` marks the store dirty when a saved key changes (transient keys don't count); a 1 s interval writes `JSON.stringify({ v, state })` with the state minus `transientKeys`, inside `try/catch`. Up to 1 s of progress is lost on close. `saveGameStateNow()` writes every store at once, skipping the interval (used by the offline claim and before the update banner's reload); it returns false if a write failed, and a failed store stays dirty so the interval retries it. The update banner doesn't reload after a failed save.
3. `GameComponent.resetState` calls `resetState()` on every store, which patches `initialState` back in.

## Export and import
Settings → Save (`src/app/services/save-transfer.service.ts:SaveTransferService`).
- **Export** writes every store now (`exportGameSaves`), then downloads `yari-save-v<version>-<date>.json`: `{ game: 'yari', appVersion, exportedAt, saves: { <key>: <raw localStorage value> } }`. Values stay in their saved format (encoded in production).
- **Import** checks the file (`game` is `yari`, at least one known store key) and each store's save against that store's version (`checkImportedSave`): an unreadable save or one from a newer build refuses the file, since this build would run that store from scratch. Stores with an older save version would start fresh; the confirmation says how many. `replaceGameSaves` then writes the file's saves, clears stores the file lacks, and stops all saving for the rest of the page's life, so the running state can't be written back; the page reloads and loads the import like any save (versions apply as usual).
- **Storage failures** (full or blocked `localStorage`): export aborts if the fresh save fails, so it never downloads an outdated backup. Import keeps a copy of the current saves; if a write fails partway, it puts them back, turns saving on again and keeps the page as it is. Settings shows an error in both cases.
- Only stores created by the time of the export or import count (`syncedVersions`); all are injected by `GameComponent`, so a new persisted store must be too.
- The imported `offlineStore.lastSeenAt` is the export time, so the reload counts the time since as offline, under the usual offline rules (`offline-progress.md`).

## Save format
- **Dev builds** (`isDevMode()`): plain JSON, readable and editable in DevTools.
- **Production builds**: `z:` + lz-string `compressToUTF16(json)`. It keeps casual edits out and makes saves smaller. It is obfuscation, not protection: the decoder ships in the bundle.
- **No DevTools in production.** `angular.json` `fileReplacements` swaps `store/helpers/devtools.ts` for `devtools.prod.ts`: `withDevToolsStub` and no `provideStoreDevtools`, so Redux DevTools can't read or edit state and its code isn't bundled.
- **Versioned.** Every save is `{ v, state }`; `v` is the store's `version` option (default 1). A bare state object (saved before versioning) counts as version 1. An object with a `v` must be a valid envelope (`v` a number, `state` a plain object), or the save counts as unreadable.
- Loading accepts both formats in either build, so a dev save opens in prod and the other way round. The next save rewrites it in the build's own format.

## Invariants & gotchas
- **Pre-release: save compatibility is not required.** Renames and renumbers are allowed. After a breaking change to a store's saved shape, bump its `version` (`withGameStateSync(KEY, initialState, { version: 2 })`): older saves of that store start fresh, the other stores keep theirs. Running an older branch afterwards leaves the newer save alone.
- **Save ids, not data.** Store the id of an enemy, building or item and look the data up in a computed; a saved copy of static data goes stale after a data edit (`BattleStore.enemy`, `TownsStore.selectedTownBuilding`).
- **A saved id can stop resolving.** Renumbering or removing an enum value leaves old saves pointing at nothing. The lookup computed returns `null` for an unknown id, and the store repairs what depends on it on load: `BattleStore` ends a fight whose `enemyId` no longer exists (combat would otherwise stall) and clamps `currentEnemyHp` to the rebuilt max HP. A new id-based lookup needs the same guard.
- **Removed top-level keys are dropped on load.** Renamed or removed keys nested deeper (inside an object in state) still linger, because the merge keeps them.
- **New keys pick up defaults.** A key added to `initialState` appears in old saves with its initial value, because of the merge.
- **Arrays merge by index**, not replace. If `initialState` has a non-empty array and the save has a shorter one, the tail of the initial array survives. Keep initial arrays empty (or accept the effect).
- **Enum values are what get saved**, never enum names. Renumbering an enum quietly points saved data at different entities.
- **Transient state**: pass per-tick timers and UI state a reload shouldn't restore as `transientKeys` (`{ transientKeys: ['manaRegenTimer'] }`, `activeShopId`), or keep them outside stores (the attack and respawn timers live on `GameIntervalService`). A transient key changing doesn't trigger a save.
- Clearing `localStorage` by hand: reload within a second, or the next save writes the old state back.

## Known issues
- No migration step: a version bump resets that store. Corrupt values (`NaN`, `null`) are never repaired.
- A store whose save can't be read (bad JSON, failed decode, not an object, malformed envelope) or is from a newer version logs it, runs from `initialState` and doesn't save for that session, so the unreadable save is never overwritten. "reset state" doesn't save that store either until a reload.

## Pre-release TODO
- Add a migration table (per store, from version N to N+1) before the first public release, so a version bump stops resetting players' progress; drop junk keys during migration.

## How to extend
New persisted store: follow the `signalStore(withState, withGameStateSync(KEY, initialState, { version, transientKeys }), withDevtools(KEY), …)` pattern (import `withDevtools` from `store/helpers/devtools.ts`, never from the toolkit), add a `resetState()` method, and call it from `GameComponent.resetState`.
