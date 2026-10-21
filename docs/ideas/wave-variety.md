# Wave variety & boss waves

**Scope:** M · **Status:** Proposed

Waves get a mixed enemy pool, an elite every N waves, and a zone-boss wave with a guaranteed drop.

## Why
Waves inside a zone are identical (repo audit 3.3). Makes weaknesses, bestiary and shinies more interesting.

## Touch-points
`zones-data.ts` (wave templates), `enemies-data.ts`, `battle.store.ts`, bestiary tracking.
