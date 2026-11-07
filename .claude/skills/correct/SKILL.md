---
name: correct
description: "Find the mistakes agents keep repeating in this repo and make each one impossible. Try architecture first, then types, then a lint, validate check or hook whose error names the fix, then a test, and write docs last. Prove each check fails on a real past mistake. Use for /correct, or when the owner corrects the same mistake twice."
disable-model-invocation: true
---

# Correct

Adapted from `cursor/plugins` pstack. The owner keeps correcting agents in this repo for the same mistakes. Change the repo so the next agent can't make them.

Assume every contributor is an agent that sees only the files it opened, copies the nearest example, and takes the shortest path that compiles. Design the repo so a change that looks right from one file is right for the whole repo.

## Find the mistake classes

Read the evidence, newest first:

- Past sessions: `node scripts/agent-friction.mjs` prints the owner's corrections, refused tool calls and the most common commands from this repo's transcripts.
- `git log` on `origin/staging`: reverts, `fix(...)` commits that follow a feature, CodeRabbit fixes (`node scripts/pr-comments.mjs <PR>`).
- `AGENTS.md`, `CODING_STANDARDS.md`, `docs/git-workflow.md`: every rule there is a past mistake; check what enforces it.
- Comments that explain workarounds.

Group the mistakes into classes. A class counts once it has happened twice.

## Fix each class at the highest level that works

1. **Eliminate it with architecture.** Give each piece of state one owner and each task one supported way. Hide internals so the wrong import fails. Replace hand-synced lists with one source of truth. Delete old ways and dead code an agent would copy.
2. **Enforce it with types** so the bad state can't be written (`Record<Union, …>`, unions without `default`, branded ids).
3. **Fail a check whose error names the fix.** The checks here:
   - `eslint.config.mjs` (`npm run lint`) for code patterns.
   - `scripts/validate-data.mjs` (`npm run validate`) for game data, i18n, assets, docs and skills.
   - Hooks in `.claude/settings.json` (`PreToolUse`) for agent actions no file shows, such as a command run in the wrong place. A hook only binds Claude; mirror the rule in `AGENTS.md` for Codex.

   If the pattern is already common, fail only when a change adds more.
4. **Test the behavior.** Fix or delete any test that still passes when the behavior it checks breaks, or that fails when only the internals change.
5. **Write docs or agent rules last, only for judgment calls.** Nothing fails when an agent skips them.

## Fix and prove

Fix the most frequent classes now, one commit each. Prove each new check fails on a real past mistake: reproduce it, run the check, paste the failure. `npm run check` runs every Done check the way CI does. Exceptions go on the offending line with a reason.

## Keep the rule table

Keep the table under `## Enforced rules` in `AGENTS.md` pairing each rule with what enforces it. When the owner corrects you, fix the mistake and add the rule. If the rule was already there and nothing enforces it, that's a repeat: fix it at the highest level.

**Reply:** each class with its evidence, the level you picked, why a higher level didn't work, and the proof that the check fails on the old mistake.
