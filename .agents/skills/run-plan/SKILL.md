---
name: run-plan
description: "Orchestrate a `docs/plans/*.md` plan from the top-level session: one worktree and branch for the whole plan, each step handed to the cheapest fitting subagent, every step gated by a diff read and `npm run check:brief`, one PR into staging at the end. Use for /run-plan, or when starting or resuming work on a plan."
disable-model-invocation: true
---

# Run plan

`/run-plan docs/plans/<name>.md [step N | next]` (default `next`).

You are the orchestrator. You own the plan, the branch and the gates. Hand each step to a subagent unless its tag says Opus; read every result yourself. A subagent's report is a claim, not proof.

## 1. Load

- `git fetch origin staging`, then read the plan from `origin/staging` (or the working tree, when the plan is new and not on staging yet).
- Parse each `### N. Title (size, model[, plan mode][; skills /add-…])` heading and the `## Order` section. A step heading ending in `✅` is done.
- Pick the step: the one asked for, else the first not-done step whose dependencies in `Order` are all done. When none is ready, say what blocks it and stop.
- Re-grep every `file:line` the step names on the current tip; plans go stale. Put the corrected references in the brief.

## 2. Worktree (once per plan)

- Already in a worktree: stay there; branch inside it if its branch is for other work (`docs/git-workflow.md`).
- Else: `node scripts/worktree.mjs feat/<plan-name>`, then `EnterWorktree` with `path: ../yari-<plan-name>`.
- Subagents start in the session's folder, so they land in this worktree. They never create a worktree or switch branches.
- The whole plan is one branch and one PR into `staging`; each step is one commit. A plan that says "one PR per step" is wrong here: `docs/git-workflow.md` wins.

## 3. Before the step

Stop and ask the owner (AskUserQuestion) when:

- the step lists an open owner question, or the plan contradicts the code you just grepped;
- the step would lower `inventorySlots` or bump a store `version` without a migration.

When the step's mechanics are uncertain and no owner decision covers them, run `/review-game-systems` on that step first.

## 4. Route the step

| Step tag | Who does it |
|---|---|
| `Sonnet` (any size) | `general-purpose` subagent, `model: "sonnet"`, brief from `references/step-brief.md` |
| `Opus` | `general-purpose` subagent, `model: "opus"`, same brief |
| `plan mode` | you, in plan mode (`EnterPlanMode`), then build it yourself |
| no tag | you judge: S/M with a clear recipe goes to Sonnet, design-heavy stays with you |
| art | `asset-generator` agent, alongside the code step |
| new lore or dialogue scripts | `lore-keeper` agent first; the code step wires its scripts with the named `/add-*` skill |

`plan mode` wins over the model tag. Fill the brief verbatim. Writer subagents run one at a time: they share one tree. Read-only work (design review of the next step, lore drafts, art) may run in parallel with a writer.

## 5. Gate the step

1. `git log -1 --stat` and `git show HEAD`: the commit holds only this step's files, follows `CODING_STANDARDS.md`, and does what the step says.
2. The system doc and the `CHANGELOG.md` line the plan names are in the commit (player-facing steps only for the changelog).
3. `npm run check:brief` passes. Run it yourself.
4. Review: when the step touches a store, save, enum or derived stat, run `/blast-radius`; otherwise a `caveman:cavecrew-reviewer` agent on `HEAD~1..HEAD`.
5. A failed gate goes back to the same subagent (`SendMessage`) with the failure. Fails twice: stop and ask the owner; no third blind retry.
6. Append ` ✅` to the step heading in the plan and amend it into the step's commit (`git commit --amend --no-edit`; the commit is unpushed and yours). No sha in the heading: the amend changes it.

Then report the step in two lines and continue with the next ready step, unless the owner asked for one step.

## 6. Finish

After the last step, or when the owner says ship:

1. When the plan changes player-visible UI or game behavior: `verify-yari` in a subagent (`model: "sonnet"`) for the feature files the plan touched.
2. Wrap-up step of the plan (idea status, lore canon), if it has one and it isn't done.
3. Push, open the PR into `staging` with a body from `mattpocock-skills:pr` that lists the steps with their commits and the `verify-yari` evidence path.
4. Bind the PR with the `ccd_pr` tools and offer Auto-fix.

## Codex

Codex has no model-routed subagents: run each step inline with the same brief as your checklist, and keep the same gates.
