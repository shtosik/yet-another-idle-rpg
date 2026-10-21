# Dialogue

## Purpose
Data-driven NPC conversations. Each NPC has a graph of nodes; options branch on game state and apply effects (start quests, take items, open shops, accept guild tasks). Dialogue is the main way quests start, advance and end.

## Key files
- `src/app/services/dialogue-manager.service.ts:DialogueManagerService` — `startDialogue`, `getActiveResult`, `selectOption`, `checkCondition`, `applyEffects`.
- `src/data/npc-data.ts:NPC_Data` — per NPC: avatar `url`, `dialogue` graph, `startNodeId` (default 0), `firstMeetNodeId`.
- `src/data/dialogues/<town>/<npcKey>.ts` — one file per NPC: a `<Name>Dialogue` enum of node ids and a `Record<enum, DialogueNode>`.
- `src/data/dialogues/types.ts:DialogueType` — union of every NPC's graph type (add new NPCs here).
- `src/interfaces/dialogues/dialogue-node.interface.ts`, `dialogue-option.type.ts` — `DialogueNode` → `options[]` → `results[]`.
- `src/types/dialogues/dialogue-condition.type.ts:DialogueCondition`, `dialogue-effect.type.ts:DialogueEffect` — discriminated unions.
- `src/app/services/quest-status.ts:matchesQuestState` — quest conditions.
- `src/app/components/game/dialogue/dialogue.component.ts` — rendering, requirement labels, disabled state.

## Data flow
1. `startDialogue(npcId)`: if the `met_<npcId>` flag is not set and the NPC has `firstMeetNodeId`, start there; otherwise at `startNodeId ?? 0`. The first-meet node's options must set that flag themselves with a `flag` effect named `met_` + the `NpcID` value.
2. For each option, the shown branch is `getActiveResult`: the **first** result whose `visibilityConditions` all pass, skipping results that start a quest which has already started. An option with no matching result is hidden.
3. `requirementsNeeded` on that result are shown as labels; if any fail, the option is disabled.
4. On click, `selectOption` applies `effects` in order, then closes (`closeDialogue: true`) or moves to `next`.

## Conditions (quest)
`{ type: 'quest', questId, questState, step? }` uses `QuestState`:
- `notStarted`, `completed` — plain status.
- `available` — not started and `startRequirements` met.
- `active` — started (optionally at `step`).
- `readyToAdvance` — active (optionally at `step`) **and** the current step's requirements are met. Use this for turn-in branches.

## Invariants & gotchas
- **Order results from most specific to least.** Quest hubs go: turn-in (`readyToAdvance`) → in progress (`active`) → offer (`available`) → fallback.
- Node ids are the enum values; `default = 0` is the start node for returning players.
- Every `next` must exist and every node should be reachable. `npm run validate` checks both (unreachable = warning).
- Dialogue text keys are `dialogues/<npcKey>:<node>.<field>`, and the namespace must be registered in `app.config.ts` (see `localization.md`).
- Adding a condition or effect variant means extending the union **and** the switch in `checkCondition`/`applyEffects`, plus `getConditionLabel` in the component if it can be a requirement. Use the `add-dialogue-effect` skill.
- Flags (`{ type: 'flag' }`) are write-only for data: no condition reads them. Only the engine reads `met_<npcId>`.

## Known issues
- **In-progress branches are unreachable.** The trees were written with `active` meaning "in progress" while the engine treated it as "ready to advance". The rename to `readyToAdvance` kept that behavior, so results meant for "quest in progress" still use `readyToAdvance`. They need switching to `active`.
- Finn's quest hub lists the Big Game offer before the Fetches and Fangs turn-in, so Fetches and Fangs can't be turned in (blocks the Mawood questline).
- `getConditionLabel` has no labels for the `many*` conditions (Sylvie's and Brenna's turn-ins show unlabeled requirements).
- Nodes with no visible options after a quest starts: Josh `workInfo`, Milo `questWhatLurksAccept`.
- `selectOption` picks its result by visibility only. It does not skip already-started quest starts the way `getActiveResult` does, so the executed branch can differ from the shown one.
- Gold fees in dialogue (`stat` `deduct` of `goldCoins`, Bartender and Josh) are not gated, so gold can go negative. Owner decision: block spending when the player can't afford it (`player-stats-inventory-equipment.md`).
- `item` `give` effects (quest rewards in dialogue) don't check inventory space; overflow is discarded.
- Unreachable nodes: Josh `missionCheck`, Corwin `aboutMawood` (`npm run validate` warnings).

## How to extend
New NPC or new branches: the `add-npc-dialogue` skill. New quests: `add-quest`. Check a tree: `audit-dialogue`.
