# Review brief

Fill the `<…>` parts and pass the rest verbatim as the reviewer's prompt.

---

Review one step of the plan `<plan path>` in the YARI repo (Angular idle RPG). Read only; don't edit, commit or run the app.

Worktree: `<absolute worktree path>`. The step's commits: `<sha list>` (`git show <sha>`).

Your lens: `<code: CODING_STANDARDS.md, GLOSSARY.md terms and the step text | systems: the step's game rules against the whole game and docs/systems/>`.

## The step

<step text from the plan, verbatim>

Earlier review rounds of this step, if any: `.claude/jobs/<name>/step-<N>/round-*/`. Don't repeat a finding the builder already fixed.

## Reply

The first line is exactly `PASS` or `CHANGES`. `CHANGES` only for something that must change before the step ships: a bug, a broken rule, a missing spec or doc the step asks for. Nits and ideas go under `notes` and don't make it `CHANGES`.

```
PASS | CHANGES
must: <path:line: problem. fix.> (one per line; "none")
notes: <optional, one per line; "none">
```
