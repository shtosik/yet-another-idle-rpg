# Town NPC dialogue

The player opens the world map, picks a town from the `Towns` list, enters a building and clicks an NPC portrait to talk. The dialogue shows the NPC's name, message and response options; choosing an option advances the conversation, and the close button ends it.

## Sub-features

- `town-open` Map tab, `Towns` list, town view with building buttons.
- `town-building` a building shows its NPC portraits.
- `dialogue-open` clicking a portrait opens the dialogue with name, message and options.
- `dialogue-option` choosing an option shows the next message.
- `dialogue-close` the close button returns to the building.

## How to get to it (user POV)

- `Map` tab, `Towns` toggle button, then a town button (`La Harpar`, `Lirold`, ...).
- Town view: building buttons (`Tavern`, `Market`, `Shop`, `Exploration Guild` in La Harpar).
- Building: NPC portrait buttons named by NPC (`Bartender`, `Josh` in the Tavern).

## Driving it with the built-in browser

Preconditions:

- Doctor passes.
- Map and towns unlocked: `dev.unlock('map')` and `dev.unlock('towns')` (a fresh save has both locked).

- **Open map.** `find` "Map", `left_click` the `button "Map"` ref. The tab gets `aria-current="page"`.
- **Town list.** `find` "Towns", click `button "Towns"` (`aria-controls="map-town-list"`). It shows `aria-expanded="true"` and a list of town buttons.
- **Enter town.** `find` "La Harpar", click the `button` match (not the `generic` one). `.town-view__name` reads `La Harpar` and building buttons appear.
- **Enter building.** `find` "Tavern", click it. Portrait buttons `Bartender` and `Josh` appear.
- **Talk.** `find` "Bartender", click it. `app-dialogue` `textContent` starts with `Bartender` and contains `Oi, you! Quick, what do you want?!` and at least one option (`li.dialogue-modal__option-btn`).
- **Choose option.** Click the centre of the first `li.dialogue-modal__option-btn` by coordinate. The message text changes.
- **Close.** Click the centre of `app-dialogue app-close-button button` by coordinate. `app-dialogue` is gone; the portraits are back.
- **Proof.** Message before/after the option and after close to `tmp/verify/<run-id>/town-dialogue.txt`; screenshot with the dialogue open to `tmp/verify/<run-id>/town-dialogue.jpg`.

## Gotchas

- At the pane's default width the portraits can sit off-screen; scroll the target into view and take a screenshot before clicking. Do not use `resize_window` (it breaks coordinates).
- Dialogue options and the close button have no accessible names: coordinate clicks.
- Options with unmet requirements are rendered with class `disabled` and ignore clicks; pick one without it.
- Some options start quests or cost gold; check `questsStore`/`playerStore` if the option is the subject of the proof, and reset state afterwards if the run continues.
- The `dev.tab(4)` (Towns) shortcut skips the map; it is not the player path.
