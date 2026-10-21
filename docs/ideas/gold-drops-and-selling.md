# Gold drops & selling

**Scope:** S · **Status:** Proposed

Enemies drop a gold range; loot can be sold to shops.

## Why
- Gold per kill is hard-coded `1 * goldMultiplier` (shiny only), and `stats.goldCoinsMultiplier` is never applied — gold stats on slimeGoldenCrown, trophyNecklace, ratCatcher, silverwoodChestplate do nothing (repo audit 1.7).
- No sell action exists; `ItemData.value` is never read. 11 loot items are dead ends.
- Blocks balancing of every gold-related crafting/consumable idea.

## Sketch
- `Enemy.gold: [min, max]`; on kill: `floor(rand(min, max) * goldCoinsMultiplier * shinyMult)`.
- Skill-tree goldGain node → `goldCoinsMultiplier`.
- Sell action in shop UI using `ItemData.value` (or a separate `sellValue`).
- Rebalance shop prices against the new income.

## Touch-points
`enemies-data.ts`, `enemy.interface.ts`, kill handling in `player.store.ts` / `battle.store.ts`, `shop.store.ts` + shop modal, `skill-tree-data.ts`.
