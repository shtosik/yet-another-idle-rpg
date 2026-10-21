---
name: audit-dialogue
description: Use to audit an NPC dialogue tree for logic bugs the validator can't see — quest hub ordering, ungated quest starts, dead ends, unpaid gold fees, turn-ins that drift from quest data. Triggers on "audit this dialogue", "check Elara's dialogue", "is this NPC wired correctly?", "find dialogue bugs in X".
---

# Audit a dialogue tree

Read-only audit of one NPC file in `src/data/dialogues/<town>/<npcKey>.ts`. Report findings; fix nothing unless the user asks.

Background: `docs/systems/dialogue.md` (engine rules, `QuestState` meanings, known issues) and `docs/systems/quests.md`.

## Steps

1. **Pick the target.** Use the path the user gave; otherwise ask which NPC.
2. **Run `npm run validate`** and copy every line mentioning this NPC (broken `next`, missing start node, unreachable nodes, missing i18n keys). These are mechanical; don't re-derive them by hand.
3. **Walk every option of every node** and apply each check below. Note `file:line` for each finding.
4. **Report** under three headings, in order: `## Blockers` (player gets stuck, loses progress or resources), `## Wrong branch shown` (ordering or condition bugs), `## Style`. One line per finding, with `file:line` and the fix. If nothing is found, say so in one line.

## Checks

**Quest hubs** — for each option with several results, results are tried top to bottom and the first visible one wins:
- Order must be turn-in (`readyToAdvance`) → in progress (`active`) → offer (`available`) → fallback. A broader result above a narrower one shadows it.
- A result meant for "quest in progress" must use `QuestState.active`; `readyToAdvance` only fires when the step's requirements are met.
- Every quest-start effect sits behind an `available` condition, including starts reached through lore links.
- A turn-in's `requirementsNeeded` and `item` `take` amounts match the step's `requirements` in `src/data/quests-data.ts:QUEST_DATA`.
- `take` effects come before `advance`/`end` in the same result, so freed slots count toward rewards.

**Paths**
- The first-meet node (`firstMeetNodeId` in `src/data/npc-data.ts`) has every path set the `met_<NpcID>` flag.
- Every node reachable after a quest starts still shows at least one option (a dead end otherwise).
- Every hub node has a goodbye option (`closeDialogue: true`).

**Costs**
- A `stat` `deduct` of `goldCoins` has a matching `requirementsNeeded` gold check, and a repeated fallback doesn't charge on every click.

**Labels**
- Requirements using `many*` conditions render without a label (`getConditionLabel` lacks them); flag them so the author knows.

Done when every node's options have been checked against every rule above, and `npm run validate` and `npx ng build` pass.
