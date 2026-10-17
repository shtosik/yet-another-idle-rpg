# Git workflow

## Stacked PRs

A stack is a chain of PRs where each one targets the previous branch. Merging a PR into its (already merged) base branch does **not** put its commits in `main`: the code is stranded on a branch that is about to be deleted. This happened to the asset-pipeline adapter and CLI PRs.

- Merge a stack from the bottom, and before each merge retarget the PR to `main` (`gh pr edit <n> --base main`). Or merge the stack's top branch into `main` once and close the lower PRs.
- Before deleting any branch, `git cherry origin/main origin/<branch>` must print nothing. A `+` line is a commit that never reached `main`; merge or port it first.

## Staging

Stage explicit paths (`git add path/a path/b`), never a directory or `-A`. The working tree often holds the user's untracked files (docs, agent definitions) that must not ride along in an unrelated commit.

## Worktrees

Run `npm ci` inside a temporary `git worktree`. Never link its `node_modules` to the main checkout: `git worktree remove --force` follows the link and empties the real `node_modules`.
