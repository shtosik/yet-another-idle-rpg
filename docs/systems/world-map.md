# World map

## Purpose
A pannable, zoomable painted map (Leaflet) with markers for unlocked towns and zones. Clicking a marker travels there. The map tab unlocks with the first town (shown locked in the navbar before that).

## Key files
- `src/app/components/game/world-map/world-map.component.ts:WorldMapComponent` — Leaflet map with a custom `PIXEL_CRS`, tile layer, marker sync; zone markers show claimed zone mastery stars (`showZoneStars`).
- `src/data/world-map-data.ts:WORLD_MAP_DATA` — tile path, image `manifest` (size, tile size, zoom range), default view, `markers` (`town` / `zone` / `poi`, position in source-image pixels, `label`, optional `minZoom`).
- `scripts/tile-map.mjs` (`npm run tile`) — slices `src/assets/img/world/source.png` into `src/assets/maps/world/tiles/{z}/{x}/{y}.webp`.
- `src/styles.sass` — global Leaflet positioning override (see gotchas).

## Data flow
1. `PIXEL_CRS` makes 1 CRS unit = 1 source pixel at `maxZoom`, so marker positions are authored as raw image pixels (`x` right, `y` down → `latLng(-y, x)`).
2. `onMapReady` waits a tick, calls `invalidateSize`, then adds the tile layer bounded to the image and zooms to where the image fills the panel (`getBoundsZoom(bounds, true)`). It centers on the current zone's marker (`BattleStore.currentZoneId`); a zone without a marker falls back to `defaultView.center`. `defaultView.zoom` is overridden. Max bounds are exactly the image, so a zone near the edge opens clamped to the edge rather than centered.
3. Effects on `PlayerStore.unlockedContent().zones` / `.towns` add markers for unlocked entries only. `minZoom` hides a marker when zoomed out. Markers have an invisible 8 px hit area around the label and sit at 85% opacity (full on hover). The zone the player is fighting in (`BattleStore.currentZoneId`) gets a glowing yellow border (`map-marker--current`), updated by an effect and after every zone-marker sync.
4. Town marker click, or a town in the top-right Towns list (a toggle, closed on open; unlocked towns with a marker in marker order, then unlocked towns with Buildings but no marker yet): `openTown` = `TownsStore.selectTown` + switch to the towns tab. Zone marker click: `BattleStore.setZone` + switch to battle.

## Invariants & gotchas
- **Tile gaps**: Leaflet's bundled `position: absolute` rules don't apply in this build, so `src/styles.sass` forces them on `.leaflet-pane`, `.leaflet-tile`, `.leaflet-tile-container` and related elements, plus fixed 256 px tile size. Remove it and every tile renders a tile apart and containers jump during zoom. Component-level `::ng-deep` doesn't reach these elements reliably.
- `source.png` is 3072×2048: the whole map redrawn in one style (ChatGPT, 2026-10-31), upscaled 2× with the NMKD ESRGAN model; layout in `docs/design/southern-map-expansion.md`. `source.png.kra` is the old 2794×752 Krita file. To extend the map, generate window by window with `scripts/asset-gen/map-window.mjs` and the `map-painterly` asset family (`asset-pipeline.md` § World-map pieces).
- Changing `source.png` means re-running `npm run tile` and updating `manifest` width/height (and marker positions if the art moved).
- Marker HTML uses the CSS classes `map-marker map-marker--<type>`.
- The skill tree uses the same Leaflet approach with plain `CRS.Simple` (see `skill-tree.md`).

## Known issues
- Marker labels are hard-coded English (`label`) instead of `zones:names` / `map:towns` keys; points of interest open a popup showing the raw `i18nKey`.
- `setTimeout` in `onMapReady` is never cleared on destroy.
- Map source art (`source.png` 4 MB, `source.png.kra` 10 MB) ships in the build because all of `src/assets` is copied.

## How to extend
New marker: add an entry to `WORLD_MAP_DATA.markers` with the source-image pixel position. A new zone marker only shows once the zone is in `unlockedContent.zones`.
