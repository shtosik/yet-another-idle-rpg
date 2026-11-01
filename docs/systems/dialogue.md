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
2. For each option, the shown branch is `getActiveResult`: the **first** result whose `visibilityConditions` all pass, skipping results that start a quest which isn't `available`. An option with no matching result is hidden.
3. `requirementsNeeded` on that result are shown as labels; if any fail, the option is disabled. If the result's item gains (`give` effects, quest item rewards) don't fit after its removals, the option is disabled with a tag naming each short tab, e.g. "1 Materials slot needed" (`DialogueManagerService.missingSlots`, per tab). If its `deduct` gold effects cost more than the player has, it is disabled with an "N more gold needed" tag (`missingGold`): gold never goes negative.
4. On click, `selectOption` runs the same `getActiveResult` branch: it applies `effects` in order, then closes (`closeDialogue: true`) or moves to `next`.

## Conditions (quest)
`{ type: 'quest', questId, questState, step? }` uses `QuestState`:
- `notStarted`, `completed` — plain status.
- `available` — not started and `startRequirements` met.
- `active` — started (optionally at `step`).
- `readyToAdvance` — active (optionally at `step`) **and** the current step's requirements are met. Use this for turn-in branches.

Kill-count requirements inside quest conditions count kills since the quest reached its current step (see `quests.md`). Quest requirements are checked by `QuestsStore.requirementProgress`, the same check the quest panel uses for its progress and Ready tag.

## Conditions (reputation)
`{ type: 'reputation', townId, tier }` passes when `PlayerStore.townTier(townId) >= tier`. Gate a free or extra branch with it, before the paid one; with `hidden: true` it stays a silent gate. A shown lock label is `reputationLockText` ("Requires Mawood Honored — 140/200"). See `towns-shops-guild.md`.

## Conditions and effects (arena)
`{ type: 'arena', state: 'ready' | 'running' | 'rewardsWaiting' }`: ready to enter (no run, entry cooldown over) / a run going on / clear rewards waiting to be claimed. The `arena` effect's `action` is `enter` (start a run; pair it with the fee's `stat` deduct) or `claim` (move the waiting rewards into the inventory; counted by `missingSlots`). See `arena.md`.

## Effects (reputation turn-in)
`{ type: 'reputationTurnIn', npcId, bundles: 'one' | 'all' }` hands `npcId`'s `REPUTATION_TURN_INS` item over: one full bundle, or every full bundle held, for town reputation through `ReputationService.gain`. `DialogueManagerService.turnIn` keeps back what the current steps of active quests need; `canApplyResult` disables the option without a full bundle beyond that, and `getActiveResult` skips it (hiding the option) once the town is Exalted. The shared response keys `quests:reputation.turnInOne`/`turnInAll` get `amount`, `item`, `held` and `kept` from `getResponseParams` (the `_kept` variant when quests keep some back); the effect tag shows "+10 La Harpar reputation". See `towns-shops-guild.md`.

## Invariants & gotchas
- **Order results from most specific to least.** Quest hubs go: turn-in (`readyToAdvance`) → in progress (`active`) → offer (`available`) → fallback. An NPC with several questlines (Finn) lists every turn-in, then every in-progress, then every offer.
- A turn-in result is just `readyToAdvance` + `advance`/`end`. The store takes the step's items; don't restate them as `requirementsNeeded` or `take`. The turn-in NPC must match the step's `turnInNpc` in `QUEST_DATA` (`npm run validate` checks that their dialogue handles the quest).
- **Talk steps** (`requirements: []`, "go tell Sylvie") are `readyToAdvance` the moment they start. The giver's reminder for that step checks `active` with `step: N` and goes after the previous step's turn-in; the turn-in itself is its own option on the turn-in NPC's `default` node, gated by `readyToAdvance` with `step: N` (e.g. Safe Passage, Roots and Rafters).
- Lore links into an offer node also need an `available` result, plus a fallback result so the option stays usable.
- Node ids are the enum values; `default = 0` is the start node for returning players.
- Every `next` must exist and every node should be reachable. `npm run validate` checks both (unreachable = warning).
- Dialogue text keys are `dialogues/<npcKey>:<node>.<field>`, and the namespace must be registered in `app.config.ts` (see `localization.md`).
- Adding a condition or effect variant means extending the union **and** the switch in `checkCondition`/`applyEffects`, plus `getConditionLabel` in the component if it can be a requirement. Use the `add-dialogue-effect` skill.
- Flags: a `flag` effect sets one; the `flag` condition (`name`, `isSet`) reads it, e.g. to charge a fee only once (the Bartender's three paid answers and Josh's beer: `bartender_paid_for_*`, `josh_paid_beer`), or to give an item once (the Exalted town pets: `bartender_gave_pet`, `corwin_gave_pet`, set by the same result that gives the pet, so a full inventory leaves the offer open). The engine reads `met_<npcId>`.

## Known issues
- Gold fees in dialogue (`stat` `deduct` of `goldCoins`, Bartender and Josh) are not gated, so gold can go negative. Owner decision: block spending when the player can't afford it (`player-stats-inventory-equipment.md`).

## How to extend
New NPC or new branches: the `add-npc-dialogue` skill. New quests: `add-quest`. Check a tree: `audit-dialogue`.
