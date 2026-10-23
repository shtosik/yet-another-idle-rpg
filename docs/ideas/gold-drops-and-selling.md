# Gold drops & selling

**Scope:** S · **Status:** Done (2026-10-22, `feat/gold-selling`)

Enemies drop their own gold amount; loot can be sold at shops.

## Why
- Gold per kill is hard-coded `1 * goldMultiplier` (shiny only), and `stats.goldCoinsMultiplier` is never applied — gold stats on slimeGoldenCrown, trophyNecklace, ratCatcher, silverwoodChestplate do nothing (repo audit 1.7).
- No sell action exists; `ItemData.value` is never read. 11 loot items are dead ends.
- Blocks balancing of every gold-related crafting/consumable idea.

## Decisions
- **Gold is its own number per enemy** (`Enemy.gold`), not derived from XP. On kill: `ceil(gold × goldCoinsMultiplier × waveRewardMult × shinyMult)` — fractions round up. Wave scaling: see `wave-variety.md`.
- **The `goldGain` skill node grants `goldCoinsMultiplier`** (+0.1 per level), not `goldCoins`.
- **Selling at any shop for the item's full `value`.** `value <= 0` means unsellable: spellbooks, recipes, station gear, quest items, pets.
- **No buy-sell profit:** an item a shop sells must have `value` below its shop price (runes 20–25 gold). `npm run validate` should check it.
- Ctrl-click sells the whole stack.
- Rebalance shop prices against the new income with the economy simulation (`progression-pacing.md`).

## Later
- **Shop preferences:** some shops pay more (or only buy) certain item kinds — see `shop-preferences.md`.

## Touch-points
`enemies-data.ts`, `enemy.interface.ts`, kill handling in `player.store.ts` (`processBattleEnd`), `shop.store.ts` + shop UI, `skill-tree-data.ts`, item `value`s in `src/data/items/`, `scripts/validate-data.mjs`.
