# Shiny Monster Mechanic — Implementation Plan

> **Pitch:** Once unlocked via a new exploration skill, every enemy spawn has a small
> chance to be "shiny" — different sprite, 10× rolls on the drop table, 5× XP, 10× gold.
> **Date:** 2026-05-13

## Design decisions (locked)

| Decision | Choice |
|---|---|
| Chance source | **`shinyChance` PlayerStat** (default `0`). The skill unlock sets it to `1` (1%). Future items/skills can stack on top via the existing stat-update pipeline. |
| Boss eligibility | **Bosses can be shiny.** Already rare, so this is a jackpot moment. No filter. |
| Reward scaling | **Drops rolled 10× and accumulated. XP × 5. Gold × 10.** |
| Visual cue | **Image swap only** — `-shiny` suffix on the enemy sprite filename. No badge, no glow. |
| Roll timing | **At enemy spawn** (`BattleStore.startBattle`). Encounter is shiny or not for its full lifetime. |
| Skill type | `stat` type with `stat: 'shinyChance', statAmount: 1` — reuses the existing "skill unlock adds to stat" machinery. |
| Chance scale | `shinyChance` is stored as **percent** (e.g. `1` = 1%). Roll: `Math.random() * 100 < shinyChance`. Matches `critChance`. |

## How the loop runs

```
startBattle()
   ├─ roll = Math.random() * 100
   ├─ isShiny = roll < playerStore.stats().shinyChance
   ├─ enemy = { ...ENEMIES_DATA[id], url: isShiny ? toShinyUrl(url) : url }
   └─ patchState: { enemy, isShinyEnemy: isShiny, ... }

battleManager.doDamage() → enemy dies
   └─ playerStore.processBattleEnd(enemyId, zoneId, wave, battleStore.isShinyEnemy())
        ├─ rolls = isShiny ? 10 : 1
        ├─ drops = aggregate(rolls × calculateEnemyDrops(enemy))
        ├─ xpGained = enemy.experience × xpMultiplier × (isShiny ? 5 : 1)
        ├─ goldGained = 1 × (isShiny ? 10 : 1)  // gold multiplier applies on top, as usual
        └─ apply
```

## File inventory

### Modified files
1. `src/enums/ids/skill-tree-node-id.enum.ts` — add `shinyHunter = 5` to the exploration block.
2. `src/types/player/player-stat.type.ts` — add `'shinyChance'` to the union.
3. `src/app/store/player/player.ts` — add `shinyChance: 0` to `statsInitialState`.
4. `src/data/skill-tree-data.ts` — add `shinyHunter` to `EXPLORATION_SKILLS_DATA` and a new row to `SKILL_TREES_DATA[SkillTreeID.exploration].skills`.
5. `src/app/store/battle/battle.store.ts` — add `isShinyEnemy: boolean` to state, roll in `startBattle`, override URL.
6. `src/app/store/player/player.store.ts` — extend `processBattleEnd` to accept `isShiny`. Update `calculateEnemyDrops` to accept a `rolls` parameter and accumulate.
7. `src/app/services/battle-manager.service.ts` — pass `battleStore.isShinyEnemy()` to `processBattleEnd`.
8. `src/assets/locales/en/skill-tree.json` — add i18n key for the new skill name/description.

### Assets (out of scope for code, but call out)
- `src/assets/img/skills/shinyHunter.png` — skill icon (1).
- `src/assets/img/enemies/<enemyName>-shiny.png` — one per enemy currently in `ENEMIES_DATA` (15 sprites).

---

## Phase 1 — Skill data and PlayerStat

### 1.1 New SkillPointID
`src/enums/ids/skill-tree-node-id.enum.ts`:
```ts
// Exploration Skill Tree
autoWaveProgression = 0,
haste = 1,
goldGain = 2,
knowledge = 3,
weaknesses = 4,
shinyHunter = 5,   // ← new
```

### 1.2 PlayerStat
`src/types/player/player-stat.type.ts` — add `'shinyChance'` to the union.

`src/app/store/player/player.ts` — `statsInitialState`:
```ts
shinyChance: 0,
```

### 1.3 Skill tree entry
`src/data/skill-tree-data.ts` — under `EXPLORATION_SKILLS_DATA`:
```ts
[SkillPointID.shinyHunter]: {
  id: SkillPointID.shinyHunter,
  skillPointCost: 10,
  unlockRequirements: null,
  maxLevel: 1,
  special: true,
  url: './assets/img/skills/shinyHunter.png',
  type: SkillPointType.stat,
  stat: 'shinyChance',
  statAmount: 1,                  // +1% per level (and maxLevel is 1)
},
```

Then add a new row to the exploration tree layout:
```ts
[SkillTreeID.exploration]: {
  id: SkillTreeID.exploration,
  skills: [
    [SkillPointID.autoWaveProgression],
    [SkillPointID.haste, SkillPointID.goldGain, SkillPointID.knowledge],
    [SkillPointID.weaknesses],
    [SkillPointID.shinyHunter],   // ← new row
  ],
  unlockRequirement: null,
},
```

### 1.4 i18n
`src/assets/locales/en/skill-tree.json` — follow the existing naming convention (a name + tooltip for `shinyHunter`). The exact key shape depends on what's already there; mirror `haste` / `weaknesses` if they have tooltips.

---

## Phase 2 — Battle spawn rolls shiny

### 2.1 BattleState shape
`src/app/store/battle/battle.store.ts`:
```ts
export interface BattleState {
  // ...existing
  isShinyEnemy: boolean
}

export const initialState: BattleState = {
  // ...existing
  isShinyEnemy: false,
}
```

### 2.2 URL helper
Local helper in `battle.store.ts`:
```ts
function toShinyUrl(url: string): string {
  return url.replace(/\.png$/i, '-shiny.png')
}
```

This relies on every enemy URL ending in `.png` (verified across `ENEMIES_DATA`). If a future
asset uses `.webp`/`.gif`, the regex extends easily.

### 2.3 Roll on `startBattle`
Inject `playerStore` (already injected). Rewrite the enemy assignment:
```ts
startBattle(): void {
  patchState(store, (state) => {
    const zoneData = store.currentZoneData()
    let enemy: Enemy

    if (state.currentWave !== zoneData.maxWave) {
      const possibleEnemies = zoneData.enemies
      const randomIndex = Math.floor(Math.random() * possibleEnemies.length)
      enemy = ENEMIES_DATA[possibleEnemies[randomIndex]]
    } else {
      enemy = ENEMIES_DATA[zoneData.bossEnemyId]
    }

    const shinyChance = playerStore.stats().shinyChance ?? 0
    const isShiny = shinyChance > 0 && Math.random() * 100 < shinyChance

    return {
      isInCombat: true,
      enemy: isShiny ? { ...enemy, url: toShinyUrl(enemy.url) } : enemy,
      currentEnemyHp: enemy.maxHp,
      isShinyEnemy: isShiny,
    }
  })
}
```

The enemy object in state is a copy (spread) so we don't mutate `ENEMIES_DATA`. The
`url` swap is contained to runtime state.

### 2.4 Reset on end/wave change
`endBattle()` and `changeWave()` already reset `enemy` to null — also reset `isShinyEnemy: false` there for cleanliness.

---

## Phase 3 — Drops, XP, gold scale

### 3.1 Accumulate drops helper
`src/app/store/player/player.store.ts` — update `calculateEnemyDrops`:
```ts
const calculateEnemyDrops = (enemy: Enemy, rolls: number): InventoryItem[] => {
  const accumulator = new Map<string, InventoryItem>()  // key = `${id}:${tier}`

  for (let r = 0; r < rolls; r++) {
    enemy.drops.forEach(drop => {
      const roll = Math.ceil(Math.random() * drop.chance)
      if (roll !== drop.chance) return

      const amount = Math.floor(Math.random() * (drop.maxAmount - drop.minAmount + 1) + drop.minAmount)
      const { type, tier } = ITEM_DATA[drop.id]
      const key = `${drop.id}:${tier}`
      const existing = accumulator.get(key)
      if (existing) {
        existing.amount += amount
      } else {
        accumulator.set(key, { id: drop.id, type, tier, amount })
      }
    })
  }

  return [...accumulator.values()]
}
```

This pre-aggregates by `(id, tier)` so the inventory only gets one update per item even
when shiny rolls hit the same drop multiple times. Avoids any latent issue with
`updatePlayerInventory` if it were ever called with duplicate entries.

### 3.2 Extend `processBattleEnd`
```ts
processBattleEnd(enemyId: EnemyID, zoneId: ZoneID, currentWave: number, isShiny: boolean) {
  const enemy = ENEMIES_DATA[enemyId]
  const stats = store.stats()

  const xpMultiplier = isShiny ? 5 : 1
  const goldMultiplier = isShiny ? 10 : 1
  const dropRolls = isShiny ? 10 : 1

  const xpGained = Math.ceil(enemy.experience * stats.xpMultiplier * xpMultiplier)
  const goldGained = 1 * goldMultiplier  // existing 1g base, scaled
  const itemsToUpdate = calculateEnemyDrops(enemy, dropRolls)

  store.updatePlayerStats([
    { stat: 'experience', amount: xpGained },
    { stat: 'goldCoins', amount: goldGained },
  ])

  store.updateZoneProgression(zoneId, currentWave)
  store.updateEnemyKillCount(enemyId)
  store.updateTaskProgress(enemyId)

  if (itemsToUpdate.length) store.updatePlayerInventory(itemsToUpdate)
}
```

Note: `xpMultiplier` and `goldCoinsMultiplier` (the player's existing stats) stack
multiplicatively with the shiny bonus. So a shiny + level-5 `knowledge` = `× 5 × 1.5`.
That's the natural compounding behaviour — flag if you want it changed.

### 3.3 Update caller
`battle-manager.service.ts` — wherever `processBattleEnd` is called, pass the shiny flag:
```ts
this.playerStore.processBattleEnd(
  enemyId,
  zoneId,
  currentWave,
  this.battleStore.isShinyEnemy(),
)
```

---

## Phase 4 — Smoke test

1. Reset state. `stats.shinyChance` should be `0`.
2. Kill 100+ regular enemies → none should be shiny (image always the standard sprite).
3. Open skill tree → exploration → unlock `shinyHunter` (requires 10 unspent skill points).
   - `stats.shinyChance` becomes `1`.
4. Kill enemies → roughly every 100th encounter spawns with the `-shiny` sprite.
   - Quick verification: in devtools, temporarily set `shinyChance` to 100 → every spawn is shiny.
5. Verify on a shiny kill:
   - Inventory receives roughly 10× the usual drop quantity.
   - XP gained = `enemy.experience × xpMultiplier × 5`.
   - Gold gained = `10` (not 1).
6. Verify on a shiny **boss** kill that the same logic applies. Bosses are eligible.
7. Verify the `-shiny` image swap: log into the network tab and confirm the request goes
   to `./assets/img/enemies/<name>-shiny.png`. Falls back to the regular sprite via
   browser onerror if the asset is missing — players see the regular image but the
   gameplay effects still apply.
8. `npx tsc --noEmit` passes.

---

## Phase 5 — Out of scope

Deliberately deferred to keep the PR focused:
- **Shiny kill counter / achievement tracking.** Could live on `playerStore` later.
- **"Shiny!" UI badge + glow animation.** Listed as v2 polish.
- **Sound effect on shiny encounter.** Polish.
- **Shiny-exclusive drops** (Pokemon-style unique items). Would require extending `EnemyDrop` with a `shinyOnly` flag.
- **Per-zone shiny chance modifiers.** Easy add later — a multiplier on the zone definition that's read alongside `shinyChance`.
- **Migration for existing saves.** Existing players have no `shinyChance` in their persisted stats — `withGameStateSync` merges defaults so they'll get `0` on next load. Confirm by clearing-then-reloading-then-checking devtools.

---

## Risks and edge cases

1. **Missing shiny sprite asset** → browser shows a broken image but combat works. Mitigations:
   - Add an `onerror` handler in `enemy.component.html` to fall back to the regular `url` if the shiny variant 404s.
   - Or, ship all 15 `-shiny.png` files alongside this feature (preferred — atomic).

2. **Save sync ordering** → if a save load happens AFTER the first `startBattle` (unlikely but possible during reload), `isShinyEnemy` could be stale. `endBattle()` and `changeWave()` resetting the flag handles this.

3. **Existing `xpMultiplier` stat** → multiplicative stacking is intentional. The shiny bonus amplifies any existing buffs rather than replacing them. If you want flat 5×/10× regardless of player stats, change `Math.ceil(enemy.experience * stats.xpMultiplier * 5)` → `Math.ceil(enemy.experience * 5)`.

4. **Drop accumulation map key** → I use `${id}:${tier}` because tier disambiguates the same `ItemID` at different tiers (rare today, but the data model supports it). If tiers are never mixed for a single enemy, plain `id` is fine.

---

## Estimated effort

| Phase | Effort |
|---|---|
| 1 — skill data + stat | XS — 15 min |
| 2 — battle spawn roll | S — 30 min |
| 3 — drops/xp/gold scale | S — 30 min |
| 4 — smoke test | XS — 15 min |

**Total:** ~1.5 h of focused work (assets excluded — those are a separate art task).

## Suggested commit sequence

```
1. feat(stats): add shinyChance PlayerStat
2. feat(skills): add shinyHunter exploration skill
3. feat(battle): roll shiny on enemy spawn and swap sprite URL
4. feat(loot): shiny enemies drop 10x, give 5x XP and 10x gold
```

Each commit is independently runnable — after #1 you can verify the stat exists in
devtools, after #2 the skill is buyable (but does nothing), after #3 sprites swap,
after #4 the full loop works.
