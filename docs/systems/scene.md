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

## Supported window range

1280–1536 CSS px wide (1536 is the `body` cap). Below 1280 isn't supported yet (`docs/ideas/responsive-layout.md`).
