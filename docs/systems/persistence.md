# Persistence

## Purpose
Saves game state to `localStorage` on every change and restores it on load. There is no backend and no save file.

## Key files
- `src/app/store/helpers/with-game-state-sync.hook.ts:withGameStateSync` — the whole mechanism.
- Stores that use it, each under its own `localStorage` key (`STORE_KEY` constant in the store file):

| Key | Store | Holds |
|---|---|---|
| `playerStore` | `src/app/store/player/player.store.ts:PlayerStore` | stats, inventory, equipment, unlocked nodes, stations, recipes, tasks, unlocked content |
| `battleStore` | `src/app/store/battle/battle.store.ts:BattleStore` | current zone/wave/enemy, spells, buffs, consumable slots |
| `questsStore` | `src/app/store/quests/quests.store.ts:QuestsStore` | quest step progression, completed quests, dialogue flags |
| `townsStore` | `src/app/store/towns/towns.store.ts:TownsStore` | selected town/building, open shop |
| `shopStore` | `src/app/store/shop/shop.store.ts:ShopStore` | stock and refresh timers |
| `campStore` | `src/app/store/camp/camp.store.ts:CampStore` | Camp tab UI selection |

## Data flow
1. Store `onInit`: read `localStorage[key]`, `JSON.parse`, then `merge({}, initialState, parsed)` (lodash deep merge) and `patchState`.
2. An `effect` writes `JSON.stringify(getState(store))` back on every state change.
3. `GameComponent.resetState` calls `resetState()` on every store, which patches `initialState` back in.

## Invariants & gotchas
- **Pre-release: save compatibility is not required.** Renames and renumbers are allowed. After a breaking state change, clear `localStorage` (DevTools → Application → Local Storage).
- **Renamed or removed keys linger.** The merge keeps every key in the saved JSON, so an old key stays in state (and gets saved again) forever. `resetState()` does not remove them either, because `patchState` only overwrites keys.
- **New keys pick up defaults.** A key added to `initialState` appears in old saves with its initial value, because of the merge.
- **Arrays merge by index**, not replace. If `initialState` has a non-empty array and the save has a shorter one, the tail of the initial array survives. Keep initial arrays empty (or accept the effect).
- **Enum values are what get saved**, never enum names. Renumbering an enum quietly points saved data at different entities.
- Every state change triggers a full `JSON.stringify` of that store. Avoid high-frequency state updates for anything big (for example, don't put per-tick counters in `PlayerStore` if they can live in a non-persisted signal).

## Known issues
- No save version or migration step. Corrupt values (`NaN`, `null`) are never repaired.

## Pre-release TODO
- Add a save version per store and a migration table before the first public release; drop junk keys during migration.

## How to extend
New persisted store: follow the `signalStore(withState, withGameStateSync(KEY, initialState), withDevtools(KEY), …)` pattern, add a `resetState()` method, and call it from `GameComponent.resetState`.
