# Git workflow

Several Claude sessions often run in parallel on this repo, sharing the main checkout.

- **Keep the main checkout on its current branch.** `git checkout` / `git switch` there moves every other session onto your branch and mixes uncommitted work.
- For a new feature branch, create a worktree: `git worktree add ../yari-<name> -b feat/<name>` (or start the session with `claude --worktree <name>`), and work only inside it.
- Right after `git worktree add`, switch the session into the worktree with the `EnterWorktree` tool (`path: ../yari-<name>`). The desktop app's diff pane only shows the session's own folder, so edits made in a worktree the session never entered don't show up there.
- Run `npm install` in the new worktree for its own `node_modules`. A junction or symlink to the main checkout's `node_modules` is unsafe: removing the worktree has deleted the real `node_modules` before.
- Stage only files you changed yourself; other sessions' uncommitted work may be in the tree.
