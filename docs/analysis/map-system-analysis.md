# Map system — analysis

## Goal

Add a pannable, zoomable world map panel that fits the existing game grid (2 columns × 2 rows, roughly 48rem × 45rem viewport). The map must support touch swipe / pinch gestures and **load map imagery procedurally** rather than as a single huge file. New npm packages are allowed.

## Requirements summary (confirmed)

| # | Decision | Value |
|---|---|---|
| 1 | Map scope | **One big world map**, extended over time as new content is added |
| 2 | Source art | User-provided high-res image, grows as content is added |
| 3 | Interactive markers | Towns (enter town view), Zones (start combat), POIs (info popup) |
| 4 | Tile pipeline | Node build script using `sharp`, re-runnable |
| 5 | Tab placement | New `GameTab.map`, inserted between `main` and `skillTree` |
| 6 | Locked markers | Per-marker `hide` or `dim` behavior |
| 7 | Marker count | Small at launch; grows with content. No clustering needed yet. |
| 8 | View persistence | Last center/zoom restored on tab re-entry |

## What "procedural loading" means here

The standard pattern: **tile pyramid**. The source map is pre-processed offline into 256×256 tile images at multiple zoom levels.

- Zoom 0 → 1 tile (full map at low res)
- Zoom 1 → 4 tiles
- Zoom 2 → 16 tiles
- …up to a max zoom derived from source resolution

At runtime, only the tiles inside the current viewport at the current zoom level are fetched. Pan/zoom triggers more requests. This is how Google Maps, Leaflet, OpenSeadragon work — and the only way "load only what's visible" works without hacks.

For a 4096×4096 source, you get ~5 zoom levels (1+4+16+64+256 = 341 tiles, ~30 MB at typical WebP quality, lazy-loaded so first paint is tiny). The same approach scales as the source grows.

## Library choice — Leaflet (`CRS.Simple`)

Recommended: **Leaflet** + **`@bluehalo/ngx-leaflet`** Angular wrapper.

- ~42 KB gzipped core, mature and well-maintained
- `CRS.Simple` mode treats the map as raw pixel space (no lat/lon)
- Pan, pinch-zoom, momentum swipe, double-tap-zoom, scroll-zoom, keyboard — all built-in
- Tile loading is procedural by default (`L.tileLayer('tiles/{z}/{x}/{y}.webp')`)
- Markers + popups handle town/zone/POI interactions
- `ngx-leaflet` is standalone-component friendly

### Alternatives considered

| Library | Verdict |
|---|---|
| **OpenSeadragon** | Purpose-built for deep-zoom images; slightly nicer zoom feel but weaker for markers and Angular integration. Reasonable fallback. |
| **OpenLayers** | Heavier, geographic-first. Overkill. |
| **Pixi.js / Konva** | Flexible but you'd write pan/zoom/tile management yourself. Only worth it for animated/dynamic maps. |
| **ngx-image-zoom, panzoom, hammer.js + `<img>`** | These zoom an already-loaded image. Don't satisfy the procedural-load requirement. |

## Dependencies to add

```
leaflet
@bluehalo/ngx-leaflet
@types/leaflet (dev)
sharp (dev)
```

Runtime cost: ~45 KB gzip. Leaflet CSS is scoped to `.leaflet-*`, no conflicts. `angular.json` may need Leaflet's global stylesheet allowlisted.

## Tile pipeline

`scripts/tile-map.mjs`:

- `npm run tile` — slices the world source image into the tile pyramid
- Re-runnable: when the source image grows, re-run to regenerate tiles

Layout:

```
src/assets/maps/world/
  source.png            # gitignored, you supply, grows over time
  manifest.json         # { width, height, tileSize, minZoom, maxZoom } — committed
  tiles/{z}/{x}/{y}.webp # committed
```

- Tile size 256×256, **WebP** preferred (~30% smaller than PNG).
- `manifest.json` is read at runtime so the component can configure Leaflet `bounds` without hardcoding dimensions — supports the source growing without code changes.
- Commit the tile folder (simple, keeps dev frictionless). Re-evaluate if git churn becomes a problem; the alternative is generating tiles on `prepare`/CI.

### Extending the map as content grows

The "one big map that grows" model has two viable strategies for adding land:

1. **Edit `source.png` directly, re-tile.** Simplest. The tile output changes wherever new terrain appears; everything else stays put if you grow the canvas at the edges or in unused gutters.
2. **Composite multiple "tile chunks" at build time.** The tile script reads a manifest of sub-images with offsets and assembles `source.png` before tiling. Useful only when multiple contributors need to author content in parallel — overkill for one developer.

Recommend **(1)** until parallel authoring becomes a need.

## Coordinate system

Source-image **pixel coordinates** (e.g. `{ x: 1240, y: 2780 }`). Cleaner than percentages because marker positions can be authored by reading pixel coordinates directly in any image editor. Stable across source resizes as long as you grow the canvas at edges, not the center.

## Data model

### `src/data/world-map-data.ts` (new)

```ts
interface BaseMarker {
  position: { x: number; y: number }   // source-image pixels
  minZoom?: number                     // hide below this zoom level
  lockBehavior?: 'hide' | 'dim'        // default 'hide'
  requirement?: UnlockRequirement       // reuse existing interface
}

interface TownMarker extends BaseMarker { type: 'town'; townId: TownID }
interface ZoneMarker extends BaseMarker { type: 'zone'; zoneId: ZoneID }
interface PoiMarker  extends BaseMarker { type: 'poi';  i18nKey: string }

export type WorldMapMarker = TownMarker | ZoneMarker | PoiMarker

export interface WorldMap {
  tilesPath: string                    // 'assets/maps/world/tiles'
  manifest: string                     // 'assets/maps/world/manifest.json'
  defaultView: { center: [number, number]; zoom: number }
  markers: WorldMapMarker[]
}

export const WORLD_MAP_DATA: WorldMap = { ... }
```

Markers live on the **map data**, not on `Town`/`Zone`. Keeps gameplay data clean and lets the map evolve independently.

Optional convenience: organize the `markers` array into local `const` groups (e.g. `portStocksmarMarkers`, `southbackMarkers`) that get spread into the final array. Helps readability as the list grows.

### Marker visibility tiers (via `minZoom`)

Without this the map gets cluttered as content grows. Suggested defaults:

- Towns: visible at all zoom levels
- Zones: visible at zoom ≥ 2
- POIs: visible at zoom ≥ 3

## Locked-marker UX (per-marker)

Each marker carries `lockBehavior: 'hide' | 'dim'` and optional `requirement: UnlockRequirement`. When `requirement` isn't met:

- `hide` (default) → don't render. Matches the `tradersBasement` button just added.
- `dim` → render at low opacity, non-clickable, tooltip explains the requirement.

## Components

```
src/app/components/game/world-map/
  world-map.component.ts            # owns Leaflet map, tile layer, marker rendering
  world-map.component.html          # <div leaflet [leafletOptions]>
  world-map.component.sass
  marker/
    map-marker.component.ts         # rendered inside L.divIcon, gets MarkerData input
```

### Interaction wiring

- **Town marker** click → `townsStore.selectTown(townId)` then change tab to `GameTab.towns`
- **Zone marker** click → `battleStore.setZone(zoneId)`
- **POI marker** click → Leaflet popup with translated `i18nKey` content

## Store — `src/app/store/map/map.store.ts` (new)

```ts
interface MapState {
  view: { center: [number, number]; zoom: number } | null
}
// methods: saveView, resetState
```

- Persisted via `withStorageSync` like other stores.
- View saved on `moveend` / `zoomend` events from the Leaflet component.
- On tab open, restore saved view or fall back to `WORLD_MAP_DATA.defaultView`.

## Touch / swipe

Leaflet defaults already cover everything required:

- 1-finger pan with momentum
- pinch-zoom
- double-tap zoom
- scroll-wheel zoom on desktop

No `hammer.js` or extra gesture lib needed.

## Layout integration

### Grid slot in `game.component.sass`

```sass
.map
  grid-column: 2 / span 2
  grid-row: 1 / span 2
  padding: 0
```

### `game.component.html`

```html
@case (GameTab.map) {
  <app-world-map class="map"/>
}
```

### Tab menu (`game-menu.component.html`)
Insert `<li>` for `GameTab.map` **between `main` and `skillTree`** (battle isn't a tab — always rendered).

Final menu order: `main → map → skillTree → crafting → towns`.

### Enum
```ts
export enum GameTab {
  main = 1,
  map = 5,        // new
  skillTree = 2,
  crafting = 3,
  towns = 4,
}
```

## Files touched

### New
- `src/app/components/game/world-map/world-map.component.{ts,html,sass}`
- `src/app/components/game/world-map/marker/map-marker.component.ts`
- `src/data/world-map-data.ts`
- `src/app/store/map/map.store.ts`
- `scripts/tile-map.mjs`
- `src/assets/maps/world/...`

### Modified
- `package.json` — deps + `tile` script
- `angular.json` — allowlist `leaflet/dist/leaflet.css` global style
- `src/enums/ids/game-tab.enum.ts` — `map = 5`
- `src/app/components/game/game.component.html` — new `@case (GameTab.map)`
- `src/app/components/game/game.component.sass` — `.map` grid placement
- `src/app/components/game/game-menu/game-menu.component.html` — insert tab between `main` and `skillTree`
- `src/assets/locales/en/*.json` — `gameTabs.map`, POI strings

## Implementation order

1. **Scaffold** — add packages, `angular.json` CSS allowlist, `GameTab.map`, tab in menu, grid slot, empty `WorldMapComponent` showing a placeholder div
2. **Tile pipeline** — `scripts/tile-map.mjs`, world tile set (when source image arrives)
3. **Marker rendering** — towns/zones/POIs, wired to existing stores (`townsStore.selectTown`, `battleStore.setZone`, popup for POI)
4. **MapStore** — view persistence on `moveend` / `zoomend`
5. **Locked markers** — `requirement` + `lockBehavior` rendering
6. **Iterate** — add markers to `WORLD_MAP_DATA.markers` as content ships

## Open items / pending decisions

- **Source image resolution** — deferred until first map is produced. Tile script derives `maxZoom` from input dimensions.
- **Default view on first load** — center on the starting area (likely Port Stocksmar / laHarpar) at a mid zoom level. Configured in `WORLD_MAP_DATA.defaultView`.
- **Mobile-first vs desktop-first** — affects gesture priorities; default Leaflet config handles both, but explicit tuning may be desired.

## Library reference

- Leaflet docs: https://leafletjs.com/reference.html
- `CRS.Simple` guide: https://leafletjs.com/examples/crs-simple/crs-simple.html
- `@bluehalo/ngx-leaflet`: https://github.com/bluehalo/ngx-leaflet
- `sharp`: https://sharp.pixelplumbing.com/
