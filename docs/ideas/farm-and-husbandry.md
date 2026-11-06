# The Farm (Farming Guild)

**Scope:** M-L · **Status:** Accepted (owner decisions recorded 2026-11-05 and 2026-11-06; names are placeholders)

A farm on the world map, run by a **Farming Guild**, where the player plants seeds that monsters drop, waits in real time and harvests ingredients for Cooking and Alchemy. Farming is the game's first **profession**; its level is called **Farming expertise** (§7a). Farming only in v1: husbandry (animals) is a later expansion (§11).

> **Ownership.** This doc owns the player-facing behaviour (rules, numbers, text). [`seed-storage.md`](seed-storage.md) owns how seed storage is implemented and must follow §9b (unlimited counts, silent collection before the unlock, receipts after it, no prestige dependency).

> Replaces the earlier three-concept draft (see §12). This doc changes `gathering-skills.md`'s Farming (§10). `north-lirold-and-exploration-guild.md` and `la-harpar-quests.md` are proposed drafts; lines citing them are conditional.

## 0. What exists today

| Fact | Source |
|---|---|
| No farm location, marker, text or NPC exists in data or locales. | `world-map-data.ts`, `map.json`, `towns-data.ts`, all locales |
| The world map is 3072×2048; the Mountain Pass marker is at (1400, 600), The Long Path (940, 480), Deepwood (2000, 430), Elderwood Wilds (2080, 620). The farm sits at **~(1400, 400)**, 200 px north of the Pass, on terrain that is only painted today (owner decision). | `src/data/world-map-data.ts`, owner |
| Map tab: Town markers on the map plus a collapsible **Towns** list (`towns__list`) of every unlocked Town; a Town also appears in the list without a marker. A click opens the Towns tab. | `world-map.component.html`, `world-map.component.ts` `unlockedTowns`, `openTown` |
| Unlocked content is saved as `unlockedContent: { zones, towns, … }`; `UnlockService` rules grant it. | `player.store.ts`, `unlock-conditions.ts` |
| Reputation exists for La Harpar and Mawood only (`REPUTATION_TOWNS`), five tiers (Neutral 0, Friendly 50, Honored 200, Revered 600, Exalted 1500). Shops gate stock by `minReputation`; NPCs hand reputation bundles over (`REPUTATION_TURN_INS`, one item per NPC). | `store/player/reputation.ts`, `shops-data.ts`, `data/reputation-turn-ins.ts` |
| Apples drop from the Corrupted Sapling and sell at La Harpar (25 g). Cheese drops from Rat and Giant Rat **and is sold at La Harpar from Honored (30 g)**. Alchemy 1 already makes Minor Mana Potion (vial + apple) and **Greater Mana Potion** (vial + 3 spider silk). | `shops-data.ts`, `recipes-data.ts` |
| Camp stations: data allows Cooking 3 and Alchemy 2, but the only station gear that exists reaches **Cooking 2 and Alchemy 1**. Names: Cooking 1 Fire Pit, 2 Cooking Pot, 3 Smoking Rack; Alchemy 1 Mortar & Pestle, 2 Alembic. The farm adds **no station upgrades** (owner decision), so every farm recipe needs Cooking 1-2 or Alchemy 1. | `stations-data.ts`, `station-items.data.ts`, `camp.json` |
| The Exploration Guild is the only guild: Marvin (La Harpar), proposed move to Lirold under Guildmaster Odile Varrow. Its rank is separate from reputation. | `docs/lore/factions.md`, `GLOSSARY.md` |
| The black sap appeared 2 years ago. *Silk and Water* starts after *The Sap That Burns* only; the Gnarled Treant dies in the later *Blighted Heart*, so at the farm's unlock the Treant is **alive** and the blight is not beaten. | `Corwin#aboutMawood`, `quests-data.ts` (`silkAndWater`, `theBlightedHeart` start requirements) |
| Quests cannot repeat, cool down or pick random items: a completed quest stays at step 9999. Precedents: the Arena's wall-clock cooldown (`arenaReadyAt`), Chests' saved rolls (`rolledChests`). | `docs/systems/quests.md`, `docs/systems/arena.md`, `player-stats-inventory-equipment.md` |
| The Arena Chest (`ItemID.arenaChest`) rolls 4 weighted entries (gold, silk, feathers, wood, potions, runes, recipes, pets). | `src/data/items/rewards-items.data.ts` |
| Town view: background, one button per Building; a Building shows its NPC frames; dialogue and shop overlay it; inventory stays visible. | `towns.component.html`, `town-building/`, `npc-frame/` |
| Quest steps the system checks: `item`, `stat`, `enemy` kills, `wave` kills, `quest`, `reputation`; talk steps have `requirements: []`. | `docs/systems/quests.md` |

## 1. The story

North of the Mountain Pass, where the road bends toward the Elderwood, a terraced valley is fed by a spring that the blight never reached. It belongs to the **Farming Guild**, an old fellowship of growers who keep seed lines the way smiths keep forges: pure, labelled and passed hand to hand. Two winters ago the black sap crept through the Spires, and the Guild's seed vaults went quiet; half the lines sprouted black. They stopped trading and closed the gate on strangers.

The blight is not beaten; the gate opens anyway. Sylvie, a correspondent of the Guild for years, writes that a fighter has been carrying her silk and clean water through the worst of the Elderwood, and the Guild's seed lines are failing. They don't want a hero, they want hands: monsters carry wild seed in their gullets and fur, and the Guild needs someone who is already out there fighting to bring it back. The player brings seeds and grows them on the Guild's terraces; the Guild teaches, sells a few and pays in reputation.

The Guild fits the existing threads: it is a fresh witness to T-08 (what changed 2 years ago), and it gives Mawood's shortage of food a cause.

**Name check.** "Farming Guild" is a placeholder. `GLOSSARY.md` marks "Guild (alone)" as *Avoid* because it means the Exploration Guild. The Farming Guild must always be written in full, with its own Terms (below); it has no ranks, no tokens and no contracts, only **reputation**. Alternative names if "Guild" is confusing: Growers' Circle, Tillers' Hall.

## 2. The Site: a new kind of place

The farm is neither a Zone (no combat) nor a Town (no Buildings screen). It needs a new term.

**Proposed name: Site** (`SiteID`): *a non-combat place with one purpose, a home screen and a panel, reached from the map or the Sites list.* The Sites list will hold later shortcuts (a mine to quarry, a shrine, a market). It fits `GLOSSARY.md`: Town, Building, Zone and Region are taken; "location", "area" and "map" are on their *Avoid* lists. Label in the UI: **Sites**.

| What | How the farm uses it |
|---|---|
| Data | `src/data/sites-data.ts`: `{ id: SiteID.farm, regionId: RegionID.portStocksmar, url, npcs: TownBuildingNpc[], gate: { position }, marker }`. Region is La Harpar's (owner decision 2026-11-06). |
| Map marker | A new marker kind `site` in `world-map-data.ts` at `(1400, 400)`, `minZoom: 2`, shown once unlocked; click opens the Site (`GameTab.farm`). |
| Shortcut list | A second collapsible list on the map tab, beside **Towns**: `sites__list`, filled by `unlockedSites` (a copy of `unlockedTowns` in `world-map.component.ts`, reading `unlockedContent().sites`). It lists a Site even without a marker, as Towns without a marker already are. Hidden while empty. |
| Unlock | A dialogue effect `unlockSite` (proposed; `/add-dialogue-effect`) fires during the first quest, plus a popup `unlocks.json` `sites.farm`. Fallback without code: a `hasItem` rule on a Guild Letter. |
| Save | `unlockedContent.sites: SiteID[]`, handled like `towns` in `PlayerStore` (`applyUnlockTarget`, `isUnlocked`). |

### The Site view (first screen) reuses the Town view

Today (`towns.component.html`, `town/`): a Town opens as `town-view` (a background image, a name, a tier tag, one `building-btn` per Building at a `%` position, a close button). Selecting a Building swaps in `app-town-building` (the Building's background plus an `app-npc-frame` per NPC at `%` positions), with a close button, an `app-dialogue` overlay on top and `app-shop` inline. The Towns tab sits in the grid at columns 2-3, row 1, so the inventory (row 2), the equipment and the quests panel stay visible while the player talks and hands items over.

The farm's first screen is the same thing:

| Part | Reuse |
|---|---|
| Farm-ish background | `Site.url`, set as `backgroundImage` like `town-view` / `app-town-building`. |
| NPC portraits | `app-npc-frame` per `TownBuildingNpc` (`{ id, position }`); `app-town-building` already renders them from a `TownBuilding` (`npcs`, `url`). |
| Dialogue and shop | `app-dialogue` overlay and inline `app-shop` exactly as in `towns.component.html` (Marta's seed shop). |
| **One button: the Gate** | A `building-btn`-styled button at `gate.position` (`%`), labelled "Gate" (`map:sites.farmGate`). Click swaps to the plots panel. |
| Footprint | `.farm-home` joins `.towns` in `game.component.sass`: columns 2-3, row 1, inventory in row 2, equipment and quests in column 4. |

The plots panel is the second screen and uses the map's footprint (§5). Close on the plots panel returns to the farm home; close on the farm home returns to the map (`goToMap`).

**What a Site view needs that a Town view lacks:**
1. A `Site` data type and `SITES_DATA` (a Town has `buildings`; a Site has `npcs` plus a `gate`). `TownBuildingNpc` is reused as is.
2. `app-town-building` takes a `TownBuilding`. Either give the Site a `TownBuildingID.farmyard` and pass a built `TownBuilding` (smallest change), or loosen the input to `Pick<TownBuilding, 'npcs' | 'url'>`.
3. Selection state. `TownsStore` saves `selectedTownId` and `selectedTownBuildingId` and the NPC frames and dialogue read through it (`towns.store.ts`). **Verify** that an NPC frame works with no selected Town; if not, add `selectedSiteId` there, or host the dialogue and shop in a `SiteComponent`.
4. **Site destination (first-class).** `NpcPlace` is `{ npcId, townId, buildingId }` and `GameNavigationService.talkTo(townId, buildingId, npcId)` requires both IDs. Change to a union: `NpcPlace = { kind: 'town'; npcId; townId; buildingId } | { kind: 'site'; npcId; siteId }`. `npcPlace(npcId)` scans `TOWNS_DATA`, then `SITES_DATA`. `talkTo(place)` takes the union (`talkToMarvin` updates): for a site it closes any shop, sets the farm stage to `home`, sets `GameTab.farm` and starts the dialogue. The quest panel's link reachability (`quest-list.component.ts`: `isTownUnlocked(giver.townId)` today) becomes `place.kind === 'site' ? isSiteUnlocked(place.siteId) : isTownUnlocked(place.townId)`. NPC frames already emit NPC and shop IDs without needing a Town, so they are reused as is.
5. NPC portraits in the NPC data for `farmWarden` and `farmDrover`; shop and `npcShops` bookkeeping unchanged.
6. A tab: `GameTab.farm` with two stages (`home`, `plots`). **Reload:** the active tab is transient (`GameNavigationService.tab` is not saved), so a reload opens the default tab, not the farm; the stage is not saved either. Plots, seeds and cooldowns are saved and unaffected.

## 3. The Farming Guild (NPCs)

Two members, reworked from the earlier draft's Marta and Wick to give the Guild two **order** givers (§4a): one wants farm produce, the other wants animal materials. Names are placeholders; portrait briefs go to `docs/character/farm/` once accepted.

| Name / `NpcID` | Role | Wants | Personality | Voice |
|---|---|---|---|---|
| **Warden Marta Tillbrook** / `farmWarden` | Guild head on the terraces; chain quest giver; runs the seed shop; **order giver for farm resources** (crops, never seeds) | The Guild's larder and cellar full again | Blunt, sunburnt, counts in seasons; closed the gate after the sap and doesn't apologise for it; warms slowly | Short sentences. Calls the player "walker". *"Dirt doesn't care how brave you are."* *"Rats don't make cheese, walker. They steal it."* (the one cheese joke, so the Rat drop makes sense) |
| **Wick** / `farmDrover` | The Guild's drover and tanner's boy; **order giver for animal resources** already in the game (hides, fangs, feathers, silk, bone) | Bedding, tack, fence charms and everything else the wild leaves lying around | Fifteen, shy, labels everything, brave only about animals; hasn't kept a herd since the sap (the herds were lost, so husbandry in §11 is his later arc) | Trails off. *"Pelts for the, um, saddle blankets. And fangs. For the fence."* *"The herd's gone. I keep the tack oiled anyway."* |

Existing NPCs in the chain: **Sylvie** (Mawood apothecary) starts it, **Corwin** gets one closing line. Sylvie's voice: warm, talkative, *"I know I talk a lot"*.

## 4. Quest chain

QuestIDs continue after the last shipped quest. Reward scale: matched to *Silk and Water* (800 XP, 150 gold, one Skill Point Book) for the small steps; the finale to *The Blighted Heart* halved. At tier 4-5 these are modest; the farm pays in items and reputation. Balance is the main thread's call (`npm run sim`). These six are ordinary one-time quests (the level gates use a `professionLevel` requirement, §7a); the repeatable **Guild orders** are §4a.

| ID | Giver | Where | Start gate | Steps | Clue or item source | Rewards |
|---|---|---|---|---|---|---|
| `seedsFromTheTerrace` — **Seeds from the Terrace** (proposed) | Sylvie | Mawood, then the farm | `silkAndWater` completed | 1. Talk to Warden Marta at the farm. | Start result gives the Guild Letter and unlocks the farm (`unlockSite`) and the Farming profession at expertise 1 (`unlockProfession`). Marta's turn-in is the "meeting the Guild" scene on the farm home screen. | 600 XP, 100 gold, Farming Guild reputation 10, 5 Turnip Seeds |
| `theFirstFurrow` — **The First Furrow** (proposed) | Marta | Farm | `seedsFromTheTerrace` completed | 1. Bring 4 `turnip`. | Turnip and Wheat have no other source in v1, so the step is only met by planting; Marta says how. Turnip Seeds from the previous reward; she sells more. The plant-wait-harvest tutorial (§6). | 800 XP, 150 gold, Guild reputation 15, 30 Farming XP, 5 Wheat Seeds (plantable at Farming expertise 2). Opens Marta's order. |
| `wheatForTheGuild` — **Wheat for the Guild** (proposed) | Marta | Farm | `theFirstFurrow` completed | 1. Bring 10 `wheat`. | Wheat Seeds from the reward; more from Plains slimes. Teaches that plots run in parallel. | 800 XP, 150 gold, Guild reputation 25 (Friendly reached), 100 Farming XP, Farmer's Bread recipe scroll. Opens Wick's order. |
| `silverleafForSylvie` — **Silverleaf for Sylvie** (proposed) | Sylvie | Mawood | `wheatForTheGuild` completed and Farming expertise 5 | 1. Bring 6 `silverleaf`. | Silverleaf Seeds drop from Deer on The Long Path (and the Arena Chest). | 1000 XP, 200 gold, Mawood reputation 25, Guild reputation 15, 400 Farming XP, Silverleaf Tonic recipe scroll |
| `anOrchardAgain` — **An Orchard Again** (proposed) | Marta | Farm | `silverleafForSylvie` completed and Farming expertise 8 | 1. Bring 12 `apple`. | Any source counts (the shop sells apples); Marta's offer says the Guild wants them from its own trees and gives the Apple Seeds lead (Goats on the Mountain Pass). | 1200 XP, 250 gold, Guild reputation 40, 1500 Farming XP, **+1 plot** |
| `theGrowersTable` — **The Growers' Table** (proposed) | Marta | Farm | `anOrchardAgain` completed **and Farming Guild Honored** | 1. Bring 5 `turnipStew` and 5 `harvestPie`. | Cooking at the Fire Pit and the Cooking Pot. Harvest Pie's recipe is **sold by Marta at Honored**; her offer node says so ("Honored folk get my pie recipe, walker."). | 2500 XP, 500 gold, Skill Point Book, Guild reputation 60, 3000 Farming XP, **+1 plot**; one closing line from Corwin |

**Reputation before the finale** is 10 + 15 + 25 + 15 + 40 = 105; Honored is 200, so the player needs about 95 more from **orders** (roughly a dozen at 6-10 reputation each, about a week of regular play). That is intended: orders are required progression, not a top-up.

### Clue beats
- **Seeds from the Terrace:** the Guild closed the gate two winters ago when its seed lines turned black. Sylvie vouching for a fighter who brings her silk and clean water is why the Guild lets one stranger in.
- **The First Furrow:** a turnip is a minute of patience times fifteen; Marta lets the player eat the first one.
- **Wheat for the Guild:** the Guild needs wild seed; monsters carry it. The player is the supply line.
- **Silverleaf for Sylvie:** the apothecary's herb shelf is thin; a field can fill it, and the black-bark herb lines were burned.
- **An Orchard Again:** the Guild's orchard burned in the sap winter. Planting apples is the Guild saying it is open again. (The sapling that drops apples is blighted: the tree doing the harm now feeds the cure.)
- **The Growers' Table:** Marta cooks for the first time in two years, and the player's hands made the meal.

## 4a. Guild orders and the turn-in cooldown

After the early chain, each of the two NPCs gives a repeatable **Guild order**: one quest each, `marthasOrder` and `wicksOrder` (proposed), with the same dialogue hub as any quest giver. An order asks for **a random item from a pool, in a random amount of 10 to 20**. Completing it starts **that order's own** 2 h cooldown.

### The general turn-in cooldown (every turn-in has its own)

Owner decision (2026-11-06): the cooldown starts **when the player turns in**, lasts **2 hours**, and belongs to **the individual turn-in**, not to the NPC. A turn-in to Marta never blocks Wick, and Marta's order never blocks Marta's other turn-ins either.

**Key shape.** `TurnInKey = `order:${QuestID}` | `bundle:${NpcID}:${ItemID}``. Examples: `order:marthasOrder`, `order:wicksOrder`, `bundle:laHarparBartender:crabMeat`, `bundle:mawoodSylvie:spiderSilk`. Today each reputation NPC has exactly one bundle, so there is one key each; an NPC with two bundles later gets two keys.

**What it covers.**

| Existing thing | Today | With the cooldown |
|---|---|---|
| One-time quests (`QUEST_DATA`, all shipped; step 9999 forever) | Never repeat | **Unchanged.** No cooldown, never blocked by one. |
| `REPUTATION_TURN_INS`: Bartender (Crab Meat, 20 for 10 rep), Josh (Feather, 20 for 10 rep), Sylvie (Spider Silk, 15 for 15 rep), Brenna (Ancient Wood, 10 for 25 rep) | Repeatable at once, one bundle or every full bundle held, until the town is Exalted | **Covered, and the "all" option is removed** (owner decision): each turn-in hands over **one bundle** and starts that bundle's cooldown. |
| New Guild orders | Don't exist | Covered; the reason for the mechanism. |
| The Arena (30 min entry cooldown), shop refresh, Exploration Guild tasks | Own timers | **Not touched.** They aren't turn-ins. |

**What changes for bundles (a nerf).** `dialogue.md` "Effects (reputation turn-in)": the effect becomes `{ type: 'reputationTurnIn', npcId }` with no `bundles: 'one' | 'all'`; `DialogueManagerService.turnIn` returns at most one bundle; the shared response keys `turnInOne`/`turnInAll` collapse to one; `turnInBundles` in `reputation-turn-ins.ts` loses the `all` case; the four NPC trees lose their "hand over all" option; `reputation-turn-in.spec.ts` and `scripts/sim-economy.mjs` (`repPerHour`) follow. `town-reputation.md` "Turn-ins" (two options, "target 15-25 h to Exalted") changes to one option and a ceiling of one bundle per 2 h per NPC, so its pacing targets and thresholds need re-tuning with `npm run sim`. Before the change a 34-Crab-Meat stack paid 10 reputation at once and the rest later; now each 2 h gives 10 at most. Accepted by the owner.

**Farming XP.** Every **farm** turn-in (Marta's and Wick's orders) grants Farming expertise XP (§7a). The four existing non-farm bundles (Bartender, Josh, Sylvie, Brenna) do **not** give Farming XP: only Farming Guild turn-ins do (owner decision, settled).

**What changes in data.**
- A global `TURN_IN_COOLDOWN_MS = 2 * 60 * 60 * 1000` in one definition table keyed by `TurnInKey` prefix, with an optional per-entry `cooldownMs` override (`0` = none). One definition, no per-NPC and per-turn-in conflict.
- Quest data gains `repeat?: { pool: OrderEntry[]; picks: number }`. `OrderEntry = { itemId, minTier: ReputationTier, reputationPer10, goldPerItem, xpPerItem }`; the amount is rolled 10-20 for every entry. Wick's entries also carry `sourceZones: ZoneID[]`.

**What changes in state** (saved, in `QuestsStore` unless noted).
- `lastTurnInAt: Partial<Record<TurnInKey, number>>` (epoch ms). Written on every successful order completion and bundle turn-in.
- Ready time is **computed, not stored**: `lastTurnInAt[key] + TURN_IN_COOLDOWN_MS × (1 − turnInCooldownReduction)` (§9a). A stat gained later shortens a running cooldown at once; the reduction is capped at 75% so a cooldown never reaches zero.
- `orders: Record<QuestID, { requirements: { itemId, amount }[]; rewards: { reputation, gold, farmingXp } }>`: the **picked requirements and every base reward together**, written when the order starts (below). `questCompletions: Record<QuestID, number>` records completion history.
- Wall time (`Date.now()`), so it runs while the game is closed. A changed system clock moves it, as in the Arena (accepted there, `arena.md`). A negative elapsed time counts as no time passed.

**The completion contract** (finding 2 of the Codex review). A repeatable order must behave the same through every route:
1. **Start rolls and saves.** The `quest start` result rolls the pick (pool entries whose Guild tier the player meets and, for Wick, whose source zone is unlocked; one entry; an amount `10..20`), computes the **base** rewards from the entry (`reputation = ceil(amount / 10 × reputationPer10)`, `gold = amount × goldPerItem`, `farmingXp = round(amount × xpPerItem)`) and **persists `orders[questId]` at once** with `saveGameStateNow` (the `rolledChests` pattern), so a reload can't re-roll. Multiplier stats (`farmXpMultiplier`) are applied at completion, not stored.
2. **One completion function.** `QuestsStore.completeOrder(questId, now)` is the only place an order ends. Every route calls it: the dialogue turn-in result (`advanceQuest`), `endQuest` and any later route. It rechecks (a) the order is active, (b) the player holds the saved `requirements` after reservations, and (c) the order's own cooldown key is ready (it cannot be cooling while the order was startable, but cheats, clock changes and loaded saves make the recheck cheap insurance).
3. **A rejected completion changes nothing:** no items taken, no rewards, no cooldown written, the pick and the order stay.
4. **A successful completion is atomic:** it takes the items, grants the stored rewards (reputation, gold, Farming XP × (1 + `farmXpMultiplier`), through `updatePlayerStats`/`applyProfessionXp`), writes `lastTurnInAt[key] = now`, increments `questCompletions`, clears `orders[questId]`, sets the step back to `undefined` and persists, in one state update.
5. **Reservations.** `DialogueManagerService.turnIn` keeps back what the current steps of active quests need so a bundle can't consume it. It must include the **picked requirements of active orders** (`getStepItems` reads `orders[questId].requirements` for the `pickedItems` requirement), so Sylvie's Spider Silk bundle can't eat the silk of an active Wick order.
6. **Order rewards contain no items** (reputation, gold, XP), so no inventory-capacity check applies.

**What changes in the quest system** (`quests.md`: no repeat, no cooldown, no random pick today).

| New | What |
|---|---|
| `repeat` field | On a quest: it can be started again after completion. |
| Requirement variant | A step requirement `{ type: 'pickedItems' }`: the items are `orders[questId].requirements`. `requirementProgress`, `canAdvanceQuest`, `getStepItems`, the quest panel text ("Bring 14 Turnip") and the dialogue requirement labels read it. |
| Availability | `QuestState.available` is false while that order's cooldown key is cooling. |
| Dialogue | New condition `{ type: 'turnInCooldown', key, state: 'ready' | 'cooling' }` (`/add-dialogue-effect`): the order offer and the bundle option fall back to a "come back later" node while cooling, like Ludo's cooldown node. |
| Validate | Pool items exist, no pool item is a seed or a farming tier above 2, a Neutral entry exists, Wick's entries have a source zone. |

**What changes in the UI: one timer per turn-in.**
- **Dialogue:** each turn-in option shows its own disabled tag ("Ready in 1 h 12 m", same style as "N more gold needed"): Marta's order, Wick's order, each bundle.
- **NPC frame** (`npc-frame`): a badge with the **soonest** ready time when **all** of that NPC's turn-ins are cooling; hidden when at least one is ready. One shared 1 s signal (the `ShopStore.tickCooldowns` pattern).
- **Quest panel:** a running order shows like any quest; a cooling order's row says "Ready in …".
- **Quest completed modal:** names the cooldown ("Marta's next order in 2 h").

**The cooldown stat.** A derived `PlayerStat`, `turnInCooldownReduction` (§9a), first granted by expertise milestone 20.

Alternative (not chosen): a separate "orders" store like the Exploration Guild's tasks. It avoids touching `QUEST_DATA`, but the owner asked for turn-in quests, and the quest panel, "Talk to" link and rewards modal already exist.

### Marta's order: farm resources (crops, never seeds)

**What "higher tier" means (owner decision 2026-11-06).** Orders ask only for **tier 1-2 crops** (Turnip, Wheat), the two crops whose seeds the Guild sells. Tier 3 and above are drop-only seeds that a player may never have found, so no order depends on them. One pick per order; amount 10-20.

| Unlocks at Guild tier | Crop | Amount | Reputation per 10 | Gold per item | Farming XP per item |
|---|---|---|---|---|---|
| Neutral | Turnip | 10-20 | 4 | 3 | 1.5 |
| Friendly | Wheat | 10-20 | 7 | 6 | 3 |

At Exalted reputation no longer rises, so orders pay **gold plus Farming XP**. Reputation per order is 4-8 for Turnip and 7-14 for Wheat; with the chain's own reputation it carries the player to Honored (§4). First guesses for `npm run sim`.

### Wick's order: animal resources already in the game

One pick per order; amount 10-20. Drops of existing enemies, tiered by Zone. An entry is eligible only if **both** hold: the Guild tier is met **and** at least one of its source Zones is unlocked (`unlockedContent().zones`, as Exploration Guild tasks already filter targets). The pick is saved; unlocking another Zone later affects future orders only. Overlap with La Harpar's bundles (Crab Meat, Feather) is accepted (owner decision).

| Unlocks at Guild tier | Item (existing) | Source Zone (tier) | Reputation per 10 | Gold per item | Farming XP per item |
|---|---|---|---|---|---|
| Neutral | Feather | Horseshoe Beach (1) | 4 | 3 | 1.5 |
| Neutral | Crab Meat | Horseshoe Beach (1) | 4 | 3 | 1.5 |
| Neutral | Rat Tail | Trader's Basement (1) | 4 | 3 | 1.5 |
| Friendly | Turtle Shell | Horseshoe Beach (1) | 7 | 6 | 3 |
| Friendly | Wolf Fangs | The Long Path (3) | 7 | 6 | 3 |
| Friendly | Deer Pelt | The Long Path (3), Mountain Pass (4) | 7 | 6 | 3 |
| Friendly | Venison | The Long Path (3), Mountain Pass (4) | 7 | 6 | 3 |
| Honored | Spider Silk | Elderwood Wilds (5) | 10 | 10 | 6 |
| Revered | Bear Pelt | Deepwood (6) | 14 | 20 | 10 |
| Revered | Bone Fragment | Deepwood (6) | 14 | 20 | 10 |
| Revered | Elder Silk | Deepwood (6) | 14 | 20 | 10 |
| Exalted | Harpy Feather | Upper Canopy (7) | 0 | 25 | 16 |

Chest-only or quest-only items (Ancient Wood for *Raw Materials*) are left out on purpose.

## 5. The farm panel (plots UI)

`game.component.html` renders one component per tab inside a four-column grid (`game.component.sass`: `grid-template-columns: 1fr 24rem 24rem 1fr`, `grid-template-rows: 20rem 25rem`). Column 1 is the battle panel (rows 1-2). The Towns tab takes columns 2-3, row 1; the map takes **columns 2-3, rows 1-2** (`.map { grid-column: 2 / span 2; grid-row: 1 / span 2; padding: 0 }`), about 48 rem by 45 rem. On the map tab `game.component.html` still renders the equipment and quests panels (column 4); the inventory cell sits under the map in the same grid rows.

The farm's **home** screen (§2) uses the Towns footprint. The **plots panel** uses exactly the map's footprint: `<app-farm-plots class="farm"/>`, `.farm` joins `.map`'s rule. Column 4 shows the **equipment and quests panels**, exactly as on the map tab (owner decision 2026-11-06), so the quests panel tracks the running order and chain step, and the player can swap the pet.

| Region of the panel | Contents |
|---|---|
| Header | Farm name, Farming Guild reputation tier and bar (same bar as the Reputation tab), plot count "5 / 9", a **Farming expertise bar** (level, XP bar, "next: Wheat Seeds at expertise 2", §7a), a close button (back to the farm home). |
| **Seed list (left side strip)** | The seeds in the farming state (`PlayerState.farm.seeds`, not the inventory), one row each: icon, name, count, grow time, yield. **Click a seed to make it active** (highlighted; the plot cursor shows the seed). A seed above the player's Farming level is shown locked, with "Requires Farming expertise 5", and can't be activated. **Click an empty plot to plant** one of the active seed. The seed stays active while the player has any left; it deselects itself at 0, or when clicked again. Replaces the earlier picker design. No seeds held: the strip says so and names the sources (§7). |
| Plot grid | **3 plots at the start**, up to **9** in a 3×3 grid (fits the footprint). An empty plot shows "Plant"; a growing plot shows the crop, a progress bar and time left; a ready plot shows "Harvest" (click to harvest it). |
| Footer | **Plant all** and **Harvest all** buttons, locked until their reputation tier (below). |

**Plant all** fills every empty plot with the active seed (stops when the seeds run out). **Harvest all** harvests every ready plot, stopping at the first tab that is full.

| Convenience | Unlocks at Farming Guild tier | Why |
|---|---|---|
| Harvest all | Friendly (50) | It is the first thing a player with 4 plots wants, and Friendly is reached by the first three quests. |
| Plant all | Honored (200) | The second convenience; by Honored the player has 6 plots and several seeds. |

Locked buttons show a lock and the requirement ("Requires Farming Guild Friendly"), the same text as `reputationLockText`.

**Plot count:** `3 + reputation tier index (Friendly +1, Honored +1, Revered +1, Exalted +1) + completed plot-granting quests (An Orchard Again, The Growers' Table)`, capped at 9. Derived, never saved.

Behaviour rules: seeds are consumed when planted unless the seed-save chance spares one; harvest adds crops to the inventory and is **blocked** when a tab has no room (the plot stays, no XP, §8 rules), with the usual "1 Materials slot needed" tag (`missingSlots`); the player can leave, fight or go offline while plots grow.

## 6. Tutorial beats

1. **Meet the Guild** (`seedsFromTheTerrace`): arrive on the farm home screen: the background, Marta's and Wick's portraits and the Gate button. Marta's first-meet node; the "Farm Discovered" popup has already shown at the unlock.
2. **Plant** (`theFirstFurrow`): Marta: "Through the gate, walker. Empty plot, number one." The Gate button pulses until used once; inside, the seed list highlights the Turnip Seeds row, then the first plot.
3. **Wait:** Marta: "Fifteen minutes. Go and hit something." The quest panel shows `Bring 4 Turnip (0)`; the plot timer runs in the plots panel.
4. **Harvest:** a Ready tag; click harvests, and the Farming expertise bar fills (first XP). The turn-in node opens when Marta is spoken to.
5. **Parallel plots** (`wheatForTheGuild`): the quest needs more than one plot's yield in a reasonable time, so the player plants wheat in one plot and turnips in another.
6. **Orders** (after `theFirstFurrow`): Marta mentions her order; the first one asks for a Neutral crop, so the player already has some. The 2 h cooldown is told in the dialogue ("Come back in two hours, walker.") and shown as a badge on her portrait.
7. **Unlock Harvest all** at Friendly: a toast on the tier-up, and the footer button unlocks.

## 6a. First visit: Marta covers the seeds the player already carries

**Who:** the Guild's Warden Marta on the first visit to the farm (pick; Sylvie's letter-giving node only adds one line: *"Keep anything that looks like seed, dear. The Warden will want to see it."*). Marta is the first person on the farm and owns the plots, so the seed list opens right after.
**Node:** `farmWarden` first-meet `intro1`, then `introSeeds` (new) or `introNoSeeds` (new). Needs **a condition `farmSeeds`** (`{ type: 'farmSeeds', atLeast: 1 }`, proposed; reads `farm.seeds`; `/add-dialogue-effect`).

### intro1
**Shown when:** flag `met_farmWarden` not set
> The gate's open because Sylvie vouches for you. Don't make her regret it.

1. "Sylvie said you could teach me to farm." → introSeeds (only if `farmSeeds` at least 1)
2. "Sylvie said you could teach me to farm." → introNoSeeds (otherwise)

### introSeeds (new)
> I see you already found some seeds on your journey, walker. Monsters carry wild seed in their gullets and fur, a few in every dozen. Everything that stuck to you since the beach went into the Guild's tally. It doesn't weigh on your pack.

1. "I never noticed any seeds." → introSeedsWhy
2. "Show me." → introGate · effect: set flag `met_farmWarden`, pulse the Gate button
3. "Tell me about the Guild." → aboutGuild

### introSeedsWhy (new)
> You wouldn't. A seed's small and a fight's loud. Go on through the gate; the list on the left of the plots is your tally. Slimes, gulls, deer, goats: they all carry some.

1. "Show me." → introGate · effect: set flag `met_farmWarden`

### introNoSeeds (new)
**Shown when:** no seeds counted
> Nothing in the tally yet. Monsters carry wild seed, a few in every dozen, and the tally follows you. Meanwhile I sell turnip seed, twenty gold. Plant that first.

1. "I'll take some." → shop · effect: open Marta's shop, set `met_farmWarden`
2. "I'll go find some." → end · effect: set `met_farmWarden`

### introGate (new)
> Through the gate, then. Plot one's yours. Pick a seed from the list, then pick the plot.

1. "Thanks." → end

The second visit uses `default` (quest hub, then order, shop, Guild lore). Marta's line about what the player has found is the diegetic reason seeds were counted before the farm existed.

## 7. Seeds and crops (the tier table)

**Rule.** A seed's tier equals the tier of the Zone its enemy lives in. Higher tiers take longer to grow (owner decision) and yield fewer, richer crops. The first seed grows in about 15 minutes.

**Sources (owner decision 2026-11-06): drops are the main source.** Monsters and Arena Chests drop seeds; the Guild sells **a few, low tiers only** (Turnip always, Wheat from Friendly). No other seed is ever sold.

Drop is 1-2 seeds, 1 in N per kill, added to the farming seed count (§9b); `seedDropChance` (expertise milestone 30) multiplies N down. The main thread tunes with `npm run sim`.

| Tier | Seed | Source: enemy (Zone) | Drop chance | Shop (Warden Marta) | Grow time | Yield | Crop | Uses |
|---|---|---|---|---|---|---|---|---|
| 1 | Turnip Seeds | Seagull (Horseshoe Beach) | 1 in 20 | 20 g, always, stock 20 | **15 min** | 4 | Turnip | Turnip Stew (Cooking 1), Marta's order, chain quest |
| 2 | Wheat Seeds | Green, Red, Blue Slime (Plains) | 1 in 25 each | 60 g from Friendly, stock 10 | 45 min | 5 | Wheat | Farmer's Bread (Cooking 1), Harvest Pie (Cooking 2), Marta's order |
| 3 | Silverleaf Seeds | Deer (The Long Path) | 1 in 30 | none | 2 h | 4 | Silverleaf | Silverleaf Tonic (Alchemy 1), chain quest |
| 4 | Apple Seeds | Goat (Mountain Pass) | 1 in 30 | none | 4 h | 6 | Apple (existing item) | Baked Apple, Fish & Apple Pie, Harvest Pie, Minor Mana Potion |
| 5 | Glowcap Spores | Forest Spider (Elderwood Wilds) | 1 in 35 | none | 8 h | 4 | Glowcap | Mushroom Stew (Cooking 2), Glowcap Elixir (Alchemy 1) |
| 6 | Heartroot Seeds | Treant Sprout (Deepwood) | 1 in 40 | none | 12 h | 3 | Heartroot | Sells; Heartroot Elixir and Feast of the Wood are **deferred** (need Alchemy 2 / Cooking 3 gear) |
| 7 | Canopy Blossom Seeds | Harpy (Upper Canopy) | 1 in 40 | none | 24 h | 2 | Canopy Blossom | Sells; Blossom Draught is **deferred** (needs Alchemy 2 gear) |

Seed drops use the enemy drop shape (`id, min, max, chance`); a quest-gated drop (`requiredActiveQuestId`) is available if a tier should only drop while a quest is active. Tier 1 and 2 are buyable so a new player is never stalled by a bad roll; every higher tier has to be found.

### Arena Chest (seed entries)

`ItemID.arenaChest` (`rewards-items.data.ts`): `rolls: 4`, weighted `loot` of 15 entries, total weight 1318 today (gold 300 for 6,000-12,000, Elder Silk 200, Harpy Feather 200, Ancient Wood 150, Minor Mana Potion 150, three runes 60 each, Gladiator Helm Recipe 50, War Cry Scroll 30, Patron's Gloves 30, four champion pets 7 each); the separate Pathfinder's Seal roll is unaffected. The Arena opens for a player just past the Harpy Matriarch, so the chest feeds tiers 3-7. **Owner decision: keep seeds in the weighted table** and buff gold to compensate. Add:

| Weight | Entry | Amount |
|---|---|---|
| 25 | Wheat Seeds (tier 2) | 3-5 |
| 40 | Silverleaf Seeds (tier 3) | 2-4 |
| 40 | Apple Seeds (tier 4) | 2-4 |
| 40 | Glowcap Spores (tier 5) | 2-3 |
| 30 | Heartroot Seeds (tier 6) | 1-2 |
| 20 | Canopy Blossom Seeds (tier 7) | 1-2 |

That adds 195 weight (total 1513), so every existing entry's chance per roll falls by 12.9%. **Gold is raised from 6,000-12,000 to 8,000-14,000** (average 9,000 to 11,000):

| | Before | After |
|---|---|---|
| Gold entry | weight 300 of 1318, 6,000-12,000 | weight 300 of 1513, 8,000-14,000 |
| Expected gold per chest (4 rolls) | 4 × 300/1318 × 9,000 = **8,194** | 4 × 300/1513 × 11,000 = **8,725** (+6.5%) |
| Champion pet, per chest | about 1 in 47 | about 1 in 54 (**accepted**: ≈ 1.85% vs 2.1% per chest) |
| Other entries (silk, feathers, wood, potions, runes) | — | −12.9% each (accepted) |

Seeds rolled by a chest are added to the seed count, never to a tab (§9b). The chest `loot` table shape (`{ weight, itemId, amount: [min, max] }`) already supports it. Update `docs/systems/arena.md` ("Arena Chest": "gold 6,000–12,000 (about 8k per chest on average)") and `docs/ideas/combat-arena.md` on implementation.

### Cooking and Alchemy (concrete)

**No new station upgrades** (owner decision): every farm recipe fits the station gear that exists (Cooking 1 Fire Pit, Cooking 2 Cooking Pot, Alchemy 1 Mortar & Pestle). Existing: Cooking has Grilled Fish, Baked Apple, Cheese Platter (Cooking 1), Crab Stew, Fish & Apple Pie, Venison Roast (Cooking 2) and Hunter's Feast (Cooking 3, no gear yet); Alchemy 1 has Minor Mana Potion and Greater Mana Potion. New:

| Item | Made from | Station | Learned |
|---|---|---|---|
| Turnip Stew | 3 Turnip, 1 Vial of Water | Cooking 1 (Fire Pit) | known at *The First Furrow* |
| Farmer's Bread | 4 Wheat | Cooking 1 (Fire Pit) | recipe scroll (*Wheat for the Guild*) |
| Harvest Pie | 2 Apple, 3 Wheat, 1 Cheese | Cooking 2 (Cooking Pot) | Marta's shop at Honored (the finale needs it, §4) |
| Mushroom Stew | 3 Glowcap, 2 Turnip | Cooking 2 (Cooking Pot) | Marta's shop at Revered |
| Silverleaf Tonic | 2 Silverleaf, 1 Vial of Water | Alchemy 1 (Mortar & Pestle) | recipe scroll (*Silverleaf for Sylvie*) |
| Glowcap Elixir | 2 Glowcap, 1 Vial of Water | Alchemy 1 (Mortar & Pestle) | Sylvie's shop |

**Deferred until the gear exists** (they need Cooking 3 Smoking Rack or Alchemy 2 Alembic, which no item grants yet): Feast of the Wood (2 Heartroot, 2 Venison), Heartroot Elixir (2 Heartroot, 1 Glowcap), Blossom Draught (1 Canopy Blossom, 1 Heartroot). Until then Heartroot and Canopy Blossom only sell.

Effects, durations and prices are the main thread's call (`/add-recipe-or-consumable`). Cheese stays a rat drop and is also sold at La Harpar from Honored; Harvest Pie keeps both useful. The shop's recipes for sale are the only non-seed stock beyond the two seeds.

## 7a. Farming expertise

Owner decisions (2026-11-06): Farming has a level, called **Farming expertise** in the UI. Harvesting gives Farming XP, turn-in orders give XP, and quests on the farm give XP. Seeds need a minimum expertise to plant; some seeds are level 1. **Farming gives no player XP** (settled; `gathering-skills.md` open question 3 answered no for Farming).

### Terms (GLOSSARY proposal)

- **Expertise**: a profession's level as the player sees it: "Farming expertise 7". Earned by using the profession, separate from character level. _Avoid_: Farming level, skill, profession (in player-facing text).
- **Farming expertise**: the player's expertise in farming. Code: `ProfessionID.farming`, `professions[farming].experience`.
- **Seed**: a farming item that is never in the inventory; counted per type in the farming state. _Avoid_: seed item, packet.
- **Farming Guild**, **Site**, **Plot**, **Order** (`§2`, `§4a`, `§5`).

**Relation to `gathering-skills.md`.** That doc calls non-combat skills **professions** to avoid "skill" (the skill tree). "Profession" stays the design and code term (`ProfessionID`, `professions`, `professionLevel`, `unlockProfession`); **expertise** is how a profession's level is named on screen. The rest of the professions (fishing, foraging, woodcutting, mining) should read the same way when they ship ("Fishing expertise 4"); that doc's glossary entry and UI strings need that change (§10). Expertise is **not** the character level and **not** a skill tree node.

### Where it fits `gathering-skills.md`

Farming is the **first profession shipped**, so it builds the shared pieces the zone professions will reuse: `ProfessionID` (append `farming = 4`; `fishing`, `foraging`, `woodcutting`, `mining` keep 0-3), the saved `professions` XP state, the level curve, the `professionLevel` quest and dialogue requirements, the `unlockProfession` effect and a `professionXp` quest reward. What it does **not** use: gathering spots, tool gear, the activity switch, `gatherSpeed`, or offline gathering claims. Its progression "spots" are its seeds.

### Curve

XP to go from level L to L+1 is `20 × L²` (the `gathering-skills.md` curve). Total XP to reach level L is `20 × (1² + … + (L−1)²)`: level 2 = 20, 5 = 600, 8 = 2,800, 12 = 10,120, 17 = 29,920, 22 = 66,220, 30 = 171,100. Cap **30** in v1. Pure rules in `store/player/professions.ts` (`levelFromXp`, `xpForLevel`), with a spec like `camp.spec.ts`..

### What each level gives

Level 1 is the start. Every level from 2 to 30 gives **1 skill point** (below) and one stat reward: **-0.5% seed grow time** (`seedGrowthTimeReduction` +0.005), except **every 5th level, which gives a milestone stat instead** (the growth bonus is skipped on those).

| Level | Reward | Total at this level |
|---|---|---|
| 2-4, 6-9, 11-14, 16-19, 21-24, 26-29 | +0.5% `seedGrowthTimeReduction` each | 23 such levels: 11.5% at level 30 |
| **5** | `farmSeedSaveChance` +10%: planting may not consume the seed | |
| **10** | `farmDoubleHarvestChance` +5% | |
| **15** | `farmBonusCropChance` +20% (+1 crop on a harvest) | |
| **20** | `turnInCooldownReduction` +10% (the first source of that stat, §4a) | |
| **25** | `farmXpMultiplier` +10% | |
| **30** | `seedDropChance` +25% (monster and chest seed drops) | 6 milestones |

**Past the cap (owner decision):** if the cap is ever raised, every level above 30 keeps the same rule, -0.5% seed grow time (`seedGrowthTimeReduction` +0.005) and 1 skill point, with **no new milestone stats**; the 50% total cap on `seedGrowthTimeReduction` still applies.

No plot milestone: plot count stays driven by Guild reputation and quests (§5). The values are first guesses for `npm run sim`; the growth reduction is capped by the level cap, so it tops out at 11.5% (the pet adds 10%, and `seedGrowthTimeReduction` as a whole is capped at 50%).

Derivation: `expertiseModifiers(level)` in `stats.ts` returns these from the level alone (ADR 0002), so respecs, reloads and rebalances can't drift them.

### Skill points (1 per level)

`docs/systems/skill-tree.md` and `player-stats-inventory-equipment.md`: skill points are the saved resource `unspentSkillPoints`, earned with `updatePlayerStats`, 1 per character level (`handleExperience`), 1 per Skill Point Book and quest reward; the skill tree spends them and a respec refunds them for gold. Expertise levels add to the same pool: **1 skill point per expertise level gained, 29 in all** (levels 2-30), milestones included. That is meaningful next to the character's own points, so it is a balance call for `npm run sim`.

**How they are granted without a double grant.** The points are a resource, not a derived stat, so the grant must be a one-time payment:
1. `professions[farming]` stores `pointsPaidLevel` (highest level whose points were paid; starts at 1).
2. After any XP change, `applyProfessionXp` computes `level = levelFromXp(experience)` and pays `(level − pointsPaidLevel) × SKILL_POINTS_PER_EXPERTISE_LEVEL` through `updatePlayerStats([{ stat: 'unspentSkillPoints', amount }])`, then writes `pointsPaidLevel = level`, in the same state update.
3. The same reconcile runs when the save loads, so a save made before this rule (or edited by a cheat) pays exactly once and a reload never pays again. Raising the cap or rebalancing the curve pays only the difference. A level lost to a changed curve refunds nothing.
4. Touch-points: `player.store.ts` (`applyProfessionXp`, the load reconcile, `professions` state), `professions.ts`, the level-up toast ("Farming expertise 6: +1 skill point"), `quest-completed` modal (XP rewards can level), `dev-cheats` (`dev.setExpertise`), `docs/systems/skill-tree.md` and `player-stats-inventory-equipment.md`.

### Seed expertise table

XP is per **harvested plot**, once, at the moment of harvest.

| Tier | Seed | Farming expertise to plant | XP per harvest |
|---|---|---|---|
| 1 | Turnip Seeds | **1** | 3 |
| 2 | Wheat Seeds | **2** | 8 |
| 3 | Silverleaf Seeds | 5 | 25 |
| 4 | Apple Seeds | 8 | 60 |
| 5 | Glowcap Spores | 12 | 130 |
| 6 | Heartroot Seeds | 17 | 260 |
| 7 | Canopy Blossom Seeds | 22 | 520 |

Two seeds are available at expertise 1-2 (the two the Guild sells); the rest are gated by expertise **and** by finding the seed.

### Pacing target: weeks, not days (owner decision)

Reaching expertise 30 should take **weeks of regular play**. Target: about **8 weeks at two visits a day** and about **12 weeks at one**. A visit is: harvest what is ready, replant every plot with the best seed allowed, and turn in one Marta order and one Wick order (each has its own 2 h cooldown, so both are always available).

Schedule from a direct model (not the game simulator, which does not model the farm). Assumptions: plots 3 (days 0-2), 4 (3-7), 5 (8-17), 6 (18-34), 7 (35-54), 8 (55-79), 9 (80+); every visit plants the best usable seed; orders average 15 items (Marta at most Wheat's 45 XP, Wick's brackets 22/45/90/150/240 XP by reputation); chain-quest XP 30, 100, 400, 1,500, 3,000 at expertise 1, 3, 5, 8, 12; no perks, seed supply never short.

| Expertise | Total XP | Days at 2 visits/day | Days at 1 visit/day |
|---|---|---|---|
| 5 | 600 | 3 | 5 |
| 8 | 2,800 | 8 | 14 |
| 12 | 10,120 | 15 | 27 |
| 17 | 29,920 | 24 | 44 |
| 22 | 66,220 | 34 | 61 |
| 26 | 110,500 | 45 | 72 |
| 30 | 171,100 | **59** | **85** |

Three visits a day reach 30 in about 58 days: the 24 h Canopy Blossom seed, not visits, then limits the rate. The 29 skill points arrive at about 3.5 a week over the 8 weeks (1 per level, accepted). The simulator (`scripts/sim-economy.mjs`) needs a farm model before these numbers are final; until then they are the target.

### XP sources

| Source | XP |
|---|---|
| Harvest (click or Harvest all) | the seed's XP above ×(1 + `farmXpMultiplier`), once per plot; a double harvest or bonus crop does not add XP |
| Guild order turn-in | `round(amount × xpPerItem)` (§4a tables) ×(1 + `farmXpMultiplier`) |
| Chain quests | 30, 100, 400, 1,500, 3,000 (§4); *Seeds from the Terrace* only unlocks the profession |
| Planting | none |

### Offline and harvest XP rule

XP is granted **when the player harvests**, never while a crop grows. Growth is a timestamp (§8), so a crop that finished while the player was away earns its XP on return, when harvested; there is no offline claim and no welcome-back entry for Farming. Waiting earns nothing, so the best XP comes from replanting often. Turn-in XP is granted at the turn-in.

### UI

The plots panel header shows **Farming expertise N**, an XP bar (current / needed for the next level, same bar style as the Reputation tab) and a hint "Next: Wheat Seeds at expertise 2" (the lowest locked seed the player can find). A level-up shows a toast with the reward ("Farming expertise 10: +5% double harvest, +1 skill point"). The quest panel's progress for a `professionLevel` requirement reads "Farming expertise 5 (3)". The seed list shows locked seeds with their level (§5). The stats panel lists expertise as a source under each stat it changes.

## 8. State shape (sketch)

```ts
// src/enums/ids/site-id.enum.ts
export enum SiteID { farm = 0 }

// src/data/farming-data.ts
export interface FarmSeed {
  seedId: ItemID          // an ITEM_DATA entry of ItemType.seed; one count consumed on planting
  cropId: ItemID          // item granted on harvest
  tier: number
  growMs: number          // 15 min for tier 1 … 24 h for tier 7
  yield: number           // fixed, see §7
  requiredLevel: number   // Farming expertise to plant it, §7a
  xp: number              // Farming XP per harvested plot, §7a
}
export const FARM_SEEDS: Record<ItemID, FarmSeed> = { /* … */ }

// PlayerStore (progression, saved)
professions: Partial<Record<ProfessionID, { experience: number; pointsPaidLevel?: number }>>   // shape from gathering-skills.md plus the skill-point guard (§7a); level derived
farm: {
  seeds: Partial<Record<ItemID, number>>     // count per seed type; no cap, no slots (seed-storage.md)
  plots: (Plot | null)[]                     // length = max plots (9); unused slots stay null
  activeSeedId: ItemID | null                // the seed picked in the side list; UI state, may stay unsaved
}
interface Plot {
  seedId: ItemID
  plantedAt: number        // epoch ms, display only
  progressMs: number       // growth accrued, in base grow-time ms (full = FarmSeed.growMs)
  syncedAt: number         // epoch ms of the last progress update
  rolledYield?: number     // the harvest roll, saved on the first harvest attempt, cleared when harvested
}
unlockedContent.sites: SiteID[]

// QuestsStore (orders and cooldowns, §4a)
orders: Record<QuestID, { requirements: { itemId: ItemID; amount: number }[]; rewards: { reputation: number; gold: number; farmingXp: number } }>
questCompletions: Record<QuestID, number>
lastTurnInAt: Partial<Record<TurnInKey, number>>   // epoch ms; ready = lastTurnInAt + 2 h × (1 − turnInCooldownReduction), computed

// pure rules, with a spec like camp.spec.ts: src/app/store/player/farm.ts
plotCount(tierIndex: number, grantQuestsDone: number): number            // 3 + tier + quests, max 9
syncPlots(plots, now, reduction): Plot[]                                 // accrues progress, see below
isReady(plot, growMs): boolean                                           // progressMs >= growMs
plant(farm, plotIndex, seedId, rng): Farm | null                         // null when blocked
harvest(farm, plotIndex, stats, rng): { farm; crops: ItemStack[]; xp } | null   // null when blocked
plantAll(farm, seedId, stats, rng): Farm                                 // Honored
harvestAll(farm, stats, rng): { farm; crops: ItemStack[]; xp }           // Friendly
```

### Growth is time spent growing, at the rate in force

`syncPlots` adds `max(0, now − syncedAt) / (1 − seedGrowthTimeReduction)` to `progressMs` (capped at `growMs`) and sets `syncedAt = now`. It runs **before any change to the reduction** (equipping or unequipping the Terrace Hare, a level-up that changes the expertise bonus, any future source), when the panel opens or ticks (display only, for time left: `(growMs − progressMs) × (1 − reduction)`), on load, and before every plant or harvest. So:
- Equipping the hare speeds up **only the time spent from then on**; an old crop does not become ready the moment it is put on, and taking it off does not make a ready crop unready: a ready crop stays ready (progress is capped at full and never shrinks).
- Time offline counts at the rate in force when the game saved (the equipment is whatever was saved), so a hare left equipped speeds up offline growth too. A clock set backwards counts as no time passed.
- The hare must be equipped *during* the growing time to matter. It does not change the yield roll beyond the harvest chances below, which read the equipment **at harvest**.

### Planting and harvest rules (RNG is real in v1)

`Math.random` as the chest rolls (`rollChest`) use; none of it runs offline (nothing rolls until the player acts).
- **Planting:** one seed per plant action. The seed-save roll (`farmSeedSaveChance`) happens **once per successful planting**; on success the seed is not consumed. A planting blocked by missing seeds or a locked expertise rolls nothing. Plant all rolls per plot in order and stops when the count reaches 0.
- **Harvest output:** `base = FarmSeed.yield`. Roll `farmDoubleHarvestChance`: on success `base × 2`. Then roll `farmBonusCropChance` independently: on success `+1`. Output `= base × (double ? 2 : 1) + (bonus ? 1 : 0)`.
- **XP** is once per plot at harvest, from the seed's XP (§7a), unaffected by double or bonus.
- **Blocked harvest:** if the crops don't fit the Materials tab, the plot **stays ready, pays no XP, grants nothing** and the roll is **not redone**: the first attempt saves `rolledYield` on the plot, every retry reuses it (the `rolledChests` pattern), and it is cleared when the harvest succeeds. Harvest all stops at the first blocked plot.

Timestamp growth: nothing runs per tick. Offline needs no work and the welcome-back modal needs no entry; a plot ready while away is ready on return. Crops are normal inventory items. **Seeds are not**: they are counts in `PlayerState.farm.seeds` (§9b).

## 9. Reputation: what must change

Reputation is keyed by `TownID` everywhere: `REPUTATION_TOWNS = [laHarpar, mawood]` (`store/player/reputation.ts`), `PlayerState.reputation: Partial<Record<TownID, number>>` (`player.store.ts`), the quest reward `{ type: 'reputation', townId, amount }`, shop `minReputation: { townId, tier }`, the dialogue `reputation` condition, `REPUTATION_TURN_INS`, the Reputation tab and the label `map:towns.<TownID>`. The Farming Guild is a **Site**, not a Town, and more non-Town sources will follow.

**Owner decision (2026-11-06): rename the key to `ReputationID` so new content works right away** (replaces the earlier `TownID.farmingGuild` recommendation).

| Step | Change |
|---|---|
| New enum | `src/enums/reputation-id.enum.ts`: `ReputationID { laHarpar = 1, lirold = 2, mawood = 3, farmingGuild = 4 }`. **The first three keep `TownID`'s numeric values**, so saves need nothing. (Lirold has no reputation yet; its value stays reserved so a Town's `ReputationID` equals its `TownID`.) |
| `TownID` stays | Towns remain `TownID`; `Town` data gains `reputationId?: ReputationID` (absent = keeps none). The Site data has `reputationId`. A helper `reputationIdOf(townId)` maps a Town to its key. |
| Rename | `REPUTATION_TOWNS` → `REPUTATION_IDS`; `ReputationGain`/`TierUp.townId` → `reputationId`; `PlayerStore.townTier` → `reputationTierOf`, `isTownUnlocked` untouched; state `reputation: Partial<Record<ReputationID, number>>` (same JSON keys). |
| Data | The quest reward shape `{ type: 'reputation', reputationId, amount }` (about 20 quests in `quests-data.ts`); `ShopItem.minReputation.reputationId` (`shop.type.ts`, `shops-data.ts`); the dialogue `reputation` condition and `reputationTurnIn` effect; `REPUTATION_TURN_INS.townId`. |
| UI | `reputation.component` rows and the label key (`map:towns.laHarpar` → `map:reputations.laHarpar`, new `farmingGuild`), `towns.component` tier tag, `shop.component`, `quest-list`, `quest-completed` modal, `dialogue.component`/`reputation-text`. |
| Titles and discovery | `titles-data.ts`: `TitleSource = { type: 'reputation', reputationId, tier }` (the four shipped titles keep their values, since the numeric keys do not change). `reputation.component.ts` shows a row only for an unlocked source (`isTownUnlocked` today): `isReputationUnlocked(id)` = the owning Town's `isTownUnlocked`, or `isSiteUnlocked` for a Site. The Farming Guild adds one title (§9a). |
| Services/tooling | `ReputationService.gain`, `DialogueManagerService`, `QuestsStore`, `scripts/validate-data.mjs` (reward `reputationId` must be in `REPUTATION_IDS`), `scripts/sim-economy.mjs`, dev cheats, specs (`reputation.spec.ts`, `reputation-turn-in.spec.ts`, `revered-quests.spec.ts`, `shop.component.spec.ts`). About 20 of the 33 `TownID` importers touch reputation. |
| **Save migration** | **None needed** because the numeric values and the `reputation` state key do not change; old saves load as is. Only pre-release saves exist anyway (`town-reputation.md`: no migration, saves reset). If anyone renumbers, a migration `reputation` key remap would be needed; don't. |
| Docs | `town-reputation.md` (a "Sources" section instead of "Towns covered"), `towns-shops-guild.md`, `quests.md` (reward shape), `dialogue.md`, `GLOSSARY.md` (Reputation: "points with one town **or the Farming Guild**"), `docs/ideas/slatefall-and-the-deeper-mines.md` (its Town gets its own `ReputationID`). |

Either way: the Reputation tab gains a row; tier thresholds stay the shared table; the Farming Guild values grown goods and clean seed (no price effects, no daily content; titles and a pet at Exalted are open); the Guild's shop uses `minReputation` as La Harpar's cheese does.

## 9a. Stats and the Exalted pet

### New derived PlayerStats (ADR 0002 style)

New stats are derived from their sources like every other (`docs/adr/0002-player-stats-derived-from-sources.md`): `statsInitialState` plus modifiers from equipment (pets are equipment), nodes, buffs, consumables, permanent bonuses and, new, **expertise** (§7a). Nothing is accumulated. All are additive percents (0.10 = 10%), positive = better, none inverted, none a resource.

| Stat | Meaning | Granted by |
|---|---|---|
| `seedGrowthTimeReduction` (renamed from the earlier `farmGrowthSpeed`) | Shortens every grow time: `growMs × (1 − seedGrowthTimeReduction)`, total capped at 0.5. Named for what it does to the number (a reduction, like `turnInCooldownReduction` and `spellCooldownReduction`), not a speed. | Expertise (0.5% on each non-milestone level, 11.5% at the cap), the Exalted pet (0.10) |
| `farmDoubleHarvestChance` | Chance a harvested plot yields double. | Expertise milestone 10 (5%), the pet (10%) |
| `farmSeedSaveChance` | Chance planting does not consume the seed. | Expertise milestone 5 (10%) |
| `farmBonusCropChance` | Chance of +1 crop on a harvest. | Expertise milestone 15 (20%) |
| `turnInCooldownReduction` | Shortens every turn-in cooldown (§4a): `cooldown = base × (1 − reduction)`, capped at 0.75. | Expertise milestone 20 (10%); first source |
| `farmXpMultiplier` | Farming XP from harvests and orders ×(1 + x). | Expertise milestone 25 (10%) |
| `seedDropChance` | Seed drop chance from monsters and chests ×(1 + x). Does not touch the shop. | Expertise milestone 30 (25%) |

Touch-points per stat: `types/player/player-stat.type.ts` (the union and `additivePercentStats`), `store/player/player.ts` (`statsInitialState`), `store/player/stats.ts` (a new `StatSource` `'expertise'` beside `equipment`, `skills`, `buffs`, `consumables`, `bonuses`, `mastery`, so the stats panel breaks the stat down by it, and an `expertiseModifiers(level)` function), the stats panel and its label keys (`player-stats` component, `stat-to-percentage.pipe.ts`; a stat with no source stays hidden), `validate` (every stat has a label), `docs/systems/player-stats-inventory-equipment.md`. The cooldown computation (`turnInReadyAt(npc, stats)`), `farm.ts` (`growMs`, `harvest`, `plant`) and the seed drop roll (`kill-rewards.ts` `rollEnemyDrops`, chest roll) read them.

### The Exalted title

Following the shipped pattern (`town-reputation-tier-rewards.md` Titles: display names only, no stats; **Toast of La Harpar** and **Keeper of Mawood** at Exalted; `TITLES_DATA` in `titles-data.ts`, names under `app:titles.<TitleID key>`):

| | |
|---|---|
| Title | **Hand of the Terraces** (proposed), at Farming Guild Exalted. Exalted only, no Friendly title (owner decision). |
| Data | `TitleID.farmingGuildExalted`; `TITLES_DATA[TitleID.farmingGuildExalted] = { type: 'reputation', reputationId: ReputationID.farmingGuild, tier: ReputationTier.exalted }`. `TitleSource` takes `reputationId` instead of `townId` with the `ReputationID` conversion (§9); the four shipped titles keep their numeric values, so saved titles are unchanged. |
| Text | `app.json` `titles.farmingGuildExalted`: "Hand of the Terraces". |
| Docs | `town-reputation-tier-rewards.md` (Titles table, Exalted row). |

### The Exalted pet

Every shipped town gives a pet at Exalted (`town-reputation-pets.md`: the Bartender's Tavern Cat, Corwin's Rootglow Moth). Implementation (`towns-shops-guild.md`, `enemies-shiny-pets-bestiary.md`): a pet is an **equipment item** (`slot: pet`, legendary, `value: -1`, stats like any gear, kept in the Pets tab, one pet slot). The giver's `default.*` dialogue option needs the town Exalted and a flag unset (`bartender_gave_pet`, `corwin_gave_pet`); the gift result gives the item and sets the flag, and a full Pets tab disables the option without setting it.

| | |
|---|---|
| Name | **Pet Terrace Hare** (`petFarmingGuildHare`) (proposed). A hare from the Guild's terraces that eats what the player was going to harvest; Marta: *"Nobody keeps it. It keeps itself. Feed it and it will find the ripe row first."* |
| Giver | Warden Marta, once, at Farming Guild Exalted; flag `warden_gave_pet`. |
| Stats | `seedGrowthTimeReduction` +0.10, `farmDoubleHarvestChance` +0.10 (first guesses; Tavern Cat is +0.5 `foodEffectMultiplier`, Moth is +10 `increasedSpellDuration`). |
| Can a reputation reward grant a pet? | **Not as a quest reward**: a quest `reputation` reward only credits points, and quest rewards can't be gated on a tier. The shipped way is a dialogue `give` effect gated by a `reputation` condition, which this uses; a `ReputationID`-keyed condition works with the rename (§9). |
| Slot | The pet slot (`EquipmentSlot.pet`, one per player). **The hare works only while it is equipped there** (owner decision 2026-11-06), so a player swaps it in to farm and out for a combat pet; the equipment panel stays on screen in the farm (§5). Its growth bonus accelerates only the time spent equipped (§8); its harvest chances are read at harvest. |

---

## 9b. Seeds are not inventory items

**Supersedes the earlier "seeds in the Materials tab" recommendation** (owner decision 2026-11-06). Seeds live in a separate farming state, counted per seed type, and show only in the plots panel's side seed list. [`seed-storage.md`](seed-storage.md) holds the engineering detail; this section states the farm-side rules and the two decisions that doc left open.

| Topic | Rule |
|---|---|
| Storage | `PlayerState.farm.seeds: Partial<Record<ItemID, number>>`, counts per seed type. No slots, no stacks, no cap, nothing is lost to a full tab. A new key; saves get the default through the load merge (`persistence.md`). |
| Data | A seed stays an `ITEM_DATA` entry with a new `ItemType.seed` (id, name, icon, `value: -1` unsellable, tier, `FarmSeed` link). Drop tables, shop stock, chest loot, quest `item` rewards and dialogue gifts keep their shapes; `validate` still checks every target. `tabOf` gets a `seed` case that is never reached. |
| Routing | `PlayerStore.addItems` takes seed stacks out first and adds the counts to `farm.seeds` (the `installStations` precedent: station gear never enters the inventory). Everything that adds items is covered: kills, offline kills (`applyKillBatch`), chests, Arena rewards, mastery chests, quest rewards, dialogue gifts, shop purchases, cheats. |
| Not lost | `canFit`, `missingSlots`, the chest fit check and the "N more slots needed" tags ignore seeds. The lost-drops toast and the welcome-back "lost drops" count never include them. |
| Tooltips | A seed has no inventory slot, so its tooltip (name, tier, grow time, yield, expertise needed) is shown on the side seed list and in the drop line. The bestiary's drop list still reads `ITEM_DATA` as before. |
| Shop | Marta's seed purchase adds to `farm.seeds`; the slot shows no "tab full" border for seeds. The Sell tab never lists seeds. |
| Arena Chest | The §7 seed entries are rolled as items; opening adds them to the seed count. The chest modal lists them as usual. |
| Offline drops | The same roll as online (`applyKillBatch`), so seeds found while away are counted. The welcome-back modal lists them in "received items" once the farm is unlocked. |
| Max planting | Seeds are consumed one per planting (or spared by `farmSeedSaveChance`); plant-all stops when the count runs out. |

**Decision: drops before the farm unlocks (owner asked me to decide).** Seeds are **counted from the first kill, silently**: no inventory entry, no toast and no popup, until the farm unlocks. After the unlock, a kill that drops a seed shows a small "Found: Turnip Seeds ×1" line in the battle view's toast channel (`seed-storage.md` Loot cue), and the welcome-back modal lists them. Silence before the unlock keeps the early game quiet, and the NPC beat below (§6a) covers the first visit: it tells the player seeds were counted and then shows the list populated. This answers `seed-storage.md` open question 2 (no popup at the first seed) and question 3 (the count is not visible before the unlock, except that Marta names it).

---

## 10. What must change in `gathering-skills.md`

Farming is a farm Site with a panel, not Camp plots:
- §1 "Farming (Camp, later)": rewrite. Where: the Farm Site. Loop: plant a monster-dropped seed, wait real time (15 min to 24 h), harvest. No Camp tab, no Foraging seeds.
- §2 "Recommendation": "Farming and trapping are Camp timers (C)" becomes "Trapping is a Camp timer; Farming is a Site panel with timers". The option table's column C stays for trapping.
- §4 Unlock path, Farming row (and the MVP: Farming now ships before Fishing, so the generic profession code is built with Farming): Teacher **Sylvie then Warden Marta** (not Elder Corwin), gate `silkAndWater` completed (not The Blighted Heart), unlock = the farm Site.
- "Later expansions" step 6: Farming moves out (it ships by itself, earlier); trapping stays.
- Foraging "Outputs: Rare: seeds (for farming)" is removed; Foraging's herbs and farming's crops overlap (Silverleaf, Glowcap): they stay different sources of one material, which is fine.
- §3 Tie-ins, Quests list: add "Sylvie: *Seeds from the Terrace* unlocks the farm" beside the Foraging line.
- Professions model: Farming **is the first profession** (§7a): it uses `ProfessionID`, the `professions` XP state, the `20 × L²` curve, `professionLevel` requirements and the `unlockProfession` effect from `gathering-skills.md` §6. It has **no spots, tools or activity switch, and no `gatherSpeed`**: those belong to the zone professions. Add `farming = 4` to `ProfessionID` (append; nothing is shipped to renumber). Reputation (the Guild) is a second axis next to it.
- Terms: a profession's level is shown as **expertise** ("Fishing expertise 4"); its Proposed glossary entries (Profession, Gathering spot, Activity, Tool gear) gain an **Expertise** entry (§7a), and its UI strings, `Leveling` section and "Level gives" list say expertise in player-facing text. Open question 3 (player XP) is answered no for Farming. Open question 8 (prestige) is dropped: there is no prestige mechanic (`prestige.md` is a proposal only).

## 11. Later expansion: husbandry

Not in v1. Sketch only: Wick's animals (hens, a cow, sheep; no goats, which are Mountain Pass enemies) as pens in the same farm panel (a second tab on the panel), fed from the crops, giving eggs, milk and fleece for Cooking and Alchemy, unlocked by Guild reputation and a quest. The panel layout, `FarmSeed` data and plot-state sketch keep a pen as the same shape: a timestamp, a feed and a yield.

## 12. Rejected concepts (earlier draft)

- **Camp plots with Corwin (A):** cheapest and was in `gathering-skills.md`, but gives the farm no place on the map and no NPCs. Dropped (owner).
- **Tillbrook Farm Town in the South Fields (B):** needed a Town and Building UI and tied the farm to Lirold's late game. Dropped; the South Fields stay as `southern-map-expansion.md` has them (a turnip field and an Arena hook), unrelated to the farm.
- **Hybrid (C):** two chains to keep consistent. Dropped.
- **Pests, weeds, wolves at the hens:** removed by the owner; the chain has no pest steps.

## 13. Contradictions and consistency notes

| New claim | Canon it touches (source) | Fix |
|---|---|---|
| Farming is a profession with no spots, tools or activity | `gathering-skills.md` §2 defines professions as zone activities (B) with tools | §10 and §7a: it reuses only the level, XP and requirement parts. |
| The farm unlocks at Mawood-era (after `silkAndWater`) | `gathering-skills.md` had Farming after The Blighted Heart | Moves earlier; seeds up to tier 4 are Mountain Pass and below, so the early game feeds it. |
| The farm opens while the Treant is alive | `silkAndWater` follows `theSapThatBurns`; `theBlightedHeart` is separate (`quests-data.ts`) | §1 and the dialogue never assume the Treant is dead; the Guild lets a fighter in because Sylvie vouches. |
| Cheese is sold at La Harpar from Honored | `shops-data.ts` | Harvest Pie still uses cheese; no change. |
| The Guild's valley survived the blight | Corwin: black sap reached the Spires; the Deepwood "will recover" | The valley is north of the Pass and fed by its own spring (Sylvie's platform-three spring, by contrast, went bad). No shipped text says where the blight stopped. |
| The farm is in Port Stocksmar, La Harpar's Region (owner decision 2026-11-06) | Confirmed: La Harpar is in Port Stocksmar (`laHarparJosh.json` `regionsInfo`: "La Harpar resides in Port Stocksmar."; `towns-data.ts` `regionId`). `world.md` Geography inferred the Mountain Pass as the Port Stocksmar / Elderreach border; `Finn#aboutFinn` only says the Elderwood is north of the Plains | The farm is just north of the Pass and still Port Stocksmar, so the border must lie east of it, between the Pass and the Elderwood Wilds. `world.md` updated; nothing shipped says otherwise. |
| "Guild" as a second organisation | `GLOSSARY.md`: "Guild (alone)" means the Exploration Guild | Always write "Farming Guild" in full; glossary entry added on implementation. |
| Cheese is a rat drop; a rat joke | `gathering-skills.md` (kept on purpose) | One line in Marta's voice; no dairy in v1. |
| Apple Seeds from Goats | The Corrupted Sapling drops the apple today | Both stay; the sapling still drops apples. Goat is an existing enemy (`zones-data.ts`). |
| Turn-ins get a cooldown, including the four reputation bundles | `town-reputation.md` (unlimited bundles until Exalted), `dialogue.md` | §4a; accepted by the owner. |
| Quests become repeatable | `quests.md`: a completed quest stays at 9999; "A Tale of a Captain is unfinished on purpose" | §4a adds `repeat` as an opt-in field; no shipped quest changes. |
| Reputation for a non-Town | `REPUTATION_TOWNS`, `validate` | §9 (`ReputationID`). |
| NPCs outside Town Buildings | Dialogue opens from Town Buildings | §2 touch-point 3. |
| Seeds drop before the farm exists | Drops need a place; a full tab drops loot | §9b: seeds are counted in the farming state from the first kill, silently, and Marta explains (§6a). |
| The Exploration Guild moves to Lirold | `north-lirold-and-exploration-guild.md` | No interaction. |

## 14. New content

| Kind | ID | One line |
|---|---|---|
| Site | `farm` (`SiteID` 0) | Terraced valley at (1400, 400), north of the Mountain Pass, Port Stocksmar; the Farming Guild's home. |
| Profession | `ProfessionID.farming` (4) | §7a. Reward type `professionXp`, requirement `professionLevel`, effect `unlockProfession`. |
| Reputation source | `ReputationID.farmingGuild` (4) | §9. |
| NPCs | `farmWarden`, `farmDrover` | Marta Tillbrook (farm resources, seed shop), Wick (animal resources). |
| Quests | `seedsFromTheTerrace`, `theFirstFurrow`, `wheatForTheGuild`, `silverleafForSylvie`, `anOrchardAgain`, `theGrowersTable` | §4. |
| Orders (repeatable quests) | `marthasOrder`, `wicksOrder` | §4a: random pool pick, 10-20 items, each with its own 2 h cooldown. |
| Quest system | `repeat`, `pickedItems` requirement, `orders`, `lastTurnInAt` (`TurnInKey`), `questCompletions`, `completeOrder`, `turnInCooldown` condition, `turnInCooldownReduction` stat; the `reputationTurnIn` effect loses `bundles` | §4a. |
| Items (seeds) | 7 | §7. |
| Items (crops) | Turnip, Wheat, Silverleaf, Glowcap, Heartroot, Canopy Blossom (Apple exists) | §7. |
| Items (dishes, potions) | Turnip Stew, Farmer's Bread, Harvest Pie, Mushroom Stew, Silverleaf Tonic, Glowcap Elixir + recipe scrolls. Deferred: Feast of the Wood, Heartroot Elixir, Blossom Draught (no gear). No new station upgrades. | §7. |
| Items (quest) | Guild Letter | Given by Sylvie. |
| Title | `TitleID.farmingGuildExalted` ("Hand of the Terraces") | §9a. |
| Chest | 6 new Arena Chest entries, gold raised to 8,000-14,000 | §7. |
| Pet | `petFarmingGuildHare` (Pet Terrace Hare) | Exalted gift from Marta; §9a. |
| PlayerStats | `seedGrowthTimeReduction`, `farmDoubleHarvestChance`, `farmSeedSaveChance`, `farmBonusCropChance`, `turnInCooldownReduction`, `farmXpMultiplier`, `seedDropChance`; stat source `expertise` | §9a, §7a. |
| Dialogue effect / condition | `unlockSite`, condition `turnInCooldown` | `/add-dialogue-effect`. |
| Dialogue | Warden and Drover trees (each with an order hub) | `/add-npc-dialogue`. |
| Art | farm home background, plots panel, Gate button, 2 portraits, 7 seed icons, 6 crop icons | `/generate-2d-asset`. |

## 15. Touch-points

- **New:** `enums/ids/site-id.enum.ts`, `enums/reputation-id.enum.ts`, `data/sites-data.ts`, `data/farming-data.ts`, `store/player/farm.ts` (+ spec), `components/game/farm/` (home screen and `farm-plots` panel), `enums/game-tab.enum.ts` (`GameTab.farm`), item/recipe/enemy data additions, dialogues `farmWarden` and `farmDrover` (+ locales and the `app.config.ts` namespaces), `locales/en/unlocks.json` `sites.farm`, `map.json` `sites`/`sitesLabel`/`reputations`.
- **Edited, map and view:** `world-map-data.ts` (marker kind `site`), `world-map.component.ts/.html/.sass` (`unlockedSites`, `sites__list`, marker sync), `game.component.html/.sass` (`.farm-home` joins `.towns`; `.farm` joins `.map`), `town-building.component.ts` (input type), `towns.store.ts` (selection for a Site, verify), `data/helpers/npc-places.ts` (`NpcPlace` union), `game-navigation.service.ts` (`talkTo(place)`), `quest-list.component.ts` (Site reachability), `player.store.ts` (`farm`, `unlockedContent.sites`), `unlock-conditions.ts`/`UnlockService`.
- **Edited, quests and dialogue:** `quests-data.ts` (`repeat`, six quests, two orders), `quests.store.ts`, `quest-status.ts`, `quest-list.component.ts`, `quest-completed`, `dialogue-effect.type.ts`, `dialogue-condition.type.ts`, `DialogueManagerService` (`unlockSite`, `cooldown`, picked-item labels).
- **Edited, profession (§7a):** `profession-id.enum.ts`, `professions-data.ts`, `store/player/professions.ts` (+ spec), `player.store.ts` (`professions`, `applyProfessionXp`), `quests-data.ts` reward and requirement types, `quests.store.ts`, `quest-completed`, the plots panel level bar.
- **Edited, cooldown and stats (§4a, §9a):** `quests.store.ts` / `player.store.ts` (`lastTurnInAt`), `reputation.service.ts` (bundle turn-in writes it), `npc-frame` (timer badge), `dialogue.component` (cooling tag), `quest-list`, `player-stat.type.ts`, `player.ts`, `stats.ts`, stats panel, `dialogue-manager.service.ts`, `pet-items.data.ts`, `laHarparTown`-style Warden dialogue (`warden_gave_pet`).
- **Edited, bundles (§4a):** `dialogue-effect.type.ts` (`reputationTurnIn` without `bundles`), `dialogue-manager.service.ts` (`turnIn`, reservations include `orders`), `reputation-turn-ins.ts`, the four NPC trees, `reputation-turn-in.spec.ts`, `sim-economy.mjs`, `docs/systems/dialogue.md`, `docs/ideas/town-reputation.md`.
- **Edited, reputation (rename, §9):** `reputation.ts`, `reputation.service.ts`, `reputation-turn-ins.ts`, `shops-data.ts`, `shop.type.ts`, `titles-data.ts`, the Reputation tab (`reputation.component.ts` discovery filter), `towns.component`, specs.
- **Edited, content:** `enemies-data.ts` (seed drops), `rewards-items.data.ts` (Arena Chest), `shops-data.ts` (Marta's shop), `recipes-data.ts`, `consumables-items.data.ts`, `resources-items.data.ts`, `dev-cheats.component.ts` (`dev.plantAll`, `dev.growAll`, `dev.skipOrderCooldown`).
- **Tooling:** `scripts/validate-data.mjs` (each seed maps to a crop, every drop target exists, order pools reference real items, plot count never exceeds the array), `scripts/sim-economy.mjs` (farm and order yield per hour against combat), `GLOSSARY.md` (Site, Farming Guild, Plot, Seed, Order, Expertise).
- **Docs:** new `docs/systems/farming.md`; `towns-shops-guild.md`, `town-reputation.md`, `quests.md`, `arena.md`, `docs/ideas/seed-storage.md` (engineering detail for §9b), `docs/lore/`.
- **Changelog:** `CHANGELOG.md` `[Unreleased]`: `- [feature] A farm north of the Mountain Pass lets you grow crops from seeds monsters drop.`

## 16. Owner calls

**None open.** Every owner call is settled, including: no perks past the cap (the 0.5% growth cut and 1 skill point continue, §7a), no Farming XP from non-farm bundles (§4a), the Exalted title "Hand of the Terraces" (§9a), and no reputation re-tune after the one-bundle nerf (accepted as is). `prestige.md` is only a proposal; this doc has no rebirth question.

Real engineering checks for the main thread (not owner decisions):
1. **Site NPCs:** verify an NPC frame and the dialogue work with no selected Town (`towns.store.ts`, §2 point 3) before choosing `selectedSiteId` versus a `SiteComponent`.
2. **Pacing numbers:** the §7a schedule is a direct model; build a farm model in `scripts/sim-economy.mjs` and re-check before shipping.
3. **Reputation numbers:** update `town-reputation.md` and `sim-economy.mjs` to the one-bundle rule (no re-tune).

## 17. For the main thread

Order of work (nothing waits on the owner): (1) the `ReputationID` rename (no behaviour change, no migration), (2) the generic profession code (`ProfessionID.farming`, XP, level, `professionLevel`, `professionXp`, `unlockProfession`) and the general turn-in cooldown, `turnInCooldownReduction`, and `repeat` / `pickedItems` in the quest system, with a spec, (3) Site data, map marker, Sites list and home screen, (4) plots panel and `farm.ts`, (5) NPCs, quests and content. Skills: `/add-dialogue-effect` for `unlockSite` and `turnInCooldown`; `/add-npc-dialogue` for Marta, Wick and Sylvie's addition; `/add-quest` per chain row; `/add-recipe-or-consumable` for §7; `/generate-2d-asset` for art. `/add-enemy-and-zone` is not needed (only drops).
