# Skill tree

## Purpose
A radial tree of nodes the player unlocks with skill points (1 per level). Nodes grant stats, unlock spells, or switch on battle mechanics. Respec refunds points for gold.

## Key files
- `src/data/skill-tree-data.ts:ALL_SKILLS` — every node; `SKILL_TREE_DATA` holds the root and respec costs.
- `src/enums/ids/skill-node-id.enum.ts:SkillNodeID` — ranges per branch: exploration 0–99, damage 200–399, magic 400+, origin 1000.
- `src/enums/ids/skill-branch.enum.ts:SkillBranch` — exploration, damage, magic.
- `src/enums/skill-node-type.enum.ts:SkillNodeType` — `stat`, `spell`, `battle`.
- `src/interfaces/skill-tree/skill-node.interface.ts:SkillNode`, `NodeRequirement` (`node` / `all` / `any`).
- `src/data/skill-tree-graph.ts:SKILL_TREE_GRAPH` — built at module load: node map, forward edges, prerequisite edges, layout positions.
- `src/utils/skill-tree-requirements.ts:canBuyNode`, `src/utils/skill-tree-refund.ts:canRefundNode` — pure rules.
- `src/app/services/skill-tree.service.ts:SkillTreeService` — `buyNode`, `refundNode`, `respecPreview`, `respecEntireTree`.
- `src/app/components/game/skill-tree/skill-tree.component.ts` — Leaflet `CRS.Simple` canvas with one marker per node and polylines for edges.
- `src/app/components/modals/respec-confirm/` — full reset dialog.

## Data flow
- **Buy** (`buyNode`, ctrl-click = max): `canBuyNode` checks max level, cost, and `requires` (only for the first level). Spends `skillPointCost` per level, then by type: `stat` adds `statAmount × levels` to `stats`; `spell` levels up the spell and auto-equips it into a free spell slot; `battle` nodes have no direct effect and are read with `PlayerStore.hasSkillUnlocked`.
- **Refund one node** (`refundNode`, ctrl-click = all levels): blocked if a direct dependent would lose its requirement. Costs `goldCostPerLevel` gold per level refunded.
- **Full respec** (`respecEntireTree`): costs `fullResetGoldCost(allocatedLevels)` = 500 + 50 per level; removes every spell, clears `unlockedNodes` (node stats disappear with them).
- **Layout**: the origin has an explicit `position`. Other nodes chain out from their prerequisite in the branch's launch direction (`BRANCH_LAUNCH`), `turn` fans siblings, nodes with several prerequisites sit at their midpoint.

Battle nodes read in code: `autoWaveProgression`, `autoEat`, `weaknesses`, `spellCrit`.

## Intended behavior (owner decisions)
- **Overkill** (node exists, `maxLevel` 4, no effect yet): overflow damage, or the kill itself, lets the player hit the next monster sooner instead of waiting for the 2 s respawn delay (`RESPAWN_DELAY_IN_MS`, see `game-loop-and-combat.md`). Implementation approach still open.

## Invariants & gotchas
- Saved state is `PlayerState.unlockedNodes` (`SkillNodeID` → level). Skill points are the `unspentSkillPoints` stat.
- Stat nodes are read from `unlockedNodes` by the derived `stats`; buy and refund only change the level (see `player-stats-inventory-equipment.md`).
- `skillPointCost` is per level. `levelsRefunded` counts levels, not points.
- Every node needs `skill-tree:nodes.<key>.name` and `.desc`, and an icon under `assets/img/skills/` (`npm run validate` checks).

## Known issues
- Ctrl-click buying a cost-0 node (origin) with 0 skill points computes `0/0` and saves `NaN`.
- `manaRegen` lowers `manaRegenRate` by 2 ms per level on a 30 000 ms base, so it does nothing noticeable.
- Auto wave progression keeps working after its node is refunded or respecced (only the toggle is checked).
- Every refresh rebuilds every marker's icon and tooltip, closing open tooltips.
- Tooltip text (requirements, refund cost) is hard-coded English.

## How to extend
New node: append a `SkillNodeID` in the branch's range, add the node to the branch's map in `skill-tree-data.ts` with `requires` pointing at its parent, add i18n and icon. For a `battle` node, read it with `hasSkillUnlocked(SkillNodeID.x)` where the mechanic lives.
