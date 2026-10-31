# AGENTS.md

Rules for all coding agents (Claude Code, Codex). Claude-only notes are in `CLAUDE.md`.

**Done** = `npm run validate`, `npm run lint`, `npm run test:ci` and `npx ng build` all pass (CI runs the same).

**Ask me** a clarifying question when a requirement or the architecture is unclear from the existing files.

**Before changing game behavior** (combat, saves, stats, inventory, drops, gold, dialogue, quests, skill tree, spells, crafting, offline progress, zones, towns, shops, enemies, pets, world map, translations, art), find its system doc in `docs/systems/README.md`; update that doc in the same commit.

**Player-facing change** → add a note under `## [Unreleased]` in `CHANGELOG.md`: `- [feature|bug|buff|nerf] text`, plain English for players. Releases own the `package.json` `version`; release, deploy and environment steps are in `docs/deployment.md`.

**Before writing or reviewing code**, read `CODING_STANDARDS.md`.

**Before creating a branch, switching branches, committing or opening a PR**, read `docs/git-workflow.md`: parallel sessions share this checkout.

**Explore and develop on `origin/staging`**, also when only reading code or researching ideas in a new session. `main` is the released state: look at it only for a hotfix or when asked. The main checkout may sit on `main`, so check `git branch --show-current` before reading code there; otherwise run `git fetch origin staging` first, then read from a staging worktree or `git show origin/staging:<path>`.

**Never lower inventory slot bonuses** (`inventorySlots` on items, skill nodes or the base) without a save migration: see owner decisions in `docs/systems/player-stats-inventory-equipment.md`.

**Language**: use the terms in `GLOSSARY.md` in code, docs and commits.

**Scripts are Node** (`scripts/*.mjs`): this machine has no Python.

**Checking UI**: builds with cheats on (`npm start`, `build:testing`) expose `window.dev` a moment after page load, once the cheat bar's deferred chunk arrives. Set game state through it (commands in `src/app/components/game/dev-cheats/dev-cheats.component.ts`), not by editing `localStorage`.
