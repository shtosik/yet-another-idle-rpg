---
name: run-plan
description: "Orchestrate a `docs/plans/*.md` plan from the top-level session: one worktree and branch for the whole plan, each step handed to the cheapest fitting subagent, every step gated by a diff read and `npm run check:brief`, one PR into staging at the end. Use for /run-plan, or when starting or resuming work on a plan."
disable-model-invocation: true
---

# Run plan

`/run-plan docs/plans/<name>.md [step N | next]` (default `next`).

You are the orchestrator. You own the plan, the branch and the gates. Hand each step to a subagent unless the step is tagged `plan mode`; read every result yourself. A subagent's report is a claim, not proof.

Claude-only: it needs `Agent`, `EnterWorktree`, `verify-yari` and the `ccd_pr` tools.

## 1. Worktree (once per plan)

The plan is one branch, `feat/<plan-name>`, in one worktree, `../yari-<plan-name>`, with one PR into `staging`; each step is one commit on it. A plan that says "one PR per step" is wrong here: `docs/git-workflow.md` wins.

- Session already in `../yari-<plan-name>`: stay.
- That folder exists (a resumed plan): `EnterWorktree` with `path: ../yari-<plan-name>`. Don't run `worktree.mjs`; it refuses an existing folder.
- Neither: `node scripts/worktree.mjs feat/<plan-name>`, then `EnterWorktree` with that path.
- Session in a worktree for other work: stop and ask the owner. One worktree per session, so the plan needs its own session.

Subagents start in the session's folder, so they land in this worktree. They never create a worktree or switch branches.

## 2. Load

- Read the plan from the worktree, not `origin/staging`: the ✅ marks of done steps live on the plan's branch until its PR merges. On a fresh worktree run `git fetch origin staging` first; `worktree.mjs` branched from it.
- Parse each `### N. Title (size, model[, plan mode][; skills /add-…])` heading and the `## Order` section. A step heading ending in ` ✅` is done.
- Pick the step: the one asked for, else the first not-done step whose dependencies in `Order` are all done. When none is ready, say what blocks it and stop. A step asked for by number whose dependencies aren't done: name them and ask the owner before starting it.
- Re-grep every `file:line` the step names on the current tip; plans go stale. Put the corrected references in the brief.

## 3. Before the step

Stop and ask the owner (AskUserQuestion) when:

- the step lists an open owner question, or the plan contradicts the code you just grepped;
- the step would lower `inventorySlots` or bump a store `version` without a migration.

When the step's mechanics are uncertain and no owner decision covers them, run `/review-game-systems` on that step first.

## 4. Route the step

| Step tag | Who does it |
|---|---|
| `plan mode` (wins over the model tag) | you, in plan mode (`EnterPlanMode`), then build it yourself |
| `Sonnet` | `general-purpose` subagent, `model: "sonnet"`, brief from `references/step-brief.md` |
| `Opus` | `general-purpose` subagent, `model: "opus"`, same brief |
| no tag | you judge: S/M with a clear recipe goes to Sonnet, design-heavy stays with you |

Fill the brief verbatim.

**Specialists first.** When the step needs art (`asset-generator` agent) or new lore and dialogue scripts (`lore-keeper` agent), run them before the code subagent, one at a time. Both write files and never commit. Read their output, then commit it yourself with only their paths: `<type>(<area>): <step title> art` (or `lore`). The code subagent then wires those files with the named `/add-*` skills. Every file a step needs is committed before the step's gate.

**One writer at a time**: everything above writes into the one tree. Only read-only work runs in parallel with a writer, such as `/review-game-systems` on the next step.

## 5. Gate the step

1. `git status` is clean, and `git log` / `git show` of the step's commits hold only this step's files, follow `CODING_STANDARDS.md`, and do what the step says.
2. The system doc and the `CHANGELOG.md` line the plan names are in the commits (the changelog only for player-facing steps).
3. `npm run check:brief` passes. Run it yourself.
4. Review: when the step touches a store, save, enum or derived stat, run `/blast-radius`; otherwise a `caveman:cavecrew-reviewer` agent on the step's commits.
5. A failed gate goes back to the same subagent (`SendMessage`) with the failure. Fails twice: stop and ask the owner; no third blind retry.
6. Append ` ✅` to the step heading in the plan and amend it into the step's last commit (`git commit --amend --no-edit`; the commit is unpushed and yours). No sha in the heading: the amend changes it.

Then report the step in two lines and continue with the next ready step, unless the owner asked for one step.

## 6. Finish

After the last step, or when the owner says ship:

1. When the plan changes player-visible UI or game behavior: `verify-yari` in a subagent (`model: "sonnet"`) for the feature files the plan touched.
2. Wrap-up step of the plan (idea status, lore canon), if it has one and it isn't done.
3. Push, open the PR into `staging` with a body from `mattpocock-skills:pr` that lists the steps with their commits and the `verify-yari` evidence path.
4. Bind the PR with the `ccd_pr` tools and offer Auto-fix.
