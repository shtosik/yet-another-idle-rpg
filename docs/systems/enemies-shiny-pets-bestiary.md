# Enemies, shinies, pets and bestiary

## Purpose
Enemy definitions and their loot. A **shiny** is a rare recolored spawn with much better rewards. **Pets** are equippable items dropped by enemies (normal pets from normal kills, shiny pets only from shinies). The **bestiary** tab records every enemy the player has killed.

## Key files
- `src/data/enemies-data.ts:ENEMIES_DATA` — per enemy: `maxHp`, `experience`, `weakness`, `enemyTypes`, sprite `url`, `drops`, `shinyDrops`. `drop(id, min, max, chance)` builds a drop row.
- `src/interfaces/enemy.interface.ts:Enemy`, `enemy-drop.interface.ts:EnemyDrop` (`chance` = 1 in N per roll; optional `requiredActiveQuestId`).
- `src/enums/ids/enemy-id.enum.ts:EnemyID`, `src/enums/enemy-type.enum.ts:EnemyType` (used by `damageVs<Type>` stats).
- `src/data/items/pet-items.data.ts` — `PETS` table (enemy → pet item, shiny pet item, sprite stem, stats); builds `PetItemsData`, `petDrop(enemyId)`, `shinyPetDrops(enemyId)`; `PET_DROP_CHANCE` = 2000.
- `src/utils/shiny-url.ts:toShinyUrl` — `<name>.png` → `<name>-shiny.png`.
- `src/app/store/battle/battle.store.ts:startBattle` — shiny roll; `src/app/store/player/player.store.ts:processBattleEnd` — shiny rewards and drop rolls.
- `src/app/components/game/bestiary/bestiary.component.ts` — bestiary tab; `src/data/helpers/enemy-zones.ts:ZONES_BY_ENEMY`.

## Data flow
- **Shiny roll** at spawn: `Math.random() * 100 < stats.shinyChance` (percent; 0 by default, raised by the `shinyHunter` node). Bosses can be shiny. The enemy's sprite swaps to `toShinyUrl(url)`; no other visual cue.
- **Shiny rewards**: XP ×5, gold ×10, normal drop table rolled 10 times, plus `shinyDrops` rolled once.
- **Pets**: each enemy in `PETS` gets `petDrop` in `drops` (1/2000) and `shinyPetDrops` as its `shinyDrops`. Pets are `EquipmentSlot.pet` items using the enemy sprite (shiny pets the shiny sprite); normal pets are rare tier, shiny pets legendary.
- **Bestiary**: an enemy is revealed after its first kill (`enemyKillCounts`); until then it shows `enemies/unknown.png`. The detail view shows HP, zones, kill count, drop tables and a normal/shiny sprite toggle.

## Invariants & gotchas
- An enemy with `shinyDrops` needs a `-shiny.png` sprite next to its normal one (`npm run validate` checks).
- Pet entries reference sprite stems under `assets/img/enemies/`; the pet item's icon is the enemy sprite.
- `EnemyType` names map to `damageVs<Type>` stats: a new type needs a new `PlayerStat`, initial value and label.
- Quest-only drops use `requiredActiveQuestId` so they drop only while the quest is active.
- Bosses are defined by the zone (`bossEnemyId`), not by the enemy.

## Known issues
- No gold field on enemies: every kill gives 1 gold regardless of enemy.
- The harpy matriarch's plume drops on every kill and has no use.
- 11 loot items have no use (no recipe, quest, or sell action).

## How to extend
New enemy (and zone): the `add-enemy-and-zone` skill. Shiny variant and pets: the `add-shiny-variant` skill. Sprites: `/generate-2d-asset`.
