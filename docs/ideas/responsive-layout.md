# Responsive layout

**Scope:** M · **Status:** Proposed 2026-10-24

The game grid is fixed: `body` caps at 1536px and `.game` uses fixed row heights (`20rem 25rem`) and fixed column widths. On a large monitor the game sits small in the middle; on a smaller window panels clip and need inner scroll. Most "doesn't scale" complaints about lists (shop, Camp, inventory) trace back to this.

## Sketch
- Rows and columns sized from the viewport (`minmax`, `fr`, `clamp()`) instead of fixed rem.
- Panels grow with the window; grids inside them (inventory, shop, Camp) fill with `auto-fill` columns instead of a fixed count.
- Decide a minimum supported size (e.g. 1280×720) and test there and at 1920×1080 / 2560×1440.
- Phone layout is out of scope.

## Touch-points
`styles.sass`, `game.component.sass`, grid styles in inventory, shop and Camp components.
