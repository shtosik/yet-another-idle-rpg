# Batch crafting

**Scope:** S · **Status:** Implemented on `feat/consumables` (×1 / ×5 / ×10 / max, blocked when the result doesn't fit)

> **Follow-up:** the crafting UI is being redesigned as the Camp tab. See [Camp & crafting stations](crafting-stations.md).

Craft ×1 / ×5 / ×10 / max in one action. Consumables are crafted repeatedly, so one-at-a-time crafting gets tedious.

## Sketch
- `craftItem(recipeId, times)` — clamp `times` to what ingredients allow and to free inventory space (crafting must be blocked when the result doesn't fit — repo-audit owner decision).
- Crafting UI: quantity buttons + "max craftable" computed from inventory.
- Hook point for a future "chance to save ingredients" stat.

## Touch-points
`player.store.ts` (`craftItem`), `crafting.component.ts` / template, `recipe-slot` component.
