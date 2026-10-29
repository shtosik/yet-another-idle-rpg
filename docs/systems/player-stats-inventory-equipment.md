# Player stats, inventory and equipment

## Purpose
`PlayerStore` holds everything about the player character: stats, level and XP, gold, the inventory grid, equipped gear, and progress flags. Most other systems read from or write to it.

## Key files
- `src/app/store/player/player.store.ts:PlayerStore` — state, the derived `stats`, `updatePlayerStats`, `addItems`/`removeItems`, `equipItem`/`unequipItem`, `useItem`, `processBattleEnd`, unlock flags.
- `src/app/store/player/stats.ts` — `deriveStats`, the modifier sources (`equipmentModifiers`, `skillNodeModifiers`, `buffModifiers`, `consumableModifiers`, `bonusModifiers`; zone mastery's `masteryModifiers` lives in `zone-mastery.ts`), `SourcedModifiers` and `statContributions` (per-source breakdown), `RESOURCE_STATS`, inverted stats.
- `src/app/components/game/player-stats/` — the stats panel: groups and rows from `stat-rows.ts:STAT_GROUPS`, each row's tooltip breaks the stat down by source.
- `src/app/store/player/player.ts:statsInitialState` — every stat's base value (and its unit, in comments).
- `docs/adr/0002-player-stats-derived-from-sources.md` — why stats are derived.
- `src/app/store/player/inventory.ts` — pure inventory helpers: `addItems`, `removeItems`, `canFit`, `countItem`, `maxAffordable`, `resizeInventory`.
- `src/types/player/player-stat.type.ts:PlayerStat` — the stat union, plus `multiplierStats`, `percentageStats`, `additivePercentStats` (display format, used by `stat-to-percentage.pipe.ts`).
- `src/interfaces/item.interface.ts:Item` — item union by `ItemType`.
- `src/enums/equipment-slot.enum.ts:EquipmentSlot` — 11 slots; `EquipmentSlotKey` is the string key used in `PlayerState.equipment`.
- `src/app/services/skill-tree.service.ts:SkillTreeService` — skill node buy/refund/respec (see `skill-tree.md`).

## Data flow
- **Stats** (`PlayerStore.stats()`) are a computed `Record<PlayerStat, number>`: `statsInitialState` + equipped gear + stat skill nodes × level + active buffs (`BattleStore.activeBuffs`) + active consumable effects (`BattleStore.consumableSlots`) + `permanentBonuses`, with saved **resources** on top. Nothing stores the total. `PlayerStore.sourcedModifiers()` keeps the modifiers grouped by source (gear, skills, buffs, food and potions, permanent bonuses, zone mastery); `stats` flattens it, and the stats panel's tooltip reads it through `statContributions`.
- **Stats panel** (main and Settings tabs, spanning both middle columns): Combat, Magic, Progress, Weakness damage and Damage vs enemy types. A row shows when marked `always` in `STAT_GROUPS` or when its value differs from `statsInitialState`; "Show all stats" lists every row. Level, XP and gold live in the HUD, not here. Hovering or focusing a row shows a one-line description (`app:statsPanel.descriptions.<stat>`, or the row's shared `description` key for weakness and enemy-type rows), Base, each source's flat and percent part, and Total; on inverted stats a positive data amount shows as a minus.
- **Resources** (`PlayerState.resources`: `experience`, `level`, `unspentSkillPoints`, `goldCoins`, `mana`) are earned and spent with `updatePlayerStats([{ stat, amount }])`. The same call with any other stat adds a **permanent bonus** (`PlayerState.permanentBonuses`): used reward items, quest stat rewards, dialogue stat effects. Gear, nodes, buffs and consumables never call it.
- **XP**: adding `experience` runs `handleExperience`, which levels up (possibly several times) and grants 1 skill point per level. Formula: `src/app/pipes/calculate-xp.pipe.ts`.
- **Inventory**: a fixed-length array of slots (`InventoryItem | null`), length = `stats.inventorySlots` (default 40, grows when the stat rises, never shrinks). Items stack per `id + tier`. `removeItems` takes across every stack of an id.
- **Chests** (`ItemType.chest`: `rolls` picks from a weighted `loot` table of gold or item stacks) open on right-click: `PlayerStore.openChest` rolls the loot (`rollChest`, `store/player/chest.ts`), opening needs one empty slot per pick (owner rule: the most new stacks it can give), else nothing changes and the modal says how many. The contents, or "no room", show in a modal. Stackable, unsellable (open it instead). The Arena Chest is the first.
- **Spell scrolls** (`ItemType.spellScroll`) teach their `spellId` on right-click and are used up; a scroll for a spell already known can be sold. See `spells-and-buffs.md`.
- **Station upgrade items** never enter the inventory: `PlayerStore.addItems` installs them into `stations` instead (see `consumables-camp-crafting.md`).
- **Equip**: the item leaves the inventory first, the old item goes back in; stats follow from `equipment`. A weapon's `damageType` is the element of auto-attacks and its `weaponCategory` (default melee) whether they are melee hits; an item's `spell` is known while it is equipped (`spells-and-buffs.md`). Item tooltips show both.
- **Drops** (`calculateEnemyDrops` in `player.store.ts`): each `EnemyDrop` is a 1-in-`chance` roll, amount in `minAmount..maxAmount`; drops with `requiredActiveQuestId` only roll while that quest is active. Shinies roll the normal table 10 times plus `shinyDrops` once.

## Intended behavior (owner decisions)
- **Enemy drops are lost when the inventory is full.** This is intended.
- **Unequipping, crafting and completing a quest must be blocked when the result has no inventory space**, and the UI must say why.
- **Spending gold must be blocked when the player can't afford it**, for every gold sink: dialogue fees, shops, respec/refund.

## Invariants & gotchas
- **Stats are derived, not stored.** A new stat source must be added to the `stats` computed in `PlayerStore`, not applied with `updatePlayerStats`. Removing the source (unequip, expiry, refund) removes the stat; there is nothing to mirror.
- Derived stats are rounded to 6 decimals (no float drift). `mana` never shows above `maxMana`, and stored mana drops when `maxMana` does.
- **Inverted stats**: `attackSpeed` (seconds per attack), `manaRegenRate` (ms per mana) and `shopRefreshCooldown` (ms) are lowered by positive amounts (`INVERTED_STATS` in `stats.ts`). Data always uses "positive = better".
- The mana regen timer (`PlayerStore.manaRegenTimer`) is not a stat and is not saved.
- Stat units: multipliers are factors (`critMulti` 1.2 = ×1.2); `critChance` and `shinyChance` are percent; `damageVs*` are additive fractions (0.2 = +20%).
- Every `PlayerStat` needs an `app:playerStats.<stat>` label (`npm run validate` checks).
- **Gold per kill** is `ceil(Enemy.gold × goldCoinsMultiplier × 10 if shiny)` (`processBattleEnd`).
- **Item `value`** is the sell price (`sellItem`, any shop). `value <= 0` is unsellable: books, station gear, quest items and chests must stay there (recipes, spell scrolls and pets sell, so duplicates aren't dead slots; owner decision), and a shop's price must be above the item's `value` (`npm run validate` checks both).
- `addItems` silently discards what doesn't fit. Callers that must not lose items check `canFit` first.

## Known issues
- None open here; see `docs/ideas/known-issues.md`.

## How to extend
New equipment: the `add-equipment-item` skill. New stat: add it to `PlayerStat`, `statsInitialState`, the right display list, a row in `STAT_GROUPS` (`player-stats/stat-rows.ts`), `app:playerStats` and `app:statsPanel.descriptions`; if lower is better, add it to `INVERTED_STATS` in `stats.ts`; if it is earned and spent rather than granted, add it to `RESOURCE_STATS`.
