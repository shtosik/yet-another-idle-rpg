# Player stats, inventory and equipment

## Purpose
`PlayerStore` holds everything about the player character: stats, level and XP, gold, the inventory grid, equipped gear, and progress flags. Most other systems read from or write to it.

## Key files
- `src/app/store/player/player.store.ts:PlayerStore` — state, `updatePlayerStats`, `addItems`/`removeItems`, `equipItem`/`unequipItem`, `useItem`, `processBattleEnd`, unlock flags.
- `src/app/store/player/player.ts:statsInitialState` — every stat's starting value (and its unit, in comments).
- `src/app/store/player/inventory.ts` — pure inventory helpers: `addItems`, `removeItems`, `canFit`, `countItem`, `maxAffordable`, `resizeInventory`.
- `src/types/player/player-stat.type.ts:PlayerStat` — the stat union, plus `multiplierStats`, `percentageStats`, `additivePercentStats` (display format, used by `stat-to-percentage.pipe.ts`).
- `src/interfaces/item.interface.ts:Item` — item union by `ItemType`.
- `src/enums/equipment-slot.enum.ts:EquipmentSlot` — 11 slots; `EquipmentSlotKey` is the string key used in `PlayerState.equipment`.
- `src/app/services/skill-tree.service.ts:SkillTreeService` — skill node buy/refund/respec (see `skill-tree.md`).

## Data flow
- **Stats** are one flat `Record<PlayerStat, number>` in persisted state. Every source changes it with `updatePlayerStats([{ stat, amount }])`: gear on equip (`+`) and unequip (`−`), skill nodes, buffs (`+` on cast, `−` on expiry), consumables, reward items, quest rewards.
- **XP**: adding `experience` runs `handleExperience`, which levels up (possibly several times) and grants 1 skill point per level. Formula: `src/app/pipes/calculate-xp.pipe.ts`.
- **Inventory**: a fixed-length array of slots (`InventoryItem | null`), length = `stats.inventorySlots` (default 40, grows when the stat rises, never shrinks). Items stack per `id + tier`. `removeItems` takes across every stack of an id.
- **Station upgrade items** never enter the inventory: `PlayerStore.addItems` installs them into `stations` instead (see `consumables-camp-crafting.md`).
- **Equip**: the item leaves the inventory first, the old item goes back in, then the stat delta of both is applied.
- **Drops** (`calculateEnemyDrops` in `player.store.ts`): each `EnemyDrop` is a 1-in-`chance` roll, amount in `minAmount..maxAmount`; drops with `requiredActiveQuestId` only roll while that quest is active. Shinies roll the normal table 10 times plus `shinyDrops` once.

## Intended behavior (owner decisions)
- **Enemy drops are lost when the inventory is full.** This is intended.
- **Unequipping, crafting and completing a quest must be blocked when the result has no inventory space**, and the UI must say why.
- **Spending gold must be blocked when the player can't afford it**, for every gold sink: dialogue fees, shops, respec/refund.

## Invariants & gotchas
- **Stats are accumulated, not derived.** There is no "base + gear + buffs" recomputation; persisted `stats` is the running total. Every `+` must have a matching `−` (equip/unequip, buff expiry, respec). A missed mirror permanently corrupts the save.
- **Inverted stats**: `attackSpeed` (seconds per attack), `manaRegenRate` (ms per mana) and `shopRefreshCooldown` (ms) are lowered by positive amounts in `updatePlayerStats`. Data always uses "positive = better".
- Stat units: multipliers are factors (`critMulti` 1.2 = ×1.2); `critChance` and `shinyChance` are percent; `damageVs*` are additive fractions (0.2 = +20%).
- Every `PlayerStat` needs an `app:playerStats.<stat>` label (`npm run validate` checks).
- `addItems` silently discards what doesn't fit. Callers that must not lose items check `canFit` first.

## Known issues
- Because stats are accumulated: rebalancing an item or a node's `statAmount` leaves the old delta on saves that had it applied; `statsInitialState` changes never reach existing saves; float drift builds up (`attackSpeed` 2.7000000000000006).
- `unequipItem` does not check for space; unequipping with a full inventory destroys the item (violates the owner decision above).
- `goldCoinsMultiplier` is granted by items but never applied to gold gains (see `game-loop-and-combat.md`).

## How to extend
New equipment: the `add-equipment-item` skill. New stat: add it to `PlayerStat`, `statsInitialState`, the right display list, and `app:playerStats`; if lower is better, add it to the inverted cases in `updatePlayerStats`.
