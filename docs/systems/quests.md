# Quests

## Purpose
Multi-step story objectives handed out by NPCs. Quests are started, advanced and finished from dialogue; the quest panel on the right lists them.

## Key files
- `src/data/quests-data.ts:QUEST_DATA` — per quest: `startRequirements`, `steps[]` (each with `description` and `requirements`), `rewards`.
- `src/enums/ids/quest-id.enum.ts:QuestID`.
- `src/app/store/quests/quests.store.ts:QuestsStore` — `questStepProgression` and `stepKillBaselines` (saved), `dialogueFlags`, `pinnedQuests` (saved), `togglePin`, `startQuest`/`advanceQuest`/`endQuest`, `handleQuestCompleted` (rewards + modal), `questEnemyKills`/`questWaveKills`, `requirementProgress` (current/target for any requirement; the panel and `DialogueManagerService` both use it).
- `src/app/services/quest-status.ts` — `getQuestStatus`, `canAdvanceQuest`, `isQuestAvailable`, `matchesQuestState`, `getStepItems`, `getActiveQuestIds`. Status is always derived from the saved step.
- `src/app/components/game/quests/quests.component.ts` — quest panel: the tab bar (arrow keys move between tabs); each tab is its own component: `quest-list/` (Quests) and `reputation/` (empty for now). The quest list shows active quests (ready ones first, tagged **Ready**) with progress for each requirement of the current step, the step description on click, and completed quests behind a toggle. Links: "Talk to {NPC}" (`questGiverFor` in `src/data/helpers/quest-givers.ts`, derived from dialogue quest effects: the turn-in NPC for the current step, read from the `step` on its `readyToAdvance` condition, else any turn-in NPC, else the starter; needs the Map and the town unlocked) and a zone icon on unfinished kill requirements (`GameNavigationService.fightIn`; keeps the current wave when already in that zone). Pinned quests (`pinnedQuests`, saved, dropped on completion) sort first. Never shows a step number, step count or rewards, so quest length isn't spoiled.
- `src/app/components/modals/quest-completed/` — reward modal.

## Data flow
1. **Start**: a dialogue result with effect `{ type: 'quest', action: 'start' }` sets the step to 1. The dialogue engine hides a start result unless the quest is `available` (not started and `startRequirements` met); still gate the route to the offer node with `QuestState.available` so the player isn't shown an offer they can't take. `startQuest` itself is a no-op once the quest has started.
2. **Progress**: requirements (`item`, `stat`, `enemy` kill count, `wave` kill count, `quest`) are checked, not tracked. When a quest reaches a step, the store snapshots the lifetime kill counters that step's `enemy`/`wave` requirements read (`stepKillBaselines`); those requirements count kills since then (`questEnemyKills`/`questWaveKills`).
3. **Advance**: a turn-in result gated by `QuestState.readyToAdvance` (with `step`) applies `action: 'advance'`. The store first takes the step's `item` requirements from the inventory, so turn-ins never restate them. Advancing past the last step completes the quest.
4. **Complete**: step becomes `QUEST_STEP_AFTER_COMPLETED` (9999), the step's items are taken, the kill baseline is dropped, and `handleQuestCompleted` grants `rewards` (stats and items) and opens the modal. `action: 'end'` completes immediately from any step. `advanceQuest`/`endQuest` are no-ops unless the quest is active.
5. Enemy drops with `requiredActiveQuestId` only roll while that quest is active (`getActiveQuestIds`).

Saved step encoding: `undefined` = not started, `1..n` = on step n, `9999` = completed.

## Intended behavior (owner decisions)
- **A Tale of a Captain is unfinished on purpose.** `captainsLetter` has no source and `rewards` is empty; it will be finished later.
- Completing a quest must be blocked when item rewards don't fit in the inventory (see `player-stats-inventory-equipment.md`).

## Invariants & gotchas
- Steps are 1-based in saves and 0-based in `steps[]` (`steps[step - 1]`).
- Turn-in ordering in the NPC's tree matters: see the quest hub order in `dialogue.md`.
- `QuestState.active` means started; `readyToAdvance` means started and the current step's requirements are met.
- `QUEST_DATA` is the only place requirements live. Turn-ins don't add `requirementsNeeded` or `item` `take` effects for them.
- A start result only shows while its quest is `available`, so it can't share a result with the `end` that unlocks it. Put the follow-up `start` on the next node.
- Quests started in a save from before `stepKillBaselines` have no baseline and count lifetime kills.
- Quest step descriptions are plain English strings, not i18n keys (see `localization.md`).

## Known issues
- The inventory space check for item rewards lives in dialogue (`DialogueManagerService.canApplyResult`); `handleQuestCompleted` itself doesn't check.

## How to extend
New quest: the `add-quest` skill (data, i18n, NPC quest hub ordering, start gating).
