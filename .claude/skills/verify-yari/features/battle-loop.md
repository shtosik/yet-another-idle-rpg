# Idle battle loop

The player fights automatically from page load: the current zone's enemies attack and die on their own, the kill count and wave advance, and the HUD's XP and gold rise. Progress survives a reload.

## Sub-features

- `battle-auto` combat runs with no input; enemy HP drops and new enemies spawn.
- `battle-kills` the zone kill count and wave advance.
- `battle-rewards` XP and gold in the HUD increase from kills.
- `battle-persist` kill count, XP and gold survive a page reload.

## How to get to it (user POV)

- Open the game: the battle pane on the left is always visible, on every tab.
- `Battle` tab additionally shows the player stats panel.

## Driving it with the built-in browser

Preconditions:

- Doctor passes on a fresh save (Horseshoe Beach, wave 1/10).

- **Read start state.** `javascript_tool`: `({ kills: document.querySelector('app-battle-nav-bar').textContent.match(/Kill count:\s*\d+\s*\/\s*\d+/)[0], wave: document.querySelector('app-battle-nav-bar').textContent.match(/Wave:\s*\d+\/\d+/)[0], hud: document.querySelector('app-player-hud').textContent.replace(/\s+/g, ' ').trim(), enemy: document.querySelector('app-enemy h2').textContent.trim() })`. Fresh save: `Kill count: 0 / 10` (or 1-2 if doctor waited), HUD `Lv 1 <xp> / 100 <gold>`.
- **Let it fight.** Wait ~10 s (`javascript_tool` with `await new Promise(r => setTimeout(r, 10000))`), read again. Kill count is higher, HUD XP and gold are higher, the enemy name or HP bar (`.hp-bar` text `<hp> / <max>`) has changed.
- **Saved.** `JSON.parse(localStorage.getItem('playerStore')).state.resources` has `experience` and `goldCoins` matching the HUD; `JSON.parse(localStorage.getItem('playerStore')).state.enemyKillCounts` is non-empty.
- **Reload.** `navigate` to the same URL, wait 3 s, read again. Kill count, XP and gold are at least the pre-reload values.
- **Proof.** Write before/after/reload readings to `tmp/verify/<run-id>/battle-loop.txt`; screenshot after the wait and copy it to `tmp/verify/<run-id>/battle-loop.jpg`.

## Gotchas

- `innerText` returns `KILL COUNT` (CSS uppercase); match on `textContent`.
- Levelling up resets the XP bar, so XP can drop while level rises. Compare level first, then XP.
- The kill count line is `Kill count: N / 10` per zone star goal, separate from `Wave: N/10`.
- A reload may add a little offline progress; assert "at least", not equality.
