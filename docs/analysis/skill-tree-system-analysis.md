# Skill tree system — analysis

## Goal

Replace the current three-tree, row-based skill view with **one large, interconnected, pannable/zoomable tree** inspired by Path of Exile. The tree grows out of a single central hub and branches into the existing three regions (damage / exploration / magic). Nodes can have multiple levels, edges represent prerequisite chains, and prerequisites can cross region boundaries.

## Requirements summary (confirmed)

| # | Decision | Value |
|---|---|---|
| 1 | Tree topology | **One unified tree**. Old three trees become *regions* (visual branches) within it. |
| 2 | Hub | Single central node (`SkillPointID.origin`), free, max level 1, always available. |
| 3 | Multi-level prereqs | Yes — e.g. "Node A at 3/3" before Node B unlocks. |
| 4 | Cross-region prereqs | Yes — a Damage node can require Exploration X **AND** Magic Y. |
| 5 | Purchase economy | Reuse `PlayerManagerService.buySkillPoint(id, buyMax)`. Add prereq gate inside it. |
| 6 | Per-node refund | Supported, costs gold. **Blocked** if any allocated downstream node would become invalid. No cascade — player must refund top-down. |
| 7 | Full tree reset | Supported, costs gold. Wipes everything, returns all skill points. No preview UI. |
| 8 | Background | Solid color for v1. Tile-pyramid background optional later. |

## Context: what exists today

| File | Role |
|---|---|
| `src/data/skill-tree-data.ts` | `SKILL_TREES_DATA: Record<SkillTreeID, SkillTree>`, three trees, each as `SkillPointID[][]` (rows). No prereqs (`unlockRequirements: null`). |
| `src/interfaces/skill-tree/skill-tree.inteface.ts` | Tree = `{ id, skills: SkillPointID[][], unlockRequirement: null }`. |
| `src/interfaces/skill-tree/skill-point.interface.ts` | `SkillPoint` has typed-`null` `unlockRequirements` placeholder ready to be extended. |
| `src/enums/ids/skill-tree-node-id.enum.ts` | Globally-unique IDs partitioned by tree (0-99, 200-299, 400-499). Already cross-region-friendly. |
| `src/app/services/player-manager.service.ts:24-61` | `buySkillPoint` enforces cost + maxLevel only. **No prerequisite check today.** |
| `src/app/store/player/player.store.ts:42,226-229` | State shape is `unlockedSkillPoints: Partial<Record<SkillPointID, number>>` — level per node, immutable updates. Reusable as-is. |
| `src/app/components/game/skill-trees/` | `SkillTreesComponent` wraps three `SkillTreeComponent` instances; `SkillTreeComponent` renders rows via flexbox. Both replaced. |
| `src/app/components/game/world-map/world-map.component.ts` | Working Leaflet `CRS.Simple` viewer with pixel-coord markers and zoom-based visibility. **The pattern this design reuses.** |

## Rendering architecture — Leaflet on `CRS.Simple`

### Approaches considered

| Concern | A1: Static PNG + overlays | A2: HTML/DOM nodes in a transformed container | A3: Leaflet `CRS.Simple` (chosen) |
|---|---|---|---|
| Zoom/pan | Hand-rolled | Hand-rolled | Already working in `world-map.component.ts` |
| Connection lines | Baked into PNG → can't reflect state | Need a separate SVG/Canvas layer aligned with DOM | `L.polyline` in same CRS as nodes; reactive |
| Per-node state (allocated / available / locked / maxed) | Awkward overlay drift | Native | Native via `L.divIcon` |
| Authoring | Re-export PNG on every design change | Edit `data.ts` only | Edit `data.ts` only |
| Optional painted background later | Forced PNG | None | Drop in `L.tileLayer` later — no other refactor |

**A1** locks visual state into a static image — fights the whole point of a skill tree where nodes and lines change appearance based on what's allocated.

**A2** is fine for small trees but reimplements zoom/pan/clustering that already works 50 lines away in `world-map.component.ts`.

**A3 (Leaflet) is the recommendation.** The skill tree is a second "map":

- A `SkillTreeComponent` mirrors the shape of `WorldMapComponent`. No tile layer for v1 (`map.getContainer().style.background = '#1a1a2e'` or similar via CSS).
- Nodes are `L.marker(latLng(-y, x), { icon: L.divIcon({ html, className }) })`. The divIcon's HTML is real DOM you can style by state (`allocated`, `available`, `locked`, `maxed`, `keystone`).
- Connections are `L.polyline([latLng(-y1, x1), latLng(-y2, x2)], { className: 'skill-edge skill-edge--locked' })`. Polylines live in the same CRS — they pan/zoom with markers.
- Reuse the marker-visibility-per-zoom pattern from `world-map.component.ts:109-114` if/when you want low-zoom views hiding minor stat nodes and showing only keystones.

### Connection-line rendering

Edges are **derived from prerequisites**, not authored. Walk every node's `unlockRequirements`, extract `{kind:'node'}` leaves, emit `from → to` edges. One source of truth.

Visual state per edge is a pure function of endpoint state:

| Edge state | When |
|---|---|
| `locked` | `to` is not unlockable (prereq for `to` not met). |
| `available` | `to` is unlockable but not yet allocated. |
| `allocated` | `to` has at least one level. |

For multi-level nodes, **don't** draw multiple edges. One edge per `from→to`. Render progress (e.g. "3/5") on the *node* via a ring/segment overlay in the divIcon. Edge color flips only when the source is fully allocated (or by your preferred rule — keep it cosmetic).

Edges live in a single `L.layerGroup`. On state change, iterate edges and update `polyline.setStyle({ className })`. Cheaper than re-creating layers.

## Data model

### Expanded interfaces

```ts
// interfaces/skill-tree/skill-point.interface.ts

export interface SkillPointPosition {
  x: number  // image-pixel coords, same convention as world-map-data.ts
  y: number
}

// AND = all must hold; OR = any one. Compose for "A AND (B OR C)".
export type UnlockRequirement =
  | { kind: 'node'; id: SkillPointID; minLevel: number }
  | { kind: 'all'; of: UnlockRequirement[] }
  | { kind: 'any'; of: UnlockRequirement[] }

export interface SkillPoint {
  id: SkillPointID
  region: SkillRegion                       // NEW — visual branch identity; not a hard partition
  position: SkillPointPosition              // NEW — replaces row layout
  skillPointCost: number
  maxLevel: number
  unlockRequirements: UnlockRequirement | null  // EXPANDED from typed-null placeholder
  url: string
  type: SkillPointType
  stat?: PlayerStat
  statAmount?: number
  special?: boolean                         // "keystone" — render larger / unique frame
  spellId?: SpellID
}

// interfaces/skill-tree/skill-tree.inteface.ts — collapses to ONE tree

export interface RespecConfig {
  perPointGoldCost: number                  // per refunded skill-point level
  fullResetGoldCost: (state: { allocatedPointCount: number }) => number
}

export interface SkillTree {
  rootNodeId: SkillPointID                  // central hub
  nodes: ReadonlyArray<SkillPointID>        // membership
  respec: RespecConfig
}
```

### Rename

`SkillTreeID` → `SkillRegion` (file: `enums/ids/skill-tree-id.enum.ts`). Same three values, clearer intent now that there's one tree. Optional but recommended while we're touching everything anyway.

### Mock data

```ts
// data/skill-tree-data.ts (style of new entries)

[SkillPointID.origin]: {
  id: SkillPointID.origin,
  region: SkillRegion.damage,        // arbitrary — hub is regionless visually
  position: { x: 700, y: 500 },
  skillPointCost: 0,
  maxLevel: 1,
  unlockRequirements: null,
  url: './assets/img/skills/origin.png',
  type: SkillPointType.stat,
  stat: 'attackPower',
  statAmount: 0,
},

[SkillPointID.attackPower]: {
  id: SkillPointID.attackPower,
  region: SkillRegion.damage,
  position: { x: 800, y: 540 },
  skillPointCost: 1,
  maxLevel: 10,
  unlockRequirements: { kind: 'node', id: SkillPointID.origin, minLevel: 1 },
  url: './assets/img/skills/attackPower.png',
  type: SkillPointType.stat,
  stat: 'attackPower',
  statAmount: 1,
},

[SkillPointID.doubleAttack]: {
  id: SkillPointID.doubleAttack,
  region: SkillRegion.damage,
  position: { x: 950, y: 620 },
  skillPointCost: 2,
  maxLevel: 1,
  special: true,
  unlockRequirements: { kind: 'node', id: SkillPointID.critMulti, minLevel: 5 },
  url: './assets/img/skills/doubleAttack.png',
  type: SkillPointType.spell,
  spellId: SpellID.doubleAttack,
},

// Cross-region keystone — requires Exploration:knowledge L1 AND Magic:maxMana L1
[SkillPointID.arcaneScholar]: {
  id: SkillPointID.arcaneScholar,
  region: SkillRegion.magic,
  position: { x: 350, y: 720 },
  skillPointCost: 3,
  maxLevel: 1,
  special: true,
  unlockRequirements: {
    kind: 'all',
    of: [
      { kind: 'node', id: SkillPointID.knowledge, minLevel: 1 },
      { kind: 'node', id: SkillPointID.maxMana,   minLevel: 1 },
    ],
  },
  url: './assets/img/skills/arcaneScholar.png',
  type: SkillPointType.stat,
  stat: 'xpMultiplier',
  statAmount: 0.25,
},

const SKILL_TREE_DATA: SkillTree = {
  rootNodeId: SkillPointID.origin,
  nodes: Object.values(SkillPointID).filter(v => typeof v === 'number') as SkillPointID[],
  respec: {
    perPointGoldCost: 100,
    fullResetGoldCost: ({ allocatedPointCount }) => 500 + allocatedPointCount * 50,
  },
}
export default SKILL_TREE_DATA
```

### Precomputed graph

```ts
// data/skill-tree-graph.ts
export interface SkillTreeGraph {
  nodes: ReadonlyMap<SkillPointID, SkillPoint>
  forwardEdges: ReadonlyMap<SkillPointID, ReadonlySet<SkillPointID>>  // prereq → dependent
  outgoingPrereqs: ReadonlyMap<SkillPointID, ReadonlySet<SkillPointID>>  // dependent → prereq (renderer)
}
```

Built once at module load by scanning `ALL_SKILLS` and walking each node's `unlockRequirements`. `forwardEdges` answers "what depends on X?" — the key lookup for refund veto (below).

## Logic & validation

### Requirement evaluator

```ts
// utils/skill-tree-requirements.ts
export function isRequirementMet(
  req: UnlockRequirement | null,
  unlocked: Readonly<Record<number, number>>,
): boolean {
  if (req === null) return true
  switch (req.kind) {
    case 'node': return (unlocked[req.id] ?? 0) >= req.minLevel
    case 'all':  return req.of.every(r => isRequirementMet(r, unlocked))
    case 'any':  return req.of.some(r  => isRequirementMet(r, unlocked))
  }
}
```

Cross-region requirements just work — `SkillPointID` is globally unique, evaluator is region-blind.

### Purchase gate

```ts
export function canBuySkillPoint(
  node: SkillPoint,
  unlocked: Readonly<Record<number, number>>,
  unspentSkillPoints: number,
): { ok: true } | { ok: false; reason: 'maxed' | 'cost' | 'locked' } {
  const currentLevel = unlocked[node.id] ?? 0
  if (currentLevel >= node.maxLevel) return { ok: false, reason: 'maxed' }
  if (unspentSkillPoints < node.skillPointCost) return { ok: false, reason: 'cost' }
  if (currentLevel === 0 && !isRequirementMet(node.unlockRequirements, unlocked)) {
    return { ok: false, reason: 'locked' }
  }
  return { ok: true }
}
```

**Prereqs are checked only at level 0** (first allocation). Buying levels 2..N of an already-unlocked node skips the check — they've already been satisfied. Cheap, and consistent with PoE semantics. The invariant "every allocated node has its prereqs satisfied" is preserved because the only thing that could break it (refund) is gated separately (below).

### Refund veto (per-node)

Per-node refund is **blocked** if any currently-allocated node would become invalid afterward. No cascade. Player has to refund top-down.

```ts
// utils/skill-tree-refund.ts
export function canRefundSkillPoint(
  targetId: SkillPointID,
  levels: number | 'all',
  unlocked: Readonly<Record<number, number>>,
  graph: SkillTreeGraph,
): { ok: true; goldCost: number; pointsReturned: number }
| { ok: false; reason: 'not-allocated' | 'insufficient-gold' | 'blocked-by'; blockers?: SkillPointID[] } {

  const currentLevel = unlocked[targetId] ?? 0
  if (currentLevel === 0) return { ok: false, reason: 'not-allocated' }

  const dropAmount = levels === 'all' ? currentLevel : Math.min(levels, currentLevel)
  const newLevel = currentLevel - dropAmount

  // Simulate the refund.
  const next = { ...unlocked, [targetId]: newLevel }

  // Find allocated dependents whose requirements would now fail.
  const blockers: SkillPointID[] = []
  for (const dependentId of graph.forwardEdges.get(targetId) ?? []) {
    if ((unlocked[dependentId] ?? 0) === 0) continue
    const dep = graph.nodes.get(dependentId)!
    if (!isRequirementMet(dep.unlockRequirements, next)) blockers.push(dependentId)
  }

  if (blockers.length > 0) return { ok: false, reason: 'blocked-by', blockers }
  return { ok: true, goldCost: dropAmount * /* respec.perPointGoldCost */ 0, pointsReturned: dropAmount }
}
```

UI uses `blockers` to surface a tooltip: *"Cannot refund — required by Double Attack. Refund that first."*

Only **direct dependents** need to be checked (one hop via `forwardEdges`). If `B` depends on `A` and `C` depends on `B`, refunding `A` is blocked because of `B`; we never need to see `C`. This keeps the check O(out-degree of A), essentially free.

### Full tree reset

No preview, no per-node gate, no dependent walk:

```ts
respecEntireTree(): { goldCost: number } | null {
  const unlocked = this.playerStore.unlockedSkillPoints()
  const allocatedPointCount = Object.values(unlocked).reduce((s, l) => s + (l ?? 0), 0)
  const goldCost = SKILL_TREE_DATA.respec.fullResetGoldCost({ allocatedPointCount })
  if (this.playerStore.stats().gold < goldCost) return null

  // 1. Sum total skill points to return (cost × levels for every allocated node).
  // 2. Reverse every stat delta and spell unlock the buys applied.
  // 3. Zero out unlockedSkillPoints.
  // 4. Deduct gold, credit skill points.
  return { goldCost }
}
```

### Buy/refund symmetry

Extract `applySkillPointDelta(id: SkillPointID, delta: number)` so buy and refund share one stat/spell mutation path. Today's logic at `player-manager.service.ts:43-60` only handles positive deltas; the refund flow needs the mirror (subtract stat, decrement spell level / unequip on level→0).

### View-layer state map

Compute once per CD cycle, not per-node:

```ts
// inside SkillTreeComponent
nodeStates = computed(() => {
  const unlocked = this.unlockedSkillPoints()
  const out = new Map<SkillPointID, 'allocated' | 'available' | 'locked' | 'maxed'>()
  for (const node of SKILL_TREE_GRAPH.nodes.values()) {
    const level = unlocked[node.id] ?? 0
    if (level >= node.maxLevel) out.set(node.id, 'maxed')
    else if (level > 0)         out.set(node.id, 'allocated')
    else if (isRequirementMet(node.unlockRequirements, unlocked))
                                out.set(node.id, 'available')
    else                        out.set(node.id, 'locked')
  }
  return out
})
```

Edge state is then a trivial derived function of two node states.

### Traversal cost

For ~200 nodes the full state recompute is sub-millisecond. No memoization needed. Beyond a few thousand, memoize by `(reqRef, unlockedRef)` — `unlocked` is updated immutably in the store (`player.store.ts:226-229`), so reference equality works.

## Component & service surface

### Service additions (`PlayerManagerService`)

```ts
buySkillPoint(id: SkillPointID, buyMax: boolean): void              // EXISTING — add prereq gate
refundSkillPoint(id: SkillPointID, levels: number | 'all'): boolean // NEW
respecEntireTree(): boolean                                          // NEW
```

Both refund methods return a success boolean; the view reads the canRefund preview synchronously for tooltips/disabled state.

### Component changes

- **Delete** `SkillTreesComponent` (`src/app/components/game/skill-trees/skill-trees.component.{ts,html,sass}`).
- **Rewrite** `SkillTreeComponent` as a Leaflet map mirroring `WorldMapComponent`'s structure. Drop the row-based template entirely.
- Add a small UI: "Reset Tree (cost: X gold)" button. Confirmation modal: "Reset entire tree? Returns N skill points, costs X gold."
- Per-node tooltip gets a "Refund" action when `currentLevel > 0`. Disabled with reason when `canRefundSkillPoint` returns `ok: false`.

## Implementation order

Each step independently shippable:

1. **Interfaces & enum rename** — expand `SkillPoint` with `region`/`position`/typed `unlockRequirements`, collapse `SkillTree`, rename `SkillTreeID` → `SkillRegion`. Old `skills: SkillPointID[][]` data is migrated to flat per-node entries with `position`.
2. **Graph build + evaluator** — `skill-tree-graph.ts`, `skill-tree-requirements.ts`. Pure modules, unit-testable.
3. **Buy gate** — wire `canBuySkillPoint` into `PlayerManagerService.buySkillPoint`.
4. **Leaflet renderer** — new `SkillTreeComponent` (markers + polylines + state-driven classes). Delete `SkillTreesComponent`.
5. **Refund** — `canRefundSkillPoint` veto, `refundSkillPoint` service method, tooltip UI.
6. **Full reset** — `respecEntireTree` service method + button + confirmation modal.

## Open questions parked

- Should the hub `SkillPointID.origin` auto-allocate on character creation, or be a free first click? (Either works; auto-allocate is one less UX wrinkle.)
- Long-term: do we want a "preview path to node X" UX (highlight every node along the cheapest unlock chain on hover)? Out of scope for v1 but the graph supports it trivially.
- If we add an optional painted background later, do we tile-pyramid it (like the world map) or ship one PNG? Decide when needed; renderer doesn't care.
