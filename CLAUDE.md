# CLAUDE.md

Guidance for Claude Code in this repository: a browser idle RPG (auto-battle in zones, skill tree, gear, quests, towns, crafting).

## Checks

**Done** = `npm run validate`, `npm run lint`, `npm run test:ci` and `npx ng build` all pass (CI runs the same). `validate` covers data, i18n, assets, doc references, inline `<svg>` and BEM classes styled but never used. Review against `CODING_STANDARDS.md`.

Other scripts are in `package.json`; `npm run sim` is the economy simulation, `npm run release -- minor` bumps a release branch (`docs/deployment.md`).

## Environment

- No Python on this machine: write scripts in Node (`scripts/*.mjs`).
- In a worktree session, run git as single plain commands (no `cd &&` chains or `$(…)` around git).
- Checking UI: builds with cheats on (`npm start`, `build:testing`) expose `window.dev` once the cheat bar's deferred chunk loads, a moment after the page (`tab`, `setZone`, `grantStat`, `learnSkill`, `giveItem`, `equip`, `unequip`, `openShop`; numeric enum IDs) in `src/app/components/game/dev-cheats/dev-cheats.component.ts`.

## Git workflow

Several Claude sessions often run in parallel on this repo, sharing the main checkout.

- **Never switch branches (`git checkout` / `git switch`) in the main checkout.** It moves every other session onto your branch and mixes uncommitted work.
- For a new feature branch, create a worktree instead: `git fetch origin && git worktree add ../yari-<name> -b feat/<name> origin/staging` (or start the session with `claude --worktree <name>`), and work only inside it.
- **New work starts from `origin/staging`**, never from local `main` (it lags behind). Exceptions: a sub-feature branches from its parent feature branch; a hotfix branches from `origin/main` (`docs/deployment.md` → Releases). PRs go back to where the branch came from. CI only runs on PRs into `main` and `staging`, so before merging a sub-feature into its parent, run the Done checks (above) yourself.
- Right after `git worktree add`, switch the session into the worktree with the `EnterWorktree` tool (`path: ../yari-<name>`). The desktop app's diff pane only shows the session's own folder, so edits made in a worktree the session never entered don't show up there.
- Run `npm install` in the new worktree. **Do not** junction/symlink `node_modules` from the main checkout — removing the worktree has deleted the real `node_modules` before.
- Only stage files you changed yourself; other sessions' uncommitted work may be in the tree.

## Stack

Angular 20 standalone components, zoneless change detection, `OnPush` on every component (a few older ones still lack it), `inject()` for DI, signal `input()`/`output()` in new code (some older components still use decorators). State in NgRx Signal Stores (`src/app/store/`), persisted to `localStorage`. Angular Material dialogs, SASS, i18next, Leaflet. Static game content is typed TS data in `src/data/`, keyed by numeric enums in `src/enums/`.

## Gotchas

- **Pre-release: save compatibility is not required.** Rename and renumber freely; after a breaking change to a store's saved shape, bump its save `version` (`withGameStateSync(KEY, initialState, { version })`) instead of clearing `localStorage` (`docs/systems/persistence.md`).
- **Stats are derived, not stored.** `PlayerStore.stats()` is computed from base + equipment + skill nodes + buffs + consumables + permanent bonuses. `updatePlayerStats` only earns/spends resources or adds a permanent bonus; a new stat source goes into the `stats` computed (ADR 0002).
- **Icons are files** under `src/assets/img/icons/`, used through `<img ngSrc>` with the colour baked into the file.
- **Tab layout lives in `game.component.html`/`.sass`**: which panels show on which tab, placed by host class (`.stats`, `.inventory`, ...).
- **New i18n namespace → register it** in the `translations` list in `src/app/app.config.ts`. Template pipe is `| i18next`.
- **Item data lives in `src/data/items/<category>-items.data.ts`**; `src/data/items-data.ts` only merges them.
- **Quest conditions**: `QuestState.active` = started; `QuestState.readyToAdvance` = started and current step's requirements met (turn-ins).
- **Owner decisions**: block gold spending the player can't afford; block unequip, craft and quest turn-in when the result has no inventory space (enemy drops lost on a full inventory is intended). Details in `docs/systems/player-stats-inventory-equipment.md`.
- **Language**: use the terms in `GLOSSARY.md` in code, docs and commits.
- **`docs/archive/` is history.** Current behavior is in `docs/systems/`.
- **Change a system → update its `docs/systems/` doc in the same commit.**
- **Player-facing change → add a note under `## [Unreleased]` in `CHANGELOG.md`**: `- [feature|bug|buff|nerf] text`, plain English for players. Never edit `version` in `package.json` by hand; releases bump it (`docs/deployment.md`).

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

Adding content: `/add-enemy-and-zone`, `/add-quest`, `/add-recipe-or-consumable`, `/add-equipment-item`, `/add-shiny-variant`, `/add-monster-weakness`, `/add-npc-dialogue`, `/add-shop`, `/add-town-building`, `/add-dialogue-effect`. Checking a dialogue tree: `/audit-dialogue`.

Art (icons, sprites, portraits, backgrounds): `/generate-2d-asset`, which briefs the `asset-generator` agent.

## Other docs

- `GLOSSARY.md` — domain language.
- `docs/deployment.md` — environments (production, staging, testing), branch flow, CI/CD.
- `docs/ideas/` — design backlog with status per idea.
- `docs/ideas/known-issues.md` — open bugs and tech debt across systems.
- `docs/adr/` — architecture decisions.
- `docs/plans/` — forward plans.
- `docs/design/`, `docs/character/` — lore and portrait briefs.
