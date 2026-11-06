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

## Effects (Forge)
`{ type: 'forge' }` has no payload. `DialogueManagerService.applyEffects` calls `TownsStore.openForge()` to show the Forge panel inline in the current town building, closing any shop. The building view is destroyed, which closes its dialogue just as opening a shop does. The effect tag uses `forge:open` ("Open Forge"). The panel closes on building/town navigation and is not restored after reload. Phurgo uses it from his returning hub, restored Forge lore and quest completion node; all three results require `QuestState.completed` for `QuestID.theColdForge`. See `towns-shops-guild.md` for the panel and `player-stats-inventory-equipment.md` for merge rules.

Phurgo's first-meet exits set `met_12`. His hub puts step 5, 4 and 2 turn-ins before exact-step active reminders, then the available offer, the completed service and lore. Both offer routes check availability, with a fallback on the Forge lore link. Ludo's hub advances only ready step 1 and Marvin's hub advances only ready step 3, before their existing Arena and Exploration Guild business. Phurgo's reminders for those talk steps never advance them. The full script is in `docs/ideas/gear-upgrading-cold-forge.md`; Marvin's salvage lore leads into the same tradition as his independent Pathfinder's Seal registration.

Phurgo's completed-Quest hub also offers "How does your Forge work?" immediately after the Forge-opening option. This read-only branch runs through `forgeWork`, `forgeCost` and `forgeLimits`; each node can return to `default`. It explains matching pieces, preservation of worn gear, the consumed spare, bench preview, gold costs, five workings and exclusions in workshop language, without opening the Forge or spending anything.

## Effects (Pathfinder's Seal)
`{ type: 'registerPathfindersSeal' }` has no payload. It calls `PlayerStore.registerPathfindersSeal()`, which atomically consumes one held Seal and sets the saved permanent `upgradedDropChance` bonus to the tuning constant (10%). Possession and non-registration are rechecked both by `canApplyResult` and the store; an invalid or repeated effect consumes nothing, grants nothing and cannot advance to the success node. The label uses `dialogues/laHarparMarvin:sealEffect`. Marvin's option uses existing item/stat conditions, requires one Seal, and precedes contract/store options but follows quest business. A positive permanent bonus replaces the proposed `pathfindersSealRegistered` dialogue flag everywhere: registration visibility, reminder visibility and chest suppression. No separate flag is saved. The success and reminder scripts describe a permanent salvage lesson, independent of The Cold Forge.

## Conditions (quest)
`{ type: 'quest', questId, questState, step? }` uses `QuestState`:
- `notStarted`, `completed` — plain status.
- `available` — not started and `startRequirements` met.
- `active` — started (optionally at `step`).
- `readyToAdvance` — active (optionally at `step`) **and** the current step's requirements are met. Use this for turn-in branches.

Kill-count requirements inside quest conditions count kills since the quest reached its current step (see `quests.md`). Quest requirements are checked by `QuestsStore.requirementProgress`, the same check the quest panel uses for its progress and Ready tag.

Any condition takes `not: true` to pass when it would fail. Use it to keep an in-progress reminder (`active` + not `readyToAdvance`) from showing beside the same quest's turn-in option.

## Conditions (reputation)
`{ type: 'reputation', reputationId, tier }` passes when `PlayerStore.reputationTierOf(reputationId) >= tier`. Gate a free or extra branch with it, before the paid one; with `hidden: true` it stays a silent gate. A shown lock label is `reputationLockText` ("Requires Mawood Honored — 140/200"). See `towns-shops-guild.md`.

## Condition and effect (profession)
`{ type: 'professionLevel', professionId, level }` passes when `PlayerStore.professionLevel(professionId) >= level` (0 while the profession is locked, so `level: 1` means unlocked); it is the same type quests use as a requirement, and its label reads 'Farming expertise 5'. The `{ type: 'unlockProfession', professionId }` effect calls `PlayerStore.unlockProfession` (idempotent) and its tag reads 'Learn Farming'. See `player-stats-inventory-equipment.md`. The `{ type: 'unlockSite', siteId }` effect opens a Site (`applyUnlockTarget`, so the Map tab unlocks too) and shows the `unlocks:sites.<id>` popup the first time; its tag reads 'Farm opens on the map'.

## Condition (farm seeds)
`{ type: 'farmSeeds', atLeast }` passes when the seed tally (`PlayerStore.farm().seeds`, all kinds summed) holds at least `atLeast` seeds. Marta's first-meet node uses it to pick `introSeeds` or `introNoSeeds`.

## Farming Guild dialogue
`farmWarden` (Marta) and `farmDrover` (Wick) stand on the farm Site (`SITES_DATA`). Marta's `intro1` sets `met_farmWarden`; `introLetter` ("Here's her letter") ends `seedsFromTheTerrace` (the talk step) and takes the Guild Letter, then the intro plays on; without the letter, `introGate` does the same. Her hub lists turn-ins, then in-progress reminders, then offers, then the seed shop (once `theFirstFurrow` is started), the Exalted hare gift (`petFarmingGuildHare`, flag `warden_gave_pet`, needs a free Pets slot) and lore. `theGrowersTable` shows disabled with the reputation lock text until Honored. An order's offer is one option with `requirementsNeeded` `turnInCooldown ready`, so while it cools it stays, disabled, with the "Ready in 1 h 12 m" tag. The pick is rolled when the order starts, so the offer and reminder nodes cannot name it; the quest panel does. Wick (`met_farmDrover`) only has his order hub and lore. Sylvie's new nodes (`seedsFromTheTerrace` offer, whose accept option starts the quest, gives the letter and opens the Site and Farming; `silverleafForSylvie`) sit on options in her `default` node beside `work`. Corwin's `farmFinaleLine` shows once after `theGrowersTable` (flag `corwin_heard_table`).

## Conditions and effects (arena)
`{ type: 'arena', state: 'ready' | 'running' | 'rewardsWaiting' }`: ready to enter (no run, entry cooldown over) / a run going on / clear rewards waiting to be claimed. The `arena` effect's `action` is `enter` (start a run; pair it with the fee's `stat` deduct) or `claim` (move the waiting rewards into the inventory; counted by `missingSlots`). See `arena.md`.

## Effects (reputation turn-in)
`{ type: 'reputationTurnIn', npcId }` hands one full bundle of `npcId`'s `REPUTATION_TURN_INS` item over for reputation through `ReputationService.gain`, then starts that bundle's cooldown (`QuestsStore.recordTurnIn`). `DialogueManagerService.turnIn` keeps back what the current steps of active quests need and returns 0 bundles while the bundle cools down; `canApplyResult` disables the option without a full bundle beyond that, and `getActiveResult` skips it (hiding the option) once the town is Exalted. The shared response key `quests:reputation.turnIn` gets `amount`, `item`, `held` and `kept` from `getResponseParams` (the `_kept` variant when quests keep some back); the effect tag shows "+10 La Harpar reputation". See `towns-shops-guild.md`.

## Condition (turn-in cooldown)
Every turn-in has its own cooldown, keyed by a `TurnInKey` (`src/app/store/quests/turn-in-cooldown.ts`): `bundle:<NpcID>:<ItemID>` for a reputation bundle (`bundleKey`), `order:<QuestID>` for a repeatable order (`orderKey`; `marthasOrder` and `wicksOrder`). `QuestsStore.lastTurnInAt` (saved, epoch ms) holds when each last ran. The wait is `TURN_IN_COOLDOWN_MS` (2 h) shortened by the `turnInCooldownReduction` stat (capped at 75%), computed from that time on every read, so a stat gained later shortens a running cooldown; a clock set back counts as no time passed. `{ type: 'turnInCooldown', key, state: 'ready' | 'cooling' }` passes when the turn-in is off cooldown or still cooling. Author the turn-in option with `requirementsNeeded: [{ type: 'turnInCooldown', key, state: 'ready' }]`: while cooling the option is disabled and shows a "Ready in 1 h 12 m" tag; `validate` requires it on each `REPUTATION_TURN_INS` giver. `TurnInCooldownService` holds the shared 1 s clock (ticked by `GameIntervalService`) behind the tag and the badge on the NPC's portrait (`npc-frame`), which shows the soonest ready time only when all of that NPC's turn-ins are cooling.

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
