# Game tabs and unlocks

The top menu switches the main panels. Tabs the player has not unlocked show a lock icon, are announced as locked, and do nothing when clicked; once unlocked they open their panel.

## Sub-features

- `tabs-switch` clicking an unlocked tab shows its panel and marks it current.
- `tabs-locked` a locked tab is marked locked and does not open.
- `tabs-unlock` after unlocking, the same tab opens.
- `tabs-badge` a tab with news shows a number badge (e.g. `Bestiary 3`).

## How to get to it (user POV)

- The menu bar at the top: `Battle`, `Skill tree`, `Camp`, `Spellbook`, `Map`, `Bestiary`, `Settings`.

## Driving it with the built-in browser

Preconditions:

- Doctor passes on a fresh save: `Skill tree`, `Camp`, `Spellbook`, `Map` locked.

- **Read tabs.** `javascript_tool`: `[...document.querySelectorAll('.game-menu__tab')].map(b => ({ text: b.textContent.trim(), locked: b.getAttribute('aria-disabled') === 'true', current: b.getAttribute('aria-current') === 'page' }))`. Locked tabs read e.g. `Map (Locked)` with `locked: true`.
- **Switch.** `find` "Settings", click `button "Settings"`. `Settings` is current; `app-settings` is rendered with heading `Settings`.
- **Locked click.** Click the `Map` tab (by coordinate of the `.game-menu__tab` whose text starts with `Map`). Current tab does not change; `app-world-map` is absent.
- **Unlock.** `dev.unlock('map')`. Re-read: `Map` has no `(Locked)` and `locked: false`.
- **Open.** `find` "Map", click `button "Map"`. `Map` is current and `app-world-map` is rendered.
- **Proof.** Tab readings before and after to `tmp/verify/<run-id>/game-tabs.txt`; screenshot of the open map to `tmp/verify/<run-id>/game-tabs.jpg`.

## Gotchas

- `find`/`read_page` name locked tabs just `Locked` (the `title` attribute wins), so all locked tabs look alike; pick them by `textContent` and click by coordinate.
- There is no `Towns` tab in the menu; towns open from the Map. `dev.tab(4)` forces the hidden panel.
- Tab badges are part of the name (`Bestiary 3`); `find` with the label alone still matches.
