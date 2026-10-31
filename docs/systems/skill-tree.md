# Skill tree

## Purpose
A radial tree of nodes the player unlocks with skill points (1 per level). Nodes grant stats, unlock spells, or switch on battle mechanics. Respec refunds points for gold.

## Key files
- `src/data/skill-tree-data.ts:ALL_SKILLS` — every node; `SKILL_TREE_DATA` holds the root and respec costs.
- `src/enums/ids/skill-node-id.enum.ts:SkillNodeID` — ranges per branch: exploration 0–99, damage 200–399, magic 400+, origin 1000.
- `src/enums/ids/skill-branch.enum.ts:SkillBranch` — exploration, damage, magic, and the element branches fire, water, air, earth.
- `src/enums/skill-node-type.enum.ts:SkillNodeType` — `stat`, `spell`, `battle`.
- `src/interfaces/skill-tree/skill-node.interface.ts:SkillNode`, `NodeRequirement` (`node` / `all` / `any`).
- `src/data/skill-tree-graph.ts:SKILL_TREE_GRAPH` — built at module load: node map, forward edges, prerequisite edges, layout positions.
- `src/utils/skill-tree-requirements.ts:canBuyNode`, `src/utils/skill-tree-refund.ts:canRefundNode` — pure rules.
- `src/app/services/skill-tree.service.ts:SkillTreeService` — `buyNode`, `refundNode`, `respecPreview`, `respecEntireTree`.
- `src/app/components/game/skill-tree/skill-tree.component.ts` — Leaflet `CRS.Simple` canvas with one marker per node and polylines for edges. Opens at zoom 0 (native layout); node icons are a fixed 80 px, so they overlap at zoom −1.
- `src/app/components/modals/respec-confirm/` — full reset dialog.

## Data flow
- **Buy** (`buyNode`, ctrl-click = max): `canBuyNode` checks max level, cost, and `requires` (only for the first level). Spends `skillPointCost` per level, then by type: `stat` adds `statAmount × levels` to `stats`; `spell` levels up the spell and auto-equips it into a free spell slot; `battle` nodes have no direct effect and are read with `PlayerStore.hasSkillUnlocked`.
- **Refund one node** (`refundNode`, ctrl-click = all levels): blocked if a direct dependent would lose its requirement, or if losing its `inventorySlots` would strand items in a tab (reason `inventory-in-use` with that `tab`, from `PlayerStore.slotChangeBlockedTab`; the tooltip names the tab). Costs `goldCostPerLevel` gold per level refunded.
- **Full respec** (`respecEntireTree`): costs `fullResetGoldCost(allocatedLevels)` = 500 + 50 per level; removes every spell the tree gave (scroll and gear spells stay: a spell has only one source), clears `unlockedNodes` (node stats disappear with them). Blocked the same way when the tree's slots hold items (`respecPreview().inventoryBlockedTab`; the dialog names the tab).
- **Layout**: the origin has an explicit `position`. Other nodes chain out from their prerequisite in the branch's launch direction (`BRANCH_LAUNCH`), `turn` fans siblings, `distance` lengthens a step (default 1), nodes with several prerequisites sit at their midpoint. `anchor` lays out and draws a node from another node instead of its requirements (`SKILL_TREE_GRAPH.drawnEdges`; unlocking and refunds still use `requires` through `forwardEdges`).
- **Magic**: the four strike spells (Fire Strike, Tidal Lash, Gale Cut, Stone Spike) hang off the origin 2.5 steps out, one per element branch, fanned across the magic sector (−25°, 5°, 55°, 85°). Each element branch: spell → Mastery (+0.1 to that element's weakness multiplier, 5 levels) → a spell perk (`battle` node read through `SpellProps.perk`: −5 s Fire Strike / Tidal Lash, −3 s Gale Cut, −1 mana Stone Spike). The shared core (Max Mana → Mana Regen and Magic Damage → Spell Crit → Spell Cooldown) needs any one strike spell; Max Mana is anchored to the origin, 2 steps out in the lane between the water and air branches, so one line leads to it; its description names the strike spells it needs, since locked tooltips only say "Locked".

Battle nodes read in code: `autoWaveProgression`, `autoEat`, `weaknesses`, `spellCrit`, and the spell perks (`fireStrikeCooldown`, `tidalLashCooldown`, `galeCutCooldown`, `stoneSpikeMana`, by level through `SpellProps.perk`).

## Intended behavior (owner decisions)
- **Overkill** (node exists, `maxLevel` 4, no effect yet): overflow damage, or the kill itself, lets the player hit the next monster sooner instead of waiting for the 2 s respawn delay (`RESPAWN_DELAY_IN_MS`, see `game-loop-and-combat.md`). Implementation approach still open.

## Invariants & gotchas
- Saved state is `PlayerState.unlockedNodes` (`SkillNodeID` → level). Skill points are the `unspentSkillPoints` stat.
- Stat nodes are read from `unlockedNodes` by the derived `stats`; buy and refund only change the level (see `player-stats-inventory-equipment.md`).
- `skillPointCost` is per level. `levelsRefunded` counts levels, not points.
- Every node needs `skill-tree:nodes.<key>.name` and `.desc`, and an icon under `assets/img/skills/` (`npm run validate` checks).
- Refunding or respeccing `autoWaveProgression` or `autoEat` switches its toggle off; auto wave progression also checks the node when it fires.
- Buy max on a free node (`skillPointCost` 0) fills it to `maxLevel`.

## Known issues
- Every refresh rebuilds every marker's icon and tooltip, closing open tooltips.
- Tooltip text (requirements, refund cost) is hard-coded English.

## How to extend
A stat node with `statPercent: true` scales the stat by `statAmount` per level after flat modifiers (`manaRegen`: 10% faster regen per level).

New node: append a `SkillNodeID` in the branch's range, add the node to the branch's map in `skill-tree-data.ts` with `requires` pointing at its parent, add i18n and icon. For a `battle` node, read it with `hasSkillUnlocked(SkillNodeID.x)` where the mechanic lives.
