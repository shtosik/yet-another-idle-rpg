# Pet leveling & collection bonuses

**Scope:** S-M · **Status:** Proposed (zone collections designed with the owner 2026-10-31, deferred from the inventory tabs work)

Pets gain XP while equipped; a collection log grants set bonuses. Shinies count double.

## Why
Pets already have `stats` and `shinyStats` (`pet-items.data.ts`). A collection gives long-term goals to the 1/2000 drops, and a reason to keep pets of the same enemy type beyond the one equipped.

## Zone collections (owner-reviewed design)
A zone's set = the pets of every enemy in its `enemies` list **plus its boss** (`bossEnemyId`, `zones-data.ts`). Every zone with monsters counts (Traders' Basement too: rat + Giant Rat). Today no zone repeats an enemy; if a later zone reuses one, its pet counts toward both sets.

- Completing a zone's normal set gives a **global permanent bonus**: gold find or XP (alternate per zone, small, e.g. +2%).
- Arena champion pets belong to no zone set (could be their own Arena set later).
- Separate from zone mastery (`masteryReward`, a one-time claim); the collection bonus is permanent.
- Shiny sets: parked until shiny pet rates are fixed (about 1 shiny pet per 200,000 kills at 1% shiny chance).
- Owned pets = the Pets inventory tab plus the equipped pet; no new state.
- Progress in the bestiary per zone (owned / total). The Pets tab already shows "owned / total" overall.
- Bonus is a new modifier source in the `stats` computed (ADR 0002), not stored.

## Other set ideas
- Type sets, e.g. "all slime pets: +x% damageVsSlime".

## Pet leveling
- `petXp` in player state; the equipped pet gains XP from kills and its stats grow per level.

## Touch-points
`pet-items.data.ts`, `zones-data.ts`, `stats.ts` (collection source), bestiary component, `petXp` in player state for leveling. Docs: `enemies-shiny-pets-bestiary.md`.
