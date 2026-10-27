# Git workflow

Several Claude sessions often run in parallel on this repo, sharing the main checkout.

- **Keep the main checkout on its current branch.** `git checkout` / `git switch` there moves every other session onto your branch and mixes uncommitted work.
- **New work starts from `origin/staging`**; local `main` lags behind. Create a worktree: `git fetch origin && git worktree add ../yari-<name> -b feat/<name> origin/staging` (or start the session with `claude --worktree <name>`), and work only inside it.
- A sub-feature branches from its parent feature branch; a hotfix branches from `origin/main` (`docs/deployment.md` → Releases).
- **PRs go back to where the branch came from**: feature PRs into `staging`. `main` takes only `release/*` and `hotfix/*` PRs, and CI fails on anything else. CI runs only on PRs into `main` and `staging`, so before merging a sub-feature into its parent, run the Done checks yourself.
- Right after `git worktree add`, switch the session into the worktree with the `EnterWorktree` tool (`path: ../yari-<name>`). The desktop app's diff pane only shows the session's own folder, so edits made in a worktree the session never entered don't show up there.
- Run `npm install` in the new worktree for its own `node_modules`. A junction or symlink to the main checkout's `node_modules` is unsafe: removing the worktree has deleted the real `node_modules` before.
- In a worktree session, run git as single plain commands (no `cd &&` chains or `$(…)` around git).
- Dev server in a worktree: other worktrees may hold 4200 and stopped servers can keep their port on Windows, so run `npx ng serve --port 0` in the background and wait until its output contains `localhost:` (the `Local:` label has colour codes inside it, so grepping for `Local:` never matches); the port follows, after more colour codes.
- Stage only files you changed yourself; other sessions' uncommitted work may be in the tree.
- PR review comments: `node scripts/pr-comments.mjs <PR>` prints CodeRabbit's findings (inline and nitpicks) without the HTML.
