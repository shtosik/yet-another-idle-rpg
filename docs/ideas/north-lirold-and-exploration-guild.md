# Lirold & the Exploration Guild

**Scope:** M · **Status:** In progress: Lirold, its unlock rule and map marker, the Arena, the Forge and shop stock stages are shipped; Guild hall, Odile Varrow, Marvin's move to the Tavern and The Guild Trial are proposed (revision 7, 2026-11-08: mechanics review folded in, implementation plan in §11; revision 6 rewrote dialogue and lore under the current voice rules). The Guild Trial and Guild Shortsword wait for the Slatefall PR. File name kept from before the rename.

> `la-harpar-quests.md` (the Tidecaller questline and La Harpar side quests) is a proposed draft in `docs/ideas/`. Its QuestID (16–26) and ItemID (134–143) reservations are void: shipped content took those ids. Everything below that cites it is conditional on it shipping, including the ID numbers it reserves.

Lirold, the capital of Port Stocksmar, is a Town the player reaches **after the Elderwood chain**. The Exploration Guild's hall will stand there, run by a new Guildmaster, **Odile Varrow**. She gives *The Guild Trial*, knows the player's deeds, and has the full Guild store and contracts. **Marvin stays in La Harpar for good**: a Guild member back from an expedition, now in the Tavern. Until the player meets Varrow he sells a few Guild items and handles contracts; after that he sends them to her. He also teaches combat and keeps the Guild's road book. The road from the capital to the Mountain Pass and the mining village on it are in [`slatefall-and-the-deeper-mines.md`](slatefall-and-the-deeper-mines.md).

**Owner decisions in force (2026-10-27):**
- The capital lies **south** of Horseshoe Beach: a large city inside stone walls with a castle at its centre. A road runs from it to the Mountain Pass, with a mine near the Pass on that road.
- On the world map: marker at (600, 1180) since the 2026-10-31 redraw (§3a is superseded).
- It unlocks **after the Mawood Zones** (Elderwood Wilds, the Deepwood, the Upper Canopy).
- Some capital NPCs acknowledge what the player did in La Harpar and Mawood.
- Renamed and shipped: North Lirold → **Lirold** (`TownID.lirold`), Southback → **Elderreach** (`RegionID.elderreach`).
- Marvin stays in La Harpar; only the Exploration Guild moves to the capital, under a new NPC.
- Guild split: Marvin sells a stage-0 store and handles contracts until the player has met Varrow, then redirects to her; one shop with stock stages (§5).

**Owner decisions (2026-11-08, after the mechanics review):**
- Marvin and Varrow share one shop: same stock, same refresh. Marvin shows stage 0 only; Varrow shows stage 0 and stage 1.
- Second Contract and Bounty Mark stay at stage 0 (rank 2), so Marvin keeps selling them. Stage 1 is only the three new hall items.
- *The Guild Trial* waits for the Slatefall PR, together with its reward, the Guild Shortsword (§6).
- The Guild Shortsword is buffed to sit beside the Talon Blade, not above it, with different stats and one unusual stat (§6).
- Marvin's Shop button is hidden once the player has met Varrow (§8).

## 1. Lore already in the game

| Fact | Source |
|---|---|
| Lirold is the capital of Port Stocksmar. La Harpar and Horseshoe Beach are "important trade partners" to it. | `laHarparJosh.json` `beachName` |
| La Harpar has been "a vital partner to Lirold for a long time". | `laHarparTrader.json` `aboutFishermen` |
| The four known Regions are Elderreach, Port Stocksmar, Greefic Hill and Saint Nestroud. | `laHarparJosh.json` `regionsInfo` |
| Lirold is a Town with two Buildings, the Arena (Ludo Crane) and the Forge (Phurgo). Its world map marker is at (600, 1180). It opens on Upper Canopy Wave 15. | `src/data/towns-data.ts`, `src/data/world-map-data.ts`, `src/data/unlock-conditions.ts`, `unlocks.json` `towns.lirold` |
| Marvin: "head of the Exploration Guild". The Guild "map[s] the unknown and thin[s] out the dangers", pays Explorer Tokens, and raises Guild rank every 5 tasks. | `laHarparMarvin.json` `introduction1`, `introduction2`, `whatIsThisPlace1` |
| Marvin is "the only decent person living here" (La Harpar), "an adventurer", "a very skilled warrior", back "a few days ago" from an expedition. | `laHarparElara.json` `villagersOpinion`, `marvinInfo`; `laHarparTrader.json` `aboutPeople` |
| Marvin trains fighters: "specializes in combat training" (Bartender); "probably training people at the local exploration guild" (Elara). No training exists in the game today. | `laHarparBartender.json` `anyoneWhoCanTrainMe1`, `laHarparElara.json` `marvinLocation` |
| Marvin keeps a book. Phurgo: he "keeps the road records for the Exploration Guild, in La Harpar", "He'll want to tell you about the book. Let him." Ludo: "He'll put you in his book." Marvin told Phurgo's story with a pie on purpose ("I know when I'm being managed") and said salvage was possible all along. | `liroldPhurgo.json` `coldForgeRecord`, `coldForgeProgressThree`, `coldForgeProgressFour`, `default.opt9`; `liroldArenaMaster.json` `pathfindersSealInfo` |
| The Guild leaves Pathfinder's Seals among the Arena's prizes and pays the carriage. Ludo sends the player to Marvin with one: one piece in ten comes up better, and "he only does it the once". | `liroldArenaMaster.json` `pathfindersSealInfo` |
| The castle shut the mine road two winters back; Slatefall iron stopped. Nobody at the Forge knows why the mine shut. | `liroldPhurgo.json` `aboutForge`, `aboutSlatefallGuess`; `liroldArenaMaster.json` `coldForgeLead` |
| The Guild is "the main hub for local adventurers" and will "help you get prepared for the road". La Harpar's unlock popup sends the player to it. | `laHarparTrader.json` `aboutGuild`, `unlocks.json` `towns.laHarpar.body` |
| The Upper Canopy is the highest point in the game; the Harpy Matriarch nests in the crown of the tallest Spire. The Canopy Bandits are outlaws who fled up there. | `mawoodMilo.json` `aboutCanopy*`; design only: `docs/design/mawood-and-elderwood-zones.md` |
| Mechanics: the Guild sits in La Harpar (Horseshoe Beach wave 5). The Upper Canopy is the last Zone: tier 7, maxWave 15, Boss Harpy Matriarch, no `nextZoneId`. `UNLOCK_RULES` read `waveReached`, `hasItem`, `levelReached` and `questCompleted`. | `towns-shops-guild.md`, `zones-waves-unlocks.md`, `zones-data.ts`, `unlock-conditions.ts` |

## 2. The story

The Exploration Guild is chartered by the capital, which pays for its charts and honours its Explorer Tokens. Its only hall stands in the capital, under Guildmaster Odile Varrow. Marvin is La Harpar-born and a Guild member, home in the village after an expedition Varrow sent him on. He drinks in the Tavern, trains anyone who asks, keeps the Guild's road book, and as a member hands out contracts and a few Guild supplies from his pack. He tells the player what the Guild is and that the hall in Lirold has far more. Once the player has met Varrow, contracts and supplies go through her; the book, the salvage pages and the teaching stay with him.

The player climbs the beach, the Plains, the Long Path, the Pass and the Elderwood. From the Harpy Matriarch's nest in the crown of the tallest Spire, the highest point anywhere, they see what the forest hid: south, past the mountains, a road coming down off the Pass, and at its far end grey walls and a castle under the mountains.

In the capital, Varrow already knows the player's deeds (§8b) from traders and Marvin's letters. She gives the Guild's one trial:
- Bring in the outlaws who fled the capital's law into the Spires.
- Kill the Troll that came down onto the castle's mine road after the mine closed.

Passing the trial earns Guild steel and the Guild's writ for the castle's closed east road. That road leads to Slatefall and its mines. Where Marvin's last expedition went stays between him and Varrow (T-17).

## 3. Where Lirold unlocks

**Gate (shipped): Upper Canopy wave 15 (the Harpy Matriarch kill).** `UNLOCK_RULES`: `waveReached` `upperCanopy` 15 → town `lirold`, with a notification. Wave 15 is the Boss wave, so `waveReached` 15 means the Matriarch is dead.

- **After the whole Mawood chain.** The Upper Canopy is the last Zone (tier 7). Its entrance needs *Feathers for a Kite*, which needs *The Blighted Heart*, so every Mawood Zone is behind it.
- **A Boss gate here, unlike other Towns.** Other Towns open on a non-Boss wave because the Town sits partway into its Zone. The capital is seen *from* the top of the last Zone, so the reward for reaching the top is the view. The Upper Canopy has no next Zone, so its Boss kill raises no second popup.
- **Not a mid-Zone wave.** Wave 8 (where Milo's *What Lurks at the Top* sends the player) would open the capital before the Matriarch and split the Mawood ending.

**How the player gets from the Elderwood to a city south of the beach:**
1. They don't take the mine road. The castle closed the road from the Pass down to Slatefall when the mine collapsed two winters ago. It is barred where it leaves the Pass, and a Troll squats on it (the trial's step 2).
2. So the player travels back the way they came: over the Pass, down the Long Path, across the Plains to Horseshoe Beach, then along the coast road south to the north gate.
3. In play this is a click on the world map, like Mawood. The town picker hard-codes La Harpar (`towns-shops-guild.md` Known issues), so the map is the only way in.

**Popup** (`unlocks.json` `towns.lirold`), title shipped as "Lirold Discovered!":
- body, shipped: "From the Matriarch’s nest you can see past the mountains: a road winding south off the Pass, and at its end stone walls and a castle under the mountains. Lirold, the capital of Port Stocksmar. Travel there from the Map; its Arena takes any challenger who can pay the gate."
- body, once the Guild hall ships (the wording `lirold-arena-master.md` §3 already proposes): "From the Matriarch’s nest you can see past the mountains: a road winding south off the Pass, and at its end stone walls and a castle under the mountains. Lirold, the capital of Port Stocksmar. Travel there from the Map: the Exploration Guild’s hall is there, and an Arena for anyone who can pay the gate."

**Guild tasks** keep rolling from unlocked Zones with `tier <= rank + 1`. `ExplorationGuildService` needs no change.

## 3a. Map placement brief

**Superseded:** the map was redrawn at 3072×2048 (2026-10-31) and Lirold's marker sits at (600, 1180) in `src/data/world-map-data.ts`; the canvas sizes and coordinates below are from the old 2794-wide map (`docs/design/southern-map-expansion.md`).

Placement only, no art plan. The world map source (`src/assets/img/world/source.png`, 2794×752, x right, y down) is extended **at the bottom only**, to about **2794×1100**, so every existing marker keeps its coordinates. The new strip (y 752–1100) continues what touches its top edge: sea on the far left, coast and green land at x ~250–750, the mountain range at x ~780–1400.

| What | Target area (px, extended canvas) | Subject |
|---|---|---|
| Coast road | From Horseshoe Beach (200, 430) south along the shore to Lirold's north gate (~420, 830) | A dirt road along the shore, through grass and low dunes. |
| Lirold (walled city + castle) | Box x 300–650, y 830–1030. Castle at ~(470, 930); Town marker there (replaces the old (730, 110)). | A large city ringed by grey stone walls with towers; a north gate to the coast road, an east gate to the mountain road. A many-towered castle in the centre; dense slate-roofed houses, a market square, banners. |
| Mine road to the Mountain Pass | East gate (~650, 930) → east along the southern foothills (~850, 900) → (~1050, 860) → Slatefall (~1180, 840) → north up a valley to the Mountain Pass marker (1250, 550) | A paved road becoming a stone track as it climbs; switchbacks on the last stretch; a timber barrier across it just below the Pass (~1245, 610). |
| Slatefall + mine entrance | Village at ~(1180, 840), box ~1120–1260 × 800–880. Mine mouth at ~(1230, 780) on the slope above; Zone markers for the Deeper Mines and the Lower Shafts there, a few px apart. | A small cluster of stone cottages on a mountainside terrace; spoil heaps and a quarry cut; ore-cart rails running up to a timber-framed tunnel mouth in the rock. |

After the canvas grows, `WORLD_MAP_DATA.manifest.height` becomes 1100 and the tiles are regenerated (`npm run tile`). `defaultView.center` may move down (main thread's call). The mountains must reach into the new strip so the road has something to climb.

## 4. Lirold, the Town (design)

**(The Town, Arena and Forge are shipped; the Guild hall and everything about it below are proposed.)**
- **Look:** stone and slate, where La Harpar is driftwood. A large walled city with a castle at its centre, a north gate onto the coast road and an east gate onto the mine road (closed by castle order until the trial), banners and a busy square. Its slate comes from Slatefall.
- **Palette:** limestone white, slate blue-grey, Guild orange (Marvin's scarf) on banners.
- **The castle:** who rules from it is not said anywhere (thread T-24).

| Building | Who | Notes |
|---|---|---|
| Arena (`TownBuildingID.liroldArena`), shipped | Ludo Crane | `arena.md` |
| Forge (`TownBuildingID.liroldForge`), shipped | Phurgo | `towns-shops-guild.md` |
| Exploration Guild (existing `TownBuildingID.explorationGuild` and `map.json` label, moved from La Harpar), proposed | Guildmaster Odile Varrow (`NpcID.liroldVarrow`) | Map table, ledgers, a training yard. Lirold's third Building. Background: reuse `laHarparExplorationGuild.png` at first, repaint as a capital hall later (owner call). |

A further capital NPC (a gate sergeant, a castle clerk) is left for later; the trial and the deeds work with Varrow alone.

### Guildmaster Odile Varrow
Head of the Exploration Guild. Ex-cartographer in her fifties who walked half the charts on her own wall before she took the hall. Serious and exact, without humour. She treats the player as a source: she asks where, which way and how far before she asks anything else, and grades everything she knows by who told her. She sends people like Marvin where she wants charts and writes down who has not come back. Voice sheet: `docs/character/lirold/varrow.md`. Script: §8b.

## 5. The Guild before and after the capital

**La Harpar Guild building: removed.** Marvin is not running a Guild building, so La Harpar loses `explorationGuild` (the ID and label move to the capital). **Marvin moves into the Tavern** with the Bartender and Josh. That fits the shipped lines: the Bartender's "You can usually find him nearby", and "back from an expedition" (a man at the tavern, not at a desk). Pick over "Marvin's house" because it needs no new Building or background.

**Owner design (2026-10-27):**

| | Marvin (La Harpar Tavern) | Varrow (Guild hall, Lirold) |
|---|---|---|
| Until the player has met Varrow (flag `met_liroldVarrow` not set) | Contracts (accept, claim, cancel) and the Guild store at **stage 0**. Says the hall in Lirold has more in stock. | Locked until the Town opens; after that, her first-meet node sets the flag. |
| After (flag `met_liroldVarrow` set by her first-meet node) | No store and no contract options; one option redirects to Varrow (`redirectVarrow`, §8a). Tips and lore stay. | Full contract options and the Guild store at **stage 1**. |
| Combat tips | Always (§7, §8a). | No; she sends you to Marvin. |
| *The Cold Forge* step 3, Pathfinder's Seal registration and reminder (owner call, §10) | Always: the road book and its salvage pages stay with him. | No; `sealToMarvin` sends a Seal holder to him. |
| Deed lines | — | Yes (§8b). |
| *The Guild Trial* | — | Yes, with the Slatefall PR (§6). |

- **One shop, stock stages.** Both NPCs open `explorersGuildStore`. Same shop id, so same runtime stock: a one-off item the player didn't buy from Marvin is still in stock at Varrow, plus the stage-1 items.
  - Mechanic, shipped: optional `minStage` on `ShopItem` (default 0) and optional `stage` on the dialogue `shop` effect (default 0). Items with `minStage` > `stage` are hidden. No shop uses it yet; this feature only sets the data.
  - Called "stage" so it doesn't clash with `tier` (item rarity) or `minRank` (Guild rank), which `ShopItem` already has. `minRank` still applies inside each stage.
- **Active contracts carry over**: they live on the player (`PlayerStore.activeTasks`), so a contract taken from Marvin is claimed at Varrow.
- **Finished-task shortcut**: `GameNavigationService.talkToMarvin` becomes `talkToGuild` and opens Marvin in the La Harpar **Tavern** until `met_liroldVarrow` is set, then Varrow in the Lirold Guild hall. It finds them with `npcPlace(...)`, not a hard-coded Town and Building: the old `laHarpar` + `explorationGuild` pair finds nothing after the move, and `talkTo` returns silently.
- **No save migration.** A save standing in La Harpar's `explorationGuild` resolves no Building and falls back to the La Harpar town view (`towns.store.ts`). Active tasks, bought items and `permanentBonuses` are untouched; `ensureShop` appends the new stock by item id. No `inventorySlots` bonus drops. Don't bump `SAVE_VERSION`.
- **`la-harpar-quests.md` Marvin quests** (S4, S6, T3 step-1 turn-in) stay with Marvin; quest options are not flag-gated.

### Store stages (owner call)

Prices are Explorer Tokens. Stage 0 is all of today's stock; stage 1 is three new hall items (owner, 2026-11-08). Token sources: contracts pay 1/2/3 × the target Zone's tier, and a task targets a random unlocked Zone with `tier <= rank + 1`, drawn evenly from every regular enemy of those Zones (`exploration-guild.service.ts`), so with all eight Zones open a short task averages about 4 (91 tokens over 23 targets). Zone mastery chests pay 3 × tier per star, 261 tokens across all stars of the eight Zones. Stage 1 totals 280 tokens, a post-Mawood sink at 60–80 each.

| Stage | Item | Price | Stock | `minRank` | Note |
|---|---|---|---|---|---|
| 0 | Minor Mana Potion | 1 | 10, refreshes | — | shipped |
| 0 | Crab Stew recipe | 4 | 1 | — | shipped |
| 0 | Cheese Platter recipe | 6 | 1 | — | shipped |
| 0 | Skill Point Book | 15 | 1, refreshes | — | shipped |
| 0 | Guild Satchel (+2 slots each to Gear, Consumables and Materials) | 20 | 1 | 1 | shipped |
| 0 | Hunter's Feast recipe | 12 | 1 | 1 | shipped |
| 0 | Ambush Scroll | 25 | 1 | 1 | shipped |
| 0 | Second Contract (+1 `maxTaskSlots`) | 40 | 1 | 2 | shipped, stays at stage 0 |
| 0 | Bounty Mark (+10% `taskDoubleKillChance`) | 40 | 1 | 2 | shipped, stays at stage 0 |
| 1 | **Third Contract** (`thirdContract`, new): +1 `maxTaskSlots` | 80 | 1 | 4 | Same kind as Second Contract. "The hall trusts you with three." |
| 1 | **Varrow's Seal** (`varrowsSeal`, new): +10% `taskDoubleKillChance`, stacks with Bounty Mark | 80 | 1 | 3 | Same kind as Bounty Mark. The Guildmaster's stamp on your contracts. |
| 1 | **Guild Pack** (`guildPack`, new): +2 slots each to Gear, Consumables and Materials | 60 | 2 | 3 | Same kind as Guild Satchel, which ships at `inventorySlots` 2 per tab, not the +5 this table used to say; for the post-Mawood drop load. |

`npm run sim` has no token or task model, so it can't check these prices; the figures above are the check.

### Shipped La Harpar lines to change

Only lines that place the Guild itself in La Harpar, or make Marvin its head, need to change on other NPCs. Marvin's own file is replaced whole by §8a. Lines that only place Marvin stay as they are.

| Key | Now | Proposed |
|---|---|---|
| `laHarparElara.json` `marvinLocation.message` | "He is probably training people at the local exploration guild." | "He is probably in that tavern, I'm afraid, training anyone who'll listen. He's the only one in there doing anything." |
| `laHarparTrader.json` `aboutPeople.message` | "…And Marvin just returned from an expedition—you'll find him near the guild." | "There's Josh at the tavern; he's a good soul but leans a bit too hard on the bottle. The bartender is always swamped, so she's likely looking for help. And Marvin just returned from an expedition—he's a guild man, and you'll find him at the tavern too." |
| `laHarparTrader.json` `aboutGuild.message` | "The Exploration Guild. It's the main hub for local adventurers. You should pay them a visit; they'll help you get prepared for the road." | "The Exploration Guild, aye! Second-finest outfit in Port Stocksmar, after this shop. Their hall's down in Lirold, the capital, but Marvin's one of theirs. Have a word with him; he'll help you get prepared for the road." |
| `unlocks.json` `towns.laHarpar.body` | "…and seek out the Exploration Guild for bounty tasks." | "A fishing village lies nearby. The Map tab is now available — use it to travel there. Once inside, visit the Tavern for rumors and hunting contracts, and browse the Market for supplies." |
| `unlocks.json` `towns.lirold.body` | §3, shipped | §3, once the Guild hall ships |
| `quests.json` `steps.theColdForge.3` and `quests-data.ts` step 3 **(added in this revision: names the removed Building)** | "Ask Marvin at the Exploration Guild in La Harpar to check Phurgo's old delivery record." | "Ask Marvin at the tavern in La Harpar to check Phurgo's old delivery record." |
| `app.json` `battle.talkToMarvin` **(added in this revision: wrong once `talkToMarvin` opens Varrow)** | "Talk to Marvin to claim this task" | "Take this contract to the Guild to claim it" |

These stay: `Bartender#anyoneWhoCanTrainMe1` ("You can usually find him nearby"), `Elara#villagersOpinion`, `Elara#marvinInfo`, `Bartender#default.anyTrainer`, `Phurgo#coldForgeRecord` ("Marvin keeps the road records…in La Harpar"), `Ludo#pathfindersSealInfo` ("Take it down to Marvin in La Harpar").

## 6. The Guild Trial (Varrow)

**Ships with the Slatefall PR** (owner, 2026-11-08): there is no `TownID.slatefall` yet, so the trial's unlock rule has no target. The quest, its Varrow nodes (§8b hub options 1, 2, 4, 6 and 13; `questOffer` through `questCompleteIf`; `aboutOpenEntries` and `aboutOpenEntriesPush`, reached only through option 13) and the Guild Shortsword wait for it. Mechanics checked: `stepKillBaselines` resets on every advance, the Troll is the Mountain Pass Boss and reachable by changing Wave, and the item reward is guarded by `missingSlots`.

| ID | Giver | Zone | Start gate | Steps | Item source | Rewards |
|---|---|---|---|---|---|---|
| `guildTrial` — **The Guild Trial** (next free `QuestID`: 29 as of this revision, since `wicksOrder` is 28) | Varrow (Guild hall) | The Upper Canopy → Mountain Pass | `level` 1 (the capital itself is gated behind the Matriarch) | 1. Kill 60 Canopy Bandits (`enemy` `canopyBandit` 60).<br>2. Kill the Troll once (`enemy` `troll` 1). | none (kills only) | 5000 XP, 1000 gold, 1 skill point, 1 `guildShortsword`. Completing it unlocks Slatefall (`slatefall-and-the-deeper-mines.md` §3). |

Step descriptions (plain English, `quests-data.ts`, and `quests.json` `steps.guildTrial`):
1. "Guildmaster Varrow wants the castle's runaways out of the Spires before she'll say what the trial really is. Kill 60 canopy bandits."
2. "A troll has moved onto the Pass end of the castle's mine road, and Varrow can't get the road opened with it there. Kill it."

- **Kill counts:** both steps count kills made after the step starts (`stepKillBaselines`). The Troll is far below the player by now; step 2 is a short walk back for the story, not a fight.
- **Reward scale:** matches *What Lurks at the Top* (5000 XP, 1000 gold, 1 skill point), without its Skill Point Book and Harpy Crown. The weapon replaces those. Quest XP and gold are flat while Zone rewards double per tier, so late quests pay little next to kills; that is true of every shipped quest. Balance is the main thread's call (`npm run sim`).

**Clue beats:**
- **Offer:** the first step is a test of whether the player finishes dull work, and a bounty paid gets the castle in her debt. The second step stays unnamed.
- **Step 1 turn-in:** the castle shut its mine road two winters ago; she only has the castle's word for what happened at the mine, and the troll is the thing she can do something about.
- **Step 2 turn-in:** Guild steel, the writ for the east gate, and the first thing she has asked for rather than assigned: go to Slatefall and find out why it has gone quiet. She names Pell, already up there. If the player asks what happens if they don't come back, they become an open entry (T-32).

### New weapon (for `/add-equipment-item`)

| Field | Value |
|---|---|
| ID / name | `guildShortsword` / **Guild Shortsword** (next free `ItemID`: 210 as of this revision, since `petFarmingGuildHare` is 209) |
| Slot / type | weapon, `damageType` physical, tier **epic**, `unique: true` (like both shipped quest weapons) |
| Stats | **Open, settle in the Slatefall PR.** Owner brief (2026-11-08): comparable to the Talon Blade, not better; different stats; one unusual stat. Starting point: `attackPower` ~13, `attackSpeed` 0.1, plus one of: `taskDoubleKillChance` (Guild steel for contract work; no gate to bypass) or `shinyChance`. Any `shinyChance` above 0 turns shinies on without Shiny Hunter (`shiniesUnlocked` and the Bestiary read `shinyChance > 0`), so that choice also unlocks shinies early for whoever passes the trial. |
| Value | ~9000 |
| Why this tier | The Talon Blade (17 AP, 5 crit, epic, Giant Eagle 1/80 in the Upper Canopy) is the best weapon drop today, and step 1's ~180 Upper Canopy kills give about even odds of looting one first. The Gnoll Cleaver is 11 AP, the Bog Hammer 14. A side-grade with its own stat stays worth equipping beside the Blade. |
| One line | Guild-issue steel, short and light, made for long hunts. Every hunter who passes the Guildmaster's trial carries one. |

Icon needed (`/generate-2d-asset`).

## 7. Combat tips (checked against code, 2026-11-07)

Taught by **Marvin** in the La Harpar Tavern, from the start, when the player needs them. It fits his role: the shipped Bartender and Elara lines already call him the man who trains fighters. Varrow does not teach (owner call: copy the branch to her if wanted). Each tip is scripted in §8a in fiction: no "Wave", "node", "skill tree" or "XP" on the page. Only mechanics that work now; nothing about Splash or Overkill (no effect yet).

| Tip | Mechanical truth the line must keep | Said in fiction as | Source | Corrected from the old table |
|---|---|---|---|---|
| Waves | The last regular Wave has ×2 HP and ×2.2 XP and gold. Drop chances and the shiny chance don't scale, so farm materials on low Waves. | "stretch of country", "the far end", "near the start" | `zones-waves-unlocks.md` Wave scaling | — |
| Bosses | The last Wave is the Boss alone, 25× a regular's HP. Its kill opens the next Zone. Nothing hits back, so a stalled Boss just wastes time: go back, get stronger. | "the big one", "nothing past it opens up" | `zones-waves-unlocks.md`; `game-loop-and-combat.md` | — |
| Speed | `attackSpeed` is seconds between attacks, base 3. Lower it with gear, the Attack Speed node (5 levels) or Haste (−20% for 1 minute). Haste can be cast between fights. | "count", "attack speed, five drills' worth", "Haste" | `game-loop-and-combat.md`; `spells-and-buffs.md`; `player.ts`; `skill-tree-data.ts`; `spells.json` | — |
| Weaknesses | Needs the Weaknesses node, which needs Money Maker at level 1 (2 skill points). A hit matching the enemy's weakness deals ×1.2. Weapons hit their `damageType`; Fire Strike is fire. | "studied weaknesses", "money sense" | `game-loop-and-combat.md` Damage step 3; `skill-tree-data.ts`; `player.ts`; `enemies-data.ts` | The old table said "at level 5" (it is level 1) and "Weapons hit physical" (8 weapons have another element). The old tip's examples were wrong: goblins are water-weak and gulls air-weak. Now: fire for wolves, green slimes, rats, trolls; physical for crabs, goats, gnoll scouts. |
| Crits | `critChance` is how often (base 0), `critMulti` how hard (base ×1.2). Magic hits (Fire Strike) crit only with Spell Crit; Double Attack and Volley crit like weapon hits (`hit-resolution.ts`). | "finds the gap", "crit, hunters call it" | `game-loop-and-combat.md` Damage step 2; `player.ts`; `skill-tree.md` | — |
| Shinies | A recoloured spawn pays ×5 XP, ×10 gold and rolls its drops 10 times, plus its `shinyDrops`, on any Wave. Bosses can be shiny. Shiny chance is 0 until Shiny Hunter (10 skill points, after Weaknesses), then 1%. | "shinies", "shiny hunter", "one beast in a hundred" | `enemies-shiny-pets-bestiary.md`; `skill-tree-data.ts`; `skill-tree.json` | The old option "I saw a monster with odd colours" could not happen before the node, so the option now asks whether they exist. |

## 8. Dialogue scripts

Voices: `docs/character/laHarpar/marvin.md`, `docs/character/lirold/varrow.md`. Flag `met_liroldVarrow` here means `met_` + the `NpcID.liroldVarrow` value, the flag the engine reads (`met_laHarparMarvin` likewise: `met_4` today).

### 8a. La Harpar Marvin (`laHarparMarvin`, shipped tree, every line replaced)

All keys below replace `laHarparMarvin.json` in full, except `sealEffect` ("Register Pathfinder's Seal"), which is a UI tag and stays. Nodes marked **(new)** need enum members; add them after `sealReminder`. Structure and effects of existing nodes don't change unless stated.

#### introduction1
**Shown when:** first meeting. Every player who hasn't spoken to him lands here, including one sent by *The Cold Forge* after meeting Varrow, so this line says nothing of contracts.
> Ah, a fresh face! You look like the adventuring type, which means you've made the first mistake already and I can help with the rest. I'm Marvin, of the Exploration Guild. I only got back from an expedition a few days ago, so you've caught me with my boots off.

1. "Tell me more about this guild." → introduction2 (only if flag `met_liroldVarrow` not set) / introduction2Late (only if set)
2. "Skip the speech. What have you got?" → default · effect: set flag `met_laHarparMarvin` *(existing `opt2`, reworded because "Just show me the tasks" is false after the redirect)*

#### introduction2
**Shown when:** from introduction1 or whatIsThisPlace1, flag `met_liroldVarrow` not set
> We hunt for pay. The Guild writes a contract, so many of one beast, you go and kill them and come back, and it pays you in Explorer Tokens. Say you bring in five of those. Now you're up a rank, so I can send you farther out, and there's more in my pack I'm allowed to sell you. The hall's down in Lirold, the capital, with shelves I couldn't carry on a mule. You won't need those for a good while.

1. "Sounds good. Let's get started." → default · effect: set flag `met_laHarparMarvin`

#### introduction2Late (new)
**Shown when:** from introduction1, flag `met_liroldVarrow` set
> Then you've had all that from the Guildmaster already, and she'll have done it better. I don't run contracts for anybody on her roll. What I've got is a corner of this tavern, a very long book, and whatever I can teach you that she can't.

1. "Then teach me something." → tips (same results as the hub option) · effect: set flag `met_laHarparMarvin`
2. "I'm only passing through." → default · effect: set flag `met_laHarparMarvin`

#### default
**Shown when:** returning player
> Back again. What is it?

Options, in hub order:

1. Quest turn-ins and progress for `la-harpar-quests.md` S4/S6/T3 (if those ship), not flag-gated
2. "Phurgo's stamp says his last Slatefall load. What was on it?" → coldForgeRecord · effect: advance `theColdForge` (only if ready at step 3; not flag-gated) *(existing `coldForge`)*
3. "Here's a Pathfinder's Seal. Put me in your book." → sealRegistered · effect: register Seal (same conditions as today; not flag-gated) *(existing `registerSeal`)*
4. "I've finished a contract." → taskClaimed (only if a task is complete **and** flag `met_liroldVarrow` not set) *(existing `claimTasks`)*
5. "How are my contracts going?" → taskInProgress (only if a task is in progress **and** flag not set) *(existing `taskStatus`)*
6. "Give me a contract." → taskIntro (only if a task slot is free **and** flag not set) *(existing `taskIntro`)*
7. "What's in your pack?" → close · effect: open shop `explorersGuildStore`, stage 0 (only if flag not set) *(existing `store`)*
8. "Got any contracts for me?" → redirectVarrow **(new)** (only if flag `met_liroldVarrow` set)
9. "Teach me something about fighting." → tipsFirst **(new)** · effect: set flag `marvin_taught` (only if that flag not set) / tips **(new)** (if set)
10. "What did the Pathfinder's Seal teach me?" → sealReminder (same condition as today) *(existing `sealReminder`)*
11. "What is the Exploration Guild?" → whatIsThisPlace1 *(existing)*
12. "Where's the Guild hall?" → aboutHall **(new)** (only if flag `met_liroldVarrow` not set)
13. "What do you make of the Guildmaster?" → aboutVarrow **(new)** (only if flag set)
14. "What's that book you keep writing in?" → aboutBook **(new)**
15. "Where did that last expedition take you?" → aboutTrip **(new)**
16. "Elara says you're the only decent person here." → aboutElara **(new)**
17. "Sleeping any better?" → idleSleep **(new)**
18. "See you around, Marvin." → end *(existing `goodbye`)*

#### whatIsThisPlace1
> We map the unknown and thin out the dangers. That's what they've got carved over the door in Lirold, anyway. What it comes to is a road goes bad, and someone has to walk it and draw it, and before they can someone has to kill what's sitting on it. I've done both. Drawing's harder.

1. "How do contracts work, then?" → introduction2 (only if flag `met_liroldVarrow` not set)
2. "Thanks, Marvin." → default *(existing `opt1`, reworded)*

#### taskIntro
**Shown when:** flag `met_liroldVarrow` not set. Repeated line, kept plain. The numbers stay in the options so the player can compare (owner call).
> How long do you want to be gone? I'll find you a target on ground your rank lets me send you to. The beach is one stretch of road, the Plains two, and so on out from there, and the farther out, the more it pays.

1. "A short one: 25 to 50 kills, 1 token per stretch." → default · effect: accept short *(existing `short`)*
2. "A medium one: 50 to 200 kills, 2 tokens per stretch." → default · effect: accept medium *(existing `medium`)*
3. "A long one: 200 to 400 kills, 3 tokens per stretch." → default · effect: accept long *(existing `long`)*
4. "Actually, never mind." → default *(existing `back`)*

#### taskInProgress
> Still hunting. Keep at it, and come back when it's done.

1. "Call off the {{monster}} contract ({{left}} kills left)." → default · effect: abandon that task *(existing `cancel`, one per task)*
2. "Right, I'll keep going." → default *(existing `back`)*

#### taskClaimed
> Fine work out there! Hand it over and I'll pay you out.

1. "Pay me." → default · effect: claim *(existing `claim`)*
2. "Actually, not yet." → default *(existing `back`)*

#### coldForgeRecord
**Shown when:** after step 3 of `theColdForge` advances (works before and after `met_liroldVarrow`; the book travels with him)
> Forge, Lirold, last Slatefall load. Give me a moment, it's in here, I had this page out a week ago. There. Worked iron in strap and hoop, a crate of hinges he'd sent up to be reset, and his own heavy tongs coming home. Entered at the Slatefall post, and it's the last line I've got before the road shut. So he's owed what the goblins left, which isn't much, and you can tell him I said so.

Here's the rest of it. That hearth could have been working salvage this whole time, and he knows it, so don't argue with him. Say a friend of yours had sat two winters beside a cold fire. You wouldn't bring him a lecture. Get a Fish & Apple Pie in front of him and see that he stops for it. The recipe's on sale here in La Harpar.

1. "Is salvage Exploration Guild business?" → coldForgeSalvage
2. "I'll bring him a pie." → default

#### coldForgeSalvage
> It is when it's worth keeping. Half of what we do is bring useful things home, and there's sound work lying in every ditch on that road because whoever found it couldn't tell. So the back of my book's for salvage, and anybody with a Pathfinder's Seal goes in it and gets taught what to look for. The Arena in Lirold has a few of those among its prizes. Earn one on the sand and bring it to me.

1. "I'll keep an eye out." → default *(existing `opt1`, reworded)*

#### sealRegistered
**Shown when:** after the Seal is registered
> There, that's you in the salvage pages, and I'll keep the brass. Now hand me that. No, your own, whatever you've got. Look along the grain and check the seams, and never mind the polish, polish is what people do to bad work. Most of what you pull off a body is exactly what it looks like. About one piece in ten isn't, and from now on you'll be the one who notices, so you'll come away with a thing that's as good as worked once already. It won't happen with anything one of a kind. Or with a pet.

1. "I'll put that to use." → default *(existing)*

#### sealReminder
**Shown when:** bonus already registered
> Grain and seams, same as I showed you. You've got it now, it isn't in the brass. You won't see another of those Seals either, and you wouldn't need one.

1. "Thanks, Marvin." → default *(existing)*

#### redirectVarrow (new)
**Shown when:** flag `met_liroldVarrow` set
> You've met the Guildmaster. She asked you something before she said hello, didn't she? You're on her roll now, not my scrap of paper, so contracts and supplies go through the hall, and whatever you took from me she's already written down. I'm not brushing you off. I'd only be walking it to Lirold myself.

1. "Then teach me something." → tipsFirst / tips (same results as the hub option)
2. "That's a long walk for a contract." → default

#### aboutHall (new)
**Shown when:** from default, flag `met_liroldVarrow` not set
> Lirold, down the coast road from the beach. She won't have much to say to you yet. Say you walked in there today with crab on your boots: she'd ask you one question about the beach and go back to her table. Go somewhere nobody's drawn, do something she'll have to write down, and you won't need to introduce yourself.

1. "Who's she?" → aboutVarrow
2. "I'll get there." → default

#### aboutVarrow (new)
> Odile Varrow, the Guildmaster. She walked half the charts on that wall herself before she took the chair. She sent me on my last trip and she'll have my report before anybody. I write to her about whoever comes through here, so yes, you too, nothing you'd mind. Just don't tell her you walked a thing in four days if it was five. She knows how far it is.

1. "Where did she send you?" → aboutTrip
2. "I'll keep that in mind." → default

#### aboutBook (new)
**Shown when:** from default. The one subject he runs on about.
> The road book! Well, it's meant to be a road book. Every hand in the Guild keeps some kind of record, and mine's got out of control. Every cart through a Guild post on the coast road or the Pass or the mine road since before my time, who it was for, what was on it, whether it got there, the stamps. The weather, where somebody thought to put it down. Say you want to know what a smith in Lirold paid for charcoal nine winters back. There it is. I've had people laugh at that. I've had the same people come back when there's a carter gone and a load gone and nobody who'll own to either, and I find them the page, and they stop laughing and start asking if I could possibly look up one more thing. I had to have a second pack made for it. There's a page near the middle where the old Slatefall hand starts drawing little birds in the margin every time a load's late, and I've never...

You didn't ask for all that.

1. "Not really, no." → default
2. "Birds?" → default

#### aboutTrip (new)
> Say you're on a ridge, second week out, and you've run off the end of the map. Everything you do from there, you're doing for the first time, so you go slow and you watch your feet. You drink before you're thirsty. You count your water twice. That's a real lesson, and it's free.

1. "That's not what I asked." → aboutTripPress **(new)**
2. "Fine. Teach me something." → tipsFirst / tips (same results as the hub option)

#### aboutTripPress (new)
> I know it isn't. The report's with the Guildmaster, it isn't finished, and neither's the chart. I came home with all my fingers. Leave it there for now.

1. "I'll ask her." → default
2. "Have it your way." → default

#### aboutElara (new)
> Does she. She comes across from the market every time I'm back and asks if I saw anything of her father, and I say no, and she thanks me. Very polite. I'd sooner she threw something.

1. "And did you see anything?" → aboutElaraNo **(new)**
2. "She doesn't seem the type to give up." → default

#### aboutElaraNo (new)
> I've told you what I tell her.

1. "So you have." → default

#### idleSleep (new)
**Shown when:** from default. Idle talk.
> No. Beds are too soft, you get like that. Most mornings I'm out on the sea wall before the boats, sitting with the old men while they do their nets. Nobody asks me a thing. One of them's been telling me the same story about a turbot since I was nine.

1. "You should rest while you can." → default
2. "I know how that goes." → default

#### tipsFirst (new)
**Shown when:** the first time the player asks to be taught
> Good. Most of them only want the contracts. I run drills round the back by the crab pots, when she isn't using the yard for barrels. Well, what are you getting wrong?

1. "You tell me." → tips

#### tips (new)
**Shown when:** from default or any tip node. Repeated line, kept plain.
> What do you want to work on?

1. "How deep should I push?" → tipWaves
2. "A boss won't go down." → tipBosses
3. "How do I hit faster?" → tipSpeed
4. "Do monsters have weak spots?" → tipWeakness
5. "How do I land a really hard hit?" → tipCrit
6. "Are the odd-coloured beasts real?" → tipShiny
7. "That's enough for today." → default

#### tipWaves (new)
> Say you need a sack of crab shell by tomorrow. Every stretch of country works the same way: small stuff near the start, bigger the farther in you push. So where do you stand? Right up at the far end with the big ones, or back near the start?

1. "The far end. Bigger beasts, more shell." → tipWavesFar **(new)**
2. "Near the start." → tipWavesNear **(new)**
3. "Skip the questions. How deep do I go?" → tipWavesRule **(new)**

#### tipWavesFar (new)
> No. Everyone says that. You've just spent your day hacking at something twice as tough, and you've come home with the same sack.

1. "Why the same sack?" → tipWavesRule

#### tipWavesNear (new)
> Right. Most recruits get that wrong, so either you're good or you guessed. Which?

1. "I guessed." → tipWavesRule
2. "They die quicker back there." → tipWavesRule

#### tipWavesRule (new)
> A beast at the far end takes about twice the killing of one at the start and pays a bit over twice the coin and experience. So when you're after money, or you want to get better, push as deep as you can stand. But it's carrying nothing extra. A crab's a crab, and the odds of good shell on it are the same wherever it's standing. When you want hides, shell, anything for the sack, stay near the start, where they go down fast and you get through more of them.

1. "Deep for coin, back for loot." → tips
2. "I'll go and try it." → default

#### tipBosses (new)
> Go home, is what you do. I had a lad called Dunn stand in front of the Gangster Crab for four days, and all he got out of it was a blunt sword and a lot of opinions. The big one stands alone at the far end of its stretch with more in it than two dozen of the others. It isn't going to finish you. Nothing out there has yet, has it? It just doesn't die, and you earn nothing for as long as it doesn't. So go back a way, kill what you can kill, and come back with better steel. You will have to come back, mind. Nothing past it opens up until it's down.

1. "So I've been wasting my time." → tips
2. "I'll go and kill something smaller." → default

#### tipSpeed (new)
> Count. Next time you're out, count between one swing and the next. A green hand gets to about three. Everything you've got happens when the blade lands, your edge, your luck, the lot, so the lower that count, the sooner all of it pays. Buy gear with speed in it. Train your attack speed, five drills' worth, that's as far as anyone takes it. And learn Haste, which takes a fifth off the count for a minute. Cast it while you're waiting on the next beast. It holds between fights, and it's wasted on something that's nearly dead.

1. "I'll start counting." → default
2. "What else have you got?" → tips

#### tipWeakness (new)
> They do. Every beast's got one thing it can't stand: fire, water, air, earth or plain steel. You won't see which until you've studied weaknesses, and nobody gets near that without picking up some money sense first. Money Maker, the old hands call it, and I don't know who decided the order. Once you've got it you can read it off them on sight, and a hit of the right kind bites harder.

Wolves, green slimes, rats and trolls can't stand fire. Crabs, goats and gnoll scouts hate plain steel, which is what most blades are. Fire Strike is fire whatever you're holding, and there are a few blades about with something else already in them.

1. "So I've been hitting everything wrong." → tips
2. "I'll study it." → default

#### tipCrit (new)
> Every so often a hit finds the gap. Crit, hunters call it. Two things to train: how often and how hard. You start with no chance of it at all, and when you do get one it's barely more than a plain hit. All chance and no weight is a lot of small surprises. All weight and no chance, you'll tell stories about the one time. Build both. Fire and the like never find the gap until you've trained spell crit.

1. "I'll build both." → default
2. "What else?" → tips

#### tipShiny (new)
> Real. Oh, they're real. I've seen eleven in my life and I can tell you where every one of them stood. A goat on the Pass, first one, the colour of old copper, on a rock, chewing, and nobody else in the party could see what was wrong with it. That's what you have to understand: until you've trained your eye they look like the next one, and you kill it and walk on. Shiny hunter, they call that eye, and it's the dearest thing anyone teaches, a good ten times the work of the rest, and you won't get near it until you can read weaknesses.

After that it's one beast in a hundred. Five times the experience, ten times the coin, and it's like going through ten of them for whatever they're carrying, and some have a thing on them no plain beast ever has. Same pay in the first mile as the last, so you may as well look where they die fast. Bosses too. I saw one of those once, up on the... no. That one's in the report.

1. "You've got a funny look on your face, Marvin." → default
2. "Right. Something else." → tips

### 8b. Guildmaster Varrow (`liroldVarrow`, new NPC, namespace `dialogues/liroldVarrow`)

`firstMeetNodeId` = `arrival`, default = `default`. Her first-meet options set flag `met_liroldVarrow`, which moves the Guild from Marvin to her.

#### arrival (new)
**Shown when:** first meeting (`met_liroldVarrow` not set). She doesn't look up until she has finished the line she's drawing.
> You've stood in the Matriarch's nest. Nobody on my roll has. Looking south from up there, could you make out the east gate of this city, or only the walls? Think before you answer. I've had that sightline in pencil for nine years.

1. "A road, some walls and a castle. Who's asking?" → arrivalWho · effect: set flag `met_liroldVarrow`
2. "Marvin sent me." → arrivalMarvin · effect: set flag `met_liroldVarrow` (only if flag `met_laHarparMarvin` set)
3. "Before I answer anything, what is this place?" → introduction · effect: set flag `met_liroldVarrow`

#### arrivalWho (new)
> Walls and a road, and the road comes off the Pass, so the ridge is lower than I've drawn it. I beg your pardon. Odile Varrow. I run the Exploration Guild from this room. The Mawood traders have been telling me for some while about a stranger who brought down a Spire that had gone bad, and you'd be the hunter they mean.

1. "Marvin told me about you." → arrivalMarvin (only if flag `met_laHarparMarvin` set)
2. "What does the Guild do here?" → introduction
3. "So what have you got for me?" → default

#### arrivalMarvin (new)
> He writes short letters and he hasn't been wrong about a hunter yet. From today your contracts are mine. Whatever you took from him is already entered here, so finish it and bring it to this table instead of walking back up the coast. The tokens spend the same, and there's more on these shelves than he can fit in a pack.

1. "Good. I was tired of that walk." → default
2. "He didn't say he was handing me over." → arrivalHandover

#### arrivalHandover (new)
> No, he wouldn't. He doesn't think of people as something you hand over. It's his book I depend on, and his judgement, and I've never once got him to use the word "roll".

1. "Let's see these shelves." → default

#### introduction (new)
> The Exploration Guild's hall, the only one we have. We're paid to walk the places nobody has drawn and to clear what makes them hard to walk. Hunters take contracts from me, so many of a given beast, and I pay in Explorer Tokens, which buy what's on those shelves and nothing else anywhere. Every fifth contract you bring back moves you up the roll. The higher you stand, the farther out I'll send you and the more of the shelves I'll open. We've one man down the coast in La Harpar, Marvin, if you haven't met him. He teaches.

1. "Put me on your roll." → default
2. "Tokens that only spend here? Fine." → default

#### default (new)
**Shown when:** returning player. Repeated line, kept plain.
> What have you got for me?

Options, in hub order (turn-ins, in progress, offers, then the rest):

1. "The troll's dead, and the road's clear." → questComplete · effect: advance quest `guildTrial` (only if `guildTrial` ready to turn in at step 2)
2. "Sixty bandits. Tell the castle it can pay." → questStep1Complete · effect: advance quest `guildTrial` (only if `guildTrial` ready to turn in at step 1)
3. "I've finished a contract." → taskClaimed (only if a task is complete)
4. "About your trial..." → questProgress1 (only if `guildTrial` active at step 1) / questProgress2 (only if active at step 2). One option, two results.
5. "How are my contracts going?" → taskInProgress (only if a task is in progress; includes the per-task cancel options)
6. "Got anything harder than contracts?" → questOffer (only if `guildTrial` available)
7. "Give me a contract." → taskIntro (only if a task slot is free)
7b. Turn-ins and progress for `la-harpar-quests.md` Marvin quests are not copied: they stay with Marvin.
8. "What has the Guild heard about me?" → deeds (one result per deed quest below, each "only if <quest> completed", all to `deeds`) / deedsNone (fallback)
9. "Can you register this Pathfinder's Seal?" → sealToMarvin (only if holding a Seal with no `upgradedDropChance`, as on Marvin's `registerSeal`)
10. "Teach me something about fighting." → noTips
11. "Why is the hall here and not on the coast?" → aboutCapital
12. "Where did you send Marvin?" → aboutExpedition
13. "What's that column in your ledger?" → aboutOpenEntries (only if `guildTrial` completed)
14. "How's the hall?" → idleHallForge (only if `theColdForge` completed) / idleHall (otherwise)
15. "Show me the guild store." → close · effect: open shop `explorersGuildStore`, stage 1
16. "Good day, Guildmaster." → end

#### taskIntro (new)
Same guild effects as `laHarparMarvin`. Repeated line, kept plain.
> How long can you be away? I'll find you something on ground your rank allows, and each leg out from the beach is worth more than the last.

1. "Short: 25 to 50 kills, 1 token per leg." → default · effect: accept short
2. "Medium: 50 to 200 kills, 2 tokens per leg." → default · effect: accept medium
3. "Long: 200 to 400 kills, 3 tokens per leg." → default · effect: accept long
4. "I've changed my mind." → default

#### taskInProgress (new)
> Still open, by my book. If one has gone bad on you, say so and I'll strike it.

1. "Strike the {{monster}} contract ({{left}} kills left)." → default · effect: abandon that task (one per task)
2. "Leave them. I'll finish." → default

#### taskClaimed (new)
> Finished? Give me the count and I'll enter it.

1. "Enter it and pay me." → default · effect: claim
2. "In a moment." → default

#### noTips (new)
> No. I could show you how to take a bearing in a snowstorm, but not how to hit anything. You want Marvin, in the tavern at La Harpar. I've sent him people who could barely lift a sword and had them back inside a season, earning.

1. "I'll ask him." → default
2. "I know how to hit things." → default

#### sealToMarvin (new)
> No, that book is Marvin's. He started the salvage pages and there's no other hand in them. The Seals are ours, and those chests at the Arena are the cheapest way I've found of putting one in front of people who come back from things. Take it down to him.

1. "La Harpar again." → default

#### aboutCapital (new)
> Because the castle signs for it. Every chart we draw goes up that hill and is paid for there, and a token's only good because the castle says so. I argued for the coast once, when I was younger and thought a Guild ought to smell of salt. A hall in a fishing village hears about fish. From this window I can see two gates, and everyone coming home off any road in Port Stocksmar walks through one or the other.

1. "So the castle owns you?" → aboutCastle
2. "It's your hall." → default

#### aboutCastle (new)
> It pays for paper. I couldn't tell you who reads it. Twenty years I've sent charts up that hill, and they come back signed with a seal and never once with a name.

1. "Doesn't that bother you?" → default
2. "As long as it pays." → default

#### aboutExpedition (new)
> See where the pins stop, on that wall? Past them. That's more than I've told the castle. What I have from him is pencil over pencil and his chart isn't finished, so I won't put a name to it, not for you and not for anyone who pays me.

1. "He came back, at least." → aboutExpeditionBack
2. "Keep your secret." → default

#### aboutExpeditionBack (new)
> He came back.

1. "I'll leave it there." → default

#### aboutOpenEntries (new)
**Shown when:** `guildTrial` completed. She has stopped calling the player "hunter" by now.
> Those are open entries. A member goes out, I write the bearing and the date, and when they report I close the line. Some lines have been open a long while. You came down off the Spires on the east face or the west? I've only got the west.

1. "How many are open?" → aboutOpenEntriesPush
2. "The west." → default
3. "The east, and it's worse." → default

#### aboutOpenEntriesPush (new)
> East or west.

1. "West." → default
2. "East." → default

#### idleHall (new)
**Shown when:** `theColdForge` not completed. Idle talk.
> Damp. Vellum takes it up all through the wet months and swells, so by spring the coast sits a finger west of where it has always been, and a fish buyer has stood where you're standing and told me so. The roof wants mending and that's Slatefall slate, and there's been none to mend it with for two winters.

1. "Buy better vellum." → default
2. "I'd keep out of the rain." → default

#### idleHallForge (new)
**Shown when:** `theColdForge` completed. Idle talk.
> Soot. Phurgo's flue is going again, and when the wind's off the square it comes straight through the map room. I've shuttered the west window and I'm working by lamp. I'm told you're the reason. I'll not be sending him a note about it. That hearth was cold for too long.

1. "You could thank me." → default
2. "I'll tell him you said so." → default

#### deeds (new)
**Shown when:** at least one deed quest completed
> Traders talk, Marvin writes, and I keep all of it. Which do you want to hear?

1. "You heard about the beach?" → deedBeach (only if `clearingOutTheBeach` completed)
2. "And the Trader's basement?" → deedRats (only if `ratsWereRats` completed)
3. "The gnoll Warchief?" → deedGnolls (only if `warTrophies` completed)
4. "The Spire in the Deepwood?" → deedTreant (only if `theBlightedHeart` completed)
5. "The Harpy Matriarch?" → deedMatriarch (only if `whatLurksAtTheTop` completed)
6. "Theron Tidecaller's trail?" → deedCaptain (only if `whereTheWeatherBreaks` completed) **(proposed quest, `la-harpar-quests.md` T4; drop this option if T4 doesn't ship)**
7. "That's enough about me." → default

Each deed node's last option is "That's enough about me." → default.

#### deedBeach (new)
**Checked:** `clearingOutTheBeach` is 50 kills on wave 7, turned in to Josh, paying his ring; it doesn't require the Gangster Crab, and no shipped line says "gang", so neither does this.
> Marvin's second letter. You cleared the far end of Horseshoe Beach for Josh, and Josh gave you a ring for it. I have that from the Trader's carters too, so I believe it. He held on to that ring a long time. Marvin thought it worth a line, so I've given it one.

1. "It's only a ring." → deeds

#### deedRats (new)
**Checked:** `ratsWereRats` is 50 rats in the Trader's Basement; the Trader's habit of boasting is shipped (`Trader#aboutMe`), the rats' growing size is new.
> The Trader at La Harpar tells every caravan about the rats in his basement, and they've grown each time. One carter had them the size of a cat, and the last held his hands apart, like this. I've put it down as fifty rats, of a size to be decided. Is that right?

1. "About fifty. They were rats." → deeds

#### deedGnolls (new)
**Checked:** `warTrophies` is the Warchief three times for Brenna's raided lumber (`Brenna#questWarTrophies`, `#questWarTrophiesProgress`).
> The carver at Mawood sends me nothing as a rule, and a line came down with a lumber factor. Her stocks have stopped walking off and her Warchief is dead three times over. Three times. Either that camp has an order of succession nobody's told me about or something up there doesn't stay dead, and I'd want to know which before I drew a line through it.

1. "You'd have to go and look." → deeds

#### deedTreant (new)
**Checked:** `theBlightedHeart`. Fixed: the old line said the black sap has stopped, which breaks `Corwin#postQuestLore` (recovery over years) and `Corwin#farmFinaleLine` (containable). "Gone quiet" is Corwin's own word (`#questBlightedHeartComplete`).
> Corwin's Spire, the one the whole blight came out of, if his word is good, and I've only his word. Nobody on my roll has gone that far into the Deepwood and reported. The traders have it gone quiet down there. Three hundred years of people living in that forest and my chart stops at the rim, with a river on it I don't believe in. When you're next down there, count your steps.

1. "I was busy." → deeds

#### deedMatriarch (new)
**Checked:** `whatLurksAtTheTop` is Milo's quest; he is 8 (`Milo#aboutMilo`). Fixed: dropped the invented feather market.
> The Matriarch. A boy of eight told a fur buyer you went up there because he asked you to, and the buyer told it to me as a joke. I've looked into it as far as I can from here. I think it's true.

1. "He's a good kid." → deeds
2. "He found a door up there, you know." → deedDoor

#### deedDoor (new)
**Lore:** T-12 and T-17, a hint only. Shown from `deedMatriarch`, so `whatLurksAtTheTop` is complete and Milo has found it (`Milo#questWhatLurksPostQuest`).
> In the tallest Spire. Set into the bark, you're telling me, with iron on it. Who else have you told? Keep it to that for a little while. No, I'm not going to tell you why, because I don't know why. There's a blank on my wall and I don't care for how well that fits.

1. "I've told nobody else." → deeds

#### deedCaptain (new, proposed)
**Checked:** T4's outcome is that Theron crossed the Pass alive. Fixed: Elara came to La Harpar "years ago", not necessarily five, so her letters run "since she came to the coast".
> The Tidecaller's trail, over the Pass, and alive when he crossed it. Elara has written to this hall every season since she came to the coast, and every season I've had to answer that I had nothing. This one I'll write myself, tonight. Would you... no. I'll write it.

1. "She's waited long enough." → deeds

#### deedsNone (new)
**Shown when:** no deed quest completed (fallback; in practice unreachable, since the capital unlocks after *The Blighted Heart*)
> A name and a rumour, so far. Bring me something I can enter.

1. "I'll see what I can do." → default

#### questOffer (new)
**Shown when:** `guildTrial` available. She is measuring the player.
> Contracts are piecework and anyone can have them. Guild steel I give to people I'd send somewhere, and first I want to see whether you finish what you're given when it's dull. The outlaws in the Spires are the castle's own runaways, with a price on each. Sixty of them, hunter. There's a second part, and I'll tell you that when the first is in.

1. "Sixty, and then you tell me the rest." → default · effect: start quest `guildTrial`
2. "Why should I care about the castle's runaways?" → questOfferWhy
3. "Not yet." → default

#### questOfferWhy (new)
> You shouldn't. I do, a little. A bounty paid is a favour owed, and the next thing I ask that castle for is a gate.

1. "Fine. Sixty." → default · effect: start quest `guildTrial`
2. "Not yet." → default

#### questProgress1 (new)
> Sixty canopy bandits, and I won't enter a number you haven't got. They're up with the harpies, if you've forgotten the way.

1. "On my way." → default

#### questStep1Complete (new)
> Sixty. That goes up the hill tonight, and the clerks will take a month over it. This next part is what I care about. You'll have seen the barrier where the mine road leaves the Pass. The castle shut that road two winters ago, when the Slatefall mine came down, and a troll has moved onto the Pass end of it. I can't get a road opened with a troll on it, however good my letters are. You've dealt with that sort before.

1. "It's as good as dead." → default
2. "What happened at the mine?" → questStep1Mine

#### questStep1Mine (new)
> The castle says it came down. That's one word from one source, and the source is whoever shut the road. Kill the troll first.

1. "Killing it." → default

#### questProgress2 (new)
> The troll, at the head of the mine road. You know the ground better than my chart does.

1. "Back to it." → default

#### questComplete (new)
**Shown when:** after `guildTrial` completes (rewards: 5000 XP, 1000 gold, 1 skill point, Guild Shortsword; needs 1 free inventory slot, the dialogue disables the option otherwise). The relationship changes here: no "hunter", and the first thing she asks rather than assigns.
> So the road's clear on our side, and I have that from someone whose word I'd put in ink, which I've not been able to say about that road since it shut. That's Guild steel. You'll think it's light. It's meant for walking a long way with. This is the writ for the east gate, with my name on it and the castle's seal under that.

Slatefall's at the far end. My apprentice is up there already, Pell, drawing what he can reach, and he'll ask you a great many questions. Answer them the way you'd answer me.

I don't know why that village has gone so quiet. I'd like to, and I'm asking you to go and see. You understand that isn't a contract.

1. "I'll bring you an answer." → default
2. "And if I don't come back?" → questCompleteIf

#### questCompleteIf (new)
> Your line stays open, with the rest. Take the east gate in the morning, the guard's better then.

1. "You're a comfort, Guildmaster." → default

### Needs a new effect or condition
- **Marvin's Shop button (owner: hide it):** a `shop` effect records the NPC in the saved `npcShops`, and the frame shows a Shop button from then on. It reopens at stage 0 of the same stock, so there's no exploit, but it contradicts his redirect. `TownBuildingComponent` hides `npcShops()[laHarparMarvin]` while `met_${NpcID.liroldVarrow}` is set: one condition, no new effect, covers old saves.
- **`talkToGuild`** (renamed from `talkToMarvin`): `talkTo(npcPlace(flagSet ? NpcID.liroldVarrow : NpcID.laHarparMarvin))`. Rename `app.json` `battle.talkToMarvin` with it. The quest log's "Talk to" link for *The Cold Forge* step 3 follows `npcPlace` already.
- **Third contract slot:** `MAX_CANCELLABLE_TASKS` (2, in `laHarparMarvin.ts`) becomes one shared constant of 3 used by both trees; Marvin's third cancel option stays hidden by `taskInProgressAt`. The battle nav bar's `.task-list` `max-height: 5.5rem` fits two rows, so raise it to fit three (about 7rem; check at 1920).
- **Wiring:** add `dialogues/liroldVarrow` to the translation namespaces in `app.config.ts`. Marvin stands in the Tavern at x50 (Bartender x85, Josh x15). Specs that hard-code his Building: `npc-places.spec.ts`, `cold-forge.spec.ts`, `pathfinders-seal-dialogue.spec.ts`.
- **Flag name:** always `met_${NpcID.liroldVarrow}` in code (it will be `met_15`), never a literal.
- Everything else exists: stock stages (shipped, §5), quest states, `flag` conditions (`met_liroldVarrow` set / not set), `stat` and `item` conditions as on `registerSeal`, guild task states; quest, guild, shop and flag effects (`docs/systems/dialogue.md`). `questCompleted` unlock rules are shipped too, for Slatefall.

## 9. New content

| Kind | ID | One line |
|---|---|---|
| Unlock rule | Upper Canopy wave 15 → `lirold` | Shipped; only the popup body changes (§3). |
| Building | `explorationGuild` moves from La Harpar to Lirold | La Harpar loses it; Marvin moves into the La Harpar Tavern. |
| NPC | `liroldVarrow` (Guildmaster Odile Varrow) | Guild head in Lirold: full contracts, store at stage 1, trial, deeds. Sets `met_liroldVarrow`. |
| NPC change | `laHarparMarvin` | Guild member in the Tavern: contracts and stage-0 store until `met_liroldVarrow`, then redirects; tips, road book, *The Cold Forge* step 3 and Seal registration always. Whole text file replaced (§8a). |
| Shop | `explorersGuildStore` stage data | §5; stage 0 / stage 1 split; new items `thirdContract`, `varrowsSeal`, `guildPack` (`/add-equipment-item` or the shop's upgrade-item pattern). Mechanic shipped. |
| Quest | `guildTrial` | 60 Canopy Bandits, then the Troll; unlocks Slatefall. **Slatefall PR.** |
| Item | `guildShortsword` | Epic unique side-grade to the Talon Blade, stats open (§6); quest reward. **Slatefall PR.** |
| Item | `thirdContract`, `varrowsSeal`, `guildPack` | The three hall items in §5. |
| Dialogue | `laHarparMarvin` whole tree; `liroldVarrow` new tree; four shipped lines on other speakers | §5, §8. |
| Flag | `marvin_taught` | Plays `tipsFirst` once. |
| Map | Capital marker at (600, 1180) on the 3072×2048 map | Shipped 2026-10-31. |
| Art | La Harpar town background without the Guild sign (§11), Guild hall background (repaint), Varrow portrait, icons for the three hall items; `guildShortsword` icon with the Slatefall PR | `/generate-2d-asset`. The Capital Town background is shipped (`backgrounds/lirold.png`). |

The renames (Lirold, Elderreach) are shipped. The map marker is live at (600, 1180).

**Docs to update on implementation:** `GLOSSARY.md` (Stock stage, Guildmaster, Guild hall), `docs/ideas/explorer-token-shop.md` (stock stages), `docs/systems/towns-shops-guild.md` (Guild hall in Lirold, Marvin in the Tavern, stock stages used, `talkToGuild`), `docs/systems/quests.md` and `dialogue.md` (Marvin's location at *The Cold Forge* step 3), `docs/systems/zones-waves-unlocks.md` (popup), `docs/character/laHarpar/README.md`, `docs/lore/` (proposed → shipped).

## 10. Owner calls in this revision

1. **Seal and *The Cold Forge* stay with Marvin for good**, after `met_liroldVarrow` too. Shipped Ludo, Phurgo and `quests-data.ts` all point at him, and it works at any stage: a player can start *The Cold Forge* or win a Seal before or after meeting Varrow. Varrow only points the player to him (`sealToMarvin`).
2. **Marvin keeps a road book** that he runs on about, from Phurgo's shipped "He'll want to tell you about the book". It replaces the old "talks in systems and numbers".
3. **Terms left in tips**, because a player can't find the thing without its name: Attack Speed, Haste, Fire Strike, Weaknesses, Money Maker, Spell Crit, Shiny Hunter and "crit" appear as ordinary hunters' words for trained knacks. "Skill tree", "node" and "skill point" never appear. If that's still too gamey, the alternative is a tutorial pulse on the node.
4. **Contract options keep numbers** ("25 to 50 kills, 1 token per stretch"). "Region tier" became "stretch" (Marvin) and "leg" (Varrow). Rank stays a word in the world: the shop already labels it.
5. **Guild Pack** follows shipped Guild Satchel (+2 per tab, not +5). Ambush Scroll added to stage 0 (shipped stock missing from the old table).
6. **Option removed:** "Raise your rank and ask me again" promised a reveal no mechanic gives; Varrow now just doesn't say.
7. **New small canon:** Varrow's open entries (T-32), Marvin and Elara's question (T-33), Varrow's hint that Milo's door fits a blank on her wall (T-12), and charts signed with a seal and no name (T-24). All open on purpose.
8. **Mechanics review (2026-11-08)** folded in: owner decisions at the top, §5 (stages, no migration), §6 (held for Slatefall, Shortsword brief), §8 (Shop button, `talkToGuild`, third slot, wiring).

## 11. Implementation plan

One branch, `feat/lirold-guild`, one PR into `staging`; each step is a commit. *The Guild Trial* and the Guild Shortsword are not in it (§6).

| # | Commit | What | Skill |
|---|---|---|---|
Each commit updates the system docs for the behavior it changes (AGENTS.md) and passes `npm run validate` on its own.

| # | Commit | What | Docs in the same commit | Skill |
|---|---|---|---|---|
| 1 | Hall stock | `thirdContract`, `varrowsSeal`, `guildPack` items (next free `ItemID`s), names, icons; `explorersGuildStore` stage-1 entries with `minStage` 1 (§5). Nothing shows them yet. | `towns-shops-guild.md` (stock stages in use), `explorer-token-shop.md`, `GLOSSARY.md` (Stock stage) | `/add-equipment-item`, `/generate-2d-asset` |
| 2 | The Guild hall moves | `NpcID.liroldVarrow`; `explorationGuild` Building moves to Lirold and La Harpar loses it; La Harpar town background repainted without the Guild building's sign (below); Guild hall background (reuse `laHarparExplorationGuild.png` first) and Varrow portrait; **Marvin moves to the La Harpar Tavern at x50 in this same commit**, or The Cold Forge step 3's `turnInNpc` stands nowhere and `validate-data.mjs` fails; `talkToMarvin` → `talkToGuild` on `npcPlace`, `app.json` key renamed; `quests.json` / `quests-data.ts` *The Cold Forge* step 3 text; `liroldVarrow` tree and text from §8b without the trial nodes; `app.config.ts` namespace; her shop effect at stage 1; shared cancellable-task constant of 3; `.task-list` height for three rows; specs `npc-places`, `cold-forge`, `pathfinders-seal-dialogue`. | `towns-shops-guild.md` (hall in Lirold, Marvin in the Tavern, `talkToGuild`), `quests.md`, `dialogue.md`, `GLOSSARY.md` (Guildmaster, Guild hall), `docs/character/` READMEs | `/add-town-building`, `/add-npc-dialogue`, `/generate-2d-asset` |
| 3 | Marvin's new tree | Whole `laHarparMarvin` tree and text from §8a, keeping `sealEffect`; contract and store options gated on `met_${NpcID.liroldVarrow}` not set; `marvin_taught`; Shop button hidden in `TownBuildingComponent`; specs for the redirect and the Shop button. | `dialogue.md`, `towns-shops-guild.md` (redirect, Shop button) | `/add-npc-dialogue` |
| 4 | Other speakers | The rest of the §5 table: Elara, Trader, both `unlocks.json` popups. | `zones-waves-unlocks.md` (popup) | — |
| 5 | Wrap-up docs | `slatefall-and-the-deeper-mines.md` (owns `guildTrial` now; drop the stale "`questCompleted` is new" rows); `docs/lore/` proposed → shipped for what ships; this doc's status; `CHANGELOG.md` `[feature]` lines. | — | — |
| 6 | Check | `npm run check`; `verify-yari` in a subagent: meet Marvin, take a contract, unlock Lirold, meet Varrow, claim the contract there, buy a stage-1 item, see Marvin redirect with no Shop button, run *The Cold Forge* step 3 and a Seal registration at Marvin after meeting Varrow, three tasks in the nav bar at 1920, La Harpar town view shows no Guild sign. | — | `verify-yari` |

**La Harpar background** (`src/assets/img/backgrounds/laHarpar.png`): the big stone-and-timber building on the right carries an "EXPLORATION GUILD" sign. With the Building gone it must stop reading as the Guild. Inpaint the sign (`--source` with `--mask`, `town-painterly` family) into a plain carved board with no lettering: SDXL can't be trusted with new text. The building stays as a village house with no button.
