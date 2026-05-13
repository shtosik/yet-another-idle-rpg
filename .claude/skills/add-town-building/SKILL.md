---
name: add-town-building
description: Use when adding a new building to a town — a new tab in the town view with NPCs, optional interactive objects (zone entrances), and optional dialogue-driven mechanics. Triggers on phrases like "add a new building", "add a blacksmith to the town", "create a new guild tab", "add a building to laHarpar".
---

# Add a Town Building

A building is a tab in a town, backed by `TownBuilding` in `src/data/towns-data.ts`.
Adding one touches data, enums, assets, i18n, and NPC wiring. Optionally it also
adds dialogue nodes and new effect/condition types.

## Files overview

| File | Role |
|---|---|
| `src/enums/map/town-tab-id.enum.ts` | `TownBuildingID` enum — the tab identifier |
| `src/data/towns-data.ts` | Building definition (URL, NPC list, optional objects) |
| `src/data/npc-data.ts` | NPC registry — maps `NpcID` to avatar URL + dialogue |
| `src/enums/map/npc-id.enum.ts` | `NpcID` enum entries for NPCs in the building |
| `src/data/dialogues/<town>/` | Per-NPC dialogue tree file |
| `src/assets/locales/en/dialogues/` | Per-NPC i18n JSON |
| `src/app/app.config.ts` | Register the i18n namespace in the `translations` array |
| `src/assets/img/backgrounds/` | Building background image |
| `src/assets/img/avatars/<town>/` | NPC avatar images |
| `src/assets/locales/en/map.json` | Building tab label under `townTabs.<TownBuildingID name>` |

## Step 1 — Register the tab ID

`src/enums/map/town-tab-id.enum.ts` — add the new entry. Never renumber existing values.

```ts
export enum TownBuildingID {
  tavern = 0,
  market,
  shop,
  explorationGuild,
  blacksmith,   // ← new
}
```

## Step 2 — Add the building to the town

`src/data/towns-data.ts` — append to the `buildings` array of the target town:

```ts
{
  tabId: TownBuildingID.blacksmith,
  npcIds: [
    {
      id: NpcID.laHarparSmith,
      position: { x: 60, y: 50 },   // % from top-left of the background
    },
  ],
  url: './assets/img/backgrounds/laHarparBlacksmith.png',
},
```

`position.x` / `position.y` are CSS `left` / `top` percentages for the NPC avatar on
the building background. Test by eye in the browser.

Optional — `objectsIds` for zone entrances:

```ts
objectsIds: [
  {
    type: 'zone',
    zoneId: ZoneID.someZone,
    requirement: { type: UnlockRequirementType.quest, questId: QuestID.x, step: 0 },
    position: 'top-1/2 left-[30%] -translate-y-1/2',
    url: './objects/door.png',
    name: 'Some Zone Entrance',
  },
],
```

## Step 3 — Register NPCs

For each NPC in the building:

1. Add to `src/enums/map/npc-id.enum.ts`.
2. Add a dialogue file at `src/data/dialogues/<town>/<npcName>.ts`.
   **Convention (enforced by engine):**
   - `default = 0` — returning-player hub node
   - `introduction1 = 1` — first-visit node (only if NPC has an intro flow)
   - Introduction path must call `effects: [{ type: 'flag', name: 'met_${NpcID.x}' }]`
   - Hub node must have at least one `closeDialogue: true` goodbye option
3. Add to `src/data/dialogues/types.ts` union.
4. Add to `src/data/npc-data.ts` with `firstMeetNodeId: 1` if the NPC has an intro,
   or leave it out if every visit starts at `default`.
5. Add i18n at `src/assets/locales/en/dialogues/<npcName>.json`.
6. Register the namespace in `src/app/app.config.ts` translations array.
7. Add NPC avatar at `src/assets/img/avatars/<town>/<npcName>.png`.
8. Add the NPC name to `src/assets/locales/en/npc.json` under `names.<NpcID key>`.

## Step 4 — Add the tab label

`src/assets/locales/en/map.json` — add under `townTabs`:

```json
"townTabs": {
  "tavern": "Tavern",
  "blacksmith": "Blacksmith"
}
```

## Step 5 — Add background image

Place the background at `src/assets/img/backgrounds/<fileName>.png`.
The `url` field in towns-data uses `./assets/img/...` paths.

## Step 6 — (Optional) Dialogue-driven mechanics

If the building introduces a new gameplay loop driven through dialogue (like
the Exploration Guild's task system), you need new `DialogueEffect` and/or
`DialogueCondition` variants. Use the `add-dialogue-effect` skill for this.

The Exploration Guild is the reference implementation:
- `GuildEffect` in `src/types/dialogues/dialogue-effect.type.ts`
- `GuildCondition` in `src/types/dialogues/dialogue-condition.type.ts`
- Handled in `dialogue-manager.service.ts` (`checkCondition`, `applyEffects`)
- Labelled in `dialogue.component.ts` (`getConditionLabel`, `getEffectLabel`)
- Coloured in `dialogue.component.sass`

**Do NOT create a custom UI component for building-specific mechanics** unless the
mechanic is purely passive/informational and has no dialogue hooks. All player-facing
interaction should live in Marvin-style dialogue trees so the engine handles
visibility, requirement gating, and effects uniformly.

## Step 7 — Smoke test

1. Build tab shows up in the town navigation.
2. Background image loads.
3. NPC avatar is clickable and opens dialogue.
4. First visit routes to `introduction1` (if defined), subsequent visits to `default`.
5. After the intro, `met_${NpcID.x}` flag appears in localStorage under `questsStore`.
6. Any new dialogue effects fire correctly and update store state.
7. `npx tsc --noEmit` passes.

## Common mistakes

- Forgetting to register the i18n namespace in `app.config.ts` — all dialogue text
  shows as raw keys.
- Setting NPC avatar `position` to `{ x: 0, y: 0 }` (top-left corner) and forgetting
  to adjust — always set a sensible position.
- Adding gameplay UI as a separate component mounted via `town-building.component.html`
  conditional — this was the old `<app-exploration-guild>` anti-pattern. Use dialogue.
- Using `firstMeetNodeId` without having a node at that id in the dialogue enum — the
  dialogue silently shows an empty screen.
