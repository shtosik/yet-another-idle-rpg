# Scene

A **Scene** shows a zone, arena, town, Building or Site background whole, at its art's fixed shape, scaled as one piece. Anything placed on it is positioned in % of the art, so it stays on the same spot of the art at every window size and browser zoom.

Code: `src/app/components/shared/scene/` (`app-scene`, `SCENE_SIZES`, `SceneArea`).

## How it renders

`<app-scene [url] [kind]>` fills its host. Inside it, bottom to top:

1. **Scene fill**: the same art, `cover`, blurred and darkened, filling the host around the Scene when the host's shape differs from the art's.
2. **Scene**: the largest box of the kind's ratio that fits the host, centred. The art is its background at 100% × 100%.
3. **Projected content** (`<ng-content>`): absolutely positioned in % of the Scene. Later layers (a Scene mask, placed content, popups) stack in the order the parent projects them.

## Sizes

The size comes from the kind, never from per-entry data. Every background of a kind is exactly this size; `npm run validate` fails on any other.

| Kind | Used for | Size | Ratio |
|---|---|---|---|
| `zone` | Zone and arena backgrounds | 832×1664 | 1:2 |
| `building` | town, Building and Site backgrounds | 1376×566 | 2.43:1 |

A Scene mask is the same size as its art; `app-scene-mask` reads it under a click (`docs/systems/scene-spots.md`).

## Battle Scene

`app-battle` puts the zone or arena Scene behind the whole panel. The nav bar, pane (side buttons, enemy name and HP, toasts) and footer lie over it. The edge gradient is the Scene's first projected layer, so it darkens the art but not the sprite, popups or HUD. The 1:2 art matches the panel's shape at 1536 wide (Scene about 364×728, a few px of fill at the sides). Below that the panel gets narrower than 1:2, so the Scene spans its width with fill above and below: about 180×360 at 1280. (The art was 2:3 at first; the owner moved it to 1:2 on 2026-11-09 so it fills the column's height. The extra top and bottom bands sit mostly under the nav bar and footer.)

`<app-enemy-sprite>` and the damage popups are projected into the Scene. The sprite box fills `ENEMY_SPRITE_AREA` and the sprite scales with the Scene (`100cqw`; as big as a half-size sprite at 1536); the arena weak point and mounds sit on it and keep their clicks. `<app-enemy>` (name, tags, HP bar, arena status lines) is HUD at a fixed size, pinned to the top of the pane under the nav bar, so it never slides under it. It lets clicks through (`pointer-events: none`) except on the weakness chips, which have hints. At 1280 with a full task list it can reach the top of the sprite box.

## HUD areas

HUD drawn over a Scene, as rects in % of the art (`BATTLE_HUD_AREAS`, `BUILDING_HUD_AREAS` beside `SCENE_SIZES`). Each rect is the largest it gets across the supported range. A clickable spot painted under one would be hidden or unclickable, so a Scene mask spot must sit outside all of them.

Battle (832×1664 art; left, top, width, height in %):

| Area | Rect | Largest at |
|---|---|---|
| `navBar` | 0, 0, 100, 30 | 1536, with a full task list |
| `footer` | 0, 78, 100, 22 | 1536, with an effects row |
| `sideButtons` | 71, 28, 29, 72 | 1280, four buttons and a full task list |
| `enemyInfo` (name, tags, HP) | 14, 0, 72, 62 | 1280 with a full task list (width at 1536) |
| `enemySprite` | 29, 52, 42, 20 | everywhere |

Painter template: the free art is the left 29% from 30% to 78% down, and the strip between the sprite and the footer (72–78%).

Town, Building and Site (1376×566 art; the panel is a fixed 776×320, so the Scene fills it and these hold at every width):

| Area | Rect | Covers |
|---|---|---|
| `title` | 0, 0, 35, 17 | town name with reputation tier, Building title, Site name |
| `closeButton` | 91, 0, 9, 19 | close button |
| `npcFrameArea(position)` | 17 wide, 57 tall, centred on the NPC's `position` | portrait, cooldown and shop button |

## Town, Building and Site Scenes

`towns.component` (town view) and `town-building.component` render `<app-scene kind="building">`; the Site home reuses `app-town-building` and projects its gate into it. Building buttons, NPC frames and the gate keep their % `position` data, now of the Scene. The 1376×566 art is the crop the 776×320 panel showed of the old 1376×768 art under `cover`, so the positions still land on the same spot. The farm plots panel (`farm-plots.png`, a darkened texture with nothing placed on it) stays off the Scene.

## Supported window range

1280–1536 CSS px wide (1536 is the `body` cap). Below 1280 isn't supported yet (`docs/ideas/responsive-layout.md`).
