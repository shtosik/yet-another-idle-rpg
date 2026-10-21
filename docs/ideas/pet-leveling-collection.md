# Pet leveling & collection bonuses

**Scope:** S-M · **Status:** Proposed

Pets gain XP while equipped; a collection log grants set bonuses (e.g. "all slime pets: +x% damageVsSlime"). Shinies count double.

## Why
Pets already have `stats` and `shinyStats` (`pet-items.data.ts`). A collection gives long-term goals to the 1/2000 drops. Mountain Pass enemies still have no pets / shinies.

## Touch-points
`pet-items.data.ts`, `petXp` in player state, bestiary component, collection-bonus calculator.
