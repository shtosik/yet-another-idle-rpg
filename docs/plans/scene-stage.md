# Plan: scene stage

Battle, arena, town and Building backgrounds move from `background-size: cover` onto a **stage**: a fixed-ratio scene that scales as one piece, with the HUD around it rather than on top of it. Anything placed on the art (enemy, building buttons, search spots) then stays on its spot at every window size and browser zoom. Needed first by the search spots in [`chapter-one-sap-winter.md`](chapter-one-sap-winter.md); ships before it.

One branch, `feat/scene-stage`, one PR into `staging`, each step a commit. Code references are from `staging` at `34bbc9a`; re-check them when a step starts.

## Why

- Every scene background uses `cover` (`battle.component.sass:16`, `town-building.component.sass:10`, `towns.component.sass:43`), so the visible crop depends on the panel's shape.
- The battle panel is `1fr` wide and 45.5rem (728px) tall (`game.component.sass`), inside a `body` capped at 1536px (`styles.sass:29`): 372×728 (ratio 0.51) at 1536px and wider, 244×728 (0.33) at 1280px or 150% zoom on 1920. Battle art is 2:3 (0.67), so cover shows 50–77% of its width.
- Town and Building panels are a fixed 776×320 (2.43:1); their art is 1.75–1.86:1, so the top and bottom ~26% never shows.
- Town building buttons are placed as % of the cover-cropped panel (`towns.component.html:23`), so they already drift off their art.
- The nav bar, footer, side buttons and gradient sit on the art, so part of it can never hold anything clickable.

## Owner decisions (2026-11-09)

- Fix it from scratch with a stage, not with a safe-area rule ("keep spots in the centre") that people forget.

## Open (owner)

1. **Building and town stage ratio.** Keep the art at 16:9 and let the panel grow to it (776×437, so the panel below shrinks or the grid changes), or recrop the art to 2.43:1 and keep the panel. Recommended: recrop to 2.43:1; nothing players see today is lost, and the grid stays.
2. **Battle width.** At 2:3 and 728px tall the stage is 485px wide; the battle column is 372px at most today. Either the battle column gets `aspect-ratio`-derived width and the middle columns give up ~113px, or the stage shrinks to fit (372×558) with filled bars. Recommended: shrink to fit; no grid change in this plan.
3. **Supported window range.** Recommended: 1280–1536 CSS px wide (1536 is the `body` cap). Below 1280 the layout isn't supported (no responsive layout yet, `docs/ideas/responsive-layout.md`).

## Terms

- **Stage**: a box with the art's aspect ratio, scaled as one piece to fit its panel. Everything placed on the art uses stage coordinates (% of the stage, or source-image pixels converted once).
- **Stage fill**: what shows around the stage when the panel's shape differs: a blurred, darkened copy of the same art.
- **Scene mask**: a PNG the size of the art, black except one flat colour per clickable thing. Used by search spots (Chapter One); the stage only provides the layer it sits in.

Add the three to `GLOSSARY.md` in Step 1.

## Order

Step 1 first. Steps 2 and 3 after it, in either order. Step 4 last.

### 1. Stage component (M, Opus)
- `components/shared/scene-stage/`: inputs `url`, `width`, `height` (source-image pixels). Renders the stage fill (the same image, `cover`, blurred), then the stage: `aspect-ratio: width / height`, `max-width: 100%`, `max-height: 100%`, centred, holding the art (`object-fit: fill`, it already has the right shape) and a content slot positioned in stage %.
- Layers inside the stage, bottom to top: art, mask layer slot (empty for now), placed content (enemy, building buttons), popups.
- Art size lives in data, not in the image: `ZONES_DATA` and `TOWNS_DATA` (town and each Building) get `size: { width, height }`.
- `npm run validate`: every background with a `size` matches its PNG header (read the IHDR, no dependency); a stage ratio more than 3% off its kind's ratio (2:3 Zones, the decided Building ratio) warns.
- Specs: the stage keeps its ratio inside a wide and a narrow host; the slot's % positions land on the same art pixel in both.
- Docs: new `docs/systems/scene-stage.md`, row in `docs/systems/README.md`.

### 2. Battle on the stage (M, Opus)
- `battle.component.html`: the background moves from `.battle`'s `background-image` to `<app-scene-stage>` inside `.battle-pane`; `app-enemy`, `app-damage-popup` and the toasts go in its slot. The arena uses the same stage with `liroldArena-vertical`.
- HUD around the stage, not on it: the nav bar above and the footer below stay in their grid rows, outside the stage; the side buttons move to a rail beside or over the stage fill, never over the stage. The edge gradient goes on the fill only.
- The enemy's position and size are in stage % so it scales with the art.
- Arena click targets (`enemy.component.html:46`, `:71`) keep working: check the mound and weak-point positions after the move.
- Specs: existing battle and arena specs pass; one spec that the side rail isn't inside the stage.
- Changelog: `[feature] Battle backgrounds now show whole at any window size instead of being cut off at the sides.`
- Docs: `scene-stage.md`, `game-loop-and-combat.md`, `zones-waves-unlocks.md` (Battle header and controls), `arena.md`.

### 3. Towns and Buildings on the stage (M, Sonnet)
- `towns.component` (town view) and `town-building.component` render `<app-scene-stage>`; building buttons and NPC frames go in its slot, positions unchanged as numbers but now in stage % (so they stop drifting).
- Recrop or regenerate Building and town art to the decided ratio (Open 1); update `size` in `TOWNS_DATA`. Recheck every building button and NPC position on the new art.
- The farm home (`site.component`) uses the same stage if it shows art.
- Specs: town and Building specs pass.
- Changelog: `[bug] Town building buttons now stay on their buildings when the window is resized.`
- Docs: `scene-stage.md`, `towns-shops-guild.md`, `farming.md` if the farm home changes.

### 4. Check (S, Sonnet)
- `npm run check`.
- `.claude/skills/verify-yari` at 1280 and 1536 wide and at 150% zoom on 1920: a Zone, the arena, La Harpar, the Elder's Tree. Evidence path in the PR body.

## Not in this plan

- Search spots, scene masks and their hit test: Chapter One (`chapter-one-sap-winter.md`, step "Search spots").
- Grid changes for a wider battle column (Open 2, alternative).
- Responsive layout below 1280px.
