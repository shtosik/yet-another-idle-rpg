# Town NPC dialogue

The player opens the world map, picks a town from the `Towns` list, enters a building and clicks an NPC portrait to talk. The dialogue shows the NPC's name, message and response options; choosing an option advances the conversation, and the close button ends it.

## Sub-features

- `town-open` Map tab, `Towns` list, town view with its name, reputation tier (La Harpar, Mawood) and building buttons.
- `town-building` a building shows its NPC portraits.
- `dialogue-open` clicking a portrait opens the dialogue with name, message and options.
- `dialogue-option` choosing an option shows the next message.
- `dialogue-close` the close button returns to the building.

## How to get to it (user POV)

- `Map` tab, `Towns` toggle button, then a town button (`La Harpar`, `Lirold`, `Mawood`).
- Town view: building buttons (`Tavern`, `Market`, `Shop`, `Exploration Guild` in La Harpar; `Basement` appears once the `ratsWereRats` quest has started and opens a battle zone instead of an interior).
- Building: NPC portrait buttons named by NPC (`Bartender`, `Josh` in the Tavern).

## Driving it with the built-in browser

Preconditions:

- Doctor passes.
- Map and towns unlocked: `dev.unlock('map')` and `dev.unlock('towns')` (a fresh save has both locked).

- **Open map.** `find` "Map", `left_click` the `button "Map"` ref. The tab gets `aria-current="page"`.
- **Town list.** `find` "Towns", click `button "Towns"` (`aria-controls="map-town-list"`). It shows `aria-expanded="true"`; `#map-town-list button`s read `La Harpar`, `Lirold`, `Mawood`.
- **Enter town.** `find` "La Harpar", click the `button` match (not the `generic` map label). `.town-view__name` starts with `La Harpar` (fresh save: `La Harpar Neutral`, the tier in `.town-view__tier`); `.building-btn`s appear.
- **Enter building.** `find` "Tavern", click it. Portrait buttons `Bartender` and `Josh` appear (`find` may need a ~500 ms retry while they animate in).
- **Talk.** `find` "Bartender", click it. `.dialogue-modal__npc-name` reads `Bartender`, `.dialogue-modal__npc-message` contains `Oi, you! Quick, what do you want?!`, and there is at least one `li.dialogue-modal__option-btn:not(.disabled)`.
- **Choose option.** `find` the option text (`find` "Looks quite empty"), click the `generic` ref. The message changes (here to `I'll remember your face, smartass. ...`).
- **Close.** `read_page` with `filter: "interactive"`: the dialogue's close button is the unnamed `button [ref_N]` right after the `Josh` portrait (the one before `Bartender` closes the building). Click it. `app-dialogue` is gone; the portraits are back.
- **Proof.** Message before/after the option and after close to `tmp/verify/<run-id>/town-dialogue.txt`; screenshot with the dialogue open to `tmp/verify/<run-id>/town-dialogue.jpg`.

## Gotchas

- Dialogue options are `li`s with no role, and close buttons have no name; reach them by text (`find`) and by `read_page` interactive order, as above.
- `app-dialogue` `textContent` starts with whitespace (the empty close button comes first); read `.dialogue-modal__npc-name` instead.
- Options with unmet requirements have class `disabled` and ignore clicks; pick one without it.
- Some options start quests or cost gold; check `questsStore`/`playerStore` if the option is the subject of the proof, and reset state afterwards if the run continues.
- The `dev.tab(4)` (Towns) shortcut skips the map; it is not the player path.
