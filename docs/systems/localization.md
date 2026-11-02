# Localization

## Purpose
All player-facing text comes from i18next JSON files, so content can be added and translated without touching templates. Only English (`en`) exists today.

## Key files
- `src/app/app.config.ts:translations` — the list of namespaces loaded at startup, and `i18nextInitializer` (runs as an `APP_INITIALIZER`, loads over HTTP from `/assets/locales/{{lng}}/{{ns}}.json`).
- `src/app/pipes/i18next.pipe.ts:I18nextPipe` — template pipe, `{{ 'items:names.knife' | i18next }}`. Impure: it re-runs on every change detection.
- `src/assets/locales/en/*.json` — one file per namespace; `dialogues/<npcKey>.json` holds one NPC's dialogue.
- In TS code, call `i18next.t('ns:key')` directly (for example in Leaflet popups and modal text).

## Data flow
1. App start: `i18nextInitializer` loads every namespace in `translations`. The app renders after this resolves.
2. Templates and services ask for `ns:key`. Keys without a namespace fall back to `app`.
3. Most entity text is looked up by the entity's enum key name, built in code: `'items:names.' + ItemID[id]`.

## Key conventions
| Text | Key |
|---|---|
| Equipment panel / slot labels and hints | `app:equipment.*`, `app:equipment.slots.<EquipmentSlot key>` |
| Item name | `items:names.<ItemID key>` |
| Enemy name | `enemies:names.<EnemyID key>` |
| Zone name | `zones:names.<ZoneID key>` |
| Quest name | `quests:names.<QuestID key>` |
| Quest step description (optional) | `quests:steps.<QuestID key>.<1-based step>`; falls back to the data's English description |
| NPC name | `npc:names.<NpcID key>` |
| Spell | `spells:names.<SpellID key>.name` / `.desc` |
| Skill node | `skill-tree:nodes.<SkillNodeID key>.name` / `.desc` |
| Skill branch | `skill-tree:branches.<SkillBranch key>` |
| Town / building | `map:towns.<TownID key>`, `map:buildings.<TownBuildingID key>` |
| Station | `camp:stations.<StationID key>.name`, `.levels.<n>` |
| Stat label | `app:playerStats.<PlayerStat>` |
| Element | `app:elements.<DamageElement key>` |
| Dialogue | `dialogues/<npcKey>:<node>.message` / `.<option>` |

`npm run validate` checks every one of these for every enum value, plus literal `ns:key` strings in data.

Battle panel controls, state labels, weakness hints, spell availability and empty-slot help use `app:battle.*`. `app:elements.*` contains bare element names; the battle panel adds the shared `app:battle.weakness` prefix once. Enemy/zone/spell names continue to use their existing namespaces.

Item upgrade labels use `items:upgradedName` (`name`, `level`), `items:upgradeLevel` (`level`), and `items:upgradeMilestone` (`level`), including accessible slot names.

Forge panel labels, pair choices, preview, disabled reasons and merge result toasts use `forge:*` (`forge.json`, registered in `app.config.ts`). Item and stat names retain the shared `items:*` and `app:playerStats.*` keys.

Pathfinder's Seal uses `items:names.pathfindersSeal`, `app:playerStats.upgradedDropChance`, and the Progress description at `app:statsPanel.descriptions.upgradedDropChance`. Its registration effect label and success/reminder scripts use the existing `dialogues/laHarparMarvin` namespace; Ludo's optional explanation uses `dialogues/liroldArenaMaster`. Dialogue describes the salvage lesson and Arena prizes in-world; numeric drop and upgrade mechanics belong in the Progress stat tooltip. Keep that tooltip in sync with `PATHFINDERS_SEAL_UPGRADED_DROP_CHANCE` if tuning changes. The Cold Forge dialogue likewise uses workshop language for cooking preparation and matching gear; journal Steps may give plain instructions. Keep dialogue text aligned with `docs/ideas/gear-upgrading-cold-forge.md`.

## Invariants & gotchas
- **A new namespace must be added to `translations` in `app.config.ts`**, or every key in it renders raw. `npm run validate` catches this.
- The pipe is `| i18next`, not `| translate`.
- **Renaming an enum key renames its i18n key.** Rename the JSON key in the same change.
- i18next is not reactive. Text computed into a signal once won't change if the language changes (not an issue while only `en` exists).

## Known issues
- Older quest step descriptions have only hard-coded English fallbacks in `src/data/quests-data.ts` (`steps[].description`); The Cold Forge provides translated journal lines through `quests:steps.*`.
- World map labels are hard-coded in `src/data/world-map-data.ts` (`label`).
- Spell and skill descriptions repeat numbers that live in data (haste amount, fireStrike damage), so they drift when balance changes. Use interpolation params instead.
- `ItemData.description` exists but is never set; there are no item descriptions.

## How to extend
New NPC dialogue: the `add-npc-dialogue` skill (creates the namespace and registers it). Any new entity: add its name key under the convention above, then run `npm run validate`.
