# AGENTS.md

Rules for all coding agents (Claude Code, Codex). Claude-only notes are in `CLAUDE.md`.

**Done** = `npm run check` passes: `validate`, `lint`, `test:tools`, `test:ci` and `build`, the same steps as CI.

**Ask me** a clarifying question when a requirement or the architecture is unclear from the existing files.

**Before changing game behavior** (combat, saves, stats, inventory, drops, gold, dialogue, quests, skill tree, spells, crafting, offline progress, zones, towns, shops, enemies, pets, world map, translations, art), find its system doc in `docs/systems/README.md`; update that doc in the same commit.

**Player-facing change** → add a note under `## [Unreleased]` in `CHANGELOG.md`: `- [feature|bug|buff|nerf] text`, plain English for players. Releases own the `package.json` `version`; release, deploy and environment steps are in `docs/deployment.md`.

**Before writing or reviewing code**, read `CODING_STANDARDS.md`.

**Before creating a branch, switching branches, committing or opening a PR**, read `docs/git-workflow.md`: parallel sessions share this checkout.

**PR review comments** (CodeRabbit, inline and nitpicks): `node scripts/pr-comments.mjs <PR>`. State, base and checks of PRs: `node scripts/pr-status.mjs <PR...>`.

**Explore and develop on `origin/staging`**, also when only reading code or researching ideas in a new session. `main` is the released state: look at it only for a hotfix or when asked. The main checkout may sit on `main`, so check `git branch --show-current` before reading code there; otherwise run `git fetch origin staging` first, then read from a staging worktree or `git show origin/staging:<path>`.

**Never lower inventory slot bonuses** (`inventorySlots` on items, skill nodes or the base) without a save migration: see owner decisions in `docs/systems/player-stats-inventory-equipment.md`.

**Language**: use the terms in `GLOSSARY.md` in code, docs and commits.

**Scripts are Node** (`scripts/*.mjs`): this machine has no Python.

**Checking UI**: builds with cheats on (`npm start`, `build:testing`) expose `window.dev`; a call made before the cheat bar's deferred chunk arrives waits for it and returns a Promise, so `await` it. Set game state through it (commands in `src/app/components/game/dev-cheats/dev-cheats.component.ts`) and read it with `dev.state()`.

**Before opening a PR that changes player-visible UI or game behavior**, run `.claude/skills/verify-yari` once for the feature files the change touches (Claude: in a subagent on a cheaper model) and put the evidence path in the PR body. Skip for docs, data-only, test, script and art changes.

**Skills** live in `.claude/skills/`; after adding or editing one, run `npm run sync-skills` to copy it to `.agents/skills/` for Codex. `/generate-2d-asset` is Claude-only; Codex generates art with `node scripts/asset-gen/generate.mjs` (`docs/systems/asset-pipeline.md`).

## Enforced rules

A rule here fails a check when broken. When the owner corrects the same mistake twice, add a check and a row (`.claude/skills/correct`).

| Rule | Enforced by |
|---|---|
| Set game state through `window.dev`, not `localStorage` | `.claude/hooks/guard.mjs` (Claude) |
| `window.dev` calls work right after page load | placeholder in `dev-cheats/dev-stub.ts`, tested in `dev-stub.spec.ts` |
| Keep the main checkout on its branch; new work in a worktree (`node scripts/worktree.mjs <type/name>`) | `.claude/hooks/guard.mjs` (Claude) |
| One worktree per session: a session already in a worktree branches inside it, no `EnterWorktree` to a sibling | `.claude/hooks/guard.mjs` (Claude) |
| Start a session from current `origin/staging` | `.claude/hooks/session-start.mjs` reports how far the checkout lags (Claude) |
| Codex gets the same project skills | `npm run validate` (`scripts/sync-skills.mjs`) |
| Data references, i18n keys, assets, doc paths, changelog format | `npm run validate` |
| PRs into `main` come from `release/*` or `hotfix/*` with a version bump | CI (`.github/workflows/ci.yml`) |
