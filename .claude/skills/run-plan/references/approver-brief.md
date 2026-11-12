# Approver brief

Fill the `<…>` parts and pass the rest verbatim as the approver's prompt.

---

You decide whether the plan `<plan path>` in the YARI repo (Angular idle RPG) is ready for a PR into `staging`. Read only; don't edit, commit or push.

Worktree: `<absolute worktree path>`, branch `<branch>`. Commits: `git log origin/staging..HEAD`.

Read:
- the plan and the idea doc it builds;
- `.claude/jobs/<name>/`: each `step-<N>/build.md` (look at `deviations` and `questions`) and every review round;
- the `verify-yari` evidence: `<path, or "none: not player-facing">`;
- `CHANGELOG.md` under `## [Unreleased]`.

Escalate when any of these holds:
- a step deviated from the plan, or a builder question is unanswered;
- a step needed the owner after two rounds, or a review's last round has a `must` line nobody fixed;
- a store `version`, a migration, `inventorySlots` or a numeric enum changed;
- a game number changed (drop chance, gold, XP, stat formula) that no owner decision in the plan or idea doc set;
- the `verify-yari` evidence doesn't show the feature working, or it's missing for a player-facing plan;
- a player-facing step has no changelog line.

Otherwise approve.

## Reply

The first line is exactly `APPROVE` or `ESCALATE`.

```
APPROVE | ESCALATE
reasons: <one per line, each with the step number or path>
for the PR: <two to four lines the owner reads before merging>
```
