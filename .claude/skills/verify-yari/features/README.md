# YARI verification map

The maintained source for verifying player-facing behaviour of Yet Another RPG Idle. Read this index, then use the matching feature file as the recipe. Launch, doctor, evidence and cleanup rules are in `../SKILL.md`.

## Baseline preconditions

- Your own `npx ng serve --port 0` server (dev build, cheats on), opened in the built-in browser at the pane's own size.
- Doctor passes: `window.dev` is an object, the battle pane shows an enemy.
- Fresh save: level 1, zone Horseshoe Beach, wave 1/10, empty inventory, nothing equipped, only `Battle`, `Bestiary` and `Settings` tabs unlocked. Combat runs on its own from load, so within minutes drops fill the inventory and Camp, Skill tree and Map unlock; `dev.reset()` returns to this state.
- Never drive a server this run did not start.

## Driving conventions

- Real clicks (`find` then `computer` `left_click`) for the step under test; `window.dev` only for preconditions.
- Click by `ref`: accessible names (`button "Map"`, `button "Bartender"`), visible text for unnamed elements, `read_page` interactive order for unnamed buttons (`../SKILL.md`, Drive). No coordinate clicks.
- Read text with `textContent` of the specific element; CSS uppercases some labels.
- Enum IDs live in `src/enums/ids/*.enum.ts`.

## Proof and skip reporting

- Capture state before and after the action, plus a screenshot copied into `tmp/verify/<run-id>/`.
- Check the side effect in the saved store (`localStorage` key, `{v, state}` envelope), then reload and re-read the screen.
- Record the feature file and entry point with every artifact.
- An unreachable path is reported with the attempted step and the unmet precondition, never verified through a different path.

## Feature entry contract

Each feature file has an H1, one paragraph of player-visible behaviour, then four H2s in order: `Sub-features`, `How to get to it (user POV)`, `Driving it with the built-in browser` (starts with `Preconditions:`), `Gotchas`. No implementation details beyond stable handles and store keys used as proof.

## Features

- [Idle battle loop](./battle-loop.md): auto-combat, kill count, XP and gold, persistence across reload.
- [Equip gear](./equip-gear.md): right-click to equip from the inventory and unequip from the paper doll, saved equipment.
- [Town NPC dialogue](./town-dialogue.md): Map, town list, building, NPC portrait, dialogue options and close.
- [Game tabs and unlocks](./game-tabs.md): locked tabs, unlocking, switching panels.

Not mapped yet: skill tree (a Leaflet canvas with no accessible node handles), camp crafting, shops, quests turn-in, the `Reputation` panel tab (the town's tier label is in `town-dialogue.md`), zone mastery stars and wave buttons in the battle nav bar, battle footer spell slots, spellbook, bestiary, arena, offline progress, save export/import in Settings.
