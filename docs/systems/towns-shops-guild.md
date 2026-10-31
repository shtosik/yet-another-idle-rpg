# Towns, shops and the Exploration Guild

## Purpose
Towns are non-combat hubs. Each town has **buildings**; a building holds NPCs (dialogue) or is a zone entrance. Shops and the Exploration Guild are reached through NPC dialogue.

## Key files
- `src/data/towns-data.ts:TOWNS_DATA` — per town: `regionId`, background `url`, `buildings[]` (`buildingId`, `position` of the button on the town view, `npcs` with positions, `url` background, optional `zoneId` and `questRequirement`).
- `src/enums/map/town-id.enum.ts:TownID`, `town-building-id.enum.ts:TownBuildingID`, `npc-id.enum.ts:NpcID`, `region-id.enum.ts:RegionID`.
- `src/interfaces/town.interface.ts:Town`, `TownBuilding`.
- `src/app/store/towns/towns.store.ts:TownsStore` — `selectedTownId`, `selectedTownBuildingId` (computed `selectedTownBuilding` from `TOWNS_DATA`), `activeShopId` (not saved).
- `src/app/components/game/town/towns.component.ts` — town view, building buttons, shop/building switch; `town-building/`, `npc-frame/`, `shop/`.
- `src/data/shops-data.ts:SHOPS_DATA`, `src/types/shop/shop.type.ts:Shop`/`ShopItem` — static stock: `itemId`, `tier`, `price`, `maxStock`, `refreshable`, `minRank`; per shop `currency` (gold or `explorerTokens`), `buys` (item kinds it buys) and `sellMultipliers`.
- `src/app/store/shop/shop-prices.ts:sellPrice` — what a shop pays for an item.
- `src/app/store/shop/shop.store.ts:ShopStore` — runtime stock per shop and refresh timer (`ensureShop`, `tickCooldowns`, `buyItem`); `src/types/shop/shop-state.type.ts`.
- `src/app/services/exploration-guild.service.ts:ExplorationGuildService` — task generation; task state lives in `PlayerStore` (`activeTasks`, `explorerTokens`, `totalTasksCompleted`).

## Data flow
**Navigation**: the world map's town marker calls `TownsStore.selectTown` and switches to the town tab. Clicking a building either enters its zone (`zoneId` → `BattleStore.setZone`, back to battle) or opens the building view with its NPC frames. A building with `questRequirement` is hidden until that quest has started. Leaving the tab clears the selection.

**Town view**: the town name sits top left, followed by the player's reputation tier in towns that keep reputation; building buttons highlight on hover and focus. `GameComponent` preloads every unlocked town's background and building backgrounds, so they don't pop in on first visit.

**Reputation** (`src/app/store/player/reputation.ts`, design in `docs/ideas/town-reputation.md`): `PlayerStore.reputation` saves points per `TownID`; they are never spent or lost. Only `REPUTATION_TOWNS` (La Harpar, Mawood) keep it. The tier (`ReputationTier`: Neutral 0, Friendly 50, Honored 200, Revered 600, Exalted 1500, cumulative `REPUTATION_THRESHOLDS`) is derived, never saved. Quest rewards give reputation (`quests.md`), and so do **turn-ins**: `src/data/reputation-turn-ins.ts:REPUTATION_TURN_INS` lists four givers, each taking full bundles of one drop at a flat rate, for reputation only (Bartender 20 Crab Meat and Josh 20 Feather for 10 La Harpar; Sylvie 15 Spider Silk for 15 and Brenna, `mawoodBrenn`, 10 Ancient Wood for 25 Mawood). Items the current steps of active quests need are kept back (the option says how many), and the options disappear once the town is Exalted. Each giver's hub node (Josh's is `talkReady`, after the beer) has two options, "Hand over 20 Crab Meat (have 34)" and "Hand over all full bundles", tagged with the reputation they pay; without a full bundle they show one bundle's worth, disabled. `validate` checks every giver stands in the town they credit and uses their turn-in. `npm run sim -- --reputation` prints turn-in reputation per hour and the hours to each tier. Every gain goes through `ReputationService.gain`, which calls `PlayerStore.addReputation` and shows a tier-up toast with one line per town that went up, however many tiers it crossed; `GameComponent` renders it above dialogs. The quest panel's Reputation tab lists each unlocked reputation town with its tier and a bar to the next threshold (full at Exalted), with no reward lists. Guild rank is separate: tasks never give reputation. Cheat: `dev.addReputation(townId, amount)`.

**Dialogue**: clicking an NPC portrait starts their dialogue, shown as an overlay over the building inside the town panel, so the inventory below stays visible during turn-ins. Leaving the building (or opening a shop) closes it.

**Shops**: a dialogue `shop` effect calls `TownsStore.openShop(shopId, stage)` and records the speaking NPC in the saved `npcShops` (and the stage in `npcShopStages`); from then on that NPC's frame shows a **Shop** button that opens the shop directly at that stage; the town view swaps to `ShopComponent` inline (not a modal). **Stock stages**: the effect's optional `stage` (default 0) hides items whose `minStage` is higher. Stages share one runtime stock, so two NPCs can open the same shop at different stages and an unbought unique item stays in stock at the next stage. No shop uses stages yet. `ensureShop` creates runtime stock on first visit and re-syncs (by item id) when the static list changes. Buying checks stock, Guild rank (`minRank`), the shop's currency, station order for station gear, then inventory space; it pays (gold, or `spendTokens` in a token shop), decrements stock, then adds the item (station gear installs, the Spellbook unlocks the spellbook tab instead). Shift-click buys up to 5, stopping at the first block, with one currency float for the total. Both tabs are a grid of inventory-sized slots: stock (or stack size) in the slot, price with a coin or token icon under it, name and details in the item tooltip. Buy block reasons show on the slot: red border = can't afford, lock with `R<rank>` or `Lv <level>` = Guild rank or station level missing, orange border = the item's inventory tab is full (the label and hover text name the tab), faded = out of stock; each slot's `aria-label` names the reason. A token shop's header shows the Guild rank; the token balance is in the HUD strip. The **Sell** tab lists the inventory stacks this shop buys at `sellPrice`: `value × multiplier` rounded up (item multiplier wins over type; a green price marks "Pays more", above ×1); `buys` limits the kinds, and `buys: []` hides the tab. Click sells one, Ctrl/Cmd-click the whole stack (`PlayerStore.sellItem`). Preferences: the Trader pays ×1.5 for sea catch and ×1.25 for food; Sylvie buys only resources, potions and food, ×1.5 potions and reagents; Elarion buys only resources and gear, ×1.5 runes and rare parts. Every second `tickCooldowns` counts down; at 0, refreshable items reset to `maxStock` and the timer restarts at the player's `shopRefreshCooldown`.

**Lirold**: one Building, the Arena, with the Arena Master, who takes the fee and starts Combat Arena runs (`arena.md`).

**Exploration Guild** (Marvin, La Harpar): dialogue `guild` effects/conditions drive it. **Guild rank** = `floor(totalTasksCompleted / 5)`, no cap. `acceptTask(length)` rolls a target uniformly from the regular enemies of zones that are unlocked and have `tier <= rank + 1`, and a count (short 25–50, medium 50–200, long 200–400). Reward = 1/2/3 tokens × the target zone's `tier`. Up to `maxTaskSlots` tasks at once (stat, base 1). A kill progresses every matching task, by 2 with `taskDoubleKillChance` percent (Bounty Mark). `claimTask` claims every finished task; `abandonTask` (`taskIndex`) cancels that unfinished task; Marvin lists one cancel option per task, naming its monster and kills left. Clicking a finished task in the battle nav bar opens Marvin's dialogue in the guild building (`GameNavigationService.talkToMarvin`, which also owns the open game tab). Conditions: `taskComplete` (any finished), `hasActiveTask` (any unfinished), `noActiveTask`, `hasFreeTaskSlot`, `taskInProgressAt` (`taskIndex`).

**Guild store** (`explorersGuildStore`, from Marvin's hub): priced in Explorer Tokens, buys nothing. Rank 0: mana potions, recipe scrolls, Skill Point Book; rank 1: Guild Satchel (+2 slots to each of the Gear, Consumables and Materials tabs, 1 in stock), Hunter's Feast recipe, Ambush Scroll (25 tokens, one); rank 2: Second Contract (+1 `maxTaskSlots`) and Bounty Mark (+10% `taskDoubleKillChance`), one each.

## Intended behavior (owner decisions)
- Gold spending is blocked when the player can't afford it (shops already check).
- Two tasks may roll the same monster; one kill then progresses both. Intended: a lucky roll.

## Invariants & gotchas
- `TownBuildingID` keys name the building's i18n label (`map:buildings.<key>`) and its button; a zone entrance has no `url`.
- Runtime shop items are aligned with `SHOPS_DATA[shop].items` by index after `ensureShop`; `buyItem` and refresh use the index.
- The selected town and building id are saved; `activeShopId` isn't, so a reload never reopens a shop. Selecting a town or building (including leaving the town tab, which clears both) closes the shop; selecting a town also clears the building.

## Known issues
- The town picker hard-codes La Harpar; other towns are reached only from the world map.
- Guild store upgrades use placeholder icons (silk, letter, gnoll trophy).
- Gold shop prices weren't re-tuned after the zone rescale: late-zone income makes the 5000-gold items cheap.
- The shop template calls `buyBlockReason(i)` per item per change detection; buy logic lives in the component.

## How to extend
New building: the `add-town-building` skill. New shop: the `add-shop` skill. New guild task type: extend `GuildEffect`/`GuildCondition` (see `dialogue.md`) and `ExplorationGuildService`.
