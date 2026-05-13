---
name: fix-dialogue-bugs
description: Use to apply the known dialogue-engine fixes documented in docs/analysis/dialogue-system-analysis.md §5. Covers the four critical runtime bugs — checkCondition fall-through, requirementsNeeded not enforced, quest action 'end' dropped, and startDialogue magic-number routing. Triggers on phrases like "fix dialogue bugs", "patch the dialogue engine", "apply dialogue analysis fixes", "make requirements actually work".
---

# Fix Dialogue Engine Bugs

Four critical bugs in the current dialogue runtime. Each is small individually and can
be applied independently. Confirm with the user which subset they want; **do not** apply
all four blindly — fix #4 is a small behavioural change (intro routing) and the user may
want it sequenced separately from the others.

Reference: `docs/analysis/dialogue-system-analysis.md` §5.

## Fix 1 — `checkCondition` fall-through (CRITICAL)

**File:** `src/app/services/dialogue-manager.service.ts`
**Symptom:** every `item`, `killCount`, `manyKillCount`, `waveKillCount`, `manyWaveKillCount`,
`manyItems`, and `manyQuestCompleted` condition silently returns `true`.

**Change:** add explicit cases for each variant, drawing on the existing logic in
`checkRequirement` (which already handles `item`, `enemy`, `wave`). Then change the
`default` branch from `return true` to `return false` so future unknown variants fail
loud instead of silent.

The existing `checkRequirement` method is a good model — many of the new cases are
near-copies (it operates on `RequirementProps`, not `DialogueCondition`, but the
underlying store accessors are the same: `playerStore.inventory()`,
`playerStore.enemyKillCounts()`, `playerStore.getKillCountByZoneAndWave()`).

## Fix 2 — `requirementsNeeded` is decoration (CRITICAL)

**Files:**
- `src/app/services/dialogue-manager.service.ts` (`selectOption`)
- `src/app/components/game/dialogue/dialogue.component.html`
- `src/app/components/game/dialogue/dialogue.component.sass`

**Two-part fix:**

### 2a — engine refuses to fire
In `selectOption`, after finding `validResult`, also check `validResult.requirementsNeeded`
with `this.checkConditions(...)`. If any requirement fails: bail (don't apply effects, don't
navigate). No console.error — this is expected (player tried to click a disabled option).

### 2b — UI marks disabled options
Use `isOptionDisabled(option)` (already exists in `dialogue.component.ts:100`) and bind it
in the template:

```html
<li
  class="dialogue-modal__option-btn"
  [class.disabled]="isOptionDisabled(option)"
  (click)="!isOptionDisabled(option) && handleOptionClicked(option)"
>
```

And in SASS:
```sass
.dialogue-modal__option-btn
  &.disabled
    opacity: 0.5
    cursor: not-allowed
    pointer-events: none   // belt and braces — also blocks click
```

## Fix 3 — Quest action `'end'` is dropped

**Files:**
- `src/app/store/quests/quests.store.ts` — add `endQuest(questId)` method
- `src/app/services/dialogue-manager.service.ts` — add `case 'end'` in `applyEffects`

`endQuest` should set the quest's progression to `QUEST_STEP_AFTER_COMPLETED` and call
`handleQuestCompleted(QUEST_DATA[questId])` — mirror the tail of `advanceQuest`.

Then verify `src/data/dialogues/laHarparTown/laHarparTrader.ts:81` actually completes
the rat quest. While there: review `questOffer` for the related logic issue in
analysis §5.5.

## Fix 4 — `startDialogue` magic-number routing

**File:** `src/app/services/dialogue-manager.service.ts:72-84`

Two options, in order of preference:

### 4a (preferred) — explicit start node on `NPCProps`
1. Extend `NPCProps` in `src/data/npc-data.ts`:
   ```ts
   export interface NPCProps {
     id: NpcID
     url: string
     dialogue: DialogueType
     startNodeId?: number          // defaults to 0 (hub)
     firstMeetNodeId?: number      // optional; if set & flag absent, route here
   }
   ```
2. Update each NPC entry to declare its `firstMeetNodeId` explicitly where applicable.
   For Elara and Josh (which don't have an intro flow), omit `firstMeetNodeId` and they
   correctly start at 0.
3. Replace the magic-number heuristic with:
   ```ts
   const hasMet = data.firstMeetNodeId !== undefined
     && this.questStore.dialogueFlags()[`met_${npcId}`]
   const startId = hasMet || data.firstMeetNodeId === undefined
     ? (data.startNodeId ?? 0)
     : data.firstMeetNodeId
   ```

### 4b (alternative) — add `FlagCondition` and route through visibility
Bigger change but more uniform: add a `flag` variant to `DialogueCondition` (with
`negate?: boolean`), handle it in `checkCondition`, and let each NPC's `default` node
expose its routing as the first option with hidden visibility. Defer to the
`add-dialogue-effect` skill for the type plumbing.

## After applying fixes

1. Run `npx ng build --configuration development` (or `npx tsc --noEmit`) to confirm types.
2. Manually walk:
   - Bartender → Meat Shortage quest → verify the crab-meat gate now blocks (Fix 1 + 2).
   - Trader → talk after killing 50 rats → verify quest can be completed (Fix 3).
   - Elara, then Josh → on a fresh save, confirm you land on `default`/`greeting`,
     not `apology`/`payBeer` (Fix 4).
3. Update `docs/analysis/dialogue-system-analysis.md` — strike through §5 entries that
   are now resolved, and bump the date.

## Don't
- Don't combine Fix 4 with the others in the same commit — it's a behavioural change
  in dialogue routing and worth isolating.
- Don't change the existing `dialogueFlags` shape — it's persisted in localStorage; any
  schema change needs a migration.
