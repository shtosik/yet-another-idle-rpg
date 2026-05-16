---
name: fix-leaflet-tile-gaps
description: Use when Leaflet tiles in this project render with a one-tile (~256px) gap between every pair of adjacent tiles, or when tile containers visually "shift" during zoom animations. The root cause is that Leaflet's bundled `position: absolute` rule (leaflet.css lines 4–16) does not reach `.leaflet-tile` / `.leaflet-tile-container` / related elements in this Angular build, so they sit in normal inline flow and their `translate3d` offsets compound with their natural-flow positions. Triggers on phrases like "leaflet tiles don't connect", "gaps between map tiles", "world map tiles broken", "leaflet zoom flicker", "tiles shift on zoom".
---

# Fix Leaflet Tile Gaps

## Symptom

On the world map (`src/app/components/game/world-map/`), tiles render with full-tile-sized gaps between them. DevTools shows each `<img.leaflet-tile>` is 256×256, and the `translate3d` values sit at correct 256px intervals — yet visually adjacent tiles are ~256px apart with transparent space between. A secondary symptom: during zoom in/out there's a brief "shift" as the new tile container takes over from the old.

## Diagnostic test

Pick any two adjacent tiles in DevTools, set them to the **same** `translate3d(...)`. If they end up touching (instead of overlapping), the tiles are in normal layout flow — `position: absolute` is missing.

In the Computed tab on a `.leaflet-tile`, expand `position`. If `leaflet.css`'s rule isn't listed at all (not even crossed out), Leaflet's bundled stylesheet is not influencing this element, despite being declared in `angular.json` → `styles[]`. Why that happens here is an open question; for now we patch around it.

## Fix

Add the rule explicitly in `src/styles.sass` (global stylesheet, not a component file — `::ng-deep` from within a component does **not** reliably reach Leaflet's dynamically-injected elements):

```sass
// Leaflet's bundled `position: absolute` rule (leaflet.css line 4–16)
// somehow isn't winning against the host page's cascade for these
// elements, so they stay in normal flow and their translate3d offsets
// compound with inline-flow strides — producing one-tile gaps between
// tiles, and tile containers that shift during zoom animations as a new
// container takes over from the previous one. Force the rule explicitly.
.leaflet-pane,
.leaflet-tile,
.leaflet-marker-icon,
.leaflet-marker-shadow,
.leaflet-tile-container,
.leaflet-pane > svg,
.leaflet-pane > canvas,
.leaflet-zoom-box,
.leaflet-image-layer,
.leaflet-layer
  position: absolute !important
  left: 0 !important
  top: 0 !important

img.leaflet-tile
  width: 256px !important
  height: 256px !important
  max-width: none !important
  max-height: none !important
```

The element list mirrors leaflet.css's own rule — patch all of them in one go, not just `.leaflet-tile`, because the same cascade problem affects markers, panes, and especially `.leaflet-tile-container` (the zoom-shift symptom).

## Why both rules are needed

- **Position block** — solves the layout flow problem (the one-tile gap and the zoom-shift).
- **Width/height/max-* block on `img.leaflet-tile`** — defends against the global `* { box-sizing: border-box }` reset in `src/styles.sass` interacting with browser defaults that can let the `<img>` shrink below the inline `width: 256px` Leaflet sets. Belt-and-braces; harmless if redundant.

## If a flicker remains after the CSS fix

If zoom transitions still produce a brief glitch (tiles loading mid-animation rather than container shift), tune the tile-layer options inside `world-map.component.ts`'s `onMapReady`:

```ts
L.tileLayer(`${WORLD_MAP_DATA.tilesPath}/{z}/{x}/{y}.webp`, {
  tileSize, minZoom, maxZoom, bounds, noWrap: true,
  updateWhenIdle: true,   // don't fetch new tiles while the user is mid-zoom
  keepBuffer: 4,          // keep a wider ring of tiles cached around the viewport
})
```

`updateWhenIdle: true` is the high-value option — it stops Leaflet from spawning tile requests during the zoom animation and only loads them once the user has settled. `keepBuffer` higher than the default 2 reduces edge popping during panning.

## Open follow-up (worth investigating one day, not on this skill's hot path)

Find out **why** `leaflet.css`'s `.leaflet-tile { position: absolute }` rule doesn't make it into the cascade in this Angular build, even though the file is listed in `angular.json` → `architect.build.options.styles`. Candidates:
- Angular's CSS bundler dropping the rule (selector list trimming, dead-code elimination).
- Load order: another global style being merged after and unsetting `position` for `img`.
- Angular Material's reset stylesheet competing with higher specificity.

Once that's found, this skill's CSS becomes redundant and can be deleted. Until then, treat the global overrides as the load-bearing fix.
