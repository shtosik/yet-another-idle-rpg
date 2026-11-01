---
name: blast-radius
description: "Find what a change could break somewhere else before it ships, beyond the diff, and prove the one fact it's safe because of by running real code. Use for 'blast radius of X', 'what could this break', save or store changes, or reviewing a small diff you don't trust."
disable-model-invocation: true
---

# Blast radius

Adapted from `cursor/plugins` pstack. Find what a change breaks somewhere else, before it ships.

Listing the callers is not the job; grep does that in a second. The job is the breakage grep won't show you.

## Don't trust your own writeup

A writeup that sounds right reads as convincing whether or not it's true. Find the one or two facts the change's safety depends on and prove them by running code.

For each such fact, get it as far down this list as is cheap, and say where it stopped:

1. You said so. Worthless on its own.
2. You pointed at the line: a real `file:line`, or the library's own source in `node_modules`.
3. You walked the failure step by step and it doesn't reach.
4. You ran it: a spec or a Node script that calls the real code and fails loud if you're wrong.
5. You reproduced it in the running app (`verify-yari`, setting state through `window.dev`).

## Where grep stops in YARI

- **Saves.** Every store persists to `localStorage` as `{ v, state }`; a version bump without a migration resets that store (`docs/systems/persistence.md`). A renamed or retyped state field or a changed enum number breaks existing saves silently unless the store's `version` and `migrations` cover it. Never lower `inventorySlots` without a migration (`AGENTS.md`).
- **Numeric enums.** Data, saves and `window.dev` use enum numbers. Inserting a member mid-enum shifts every later number.
- **Derived stats.** `stats` in `PlayerStore` is computed from every source; a new source or changed formula moves every number in the stats panel, combat and offline progress. `npm run sim` models its own build in `scripts/sim-economy.mjs`, so it misses the change until updated by hand.
- **Data read by other systems.** Quest steps, dialogue conditions, shops, drops and unlock rules reference each other by id. Grep `src/` for the enum member (`ItemID.woodenSword`), including `src/data/dialogues/` and `src/assets/locales/`; `npm run validate` checks the broken references it knows about.
- **Timing.** Ticks run on wall-clock time through `worker-timers`; saves are throttled to one per second; offline progress replays the same rules in bulk. Check both the live tick and the offline path.
- **i18n.** Keys are looked up by string; a renamed key shows the raw key in the UI with no error.

## Steps

1. Read the change: the diff, the symbols it adds, changes and deletes, and what it now does differently that the diff doesn't spell out.
2. Find the one fact it's safe because of. Most risky-looking changes are safe because of one fact ("this field was never saved"). If it holds, most risks clear at once. Spend your time here.
3. Look where grep stops (list above), plus library source in `node_modules` at the installed version.
4. Rate each risk: a real chance of happening and a real cost if it does. Keep confirmed risks; list checked-and-cleared ones separately. Cite real `file:line`; a search that finds nothing is still an answer.
5. Prove the one fact: write a spec or script that runs the real code, run it, paste what happened.

## What to hand back

- **What it does.** What changed, including the part that isn't obvious.
- **The one fact it's safe because of.** State it, the step you got it to, and the proof. If you couldn't prove it, write unproven.
- **Risks.** How it breaks, `file:line`, how likely and how bad, how to check.
- **Cleared.** What you checked and why it's fine.
- **Before you merge.** The cheapest test or repro that catches the real bug, including the script you wrote.
