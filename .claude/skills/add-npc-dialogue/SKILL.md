---
name: add-npc-dialogue
description: Use when the user wants to add a new NPC to the game with a dialogue tree, or expand an existing NPC's dialogue. Wires the data file, NPC registry, i18n keys, and start-node routing in one pass. Triggers on phrases like "add a new NPC", "create dialogue for X", "wire up the blacksmith dialogue", "new conversation tree".
---

# Add NPC Dialogue

Adding an NPC to this game touches **five** files plus i18n. Skip any one and the dialogue
either doesn't load, doesn't route, or doesn't display strings. Follow the order below.

## Prerequisites — read first
- `src/types/dialogues/dialogue-effect.type.ts` — known effect variants
- `src/types/dialogues/dialogue-condition.type.ts` — known condition variants
- `src/app/services/dialogue-manager.service.ts` — engine (especially `startDialogue` heuristic)
- `docs/analysis/dialogue-system-analysis.md` §5.4 — known bug in start-node routing

## Step 1 — Register the NpcID
File: `src/enums/map/npc-id.enum.ts`
Add the new enum entry. **Avoid renumbering existing entries** — they're serialised in save data.

## Step 2 — Author the dialogue file
Path: `src/data/dialogues/<town>/<npcName>.ts`

Skeleton:
```ts
import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'
import { NpcID } from '../../../enums/map/npc-id.enum'

export enum <NpcName>ConversationID {
  default = 0,            // ← MUST be 0 — the engine uses 0 as the returning-player root
  introduction1 = 1,      // ← MUST be 1 — first-visit node (see §5.4 in analysis doc)
  // ...more nodes
}

export type <NpcName>DialogueType =
  Record<<NpcName>ConversationID, DialogueNode<<NpcName>ConversationID>>

const NS = 'dialogues/<npcName>'

const <NPC_NAME>: <NpcName>DialogueType = {
  [<NpcName>ConversationID.default]: { /* hub node */ },
  [<NpcName>ConversationID.introduction1]: {
    id: <NpcName>ConversationID.introduction1,
    messageKey: `${NS}:introduction1.message`,
    options: [
      {
        responseKey: `${NS}:introduction1.opt1`,
        results: [{
          next: <NpcName>ConversationID.default,
          effects: [{ type: 'flag', name: `met_${NpcID.<npcName>}` }],
        }],
      },
    ],
  },
}

export default <NPC_NAME>
```

### Authoring rules (enforced by the engine, not by types)
1. **`default = 0` and `introduction1 = 1`** — `startDialogue` assumes this. Violating it
   sends first-visit players to the wrong node ([Josh/Elara bug](../../../docs/analysis/dialogue-system-analysis.md#54)).
2. **At least one path through the intro must set the `met_${NpcID.x}` flag** — otherwise
   the player re-enters the intro on every visit.
3. **Every "goodbye" option needs `closeDialogue: true`** — there is no close button in
   the modal (`dialogue.component.html`, line 5 is commented out).
4. **Results with conditions go first, fallback last** — `selectOption` picks the first
   `results[]` entry whose `visibilityConditions` pass.
5. **Don't put `next` and `closeDialogue: true` together** — `closeDialogue` wins, `next`
   becomes dead.

## Step 3 — Register in `npc-data.ts`
File: `src/data/npc-data.ts`
```ts
import <NPC_NAME> from './dialogues/<town>/<npcName>'

const NPC_Data: Record<number, NPCProps> = {
  // ...existing
  [NpcID.<npcName>]: {
    id: NpcID.<npcName>,
    url: './assets/img/avatars/<town>/<npcName>.png',
    dialogue: <NPC_NAME>,
  },
}
```

## Step 4 — Add the dialogue union member
File: `src/data/dialogues/types.ts`
```ts
import { <NpcName>DialogueType } from './<town>/<npcName>'

export type DialogueType =
  | LaHarparBartenderDialogueType
  | <NpcName>DialogueType  // ← add here
  // ...
```

## Step 5 — Add the i18n keys
For each `messageKey` / `responseKey` you authored, add entries to the i18n bundles
under the `dialogues/<npcName>` namespace. Always add NPC name to `npc:names.<NpcID name>`.

Skeleton per node:
```json
{
  "default": {
    "message": "Hello again, traveller.",
    "opt1": "Tell me about the village."
  }
}
```

## Step 6 — Place the NPC in the world
If the NPC lives in a town building: register them in `src/data/towns-data.ts` (or
wire to whichever building component opens dialogue — e.g.,
`exploration-guild.component.ts` calls `dialogueService.startDialogue(NpcID.laHarparMarvin)`
directly).

If the NPC is associated with a quest, ensure `QUEST_DATA` references whichever IDs
your effects use (`questId: QuestID.x`).

## Step 7 — Smoke test
1. Start dev server, talk to the NPC for the **first** time → should land on `introduction1`.
2. Close the dialogue, re-open → should land on `default`.
3. Walk every option at least once. Watch for `console.error("No valid branch found...")` —
   that means a result is unreachable.
4. Verify the `met_${NpcID.x}` flag is in `localStorage` under the `questsStore` key.

## Common authoring mistakes
- Using `1` for something other than `introduction1` — first-visit lands on the wrong node.
- Forgetting `closeDialogue: true` on the goodbye option — player gets trapped.
- Adding a `requirementsNeeded` and assuming the engine enforces it (today it doesn't —
  see `fix-dialogue-bugs` skill).
- Using condition types other than `stat`, `manyStat`, `quest` — they currently
  silently pass (`default: return true` in `checkCondition`).

When the user has finished authoring, suggest running the `audit-dialogue` skill on the new file.
