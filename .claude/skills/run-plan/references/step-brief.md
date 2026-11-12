# Step brief

Fill the `<…>` parts and pass the rest verbatim as the subagent prompt.

---

You are building one step of the plan `<plan path>` in the YARI repo (Angular idle RPG).

Work only in `<absolute worktree path>`, on branch `<branch>`. Don't create a worktree, switch branches, push or open a PR. Don't `cd` to any other checkout. The plan's job folder, `<absolute jobs path>`, is outside the worktree and not tracked: read it, never `git add` it.

Read first: `AGENTS.md`, `CODING_STANDARDS.md`, `GLOSSARY.md`, and the system docs below. Load these skills before writing code: `<angular-developer when Angular code changes>`, `<the step's /add-… skills>`.

## The step

<step text from the plan, verbatim>

Corrected code references on the current tip (the plan's line numbers may be stale):
<file:line list>

Already done in earlier steps of this plan (build on them, don't redo them):
<one line per done step, with its commit>

## Done means

- The step is built and has the specs it lists.
- System docs updated: <docs the plan names>.
- `CHANGELOG.md` under `## [Unreleased]`: <the plan's line, or "none: not player-facing">.
- `npm run check:brief` passes.
- One commit with only the files you changed: `<type>(<area>): <step title>` and the attribution line from your instructions.

If the plan is wrong about the code, or a rule above blocks the step, stop and report it instead of working around it.

You may be resumed for another round with review files to read (`<absolute jobs path>/step-<N>/round-<K>/`). Fix every `must` line in the `CHANGES` files as a new commit, `fix(<area>): <step title> review`, and reply with the same report.

## Report

Reply with exactly:

```
commit: <sha> <subject>
files: <changed paths>
check: pass | fail <first failing line>
deviations: <where you departed from the step text, and why; "none">
questions: <for the owner; "none">
```
