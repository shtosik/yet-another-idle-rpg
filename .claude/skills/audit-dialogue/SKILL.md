---
name: audit-dialogue
description: Use to audit an NPC dialogue data file for orphan nodes, unreachable branches, broken `next` targets, missing flag-setters, requirement gates that won't be enforced by the current engine, and convention violations (e.g. `default != 0`, `introduction1 != 1`). Triggers on phrases like "audit this dialogue", "check Elara's dialogue", "find dialogue bugs in X", "is this NPC wired correctly?".
---

# Audit a Dialogue File

Run this skill against a file in `src/data/dialogues/**` to surface authoring + engine issues
before they reach a player. The checks below mirror the failure modes documented in
`docs/analysis/dialogue-system-analysis.md`.

## When invoked
Ask the user for the target file (e.g., `src/data/dialogues/laHarparTown/laHarparJosh.ts`).
If they invoked you with a path, skip the question.

## Checks to run

### Convention checks (cheap)
1. **`default = 0`** — the engine uses node id 0 as the returning-player entry.
2. **`introduction1 = 1`** — the engine uses node id 1 as the first-visit entry.
3. **Every option has at least one `result`** — empty `results: []` causes silent failure.
4. **No result has both `next` and `closeDialogue: true`** — `closeDialogue` wins, `next` is dead.
5. **At least one `goodbye`-style option in every reachable node** — there is no close
   button in the modal (`dialogue.component.html:5` is commented out).

### Reachability checks (graph walk)
Build a directed graph from `option.results[].next`. Then:

6. **Orphan nodes** — every declared node id (other than `default` and `introduction1`)
   must be the target of some `next:` somewhere. Example known orphan: `taskClaimed` in
   `laHarparMarvin.ts`.
7. **Dangling `next` targets** — every `next:` value must exist as a node id in the enum.
8. **Unreachable through visibility** — for results with `visibilityConditions`, sanity-check
   that there is at least one option-result combination that reaches them. (A result whose
   visibility can never be satisfied is dead.)

### Flag checks
9. **First-visit flag setter present** — at least one terminal path through `introduction1`
   (transitively) must include `effects: [{ type: 'flag', name: 'met_${NpcID.<x>}' }]`.
   If absent, the player is stuck in the intro forever.
10. **Flag name matches NPC** — the flag name must use the same `NpcID` member as the file's NPC.

### Engine-enforcement checks (this is where most surprises live)
11. **`requirementsNeeded` with type `item`, `killCount`, `waveKillCount`, `many*` is NOT enforced today.**
    Flag every such use as "advisory-only until engine fix lands." Reference: analysis §5.1.
12. **`requirementsNeeded` does not block click today.** Any option with requirements
    will fire its effects regardless. Reference: analysis §5.2.
13. **`{ type: 'quest', action: 'end' }` is silently dropped today.** Flag any usage as a
    no-op until the engine fix lands. Reference: analysis §5.3.
14. **`{ type: 'shop' }` is a stub.** Flag as not-yet-implemented. Reference: analysis §6.4.

### Data-level smells
15. **`hidden: true` on visibility conditions** — fine to author, but note the UI currently
    ignores `hidden` on `requirementsNeeded` (analysis §7.2). If the user authored a hidden
    requirement, warn them it will still render.
16. **Multiple `met_` flag setters across paths** — usually intentional (redundancy),
    but report so author is aware.
17. **`closeDialogue: true` on intro paths** — usually a mistake; the intro should funnel
    to `default`, not close the modal.

## Reporting format

Group findings under three headings, in this order:

```
## Blockers
- <thing that prevents the dialogue from working>

## Engine-level caveats
- <thing the author probably assumes works but doesn't, with a link to the analysis section>

## Style / convention
- <minor>
```

Quote the file:line for every finding. Don't dump full nodes; show the offending line plus
one or two of context. Never report "all checks passed" — if everything passes, say so in
one line.

## Don't
- Don't fix issues you find — surface them only. The `fix-dialogue-bugs` skill is for
  engine-side fixes; data-side fixes should be confirmed with the user first.
- Don't run `tsc` or the test suite unless the user asks — this is a fast, read-only audit.
