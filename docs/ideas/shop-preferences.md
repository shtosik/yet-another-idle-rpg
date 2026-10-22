# Shop preferences

**Scope:** S · **Status:** Proposed

Shops pay differently for different item kinds: the Mawood apothecary pays more for herbs and vials, the La Harpar trader for fish and shells, a smith for ores and hides. Some shops may buy only their kind.

## Why
Selling starts as "any shop, full `value`" (`gold-drops-and-selling.md`). Preferences give towns a reason to be visited and make where you sell a small choice.

## Sketch
- Per shop: `buys?: ItemType[]` and `priceMultipliers?: Partial<Record<ItemType, number>>` (e.g. ×1.25 preferred, ×0.5 off-kind).
- Shop UI shows the sell price per item.
- Keep the no-profit rule: preferred sell prices stay below that shop's buy price.

## Touch-points
`shops-data.ts`, `shop.store.ts`, shop UI.
