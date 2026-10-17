# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # dev server (ng serve)
npm run build      # production build
npm test           # karma/jasmine tests (ng test)
npm run tile       # regenerate world map tiles (node scripts/tile-map.mjs)
npm run test:assets # asset-gen pipeline tests (node:test, no GPU needed)
```

## Role

You're Senior Game Programmer. Prioritize good game design, user experience and optimization for web application. Write code that is readable with modern Angular standards, use signals. Ask questions if needed.

## Communication Guidelines

- Always think through the problem before executing code.
- If a requirement is ambiguous or if you need more information to provide the best solution, **ask me a clarifying question** before proceeding.
- Do not make assumptions about my project architecture if the answer isn't clear from the existing files.

## Architecture

**Stack:** Angular 20 standalone components, NgRx Signal Stores, Angular Material, SASS, i18next, Leaflet.

Change detection is `OnPush` throughout; inject services via `inject()`, not constructor DI.

### Directory layout

```
src/
├── app/
│   ├── components/game/    # Feature tabs: battle, inventory, equipment, skill-tree, world-map,
│   │                       #   bestiary, crafting, town, spellbook, quests, player-stats, dialogue, game-menu
│   ├── components/modals/  # Shop, quest-completed, respec-confirm
│   ├── components/shared/  # Reusable UI (panel, slot, spinner, close-button)
│   ├── services/           # Business logic (battle-manager, dialogue-manager, modal, …)
│   └── store/              # NgRx signal stores (player, battle, quests, shop, towns, helpers)
├── data/                   # All static game content as typed TS objects
│   └── dialogues/          # Per-NPC dialogue trees
├── enums/                  # Numeric enums for every entity type, split by domain:
│   ├── ids/                #   EnemyID, ItemID, QuestID, ZoneID, SkillTreeNodeID, SpellID, …
│   ├── items/              #   ItemType, ItemTier
│   ├── map/                #   NpcID, TownID, RegionID, TownObject, TownTabID
│   └── *.enum.ts           #   loose top-level enums (DamageElement, EquipmentSlot, …)
├── interfaces/             # TypeScript interfaces
├── types/                  # Discriminated unions (DialogueEffect, DialogueCondition, …)
└── assets/
    ├── locales/en/         # i18next JSON translation files, one per namespace
    ├── maps/               # Leaflet tile data
    └── img/                # Enemy sprites, NPC avatars, backgrounds
```

`NpcID` lives in `enums/map/npc-id.enum.ts`, not `enums/ids/` — check the subfolder before importing an enum.

### State management

Stores live in `src/app/store/` and follow this pattern:

```ts
signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withGameStateSync(STORE_KEY, initialState),  // custom persistence hook
  withDevtools(STORE_KEY),
  withComputed(...),
  withMethods(...)
)
```

`PlayerStore` is the central store: player stats, inventory, equipment, unlocked skill nodes, quest state, explored zones. `BattleStore` owns current enemy/zone/wave/combat state and active spells.

### Game loop

`GameIntervalService.initGameLoop()` ticks every 100 ms. Each tick accumulates attack cooldown and fires auto-attacks; 1-second ticks handle shop refresh cooldowns. `BattleManagerService` owns damage calc, spell casting, crits, and enemy-death handling.

### Data conventions

- All entities are identified by numeric enums, mostly in `src/enums/ids/` (`EnemyID`, `ItemID`, `QuestID`, `ZoneID`, `SkillTreeNodeID`, `SpellID`, …) — `NpcID` and other map-related enums live in `src/enums/map/` instead.
- Data keyed by enum: `ENEMIES_DATA[enemyId]`, `ITEM_DATA[itemId]`, etc.
- Discriminated unions (`DialogueEffect`, `DialogueCondition`) drive dialogue logic — add new variants by extending the union **and** the switch in `DialogueManagerService`.

### Dialogue system

Each NPC has its own dialogue file in `src/data/dialogues/` with a per-NPC enum for node IDs. Dialogue nodes hold `results[]`; the engine picks the first result whose `visibilityConditions` all pass. Effects are applied imperatively in `DialogueManagerService.applyEffects()`. Known engine quirks are documented in `docs/analysis/dialogue-system-analysis.md`.

### Localization

Translation keys follow a namespace-per-feature scheme. Templates use the `translate` pipe:

```html
{{ 'namespace:key' | translate }}
```

Namespaces: `app`, `enemies`, `items`, `skill-tree`, `quests`, `npc`, `dialogues/*`.

### Adding new content

The typical pattern for adding a new game entity:

1. Add an ID to the relevant enum in `src/enums/ids/`.
2. Add a data entry in `src/data/*-data.ts` typed against the existing interface.
3. Add i18n keys to the appropriate JSON file under `src/assets/locales/en/`.
4. Wire any store/service references.

Skills (slash commands, in `.claude/skills/`) are available for common additions: `/add-npc-dialogue`, `/add-shop`, `/add-town-building`, `/add-dialogue-effect`, `/add-equipment-item`, `/add-monster-weakness`, `/add-shiny-variant`, `/generate-2d-asset`, `/angular-developer`. A few maintenance skills (`audit-dialogue`, `fix-dialogue-bugs`, `fix-leaflet-tile-gaps`, `update-shiny-enemy-visuals`) exist but are toggled off in `.claude/settings.local.json` — re-enable there before invoking.

Art generation (item icons, enemy sprites, portraits, zone and town backgrounds) runs through the `asset-generator` agent (`.claude/agents/asset-generator.md`), which drives `scripts/asset-gen/generate.mjs` and its Style Families. Prefer `/generate-2d-asset` to brief it. See `docs/analysis/asset-pipeline.md`.

Narrative/world-building (character personalities, dialogue scripts, zone lore, town/building
descriptions) is the `lore-writer` agent (`.claude/agents/lore-writer.md`) — docs-only, writes
under `docs/character/` and `docs/design/`, never touches `src/` or assigns real IDs. Run it
before `/add-npc-dialogue` or `/add-town-building` to get the source material those skills wire
into code.

### Analysis docs

`docs/analysis/` contains detailed write-ups for major systems (dialogue, skill-tree, map, shop, shiny enemies, bestiary). Read the relevant doc before making changes to those systems.

## Agent skills

### Issue tracker

GitHub Issues (`viionc/yet-another-idle-rpg`, via `gh`). See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at repo root. See `docs/agents/domain.md`.
