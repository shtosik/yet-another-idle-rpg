# Idle battle loop

The player fights automatically from page load: the current zone's enemies attack and die on their own, the wave's kill count rises, and the HUD's XP and gold rise. Progress survives a reload.

## Sub-features

- `battle-auto` combat runs with no input; enemy HP drops and new enemies spawn.
- `battle-kills` the current wave's kill count rises. The wave itself advances only with the `autoWaveProgression` node (or the player's next-wave button), so it stays at 1/10 on a fresh save.
- `battle-rewards` XP and gold in the HUD increase from kills.
- `battle-persist` kill count, XP and gold survive a page reload.

## How to get to it (user POV)

- Open the game: the battle pane is the left column, on every tab (at ~1024 px it collapses to a sliver; see `../SKILL.md` Launch).
- `Battle` tab additionally shows the player stats panel.

## Driving it with the built-in browser

Preconditions:

- Doctor passes on a fresh save (Horseshoe Beach, wave 1/10).

- **Read start state.** `javascript_tool`:

  ```js
  const read = () => {
    const nav = document.querySelector('app-battle-nav-bar').textContent, hud = document.querySelector('app-player-hud');
    return { kills: nav.match(/Kill count:\s*\d+(\s*\/\s*\d+)?/)?.[0], wave: nav.match(/Wave\s*\d+\/\d+/)?.[0],
      level: hud.querySelector('.hud__level').textContent.trim(), xp: hud.querySelector('.hud__xp-text').textContent.trim(),
      gold: hud.querySelector('.hud__currency--gold').textContent.trim(),
      enemy: document.querySelector('app-enemy h2')?.textContent.trim(), hp: document.querySelector('app-enemy .hp-bar')?.textContent.trim() };
  };
  read()
  ```

  Fresh save: `Kill count: 0 / 10` (or 1-2 if doctor waited), `Wave 1/10`, `Lv 1`, XP `<n> / 100`.
- **Let it fight.** Wait ~15 s (`await new Promise(r => setTimeout(r, 15000))`), read again. Kill count, XP and gold are higher (a fresh character kills one enemy every ~5-15 s); the enemy name or HP (`<hp> / <max>`) has changed.
- **Saved.** `JSON.parse(localStorage.getItem('playerStore')).state` has `resources.level`, `resources.experience` and `resources.goldCoins` (at or a little behind the HUD: saves are batched), and `enemyKillCounts` (keyed by `EnemyID`) is non-empty. Keep this reading: it is the lower bound after reload.
- **Reload.** `navigate` to the same URL, wait 3 s, read again. Level is at least the saved level; XP is at least the saved XP only when the levels match (a level-up resets it). Gold and kill count are at least the saved values.
- **Proof.** Write before/after/reload readings to `tmp/verify/<run-id>/battle-loop.txt`. A screenshot of the battle pane needs a page wider than the pane's ~1024 px; at that width use the DOM text as proof.

## Gotchas

- The nav bar reads `Wave 1/10` (no colon) and `Kill count: N / 10`; the `/ 10` disappears once the wave target is met (`Kill count: 10`, `11`, ...), and on the boss wave the target is 1.
- The kill count is the current wave's (`zonesProgression[zone][wave]`), not the zone's star goals listed above it.
- Levelling up resets the XP bar, so XP can drop while level rises. Compare level first, then XP.
- Stores save at most once per second and not on page hide: compare post-reload values with the saved store read just before the reload, not with the DOM.
- A reload under 60 s claims no offline progress.
- Within the first minute or two a fresh save drops a turtle shell (Camp unlocks, with a popup) and reaches level 2 (Skill tree unlocks); neither stops combat.
