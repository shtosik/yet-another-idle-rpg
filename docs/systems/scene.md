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
| `zone` | Zone and arena backgrounds | 832×1248 | 2:3 |
| `building` | town, Building and Site backgrounds | 1376×566 | 2.43:1 |

A Scene mask is the same size as its art.

## Battle Scene

`app-battle` puts the zone or arena Scene behind the whole panel. The nav bar, footer and side buttons lie over it, with the edge gradient under them. In the supported range the panel is narrower than 2:3, so the Scene always spans the panel's width and gets fill above and below: about 370×555 at 1536 wide, 180×270 at 1280.

`<app-enemy>` and the damage popups are projected into the Scene. The sprite box fills `ENEMY_SPRITE_AREA` and the sprite scales with the Scene (`100cqw`; as big as a half-size sprite at 1536). The name, tags and HP bar stack above it at a fixed size with `pointer-events: none`; the arena weak point and mounds keep their clicks.

## HUD areas

HUD drawn over a Scene, as rects in % of the art (`BATTLE_HUD_AREAS`, `BUILDING_HUD_AREAS` beside `SCENE_SIZES`). Each rect is the largest it gets across the supported range. A clickable spot painted under one would be hidden or unclickable, so a Scene mask spot must sit outside all of them.

Battle (832×1248 art; left, top, width, height in %):

| Area | Rect | Largest at |
|---|---|---|
| `navBar` | 0, 0, 100, 23 | 1536, with a full task list |
| `footer` | 0, 85, 100, 15 | 1536, with an effects row |
| `sideButtons` | 73, 27, 27, 73 | 1280, four buttons |
| `enemyInfo` (name, tags, HP) | 27, 0, 46, 50 | 1280 |
| `enemySprite` | 27, 50, 46, 26 | everywhere |

Painter template: the free art is the left 27% from 23% to 85% down, and the strip between the sprite and the footer (76–85%).

## Supported window range

1280–1536 CSS px wide (1536 is the `body` cap). Below 1280 isn't supported yet (`docs/ideas/responsive-layout.md`).
