---
name: add-npc-dialogue
description: Use when adding a new NPC with a dialogue tree, or expanding an existing NPC's dialogue. Wires the NpcID, dialogue file, NPC registry, dialogue union, i18n namespace, town placement and avatar. Triggers on "add a new NPC", "create dialogue for X", "wire up the blacksmith dialogue", "new conversation tree".
---

# Add NPC dialogue

Engine rules and condition meanings: `docs/systems/dialogue.md`. Read it first if you haven't this session.

For **expanding** an existing NPC, do only steps 2 (new nodes and options), 5 (keys) and 8.

## Steps

1. **NpcID** — append the next value to `src/enums/map/npc-id.enum.ts:NpcID`. The key name (`<town><Name>`, e.g. `mawoodElarion`) is reused as the file name, i18n namespace and avatar file name.

2. **Dialogue file** — create `src/data/dialogues/<town>Town/<npcKey>.ts`, modeled on `src/data/dialogues/mawoodTown/mawoodElarion.ts`:
   - `export enum <Name>Dialogue { default = 0, intro1, … }` — `default` (0) is where returning players start.
   - `export type <NpcKey>DialogueType = Record<<Name>Dialogue, DialogueNode<<Name>Dialogue>>` and a default export of the graph.
   - `const NS = 'dialogues/<npcKey>'`; every `messageKey` / `responseKey` is `` `${NS}:<node>.<field>` ``.
   - The intro node: every option sets `{ type: 'flag', name: \`met_${NpcID.<npcKey>}\` }` and leads to `default`.
   - Hub nodes end with a goodbye option: `results: [{ closeDialogue: true }]`.
   - Results within an option go most specific first; quest hubs follow the order in `docs/systems/dialogue.md`.
   - Gold fees get a `requirementsNeeded` `stat` `goldCoins` `gte` check, so the option is disabled when the player can't pay.

3. **Registry** — add an entry to `src/data/npc-data.ts:NPC_Data`: `id`, `url: './assets/img/avatars/<town>/<npcKey>.png'`, `dialogue`, and `firstMeetNodeId: <Name>Dialogue.intro1` if the NPC has an intro.

4. **Union** — import the type and add it to `src/data/dialogues/types.ts:DialogueType`.

5. **i18n** — create `src/assets/locales/en/dialogues/<npcKey>.json` with a key for every `messageKey`/`responseKey`, and add `npc:names.<npcKey>` to `src/assets/locales/en/npc.json`.

6. **Register the namespace** — add `'dialogues/<npcKey>'` to `translations` in `src/app/app.config.ts`.

7. **Place and draw** — add `{ id: NpcID.<npcKey>, position: { x, y } }` (percent of the building view) to a building's `npcs` in `src/data/towns-data.ts`. Clicking the NPC frame starts the dialogue. Generate the avatar with `/generate-2d-asset` (portrait briefs live in `docs/character/<town>/`).

8. **Check** — run the `audit-dialogue` skill on the file.

Done when `npm run check` passes and `audit-dialogue` reports no blockers.
