# Keybinds

**Scope:** S · **Status:** Proposed 2026-10-24

Keyboard shortcuts for frequent actions, so the player doesn't have to reach for the navbar during play.

## Sketch
- Number keys `1`–`7` switch navbar tabs in bar order; locked tabs ignore their key.
- `Esc` closes the open shop, building, dialogue or modal.
- Later: keys for spell slots and previous / next wave.
- Ignore keys while focus is in a text input.
- Show the key next to each tab label or in its tooltip.

## Touch-points
A single keyboard listener service, `game-menu` component, `battle-side-buttons`, spell bar.
