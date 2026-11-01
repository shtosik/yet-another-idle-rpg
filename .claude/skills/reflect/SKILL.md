---
name: reflect
description: Spawn three parallel review subagents over this session's transcript, surface learnings, and route each to a concrete edit on an existing skill or agent doc. Use when the user says reflect or asks for a retro of the session.
disable-model-invocation: true
---

# Reflect

Adapted from `cursor/plugins` pstack. Mine the current conversation for durable learnings, then route them into skill and doc edits.

Skip when the conversation is trivial, off-topic, or already covered by a skill the session followed correctly. One-offs are not learnings.

## 1. Locate the transcript

Transcripts live in `~/.claude/projects/<cwd with every non-alphanumeric character replaced by ->/`, one `<session-id>.jsonl` each; subagent transcripts sit in `<session-id>/subagents/`. A worktree session's folder is named after the worktree path. Read only this repo's folders, never other projects.

Take the newest `.jsonl` whose first user message matches this conversation's opening prompt. If none matches, write a tight digest of the session instead.

## 2. Spawn three reviewers in parallel

One message, three `Agent` calls, `subagent_type: general-purpose`. Pass each template verbatim, with the transcript path or digest substituted where marked.

| Lens | `model` | Prompt template |
|---|---|---|
| Judgment | `opus` | `references/judgment-reviewer.md` |
| Tooling | `sonnet` | `references/tooling-reviewer.md` |
| Divergent | `opus` | `references/divergent-reviewer.md` |

## 3. Synthesize

One `Agent` call, `subagent_type: general-purpose`, `model: opus`. Pass `references/synthesizer.md` verbatim, with each reviewer's full output inlined where marked. It returns an Accepted / Rejected / Backlog list.

## 4. Structural enforcement check

Move any Accepted item that a lint rule, `validate` check, hook or test would enforce more reliably to Backlog.

## 5. Apply

Present the synthesizer's full Accepted / Rejected / Backlog output and wait for explicit approval before applying any Accepted edit. The user picks the subset and may redirect routings.

- Project skills (`.claude/skills/`), `AGENTS.md`, `CODING_STANDARDS.md` and `docs/` are edited on a branch per `docs/git-workflow.md`; the user's own skills (`~/.claude/skills/`) are edited in place. Never edit a skill under `~/.claude/plugins/`.
- Edit skills and agent docs with the `mattpocock-skills:writing-for-agents` skill loaded.
- After editing a skill, run `npm run sync-skills` so Codex gets the same copy.
- Backlog items are mechanisms: offer to run `/correct` on them.

Never push or open a PR without the user asking.

## 6. Summarize for the user

Short list, no preamble:

- Edits applied: `<path>`. What changed, one line each.
- Backlog: the pattern and the suggested mechanism, one line each.
- Dropped: one line per rejected finding with the synthesizer's reason.
