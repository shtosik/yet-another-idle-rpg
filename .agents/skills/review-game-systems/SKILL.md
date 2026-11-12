---
name: review-game-systems
description: Use to review a feature plan or idea doc as a game-systems expert before it is accepted or built — finds uncertain mechanics, asks the owner questions, checks the plan against the whole game and proposes a better approach. Plans and ideas only, not code. Triggers on "review this plan", "review the design of X", "is this plan sound?", "what are we missing in this idea?", "grill this plan against the game".
---

# Review game systems

Read-only review of one plan (`<main checkout>/.claude/jobs/<name>/plan.md`, untracked) or `docs/ideas/*.md` file against the rest of the game. Output is a text report. Write no file and edit nothing, not even the plan: the main thread applies the answers.

Every finding comes from the game as it is, never from your own taste, and cites its source. Opinions you cannot cite go only under **Unsourced judgment**.

## Steps

1. **Pick the target.** Use the path given, else the plan or idea named in the conversation, else ask which.
2. **Read the plan as given** (the file in the working tree, or the text in the conversation: it may be new or revised and absent from staging; do the same for proposal docs it links that staging lacks). **Read all evidence from `origin/staging`**: run `git fetch origin staging`, then `h=$(git rev-parse origin/staging)` and `git show "$h:<path>"` (Git Bash on Windows rewrites a literal `origin/staging:<path>`). The checkout may be stale or on `main`.
3. **Read the plan fully**, plus every idea or doc it links.
4. **Find the systems it touches.** Open `docs/systems/README.md`, match every mechanic the plan changes or relies on (also those it does not name) to a system doc, and read each doc. Read `GLOSSARY.md`, and `docs/ideas/known-issues.md` for open bugs in those systems.
5. **Check claims against sources**, in this order of trust: shipped code and data in `origin/staging`, `docs/systems/*`, `GLOSSARY.md`, accepted ideas, proposed ideas. When a doc and the code disagree, the code wins; report the doc as wrong.
6. **Scan `docs/ideas/README.md`** for ideas that overlap or collide, and list the plans in `<main checkout>/.claude/jobs/*/plan.md` for ones that do; read the ones that do.
7. **Run `npm run sim`** (`-- --reputation`, `-- --upgrades`; see `docs/ideas/progression-pacing.md`) only when a claim about pacing, cost or rewards needs numbers. It reads the checkout it runs in, so run it only where `src/`, `package.json`, `scripts/sim-economy.mjs` and `tsconfig.json` match `origin/staging` (an empty `git diff origin/staging -- <those paths>`); otherwise report those numbers as unavailable. Quote the output you used.
8. **Write the report** (format below).

## What to flag

Tag every finding with one category:

1. **Unbased number**: a cost, percentage, chance or amount with no reasoning or sim behind it.
2. **Unnamed system**: the plan changes or relies on a system it never mentions (saves, offline progress, drops, shops, quests, UI that reads the changed value).
3. **Owner decision conflict**: breaks a rule listed under "Owner decisions in force" in `docs/ideas/README.md`, `AGENTS.md`, or a system doc (for example inventory slot bonuses never go down without a save migration).
4. **Save / offline impact**: changes the save shape, a stack key, an item identity, or how `offline-simulation` computes progress.
5. **Economy / pacing**: moves gold, XP, drop rates or zone pacing in a way the sim or `zones-waves-unlocks.md` contradicts.
6. **Idea overlap**: duplicates, depends on or collides with another idea or plan.
7. **New term**: a word the plan uses that is missing from, or conflicts with, `GLOSSARY.md`.

Severity: **blocks** (building it would be wrong or break something), **should answer** (a decision the owner has to make), **nit**.

New NPCs, places or story: write "needs lore-keeper" and give no lore verdict yourself.

## Report format

Sections, in this order. Omit a section only when empty, and say so for Findings.

1. **Verdict**: one line — ready / needs answers / needs rework.
2. **Systems touched**: from `docs/systems/README.md`, split into *named in the plan* and *missing from the plan*.
3. **Findings**: numbered, most severe first. Each has category, severity, source (`file:line` or doc section or sim output), the question, and `➡️` your recommended answer.
4. **Proposed plan edits**: concrete text the main thread can paste into the plan, one per finding that needs a change.
5. **Alternative approach**: only when two or more blockers share a root cause. A short outline, not a redesign.
6. **Unsourced judgment**: opinions you could not cite, each marked as such. Keep them; the owner decides how much to trust them.

## After the report

The reviewer stops after the report and edits nothing. For the main thread that receives it: put the findings to the owner as numbered questions with the recommended answer, then edit the plan with the answers. Review again only when asked.
