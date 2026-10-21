# Quests

## Purpose
Multi-step story objectives handed out by NPCs. Quests are started, advanced and finished from dialogue; the quests tab lists them and shows the current step's description.

## Key files
- `src/data/quests-data.ts:QUEST_DATA` — per quest: `startRequirements`, `steps[]` (each with `description` and `requirements`), `rewards`.
- `src/enums/ids/quest-id.enum.ts:QuestID`.
- `src/app/store/quests/quests.store.ts:QuestsStore` — `questStepProgression` (saved), `dialogueFlags`, `startQuest`/`advanceQuest`/`endQuest`, `handleQuestCompleted` (rewards + modal).
- `src/app/services/quest-status.ts` — `getQuestStatus`, `canAdvanceQuest`, `isQuestAvailable`, `matchesQuestState`, `getActiveQuestIds`. Status is always derived from the saved step.
- `src/app/components/game/quests/quests.component.ts` — quests tab.
- `src/app/components/modals/quest-completed/` — reward modal.

## Data flow
1. **Start**: a dialogue result with effect `{ type: 'quest', action: 'start' }` sets the step to 1. Gate the offer with a `QuestState.available` condition so `startRequirements` are respected.
2. **Progress**: requirements (`item`, `stat`, `enemy` kill count, `wave` kill count, `quest`) are only checked, never tracked per quest. Item requirements are not consumed automatically; take items with an `item` `take` effect.
3. **Advance**: a turn-in result gated by `QuestState.readyToAdvance` (with `step`) applies `action: 'advance'`. Advancing past the last step completes the quest.
4. **Complete**: step becomes `QUEST_STEP_AFTER_COMPLETED` (9999); `handleQuestCompleted` grants `rewards` (stats and items) and opens the modal. `action: 'end'` completes immediately from any step.
5. Enemy drops with `requiredActiveQuestId` only roll while that quest is active (`getActiveQuestIds`).

Saved step encoding: `undefined` = not started, `1..n` = on step n, `9999` = completed.

## Intended behavior (owner decisions)
- **A Tale of a Captain is unfinished on purpose.** `captainsLetter` has no source and `rewards` is empty; it will be finished later.
- Completing a quest must be blocked when item rewards don't fit in the inventory (see `player-stats-inventory-equipment.md`).

## Invariants & gotchas
- Steps are 1-based in saves and 0-based in `steps[]` (`steps[step - 1]`).
- Turn-in ordering in the NPC's tree matters: see the quest hub order in `dialogue.md`.
- `QuestState.active` means started; `readyToAdvance` means started and the current step's requirements are met.
- Quest step descriptions are plain English strings, not i18n keys (see `localization.md`).

## Known issues
- Item rewards are added without a space check; overflow is discarded (violates the owner decision above). Several turn-ins run `end` before `take`, so freed slots don't count.
- `startQuest` ignores `startRequirements`: ungated lore links start Feathers for a Kite (Milo) and Fetches and Fangs (Finn) early.
- No state guards: `endQuest` on a completed quest grants rewards again; `advanceQuest` on an unstarted quest saves `NaN`.
- `enemy` kill-count requirements read lifetime kill counters, so some quests are already complete when accepted.
- Dialogue turn-ins restate requirements by hand and drift from `QUEST_DATA` (Meat Shortage: dialogue takes 50 crab meat, quest says 30).
- The quests tab's `started` filter shows every quest, the same as `all`.

## How to extend
New quest: the `add-quest` skill (data, i18n, NPC quest hub ordering, start gating).
