# CLAUDE.md

A browser idle RPG: auto-battle in zones, skill tree, gear, quests, towns, crafting.

## Commands

```bash
npm run validate     # data, i18n, asset and doc-reference checks (scripts/validate-data.mjs)
npm run sim          # economy simulation: zone times, first-hour ladder, reward flags (scripts/sim-economy.mjs)
npm run tile         # regenerate world map tiles
npm run test:assets  # asset-gen pipeline tests (node:test, no GPU needed)
```

**Done** = `npm run validate` and `npx ng build` both pass.

**Before writing or reviewing code**, read `CODING_STANDARDS.md`: stack conventions, where data lives, derived stats, i18n registration, save compatibility.

## Working with me

- If a requirement or the project architecture is unclear from the existing files, **ask me a clarifying question** before proceeding.
- Prioritize game design and user experience.

## Git workflow

Several Claude sessions often run in parallel on this repo, sharing the main checkout.

- **Never switch branches (`git checkout` / `git switch`) in the main checkout.** It moves every other session onto your branch and mixes uncommitted work.
- For a new feature branch, create a worktree instead: `git worktree add ../yari-<name> -b feat/<name>` (or start the session with `claude --worktree <name>`), and work only inside it.
- Right after `git worktree add`, switch the session into the worktree with the `EnterWorktree` tool (`path: ../yari-<name>`). The desktop app's diff pane only shows the session's own folder, so edits made in a worktree the session never entered don't show up there.
- Run `npm install` in the new worktree. **Do not** junction/symlink `node_modules` from the main checkout — removing the worktree has deleted the real `node_modules` before.
- Only stage files you changed yourself; other sessions' uncommitted work may be in the tree.

## Gotchas

- **Owner decisions**: block gold spending the player can't afford; block unequip, craft and quest turn-in when the result has no inventory space (enemy drops lost on a full inventory is intended). Details in `docs/systems/player-stats-inventory-equipment.md`.
- **Language**: use the terms in `GLOSSARY.md` in code, docs and commits.
- **`docs/archive/` is history.** Current behavior is in `docs/systems/`.
- **Change a system → update its `docs/systems/` doc in the same commit.**

## Systems — read before touching

| Touching | Read |
|---|---|
| tick, auto-attack, damage, enemy death | `docs/systems/game-loop-and-combat.md` |
| saves, stores, `localStorage` | `docs/systems/persistence.md` |
| stats, XP, inventory, equipment, drops | `docs/systems/player-stats-inventory-equipment.md` |
| NPC dialogue, conditions, effects | `docs/systems/dialogue.md` |
| quests | `docs/systems/quests.md` |
| skill tree, respec | `docs/systems/skill-tree.md` |
| spells, buffs, mana | `docs/systems/spells-and-buffs.md` |
| Camp, stations, recipes, food, potions | `docs/systems/consumables-camp-crafting.md` |
| offline progress, welcome-back modal | `docs/systems/offline-progress.md` |
| zones, waves, town/feature unlocks | `docs/systems/zones-waves-unlocks.md` |
| towns, buildings, shops, Exploration Guild | `docs/systems/towns-shops-guild.md` |
| enemies, shinies, pets, bestiary | `docs/systems/enemies-shiny-pets-bestiary.md` |
| world map, map tiles | `docs/systems/world-map.md` |
| translations | `docs/systems/localization.md` |
| generated art | `docs/systems/asset-pipeline.md` |

## Skills and agents

- Adding content: `/add-enemy-and-zone`, `/add-quest`, `/add-recipe-or-consumable`, `/add-equipment-item`, `/add-shiny-variant`, `/add-monster-weakness`, `/add-npc-dialogue`, `/add-shop`, `/add-town-building`, `/add-dialogue-effect`.
- Checking a dialogue tree: `/audit-dialogue`.
- Art (icons, sprites, portraits, backgrounds): `/generate-2d-asset`, which briefs the `asset-generator` agent.

## Other docs

- `GLOSSARY.md` — domain language.
- `docs/ideas/` — design backlog with status per idea.
- `docs/ideas/known-issues.md` — open bugs and tech debt across systems.
- `docs/adr/` — architecture decisions.
- `docs/plans/` — forward plans.
- `docs/design/`, `docs/character/` — lore and portrait briefs.
