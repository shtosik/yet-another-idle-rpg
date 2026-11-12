# Plan: Chapter One, The Sap Winter

Builds [`docs/ideas/chapter-one-sap-winter.md`](../ideas/chapter-one-sap-winter.md): two quests, the side Zone The Goat Cleft, search spots and hidden passages, the Viperskin set and a ranged damage stat. The idea doc holds the story, dialogue scripts, spot hints and item text; this plan holds the build order. Needs [`scene.md`](scene.md) merged first (spots sit on the Scene).

One branch, `feat/chapter-one-sap-winter`, one PR into `staging`, each step a commit. Code references are from `staging` at `34bbc9a`; re-check them when a step starts.

## Owner decisions (2026-11-09)

All in the idea doc; the ones that shape the code:
- Spots are baked into the art: no highlight, no cursor change, no tutorial pulse. A quest spot works only during its step and only while its item isn't held.
- Hidden Zones are full Zones. A found passage unlocks its Zone for good and puts it on the map.
- The Goat may appear in two Zones.
- Viperskin gets no set bonus until item sets exist; each piece carries the ranged stat.
- Rewards as written in the idea doc (quest pay overall is a later topic).
- The Chapter UI (labels, markers, title card) is not built here.

## Open (owner)

Carried from the idea doc §8: Signs of Rot stays ungated (1), the token is kept as a Chapter Two clue (7), Viperskin recipes from Hoarder drops rather than Brenna (10). Build as recommended unless the owner says otherwise.

## Order

Steps 1, 2 and 3 are independent. Step 4 needs 3 (the Zone) and `scene`. Step 5 needs 3 (its materials). Step 6 needs 2 and 4. Step 7 needs 6. Step 8 last. Art (Step 3, 4) can be generated ahead of the code.

### 1. Ranged damage stat (S, Sonnet)
- `rangedDamageMultiplier` (base 1, `player.ts`), mirroring `meleeDamageMultiplier`: `hit-resolution.ts` multiplies auto-attacks with a ranged weapon and ranged spells by it; the stat row in `stat-rows.ts`; label and description in `app.json`.
- Offline: `offline-simulation.ts` gets the weapon category (or an `isRangedWeapon` flag beside `isMeleeWeapon`, `offline-progress.service.ts:158`), so offline kills use it.
- Specs: `hit-resolution` (ranged hit multiplied, melee and magic not); offline simulation with a ranged weapon matches online damage.
- Docs: `game-loop-and-combat.md`, `player-stats-inventory-equipment.md`, `offline-progress.md`.

### 2. Kept turn-in items and item descriptions (S, Sonnet)
- `ItemRequirement` gets `keep?: true`; `item.consumed` (`requirement-handlers.ts`) returns nothing for it. `DialogueManagerService.turnIn` reservations still count it as needed.
- Item tooltip shows `items:descriptions.<ItemID>` when the key exists (quest items first; `item.interface.ts:20` `description?` is unused today, `known-issues.md` "no item descriptions").
- Specs: a turn-in with `keep` advances and leaves the item; tooltip shows a description.
- Docs: `quests.md`, `player-stats-inventory-equipment.md`; remove "no item descriptions" from `known-issues.md` if quest items now cover it.

### 3. The Goat Cleft (L, Opus, `/add-enemy-and-zone`)
- `ZoneID.goatCleft`, tier 4, 8 Waves, regulars Goat, Rock Viper, Goblin Hoarder; Boss Goblin Packrat. No `previousZoneId`/`nextZoneId`. Its `ZONES_DATA` entry goes **after** the Mountain Pass, so Goat quest links keep pointing at the Pass (`requirement-handlers.ts` `firstUnlocked`).
- Mastery reward: 800 gold, 12 Explorer Tokens, 5 Viperskin, 5 Pack Leather.
- Enemies, weaknesses, drop rows and rates from the idea doc §4a; `hobbsSatchel` 1 in 1 with `requiredActiveQuestId: theQuietRoad`. Pets and shiny pets via `/add-shiny-variant` (Rock Viper, Goblin Hoarder, Goblin Packrat).
- Items: Viperskin, Viper Venom, Pack Leather (materials), Lost Trade Goods (junk, sellable), Buckled Harness (chest, gold find), Runner's Boots (boots, attack speed), stats matched to the Troll Hide Vest tier via `/add-equipment-item`.
- World map marker beside the Pass; `ZONE_UNLOCK_NOTIFICATIONS` entry; names in `zones.json`, `enemies.json`, `items.json`.
- Wick's order pool: Viperskin with `sourceZones: [goatCleft]`.
- Art (`/generate-2d-asset`): Cleft background (832×1664, the Zone scene size), three enemy sprites with shiny variants, item icons.
- Docs: `zones-waves-unlocks.md` (allow an enemy in more than one Zone; the Goat's Task weight doubles, its bestiary rank counts toward both Hunter stars), `enemies-shiny-pets-bestiary.md`, `farming.md` (Wick's pool).

### 4. Search spots and hidden passages (L, Opus, plan mode)
- **Data**: `src/data/scene-spots.ts`, keyed by scene (Zone or Building): the scene's mask url and a list of spots `{ color, kind: 'search' | 'passage', when, gives }`. `when` is `{ questId, step }` for a quest spot (Chapter One has only these); `gives` is `{ itemId }` or `{ zoneId }`, plus `foundTextKey`.
- **Mask hit test**: the Scene's mask layer loads the mask once into an offscreen canvas; a click on the Scene reads the pixel at the click's scene coordinates and looks its colour up. No cursor change, no hover state, nothing drawn.
- **When a spot works**: quest active at that step **and** the item not held (search), or the Zone not unlocked (passage). Otherwise the click does nothing.
- **Search**: Item grant of the item (the Quest tab has no cap), found text as a battle or Building toast through Notices.
- **Passage**: `UnlockService.grant({ zone })` (a third Zone unlock path beside the boss chain and town entrances; no `UNLOCK_RULES` entry), found text, then `BattleStore.setZone`. Saved in `unlockedContent.zones` like any Zone.
- Spots in Chapter One: burned Guild post and goat cleft (Mountain Pass), trunk under the stair (Elder's Tree). Repaint those two backgrounds with the objects baked in, and paint their masks (same size as the art).
- `npm run validate`: every mask exists and matches its art's size; every spot colour appears in its mask; every `gives.itemId` is a quest item.
- Specs: hit test maps a Scene click to the right colour at two Scene sizes; a spot inactive before its step, active during, inactive once the item is held; a passage grants the Zone once and moves the player.
- Docs: new `docs/systems/scene-spots.md` (row in `docs/systems/README.md`); `zones-waves-unlocks.md` and `GLOSSARY.md` "Zone unlock" (third path); `GLOSSARY.md` Search spot, Hidden passage, Secret, Side Zone, Found text.

### 5. Viperskin set (M, Sonnet, `/add-equipment-item`, `/add-recipe-or-consumable`)
- Five pieces (helmet, chest, legs, boots, gloves), each with a little `rangedDamageMultiplier`. Workbench recipes from the idea doc; crafted gear sells for about 1.5× its materials (`validate` checks).
- Five Viperskin pattern scrolls (`ItemType.recipe`), Goblin Hoarder drops at 1 in 40 each, with a small sell value (a known recipe's scroll can't be used).
- Docs: `consumables-camp-crafting.md`, `player-stats-inventory-equipment.md`.

### 6. Quests (M, Sonnet, `/add-quest`)
- `theQuietRoad` (Marvin; start: Bandit killed ×1, which reads lifetime kills before the quest starts) and `theSameWinter` (Corwin; start: `theBlightedHeart` and `theQuietRoad` completed). Steps, turn-in NPCs and rewards from the idea doc §4; the Finn and Elarion steps use `keep: true`.
- Quest items (`ItemType.quest`, unsellable): `passPostDaybook`, `hobbsSatchel`, `corwinsLetter`, `warchiefsToken` (Gnoll Warchief, 1 in 3, `requiredActiveQuestId`), `corwinsRitualNotes`, `corwinsSecondLetter`, with descriptions (the daybook's carries Hobb's last line, a cleft hint).
- Docs: `quests.md` (Chapter One section).

### 7. Dialogue (L, Sonnet, `/add-npc-dialogue`, then `/audit-dialogue` per NPC)
- Nodes from the idea doc §7 for Marvin, Corwin, Finn, Elarion, Milo, Sylvie, the Bartender, the Trader and Josh. `give` effects for `corwinsLetter` (Marvin) and `corwinsSecondLetter` (Corwin); the Bartender's 20 gold through `deduct`.
- Quest hub order: turn-ins, then in progress, then offers (`dialogue.md`).
- Docs: `dialogue.md` if a new pattern appears.

### 8. Check (S, Sonnet)
- `npm run check`; `npm run sim` to confirm the main route is unchanged.
- `.claude/skills/verify-yari`: start and finish both quests with `window.dev`, find both Pass spots and the trunk from their hints at 1280 and 1536 wide, enter the Cleft from the passage and from the map. Evidence path in the PR body.
- Changelog:
  - `[feature] Chapter One, The Sap Winter: Marvin has work for you on the Mountain Pass, and the story runs on to Mawood and back.`
  - `[feature] Look closely at the world: some things in the background can be searched, and one leads somewhere new.`
  - `[feature] The Goat Cleft, a hidden side area off the Mountain Pass, with new enemies, a new boss and the Viperskin gear for bow users.`
  - `[feature] New stat: ranged damage multiplier.`
- Idea doc status → In progress, then Done with the PR.
