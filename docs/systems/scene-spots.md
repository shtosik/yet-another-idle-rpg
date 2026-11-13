# Scene spots

Secrets painted into a background: a **search spot** gives an item, a **hidden passage** unlocks a side Zone and moves the player into it. The player finds them from NPC hints and step text, never from a marker. Story and placement: `docs/ideas/chapter-one-sap-winter.md` §4a.

Code:
- `src/data/scene-spots.ts:SCENE_SPOTS` — per background art url: its Scene mask and its spots (`id`, mask `color`, `when` quest step, `gives` an item or a Zone).
- `src/app/components/shared/scene/scene-mask/` (`app-scene-mask`) — the click layer. `app-battle` projects it into the zone Scene under the enemy sprite; `app-town-building` projects it under the title and NPC frames.
- `src/app/services/scene-spots.service.ts:SceneSpotsService` — `isActive` (`spotActive`), `use`, and the mask pixels (`mask`, `maskColorAt`).

## Rules (owner decisions 2026-11-09)

- **Baked into the art.** A spot is ordinary scenery in every Wave: no outline, glow, icon, tutorial pulse, hover state or cursor change. The mask layer draws nothing.
- **When it works**: its quest is active at `when.step`, and the item isn't held (search) or the Zone isn't unlocked (passage). Any other click does nothing, so clicking scenery is never a tell.
- **Search**: one item through an atomic Item grant (quest items go to the uncapped Quest tab), then the found text (`map:spots.<id>.title|body`) in the unlock-notice modal (`Notice` `found` → `NoticesService`).
- **Passage**: `UnlockService.grant({ type: 'zone' })` (shows the Zone's `ZONE_UNLOCK_NOTIFICATIONS`, which is its found text), then `GameNavigationService.fightIn`. A third Zone unlock path beside the boss chain and town entrances (`zones-waves-unlocks.md`); no `UNLOCK_RULES` entry. The side Zone is saved in `unlockedContent.zones`, stays on the world map and is a Zone like any other.
- **Bestiary**: "Found in" lists only unlocked Zones, so a side Zone stays unnamed until its passage is found (owner 2026-11-13).

## Scene mask

A PNG the size of its art (`scene.md`), transparent except for one flat, unblended colour per spot. A click maps to an art pixel (`scenePoint`: offset in the layer ÷ layer size × art size), and the mask colour there picks the spot. The mask loads once per url into an offscreen canvas.

A spot must sit outside every HUD rect (`BATTLE_HUD_AREAS`; for a Building `BUILDING_HUD_AREAS` and each NPC's `npcFrameArea`), or it can't be clicked. On a zone Scene that leaves the left 14% from 30% to 62% down (left of the enemy name block) and the left 29% from 62% to 78%.

`npm run validate` (check 18): mask and art exist and have the same size; every spot colour is in its mask, and its bounding box is clear of the HUD; ids and colours are unique per art; a search spot gives an `ItemType.quest` item and has its found text; a passage's Zone has no `previousZoneId`.

## Making a spot

1. Pick a rect in the free area and a colour. Paint the object into the art inside it (asset pipeline inpaint, `asset-pipeline.md`), small enough to miss and clear enough to find from the hint.
2. Paint the mask: the art's size, transparent, the spot's shape in its flat colour.
3. Add the spot to `SCENE_SPOTS[<art url>]`, its found text under `map:spots.<id>` (search spots), and the hint to the NPC's dialogue and the quest step text.

## Spots

| Art | Spot | Colour | Rect (left, top, w, h %) | Step |
|---|---|---|---|---|
| `mountain-pass.png` | burned Guild post (search) | `#ff0000` | 3, 66, 21, 10 | The Quiet Road, step 1 |
| `mountain-pass.png` | goat cleft (passage to The Goat Cleft) | `#00ff00` | 3, 31, 9, 12 | The Quiet Road, step 2 |
| `mawoodElderTree.png` | trunk under the stair (search) | `#0000ff` | 76, 60, 16, 36 | The Same Winter, step 2 |

All three are live in `SCENE_SPOTS`. A search spot's quest step also requires the item it gives, so the quest can't move past the step without it.
