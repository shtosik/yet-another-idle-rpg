# Pixel art comes from IP-Adapter style reference plus downscale, not a pixel-art LoRA

Generated pixel-art assets (Style Families `item-pixel`, `enemy-pixel`, `portrait-pixel`, `zone-pixel`) are produced by an SDXL checkpoint conditioned on the family's reference images through IP-Adapter, then post-processed in code (key out background, trim, area-average to the pixel grid, palette quantize, 1px outline). We chose this over downloading a pixel-art SDXL LoRA because IP-Adapter, CLIP vision and the Hyper-SDXL 8-step LoRA are already installed, references keep new assets matched to the game's actual existing art rather than a generic pixel look, and the grid and palette are exact because code enforces them. A pixel LoRA is the fallback if phase 1 review of `item-pixel` shows this approach is not enough.

## Outcome of the `item-pixel` tuning (issue #18)

Live A/B on `woodenBow`, `fireRune` and `turtleShellHelmet` (4 candidates each, RTX 4070 SUPER, zavychromaxl_v80 + Hyper-SDXL 8-step LoRA):

- **Reference-conditioned vs `--no-ref`**: with references the output keeps the game's clean dark outline and restrained palette; without them it is noisier (extra glow rings, stray specks, oversized subjects) and does not read as the same art set. References stay on.
- **8 vs 30 steps** (dpmpp_2m, cfg 6.5): 30 steps is ~3× slower (~41 s vs ~14 s per batch of 4) for a marginal smoothing gain that the 46-cell downscale and palette quantize erase. Stay at 8 steps, euler / sgm_uniform, cfg 5.5.
- **Reference background**: refs flattened onto bright green made subjects pick up a green cast; flattened onto light grey (with a matching "plain flat light grey background" prompt) the background keys out reliably. Grey leaks a little desaturation into subjects, which falls with lower `ipWeight`.
- **`ipWeight`**: 0.5 / 0.8 / 1.1 compared; higher values pull subject colour toward the grey reference background. Chosen: **0.5**.
- **Grid / palette**: grid 46 inside a 48 canvas (room for the 1px outline), outline before quantize, 24 colours.

Known weakness: thin, elongated subjects (bows) come out inconsistently; the agent's one re-roll covers it. No pixel-art LoRA needed yet.

## Status and scope

Accepted for all five families. The live checks for `enemy-pixel`, `portrait-pixel` (pixel via IP-Adapter + downscale + outline + palette) and `zone-pixel` (block pixelate) confirmed the approach; `town-painterly` needs no pixel step and only uses the references for style. The item style gate (#34) is the one review that was blocking; revisit a pixel LoRA only if a later review rejects results across several families.

Consequences: art-pixel size is a code constant per family (items 1 px at 48², enemies and portraits 2 px, zones 4 px), so assets generated at different times stay on one grid; references must be real, distinct art (placeholder duplicates are excluded); the pipeline is tested without a GPU (`npm run test:assets`).
