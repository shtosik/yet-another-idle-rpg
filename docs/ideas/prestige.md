# Prestige / rebirth

**Scope:** M-L · **Status:** Proposed

Reset level, zone progress and gold for permanent "Legacy" points that buy global multipliers. A second, post-prestige tree could reuse `skill-tree-graph.ts`.

## Note
Do this after the XP and zone curves are fixed (repo audit 3.3), otherwise prestige math sits on a broken base.

## Touch-points
`player.store.ts`, cross-store reset action, `skill-tree-data.ts`, persistence.
