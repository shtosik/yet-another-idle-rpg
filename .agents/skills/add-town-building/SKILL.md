---
name: add-town-building
description: Use when adding a building to a town — a building button on the town view with its own background and NPCs, or a zone entrance — optionally gated by a quest or driven by dialogue mechanics. Triggers on "add a new building", "add a blacksmith to the town", "add a building to laHarpar", "add an entrance to the Deepwood".
---

# Add a town building

Background: `docs/systems/towns-shops-guild.md`. Building-specific gameplay goes through NPC dialogue (`GuildEffect`/`GuildCondition` for the Exploration Guild are the model), not a custom component.

## Steps

1. **TownBuildingID** — append the next value to `src/enums/map/town-building-id.enum.ts:TownBuildingID` (keys are `<town><Name>` for town-specific buildings, e.g. `mawoodApothecary`).

2. **Building entry** — append to the town's `buildings` in `src/data/towns-data.ts`:
   ```ts
   {
     buildingId: TownBuildingID.mawoodBlacksmith,
     position: { x: 40, y: 60 },          // button position on the town view, % of width/height
     npcs: [{ id: NpcID.mawoodSmith, position: { x: 50, y: 55 } }],   // % on the building view
     url: './assets/img/backgrounds/mawoodBlacksmith.png',
     questRequirement: QuestID.someQuest, // optional: hidden until this quest has started
   },
   ```
   For a **zone entrance**, set `zoneId` and omit `url` and NPCs; clicking it travels to the zone. Give it a `questRequirement`: starting that quest unlocks the zone (see `docs/systems/zones-waves-unlocks.md`).

3. **Label** — `map:buildings.<buildingKey>` in `src/assets/locales/en/map.json`.

4. **Background** — `/generate-2d-asset` for `src/assets/img/backgrounds/<buildingKey>.png` (town backgrounds use the `town-painterly` family).

5. **NPCs** — for each new NPC, run `add-npc-dialogue` (step 7 there places them using the `npcs` entry above).

6. **New mechanic** (optional) — new dialogue effects or conditions via `add-dialogue-effect`.

Done when `npm run validate` and `npx ng build` pass, and in the dev server the building button appears (after its quest, if gated) and opens the building or zone.
