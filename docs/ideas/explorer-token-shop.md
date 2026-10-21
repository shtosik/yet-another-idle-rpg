# Explorer Token shop & guild ranks

**Scope:** S-M · **Status:** Proposed

Spend `explorerTokens` at the Exploration Guild on permanent perks: guild ranks, loot luck, zone keys, recipe scrolls.

## Why
`explorerTokens` are only incremented (`player.store.ts:261`) and never spent; Marvin promises unlocks every 5 completions (repo audit 3.4).

## Sketch
- Token-priced shop entries (`currency: 'explorerTokens'`) or a dialogue-driven vendor.
- Rank every 5 tasks → unlock content via the unlock system.
- Also build the task pool from unlocked zones (currently hard-coded to four La Harpar zones).

## Touch-points
`player.store.ts` (`spendTokens`), `shops-data.ts`, `exploration-guild.service.ts`, `unlock-conditions.ts`.
