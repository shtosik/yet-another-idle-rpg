# Game tabs and unlocks

The top menu switches the main panels. Tabs the player has not unlocked show a lock icon, are announced as locked, and do nothing when clicked; once unlocked they open their panel.

## Sub-features

- `tabs-switch` clicking an unlocked tab shows its panel and marks it current.
- `tabs-locked` a locked tab is marked locked and does not open.
- `tabs-unlock` after unlocking, the same tab opens.
- `tabs-badge` an unlocked tab with news shows a number badge (`Skill tree`: unspent points, `Spellbook`: unseen spells, `Bestiary`: unseen enemies, e.g. `Bestiary 3`).

## How to get to it (user POV)

- The menu bar at the top: `Battle`, `Skill tree`, `Camp`, `Spellbook`, `Map`, `Bestiary`, `Settings`.

## Driving it with the built-in browser

Preconditions:

- Doctor passes on a fresh save: `Skill tree`, `Camp`, `Spellbook`, `Map` locked. These unlock through play within minutes (Camp on the first turtle shell, Skill tree at level 2, Map at wave 5), so read them right after load or `dev.reset()`.

- **Read tabs.** `javascript_tool`: `[...document.querySelectorAll('button.game-menu__tab')].map(b => ({ text: b.textContent.replace(/\s+/g, ' ').trim(), locked: b.getAttribute('aria-disabled') === 'true', current: b.getAttribute('aria-current') === 'page' }))`. Locked tabs read e.g. `Map (Locked)` with `locked: true`.
- **Switch.** `find` "Settings", click `button "Settings"`. `Settings` is current; `app-settings h2` reads `Settings`.
- **Locked click.** `find` "Locked" lists the locked tabs in menu order (fresh save: Skill tree, Camp, Spellbook, Map); click the fourth (`Map`). Current tab does not change; `app-world-map` is absent.
- **Unlock.** `dev.unlock('map')`. Re-read: `Map` has no `(Locked)` and `locked: false`.
- **Open.** `find` "Map", click `button "Map"`. `Map` is current and `app-world-map` is rendered.
- **Proof.** Tab readings before and after to `tmp/verify/<run-id>/game-tabs.txt`; screenshot of the open map to `tmp/verify/<run-id>/game-tabs.jpg`.

## Gotchas

- `find`/`read_page` name locked tabs just `Locked` (the `title` attribute wins), so `find` "Map" finds nothing while Map is locked; pick locked tabs by their order in `find` "Locked".
- There is no `Towns` tab in the menu; towns open from the Map, and `Map` stays current while a town is open. `dev.tab(4)` forces the towns panel.
- Badges show only on unlocked tabs and are part of the name (`Bestiary 3`); `find` with the label alone still matches. A fresh save shows no badge until the first new enemy.
