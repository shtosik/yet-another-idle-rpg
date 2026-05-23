# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # dev server (ng serve)
npm run build      # production build
npm test           # karma/jasmine tests (ng test)
npm run tile       # regenerate world map tiles (node scripts/tile-map.mjs)
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
│   ├── components/game/    # Feature tabs: battle, inventory, equipment, skill-tree, map, …
│   ├── components/modals/  # Shop, quest-completed, respec-confirm
│   ├── components/shared/  # Reusable UI (panel, slot, spinner, close-button)
│   ├── services/           # Business logic (battle-manager, dialogue-manager, modal, …)
│   └── store/              # NgRx signal stores (player, battle, quests, shops, towns)
├── data/                   # All static game content as typed TS objects
│   └── dialogues/          # Per-NPC dialogue trees
├── enums/ids/              # Numeric enums for every entity type (EnemyID, ItemID, …)
├── interfaces/             # TypeScript interfaces
├── types/                  # Discriminated unions (DialogueEffect, DialogueCondition, …)
└── assets/
    ├── locales/en/         # i18next JSON translation files, one per namespace
    ├── maps/               # Leaflet tile data
    └── img/                # Enemy sprites, NPC avatars, backgrounds
```

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

- All entities are identified by numeric enums in `src/enums/ids/` (`EnemyID`, `ItemID`, `QuestID`, `ZoneID`, `NpcID`, `SkillPointID`, `SpellID`, …).
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

Skills (slash commands) are available for common additions: `/add-npc-dialogue`, `/add-shop`, `/add-town-building`, `/add-dialogue-effect`.

### Analysis docs

`docs/analysis/` contains detailed write-ups for major systems (dialogue, skill-tree, map, shop, shiny enemies, bestiary). Read the relevant doc before making changes to those systems.
