# CLAUDE.md

**Done** = `npm run validate` and `npx ng build` both pass.

**Ask me** a clarifying question when a requirement or the architecture is unclear from the existing files.

**Before changing game behavior**, find its system doc in `docs/systems/README.md`; update that doc in the same commit.

**Player-facing change** → add a note under `## [Unreleased]` in `CHANGELOG.md`: `- [feature|bug|buff|nerf] text`, plain English for players. Releases own the `package.json` `version`; release, deploy and environment steps are in `docs/deployment.md`.

**Before writing or reviewing code**, read `CODING_STANDARDS.md`.

**Before creating a branch, switching branches or committing**, read `docs/git-workflow.md`: parallel sessions share this checkout.

**Language**: use the terms in `GLOSSARY.md` in code, docs and commits.
