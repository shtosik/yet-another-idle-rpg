# Plan: Zone Unlock System via Boss-Kill Progression

## Context

Currently all zones are fully accessible from the start — there is no lock on navigation. The player can arrive at `plains` or `theLongPath` before ever fighting in `horseshoeBeach`. The task is to add a **persistent zone unlock system**: a player unlocks the next zone in the progression chain by killing the boss (the single enemy on the last wave of a zone that has `nextZoneId`). The system must be designed generically so the same pattern can gate buildings, recipes, or other content in the future.

---

## File Changes

### 1. New type — `src/types/player/unlocked-content.type.ts`

```ts
import { ZoneID } from 'enums/ids/zone-id.enum'

export type UnlockedContent = {
  zones: ZoneID[]
  // future: buildings: BuildingID[], recipes: RecipeID[], …
}
```

### 2. `src/app/store/player/player.store.ts`

**State** — add field:

```ts
unlockedContent: UnlockedContent
```

**Initial state** — first zone unlocked by default:

```ts
unlockedContent: {
  zones: [ZoneID.horseshoeBeach]
}
```

**Methods** — add two:

```ts
unlockZone(id
:
ZoneID
):
void {
  patchState(store,(state)
=>
{
  if (state.unlockedContent.zones.includes(id)) return {}
  return { unlockedContent: { ...state.unlockedContent, zones: [...state.unlockedContent.zones, id] } }
}
)
}

isZoneUnlocked(id
:
ZoneID
):
boolean
{
  return store.unlockedContent().zones.includes(id)
}
```

### 3. `src/app/services/battle-manager.service.ts`

**`canMoveToNextWave`** — replace kill-count check on last wave with unlock check:

```ts
if (isCurrentWaveLast) {
  return !!(zoneData.nextZoneId && this.playerStore.isZoneUnlocked(zoneData.nextZoneId))
}
return this.currentWaveKillCount() >= zoneData.enemiesPerWave
```

**`handleEnemyDeath`** — after `processBattleEnd`, trigger unlock on first boss kill:

```ts
const zoneData = this.battleStore.currentZoneData()
const isBossWave = wave === zoneData.maxWave
if (isBossWave && zoneData.nextZoneId && !this.playerStore.isZoneUnlocked(zoneData.nextZoneId)) {
  this.playerStore.unlockZone(zoneData.nextZoneId)
}
```

This runs before the auto-wave check, so auto-wave can immediately see the newly unlocked zone.

**Auto-wave bug fix (improvement)** — the existing auto-wave check uses `zoneData.enemiesPerWave` directly, which means boss waves (requiring only 1 kill) never trigger auto-advance. Fix it to use the already-computed signal:

```ts
const requiredKills = this.battleStore.requiredKillCountOnCurrentWave()
const isEnoughKillCountToProgress = currentKillCount >= requiredKills

if (isAutoEnabled && isEnoughKillCountToProgress) {
  this.battleStore.changeWave(true)
}
```

---

## Side-zone note (`tradersBasement`)

`tradersBasement` has no `nextZoneId` / `previousZoneId` and is accessed via a quest-gated town building (`questRequirement: QuestID.ratsWereRats`). It does **not** participate in the boss-kill unlock chain and requires no changes. The two systems are orthogonal: quest-gate controls building visibility; boss-kill unlock controls wave navigation.

---

## Optional improvement: align `ExplorationGuildService`

`ExplorationGuildService.unlockedZoneIds` currently derives its pool from `Math.floor(totalTasksCompleted / 5) + 1`. This is separate from the new system but semantically overlapping. Consider replacing it with `playerStore.unlockedContent().zones` so task eligibility mirrors battle-accessible zones. This is a separate, optional refactor.

---

## What does NOT need to change

- `BattleStore.setZone` — only called from the tradersBasement building (quest-gated), no zone-unlock guard needed there.
- `TownsComponent.isBuildingAvailable` — no main-chain zone buildings exist in towns-data yet; all `zoneId` buildings also have `questRequirement`.
- `BattleStore.changeWave` — already correctly stays on maxWave if `nextZoneId` is absent; after unlock the existing logic routes to the next zone correctly.

---

## Verification

1. **New game (fresh state)**: battle starts at horseshoeBeach wave 1. Wave navigation "next" button on wave 10 (boss wave) is hidden.
2. Kill gangsterCrab: `plains` unlocks, "next" button appears on wave 10.
3. Click next → player is now on plains wave 1.
4. Kill kingSlime (plains wave 10): `theLongPath` unlocks.
5. **Auto-wave with fix**: enable auto-wave, kill the boss → auto-advances to next zone without manual click.
6. **Existing save**: add migration guard — if `unlockedContent` is missing from persisted state, `withGameStateSync` / `withStorageSync` falls back to `initialState` which seeds `horseshoeBeach`. Verify no regression for existing players by inspecting the `withGameStateSync` hook's merge behaviour.
