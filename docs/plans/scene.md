# Plan: scene

Battle, arena, town, Building and Site backgrounds move from `background-size: cover` onto a **Scene**: a box with the art's fixed aspect ratio that scales as one piece. Anything placed on the art (the enemy sprite, building buttons, search spots) then stays on its spot at every window size and browser zoom. Needed first by the search spots in [`chapter-one-sap-winter.md`](chapter-one-sap-winter.md); ships before it.

One branch, `feat/scene`, one PR into `staging`, each step a commit. Code references are from `staging` at `2a8e6c3`; re-check them when a step starts.

## Why

- Every scene background uses `cover` (`battle.component.sass`, `town-building.component.sass`, `towns.component.sass`), so the visible crop depends on the panel's shape.
- The battle panel is `1fr` wide and 45.5rem (728px) tall (`game.component.sass`), inside a `body` capped at 1536px (`styles.sass`): 372×728 at 1536px and wider, 244×728 at 1280px or at 150% zoom on 1920. Battle art is 2:3, so cover shows only 50–77% of its width, and the crop moves with the window.
- Town, Building and Site panels are a fixed 776×320 (2.43:1) at every supported width (columns `24rem 24rem`, row `20rem`), so their crop doesn't move. But their art is 1.5–1.86:1, so the top and bottom ~26% never shows, and coordinates on cropped art are awkward to author.

## Owner decisions (2026-11-09)

- Fix it from scratch with a Scene, not with a safe-area rule ("keep spots in the centre") that people forget. Where the HUD must cover art, a check enforces it (below).
- **Standard art sizes.** Every Zone and arena background is exactly **832×1664** (1:2; first 832×1248, 2:3, changed 2026-11-09 so the art fills the battle column's height: the 2:3 originals are outpainted with 208px bands top and bottom). Every town, Building and Site background is exactly **1376×566** (2.43:1, what the 776×320 panel shows of today's 1376×768 art). Scene masks are the same size as their art. No per-entry `size` data: the size comes from the kind.
- **Battle scene shrinks to fit** its panel, centred; no grid change. At 1536 it's about 364×728, at 1280 about 180×360 (the 1280 column is ~182px wide, not 244).
- **The art spans the whole battle panel** as today. The nav bar, footer and side buttons all sit over it; nothing moves out to bars beside the art. The edge gradient (dark top and bottom) stays over the scene, under the HUD, for readability.
- **Only the sprite box is placed on the scene.** The enemy sprite box is positioned and sized in scene %, so it scales with the art. The name, tags and HP bar stay HUD: a fixed-size overlay with `pointer-events: none` (the arena mound and weak-point buttons keep their clicks).
- **No spot under the HUD, enforced.** `BATTLE_HUD_AREAS` and `BUILDING_HUD_AREAS` list the HUD's rects in scene %: battle has the nav strip, footer strip, side-button rail and sprite box; Building has the title, close button and NPC frames. Each rect is the largest it gets across the supported range: the rail covers the most at 1280 wide, the nav bar and footer at 1536. `npm run validate` fails when any spot colour in a mask has pixels inside one. `docs/systems/scene.md` shows the rects as a template for painters.
- **Spot size.** A spot object is at least 8% of its art's width (~20px at 1280). The spell slots (footer) and wave controls (nav bar) are HUD, so the rule above keeps spots out from under them.
- **Supported window range**: 1280–1536 CSS px wide (1536 is the `body` cap). Below 1280 isn't supported (no responsive layout yet, `docs/ideas/responsive-layout.md`).
- **The farm plots panel** (`farm-plots.component.sass`, `farm-plots.png` as a darkened texture with nothing placed on it) stays off the Scene.
- **Unused art goes**: `plains.png`, `horseshoeBeach.png` and `theLongPath.png` are referenced nowhere.

## Terms

**Scene**, **Scene fill** and **Scene mask** are in `GLOSSARY.md`. Not "stage": the glossary avoids it for Zone, Wave and Quest step, and the code uses it for crop growth and shop stock.

## Order

Step 1 first. Step 2 any time before 3 and 4. Steps 3 and 4 in either order. Step 5 last.

### 1. Scene component (M, Opus)
- `components/shared/scene/` (`app-scene`): input `url` and `kind` (`'zone' | 'building'`), which gives the ratio from a `SCENE_SIZES` constant. Renders the Scene fill (the same image, `cover`, blurred and darkened), then the Scene: `aspect-ratio` from the kind, `max-width: 100%`, `max-height: 100%`, centred, holding the art and a content slot positioned in scene %.
- Layers inside the Scene, bottom to top: art, mask layer slot (empty for now), placed content (sprite box, building buttons), popups.
- `BATTLE_HUD_AREAS` and `BUILDING_HUD_AREAS` live beside `SCENE_SIZES`.
- Specs: the Scene keeps its ratio inside a wide and a narrow host; a slot position in % lands on the same art pixel in both.
- Docs: new `docs/systems/scene.md` (Scene, sizes, HUD areas, painter template), row in `docs/systems/README.md`.

### 2. Standardise the art (M, Sonnet, `/generate-2d-asset` for regenerations)
- One-off Node script in the scratchpad (`sharp`, already installed): centre crop to the kind's ratio, then resize to its size. Not kept in `scripts/`.
  - 1376×768 towns and Buildings: crop only.
  - 848×1264 Zones: resize (loses ~5px of width).
  - `laHarpar` (1397×752), `laHarparTavern` (1280×731): crop and resize.
  - `laHarparMarket`, `laHarparShop` (1000×571), `farm` (960×536): upscaled ~40%; look at each, regenerate if soft.
  - `tradersBasement` (1000×666, landscape) is a Zone: regenerate at 832×1248.
- Delete `plains.png`, `horseshoeBeach.png`, `theLongPath.png`.
- `npm run validate`: every Zone, arena, town, Building and Site background is exactly its kind's size from `SCENE_SIZES` (read the PNG IHDR, no dependency); fails otherwise.
- Recheck every building button, gate and NPC position on the cropped art.

### 3. Battle on the scene (M, Opus)
- `battle.component.html`: the background moves from `.battle`'s `background-image` to an `<app-scene kind="zone">` behind the whole panel (nav bar, pane and footer). The sprite box, damage popup and toasts go in its slot. The arena uses the same scene with `liroldArena-vertical`.
- The nav bar, footer and side buttons overlay the scene. The edge gradient sits over the scene, under the HUD.
- Name, tags and HP bar: fixed-size overlay, `pointer-events: none`. Arena click targets (`enemy.component.html`, mounds and weak point) keep working inside the sprite box.
- Measure the HUD rects at 1280 and 1536 and write `BATTLE_HUD_AREAS` from them.
- Specs: existing battle and arena specs pass; the sprite box keeps its scene % position in a wide and a narrow host.
- Changelog: `[feature] Battle backgrounds now show whole at any window size instead of being cut off at the sides.`
- Docs: `scene.md`, `game-loop-and-combat.md`, `zones-waves-unlocks.md` (Battle header and controls), `arena.md`.

### 4. Towns, Buildings and Sites on the scene (M, Sonnet)
- `towns.component` (town view), `town-building.component` and `site.component` render `<app-scene kind="building">`. Building buttons, the Site gate and NPC frames go in its slot; their positions stay % numbers, now of the scene. With the art at 2.43:1, the scene fills the panel exactly, so there's no fill.
- Measure the title, close button and NPC frames; write `BUILDING_HUD_AREAS`.
- Specs: town, Building and Site specs pass.
- Changelog: `[feature] Town and building backgrounds now show the whole picture.`
- Docs: `scene.md`, `towns-shops-guild.md`, `farming.md` (farm home).

### 5. Check (S, Sonnet)
- `npm run check`.
- `.claude/skills/verify-yari` at 1280 and 1536 wide and at 150% zoom on 1920: a Zone, the arena, La Harpar, the Elder's Tree, the farm home. Evidence path in the PR body.

## Not in this plan

- Search spots, scene masks and their hit test: Chapter One (`chapter-one-sap-winter.md`, step "Search spots"). Its mask check uses the HUD areas from this plan.
- A wider battle column (grid change).
- Responsive layout below 1280px.
