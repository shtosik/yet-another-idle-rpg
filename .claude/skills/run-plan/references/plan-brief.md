# Plan brief

Fill the `<…>` parts and pass the rest verbatim as the plan writer's prompt.

---

Write the implementation plan for the idea `<idea path>` in the YARI repo (Angular idle RPG), as `docs/plans/<name>.md`. Don't write code, commit, push or open a PR.

Work only in `<absolute worktree path>`. Read first: `AGENTS.md`, `CODING_STANDARDS.md`, `GLOSSARY.md`, `docs/systems/README.md` and the system docs the idea touches, the idea doc and every doc it links. Read `docs/plans/gear-upgrading.md` as the model for the format.

## Format

- `# Plan: <title>`, then one paragraph: the idea docs it builds, "One branch and one PR into `staging` for the whole plan, each step a commit on it (`/run-plan`)", and "Code references are from `staging` at `<short sha>` (<date>)".
- `## Order`: which steps depend on which.
- One `### N. Title (size, model[, plan mode][; skills /add-…])` per step. Size S, M, M-L or L. Model `Sonnet` for a step with a clear recipe, `Opus` for design-heavy logic, `plan mode` for a step that changes the item model, a store's shape or a save. Name the `/add-…` skills the step should use.
- Each step: what to build with real `file:line` references you grepped, the specs it needs, `Docs:` (system docs to update) and `Changelog:` (`[feature|bug|buff|nerf] text`, or none for a step players can't see).
- Art and lore a step needs: say so in the step (asset-generator agent, lore-keeper agent); the orchestrator runs them.
- Last step: wrap-up (idea status, system docs, lore canon).

## Rules

- A step is one commit that passes `npm run check:brief` on its own. No step leaves the game broken for the next.
- Only the owner decides game numbers. Use the idea's numbers and owner decisions; where the idea has none, write the open question into the step as `Owner question:` with your recommended answer.
- Never plan a lower `inventorySlots` or a store `version` bump without a migration step.
- Use `GLOSSARY.md` terms.

## Report

Reply with exactly:

```
plan: docs/plans/<name>.md
steps: <count>
owner questions: <one per line, with the step number; "none">
assumptions: <what you assumed that the idea doesn't say; "none">
```
