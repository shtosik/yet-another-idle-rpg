# CLAUDE.md

A browser idle RPG: auto-battle in zones, skill tree, gear, quests, towns, crafting.

**Done** = `npm run validate` and `npx ng build` both pass.

**Before writing or reviewing code**, read `CODING_STANDARDS.md`: stack conventions, where data lives.

**Before creating a branch, switching branches or committing**, read `docs/git-workflow.md`: parallel sessions share this checkout.

## Working with me

- If a requirement or the project architecture is unclear from the existing files, **ask me a clarifying question** before proceeding.
- Prioritize game design and user experience.

## Gotchas

- **Language**: use the terms in `GLOSSARY.md` in code, docs and commits.
- **Current behavior lives in `docs/systems/`**; `docs/archive/` is history.
- **Change a system → update its `docs/systems/` doc in the same commit.**

## Systems — read before touching

| Touching | Read |
|---|---|
| tick, auto-attack, damage, enemy death | `docs/systems/game-loop-and-combat.md` |
| saves, stores, `localStorage` | `docs/systems/persistence.md` |
| stats, XP, inventory, equipment, drops, gold spending | `docs/systems/player-stats-inventory-equipment.md` |
| NPC dialogue, conditions, effects | `docs/systems/dialogue.md` |
| quests | `docs/systems/quests.md` |
| skill tree, respec | `docs/systems/skill-tree.md` |
| spells, buffs, mana | `docs/systems/spells-and-buffs.md` |
| Camp, stations, recipes, food, potions | `docs/systems/consumables-camp-crafting.md` |
| offline progress, welcome-back modal | `docs/systems/offline-progress.md` |
| zones, waves, town/feature unlocks, economy sim | `docs/systems/zones-waves-unlocks.md` |
| towns, buildings, shops, Exploration Guild | `docs/systems/towns-shops-guild.md` |
| enemies, shinies, pets, bestiary | `docs/systems/enemies-shiny-pets-bestiary.md` |
| world map, map tiles | `docs/systems/world-map.md` |
| translations | `docs/systems/localization.md` |
| generated art | `docs/systems/asset-pipeline.md` |

## Other docs

- Open bugs and tech debt: `docs/ideas/known-issues.md`.
- Lore and portrait briefs: `docs/design/`, `docs/character/`.
