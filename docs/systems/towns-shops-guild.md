# Towns, shops and the Exploration Guild

## Purpose
Towns are non-combat hubs. Each town has **buildings**; a building holds NPCs (dialogue) or is a zone entrance. Shops and the Exploration Guild are reached through NPC dialogue.

## Key files
- `src/data/towns-data.ts:TOWNS_DATA` — per town: `regionId`, background `url`, `buildings[]` (`buildingId`, `position` of the button on the town view, `npcs` with positions, `url` background, optional `zoneId` and `questRequirement`).
- `src/enums/map/town-id.enum.ts:TownID`, `town-building-id.enum.ts:TownBuildingID`, `npc-id.enum.ts:NpcID`, `region-id.enum.ts:RegionID`.
- `src/interfaces/town.interface.ts:Town`, `TownBuilding`.
- `src/app/store/towns/towns.store.ts:TownsStore` — `selectedTownId`, `selectedTownBuilding`, `activeShopId`.
- `src/app/components/game/town/towns.component.ts` — town view, building buttons, shop/building switch; `town-building/`, `npc-frame/`, `shop/`.
- `src/data/shops-data.ts:SHOPS_DATA`, `src/types/shop/shop.type.ts:Shop`/`ShopItem` — static stock: `itemId`, `tier`, `price`, `maxStock`, `refreshable`.
- `src/app/store/shop/shop.store.ts:ShopStore` — runtime stock per shop and refresh timer (`ensureShop`, `tickCooldowns`, `buyItem`); `src/types/shop/shop-state.type.ts`.
- `src/app/services/exploration-guild.service.ts:ExplorationGuildService` — task generation; task state lives in `PlayerStore` (`activeTasks`, `explorerTokens`, `totalTasksCompleted`).

## Data flow
**Navigation**: the world map's town marker calls `TownsStore.selectTown` and switches to the town tab. Clicking a building either enters its zone (`zoneId` → `BattleStore.setZone`, back to battle) or opens the building view with its NPC frames. A building with `questRequirement` is hidden until that quest has started. Leaving the tab clears the selection.

**Shops**: a dialogue `shop` effect calls `TownsStore.openShop(shopId)`; the town view swaps to `ShopComponent` inline (not a modal). `ensureShop` creates runtime stock on first visit and re-syncs (by item id) when the static list changes. Buying checks stock, gold, station order for station gear, then inventory space; it deducts gold, decrements stock, then adds the item (station gear installs, the Spellbook unlocks the spellbook tab instead). Every second `tickCooldowns` counts down; at 0, refreshable items reset to `maxStock` and the timer restarts at the player's `shopRefreshCooldown`.

**Exploration Guild** (Marvin, La Harpar): dialogue `guild` effects/conditions drive it. `acceptTask(length)` rolls a target monster from the regular enemies of the player's unlocked zones and a count (short 25–50, medium 50–200, long 200–400; reward 1/2/3 explorer tokens). One active task at a time. Kills of that monster progress it; `claimTask` pays tokens and counts the completion.

## Intended behavior (owner decisions)
- Gold spending is blocked when the player can't afford it (shops already check).

## Invariants & gotchas
- `TownBuildingID` keys name the building's i18n label (`map:buildings.<key>`) and its button; a zone entrance has no `url`.
- Runtime shop items are aligned with `SHOPS_DATA[shop].items` by index after `ensureShop`; `buyItem` and refresh use the index.
- `activeShopId` and the selected building are saved, so a shop can reopen after reload.

## Known issues
- The town picker hard-codes La Harpar; other towns are reached only from the world map.
- `explorerTokens` and `totalTasksCompleted` are never spent or read; Marvin promises unlocks every 5 completions.
- Shop prices (2500–5000 gold) are far above income at 1 gold per kill.
- The shop template calls `buyBlockReason(i)` per item per change detection; buy logic lives in the component.

## How to extend
New building: the `add-town-building` skill. New shop: the `add-shop` skill. New guild task type: extend `GuildEffect`/`GuildCondition` (see `dialogue.md`) and `ExplorationGuildService`.
