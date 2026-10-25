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
| Item name | `items:names.<ItemID key>` |
| Enemy name | `enemies:names.<EnemyID key>` |
| Zone name | `zones:names.<ZoneID key>` |
| Quest name | `quests:names.<QuestID key>` |
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

## Invariants & gotchas
- **A new namespace must be added to `translations` in `app.config.ts`**, or every key in it renders raw. `npm run validate` catches this.
- The pipe is `| i18next`, not `| translate`.
- **Renaming an enum key renames its i18n key.** Rename the JSON key in the same change.
- i18next is not reactive. Text computed into a signal once won't change if the language changes (not an issue while only `en` exists).

## Known issues
- Quest step descriptions are hard-coded English in `src/data/quests-data.ts` (`steps[].description`), shown directly by the quest panel.
- World map labels are hard-coded in `src/data/world-map-data.ts` (`label`).
- Spell and skill descriptions repeat numbers that live in data (haste amount, fireStrike damage), so they drift when balance changes. Use interpolation params instead.
- `ItemData.description` exists but is never set; there are no item descriptions.

## How to extend
New NPC dialogue: the `add-npc-dialogue` skill (creates the namespace and registers it). Any new entity: add its name key under the convention above, then run `npm run validate`.
