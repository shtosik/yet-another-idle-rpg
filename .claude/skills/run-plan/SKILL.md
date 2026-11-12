---
name: run-plan
description: "Orchestrate a feature from idea to PR from the top-level session: write a `docs/plans/*.md` plan from an idea, then one worktree and branch for the plan, each step handed to the cheapest fitting subagent, every step gated by `npm run check:brief` and parallel reviewers with PASS/CHANGES verdicts, an approver's APPROVE/ESCALATE decision, and one PR into staging. Use for /run-plan, or when starting or resuming work on an idea or plan."
disable-model-invocation: true
---

# Run plan

```
/run-plan idea docs/ideas/<name>.md            write the plan, then stop for the owner
/run-plan docs/plans/<name>.md [step N | next]  build steps (default next)
/run-plan approve <name>                        ship an escalated plan
/run-plan rework <name> step N <note>           send a step back to a builder with the owner's note
```

With no argument: list the `Accepted` ideas in `docs/ideas/README.md` that have no `docs/plans/<name>.md`, and ask which one to start.

You are the orchestrator. You own the plan, the branch, the gates and the job folder. Hand each step to a subagent unless the step is tagged `plan mode`; read every result yourself. A subagent's report is a claim, not proof.

Claude-only: it needs `Agent`, `SendMessage`, `EnterWorktree`, `verify-yari` and the `ccd_pr` tools.

## The job folder

Agents hand work to each other through files, not through this conversation, so a resumed session picks up where the last one stopped. Everything lives in `.claude/jobs/<name>/` inside the worktree (gitignored; it goes when the worktree is pruned):

```
plan-review.md                  system-designer's review of a new plan
step-<N>/build.md               builder's report, one block per round
step-<N>/round-<K>/<reviewer>.md one file per reviewer: code, systems, blast-radius
decision.md                     approver's decision
```

Subagents reply in text; you save each reply verbatim to its file before acting on it. Each file has one author. Every review file starts with `PASS` or `CHANGES`; the decision file starts with `APPROVE` or `ESCALATE`.

## 1. Worktree (once per plan)

The plan is one branch, `feat/<name>`, in one worktree, `../yari-<name>`, with one PR into `staging`; each step is one commit on it. A plan that says "one PR per step" is wrong here: `docs/git-workflow.md` wins.

- Session already in `../yari-<name>`: stay.
- That folder exists (a resumed plan): `EnterWorktree` with `path: ../yari-<name>`. Don't run `worktree.mjs`; it refuses an existing folder.
- Neither: `node scripts/worktree.mjs feat/<name>`, then `EnterWorktree` with that path.
- Session in a worktree for other work: stop and ask the owner. One worktree per session, so the plan needs its own session.

Subagents start in the session's folder, so they land in this worktree. They never create a worktree or switch branches.

## 2. Intake (`idea`)

1. Worktree as in section 1, named after the idea file.
2. Read the idea and its `**Status:**` line. Not `Accepted`: ask the owner before going on.
3. Plan writer: `general-purpose` subagent, `model: "opus"`, brief from `references/plan-brief.md`. It writes `docs/plans/<name>.md` and doesn't commit.
4. `system-designer` agent on the new plan; save its reply to `.claude/jobs/<name>/plan-review.md`.
5. Show the owner the plan's step headings, `## Order` and the review's open questions (AskUserQuestion). Their answers go into the plan's steps or the idea doc's owner decisions; you edit them in.
6. On the owner's yes: commit only the plan (and idea doc edits), `docs(plans): <name> plan`. Then stop; building starts with `/run-plan docs/plans/<name>.md`.

## 3. Load

- Read the plan from the worktree, not `origin/staging`: the ✅ marks of done steps live on the plan's branch until its PR merges. On a fresh worktree run `git fetch origin staging` first; `worktree.mjs` branched from it.
- Parse each `### N. Title (size, model[, plan mode][; skills /add-…])` heading and the `## Order` section. A step heading ending in ` ✅` is done.
- Read `.claude/jobs/<name>/` if it exists: a step with a `step-<N>/build.md` and no ✅ was cut off mid-round. Resume it at its last round instead of starting over.
- Pick the step: the one asked for, else the first not-done step whose dependencies in `Order` are all done. When none is ready, say what blocks it and stop. A step asked for by number whose dependencies aren't done: name them and ask the owner before starting it.
- Re-grep every `file:line` the step names on the current tip; plans go stale. Put the corrected references in the brief.

## 4. Before the step

Stop and ask the owner (AskUserQuestion) when:

- the step lists an open owner question, or the plan contradicts the code you just grepped;
- the step would lower `inventorySlots` or bump a store `version` without a migration.

When the step's mechanics are uncertain and no owner decision covers them, run `/review-game-systems` on that step first.

## 5. Route the step

| Step tag | Who does it |
|---|---|
| `plan mode` (wins over the model tag) | you, in plan mode (`EnterPlanMode`), then build it yourself |
| `Sonnet` | `general-purpose` subagent, `model: "sonnet"`, `name: "build-<name>-<N>"`, brief from `references/step-brief.md` |
| `Opus` | `general-purpose` subagent, `model: "opus"`, same name and brief |
| no tag | you judge: S/M with a clear recipe goes to Sonnet, design-heavy stays with you |

Fill the brief verbatim. Save the builder's report to `step-<N>/build.md`.

**Specialists first.** When the step needs art (`asset-generator` agent) or new lore and dialogue scripts (`lore-keeper` agent), run them before the builder, one at a time. Both write files and never commit. Read their output, then commit it yourself with only their paths: `<type>(<area>): <step title> art` (or `lore`). The builder then wires those files with the named `/add-*` skills. Every file a step needs is committed before the step's gate.

**One writer at a time**: everything above writes into the one tree. Only read-only work runs in parallel with a writer, such as the reviewers below or `/review-game-systems` on the next step.

## 6. Gate the step

A round is one build (or rework) plus its reviews. Round 1 follows the build.

1. `git status` is clean, and `git log` / `git show` of the step's commits hold only this step's files and do what the step says.
2. The system doc and the `CHANGELOG.md` line the plan names are in the commits (the changelog only for player-facing steps).
3. `npm run check:brief` passes. Run it yourself. A failure ends the round as `CHANGES` without reviews.
4. Reviews, in parallel, each brief from `references/review-brief.md`, each reply saved to `step-<N>/round-<K>/<reviewer>.md`:
   - `code`, always: `caveman:cavecrew-reviewer` agent, against `CODING_STANDARDS.md` and the step text.
   - `systems`, when the step changes a game rule (combat, drops, gold, stats, quests, crafting, offline progress): `system-designer` agent on the diff.
   - `blast-radius`, when the step touches a store, save, enum or derived stat: run `/blast-radius` yourself while the agents work, and write its result with a verdict line.
5. Wait until every review file of the round exists. All `PASS`: go to 7. Any `CHANGES`: `SendMessage` to `build-<name>-<N>` naming the round's files to read; the fix is a new commit. That starts the next round.
6. Still `CHANGES` after round 2: stop and ask the owner; no third blind round.
7. Append ` ✅` to the step heading in the plan and amend it into the step's last commit (`git commit --amend --no-edit`; the commit is unpushed and yours). No sha in the heading: the amend changes it.

Then report the step in two lines and continue with the next ready step, unless the owner asked for one step.

## 7. Finish

After the last step, or when the owner says ship:

1. When the plan changes player-visible UI or game behavior: `verify-yari` in a subagent (`model: "sonnet"`) for the feature files the plan touched.
2. Wrap-up step of the plan (idea status, lore canon), if it has one and it isn't done.
3. Approver: `general-purpose` subagent, `model: "opus"`, brief from `references/approver-brief.md`. Save its reply to `.claude/jobs/<name>/decision.md`.
   - `APPROVE`: go on.
   - `ESCALATE`: tell the owner its reasons and stop. The job is `needs-human` until `/run-plan approve <name>` (go on) or `/run-plan rework <name> step N <note>`.
4. Push, open the PR into `staging` with a body from `mattpocock-skills:pr` that lists the steps with their commits, the `verify-yari` evidence path and the approver's decision.
5. Bind the PR with the `ccd_pr` tools and offer Auto-fix. The owner merges; never turn on auto-merge unless they ask.

## Rework

`/run-plan rework <name> step N <note>`: write the note to `step-<N>/round-<K>/owner.md` as `CHANGES` for the next round number, remove the step's ✅ (a new commit, not an amend, once pushed), then resume `build-<name>-<N>` with `SendMessage` or, in a new session, a fresh builder with the step brief plus "Read `.claude/jobs/<name>/step-<N>/` first". Gate as in section 6; the owner's rework round starts the round count again. Then run Finish from 3.
