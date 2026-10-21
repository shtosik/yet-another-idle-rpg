---
name: add-quest
description: Use when adding a quest or changing one's steps or rewards — quest data, the giving NPC's quest hub (offer, in progress, turn-in), start gating, quest-only drops and names. Triggers on "add a new quest", "create a quest for X", "make Corwin give a quest", "add a step to Meat Shortage", "change the quest rewards".
---

# Add a quest

Background: `docs/systems/quests.md` (step encoding, flow) and `docs/systems/dialogue.md` (`QuestState` meanings, hub order).

## Steps

1. **QuestID** — append the next value to `src/enums/ids/quest-id.enum.ts:QuestID`.

2. **Quest data** — add to `src/data/quests-data.ts:QUEST_DATA`:
   ```ts
   [QuestID.wolfProblem]: {
     questId: QuestID.wolfProblem,
     startRequirements: [{ type: 'quest', questId: QuestID.previousQuest, step: QUEST_STEP_AFTER_COMPLETED }],
     steps: [
       { description: 'Corwin wants 10 wolf pelts.', requirements: [{ type: 'item', itemId: ItemID.wolfPelt, amount: 10 }] },
     ],
     rewards: [{ type: 'stat', key: 'unspentSkillPoints', amount: 1 }, { type: 'item', itemId: ItemID.x, amount: 1 }],
   },
   ```
   Requirement types: `item`, `stat`, `enemy` (lifetime kill count, so it may already be met on accept), `wave`, `quest`. A quest with no prerequisite uses `{ type: 'stat', key: 'level', amount: 1 }`.

3. **Name** — `quests:names.<questKey>` in `src/assets/locales/en/quests.json`.

4. **Quest hub** in the giver's dialogue (new giver: `add-npc-dialogue` first). In the hub option, results top to bottom:
   1. **Turn-in**: `visibilityConditions` `{ type: 'quest', questId, questState: QuestState.readyToAdvance, step: N }`; `requirementsNeeded` matching the step; effects `item` `take` first, then `quest` `advance` (or `end` on the last step).
   2. **In progress**: `questState: QuestState.active` → a reminder node.
   3. **Offer**: `questState: QuestState.available` → an offer node whose accept option applies `quest` `start`.
   4. Fallback for before and after the quest.

   Every `start` effect anywhere in the tree sits behind an `available` condition.

5. **Quest items** (optional) — define in `src/data/items/quest-item.data.ts` (`ItemType.quest`, `value: -1`), add `items:names` keys, and give them a source: an enemy drop with `requiredActiveQuestId`, or a dialogue `item` `give`.

6. **Unlocks** (optional) — a building gated by `questRequirement` (see `add-town-building`).

7. **Check** — run `audit-dialogue` on the giver.

Done when `npm run validate` and `npx ng build` pass and `audit-dialogue` reports no blockers for the giver.
