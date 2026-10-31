# Lirold & the Exploration Guild

**Scope:** M · **Status:** Proposed (revision 5, 2026-10-27). File name kept from before the rename.

> `la-harpar-quests.md` (the Tidecaller questline and La Harpar side quests) is a proposed draft in `docs/ideas/`. Its ItemID reservation (134–143) is void: shipped items took those ids. Everything below that cites it is conditional on it shipping, including the ID numbers it reserves.

Lirold, the capital of Port Stocksmar, becomes a Town the player reaches **after the Elderwood chain**. The Exploration Guild's hall is there, run by a new Guildmaster, **Odile Varrow**. She gives *The Guild Trial*, knows the player's deeds, and has the full Guild store and contracts. **Marvin stays in La Harpar for good**: a Guild member back from an expedition, now in the Tavern. Until the player meets Varrow he sells a few Guild items and handles contracts; after that he sends them to her. He also teaches combat. The road from the capital to the Mountain Pass and the mining village on it are in [`slatefall-and-the-deeper-mines.md`](slatefall-and-the-deeper-mines.md).

**Owner decisions in force (2026-10-27):**
- The capital lies **south** of Horseshoe Beach: a large city inside stone walls with a castle at its centre. A road runs from it to the Mountain Pass, with a mine near the Pass on that road.
- On the world map: marker at (600, 1180) since the 2026-10-31 redraw (§3a is superseded).
- It unlocks **after the Mawood Zones** (Elderwood Wilds, the Deepwood, the Upper Canopy).
- Some capital NPCs acknowledge what the player did in La Harpar and Mawood.
- Renamed and shipped: North Lirold → **Lirold** (`TownID.lirold`), Southback → **Elderreach** (`RegionID.elderreach`).
- Marvin stays in La Harpar; only the Exploration Guild moves to the capital, under a new NPC.
- Guild split: Marvin sells a stage-0 store and handles contracts until the player has met Varrow, then redirects to her; one shop with stock stages (§5).

## 1. Lore already in the game

| Fact | Source |
|---|---|
| Lirold is the capital of Port Stocksmar. La Harpar and Horseshoe Beach are "important trade partners" to it. | `laHarparJosh.json` `beachName` |
| La Harpar has been "a vital partner to Lirold for a long time". | `laHarparTrader.json` `aboutFishermen` |
| The four known Regions are Elderreach, Port Stocksmar, Greefic Hill and Saint Nestroud. | `laHarparJosh.json` `regionsInfo` |
| Lirold exists as a Town with no Buildings. Its world map marker is commented out at (730, 110), next to the Plains; that position is wrong and is replaced in §3a. No shipped text says which way the city lies. | `src/data/towns-data.ts`, `src/data/world-map-data.ts`, `map.json` `towns.lirold` |
| Marvin: "head of the Exploration Guild". The Guild "map[s] the unknown and thin[s] out the dangers", pays Explorer Tokens, and raises Guild rank every 5 tasks. | `laHarparMarvin.json` `introduction1`, `introduction2`, `whatIsThisPlace1` |
| Marvin is "the only decent person living here" (La Harpar), "an adventurer", "a very skilled warrior", back "a few days ago" from an expedition. | `laHarparElara.json` `villagersOpinion`, `marvinInfo`; `laHarparTrader.json` `aboutPeople` |
| Marvin trains fighters: "specializes in combat training" (Bartender); "probably training people at the local exploration guild" (Elara). No training exists in the game today. | `laHarparBartender.json` `anyoneWhoCanTrainMe1`, `laHarparElara.json` `marvinLocation` |
| The Guild is "the main hub for local adventurers" and will "help you get prepared for the road". La Harpar's unlock popup sends the player to it. | `laHarparTrader.json` `aboutGuild`, `unlocks.json` `towns.laHarpar.body` |
| The Upper Canopy is the highest point in the game; the Harpy Matriarch nests in the crown of the tallest Spire. The Canopy Bandits are outlaws who fled up there. | `mawoodMilo.json` `aboutCanopy*`; design only: `docs/design/mawood-and-elderwood-zones.md` |
| Mechanics: the Guild sits in La Harpar (Horseshoe Beach wave 5). The Upper Canopy is the last Zone: tier 7, maxWave 15, Boss Harpy Matriarch, no `nextZoneId`. `UNLOCK_RULES` read `waveReached`, `hasItem`, `levelReached` only. | `towns-shops-guild.md`, `zones-waves-unlocks.md`, `zones-data.ts`, `unlock-conditions.ts` |

## 2. The story

The Exploration Guild is chartered by the capital, which pays for its charts and honours its Explorer Tokens. Its only hall stands in the capital, under Guildmaster Odile Varrow. Marvin is La Harpar-born and a Guild member, home in the village after an expedition Varrow sent him on. He drinks in the Tavern, trains anyone who asks, and as a member hands out contracts and a few Guild supplies from his pack. He tells the player what the Guild is and that the hall in Lirold has far more. Once the player has met Varrow, the Guild's business goes through her.

The player climbs the beach, the Plains, the Long Path, the Pass and the Elderwood. From the Harpy Matriarch's nest in the crown of the tallest Spire, the highest point anywhere, they see what the forest hid: south, past the mountains, a road coming down off the Pass, and at its far end grey walls and a castle under the mountains.

In the capital, Varrow already knows the player's deeds (§8b) from traders and Marvin's letters. She gives the Guild's one trial:
- Bring in the outlaws who fled the capital's law into the Spires.
- Kill the Troll that came down onto the castle's mine road after the mine closed.

Passing the trial earns Guild steel and the Guild's writ for the castle's closed east road. That road leads to Slatefall and its mines. Where Marvin's last expedition went stays between him and Varrow (T-17).

## 3. Where Lirold unlocks

**Gate: Upper Canopy wave 15 (the Harpy Matriarch kill).** `UNLOCK_RULES`: `waveReached` `upperCanopy` 15 → town `lirold`, with a notification. Wave 15 is the Boss wave, so `waveReached` 15 means the Matriarch is dead.

- **After the whole Mawood chain.** The Upper Canopy is the last Zone (tier 7). Its entrance needs *Feathers for a Kite*, which needs *The Blighted Heart*, so every Mawood Zone is behind it.
- **A Boss gate here, unlike other Towns.** Other Towns open on a non-Boss wave because the Town sits partway into its Zone. The capital is seen *from* the top of the last Zone, so the reward for reaching the top is the view. The Upper Canopy has no next Zone, so its Boss kill raises no second popup.
- **Not a mid-Zone wave.** Wave 8 (where Milo's *What Lurks at the Top* sends the player) would open the capital before the Matriarch and split the Mawood ending.

**How the player gets from the Elderwood to a city south of the beach:**
1. They don't take the mine road. The castle closed the road from the Pass down to Slatefall when the mine collapsed two winters ago. It is barred where it leaves the Pass, and a Troll squats on it (the trial's step 2).
2. So the player travels back the way they came: over the Pass, down the Long Path, across the Plains to Horseshoe Beach, then along the coast road south to the north gate.
3. In play this is a click on the world map, like Mawood. The town picker hard-codes La Harpar (`towns-shops-guild.md` Known issues), so the map is the only way in.

**New popup** (`unlocks.json` `towns.lirold`):
- title: "Lirold Discovered!"
- body: "From the Matriarch's nest you can see past the mountains: a road winding south off the Pass, and at its end stone walls and a castle under the mountains. Lirold, the capital of Port Stocksmar. Travel there from the Map — the Exploration Guild's hall is there, the one Marvin keeps talking about."

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

**(proposed; nothing below is shipped.)**
- **Look:** stone and slate, where La Harpar is driftwood. A large walled city with a castle at its centre, a north gate onto the coast road and an east gate onto the mine road (closed by castle order until the trial), banners and a busy square. Its slate comes from Slatefall.
- **Palette:** limestone white, slate blue-grey, Guild orange (Marvin's scarf) on banners.
- **The castle:** who rules from it is not said anywhere (thread T-24).

| Building | Who | Notes |
|---|---|---|
| Exploration Guild (existing `TownBuildingID.explorationGuild` and `map.json` label, moved from La Harpar) | Guildmaster Odile Varrow (`NpcID.liroldVarrow`) | Map table, ledgers, a training yard. Only Building at launch. Background: reuse `laHarparExplorationGuild.png` at first, repaint as a capital hall later (owner call). |

A second capital NPC (a gate sergeant, a castle clerk) is left for later; the trial and the deeds work with Varrow alone.

### Guildmaster Odile Varrow
Head of the Exploration Guild. Ex-cartographer in her fifties who walked half the charts on her own wall before she took the hall. Precise and measured, dry rather than warm. She talks in ledgers and numbers and calls the player "hunter". She knows more than she says, sends people like Marvin where she wants charts, and never explains why. Character file: `docs/character/lirold/varrow.md`. Script: §8b.

## 5. The Guild before and after the capital

**La Harpar Guild building: removed.** Marvin is not running a Guild building, so La Harpar loses `explorationGuild` (the ID and label move to the capital). **Marvin moves into the Tavern** with the Bartender and Josh. That fits the shipped lines: the Bartender's "You can usually find him nearby", and "back from an expedition" (a man at the tavern, not at a desk). Pick over "Marvin's house" because it needs no new Building or background.

**Owner design (2026-10-27):**

| | Marvin (La Harpar Tavern) | Varrow (Guild hall, Lirold) |
|---|---|---|
| Until the player has met Varrow (flag `met_liroldVarrow` not set) | Contracts (accept, claim, cancel) and the Guild store at **stage 0**. Says the hall in Lirold has more in stock. | Locked (Town not unlocked yet). |
| After (flag `met_liroldVarrow` set by her first-meet node) | No store and no contract options; one option redirects to Varrow (`redirectVarrow`, §8a). Tips and lore stay. | Full contract options and the Guild store at **stage 1**. |
| Combat tips | Always (§7, §8a). | No; she sends you to Marvin. |
| *The Guild Trial*, deed lines | — | Yes (§6, §8b). |

- **One shop, stock stages.** Both NPCs open `explorersGuildStore`. Same shop id, so same runtime stock: a one-off item the player didn't buy from Marvin is still in stock at Varrow, plus the stage-1 items.
  - Mechanic, to be built by the main thread: optional `minStage` on `ShopItem` (default 0), and optional `stage` on the dialogue `shop` effect (default 0). Items with `minStage` > `stage` are hidden.
  - Called "stage" so it doesn't clash with `tier` (item rarity) or `minRank` (Guild rank), which `ShopItem` already has. `minRank` still applies inside each stage.
- **Active contracts carry over**: they live on the player (`PlayerStore.activeTasks`), so a contract taken from Marvin is claimed at Varrow.
- **Finished-task shortcut**: `GameNavigationService.talkToMarvin` opens Marvin in the La Harpar **Tavern** until `met_liroldVarrow` is set, then Varrow in the Lirold Guild hall.
- **`la-harpar-quests.md` Marvin quests** (S4, S6, T3 step-1 turn-in) stay with Marvin; quest options are not flag-gated.

### Store stages (owner call)

Prices are Explorer Tokens. Stage 0 is today's rank-0 and rank-1 stock; stage 1 is today's rank-2 stock plus three new hall items. Late contracts pay 1/2/3 tokens × tier (tier 7 long = 21), so the new items sit at 60–80.

| Stage | Item | Price | Stock | `minRank` | Note |
|---|---|---|---|---|---|
| 0 | Minor Mana Potion | 1 | 10, refreshes | — | shipped |
| 0 | Crab Stew recipe | 4 | 1 | — | shipped |
| 0 | Cheese Platter recipe | 6 | 1 | — | shipped |
| 0 | Skill Point Book | 15 | 1, refreshes | — | shipped |
| 0 | Guild Satchel (+5 inventory slots) | 20 | 3 | 1 | shipped |
| 0 | Hunter's Feast recipe | 12 | 1 | 1 | shipped |
| 1 | Second Contract (+1 `maxTaskSlots`) | 40 | 1 | 2 | shipped, moves to stage 1 |
| 1 | Bounty Mark (+10% `taskDoubleKillChance`) | 40 | 1 | 2 | shipped, moves to stage 1 |
| 1 | **Third Contract** (`thirdContract`, new): +1 `maxTaskSlots` | 80 | 1 | 4 | Same kind as Second Contract. "The hall trusts you with three." |
| 1 | **Varrow's Seal** (`varrowsSeal`, new): +10% `taskDoubleKillChance`, stacks with Bounty Mark | 80 | 1 | 3 | Same kind as Bounty Mark. The Guildmaster's stamp on your contracts. |
| 1 | **Guild Pack** (`guildPack`, new): +5 inventory slots | 60 | 2 | 3 | Same kind as Guild Satchel; for the post-Mawood drop load. |

Moving Second Contract and Bounty Mark to stage 1 delays them from rank 2 (early) to post-Mawood; re-run `npm run sim`.

### Shipped La Harpar lines to change

Only lines that place the Guild itself in La Harpar, or make Marvin its head, need to change. Lines that only place Marvin stay as they are.

| Key | Now | Proposed |
|---|---|---|
| `laHarparMarvin.json` `introduction1.message` | "Ah, a fresh face! You look like the adventuring type. I'm Marvin, head of the Exploration Guild." | "Ah, a fresh face! You look like the adventuring type. I'm Marvin, of the Exploration Guild — just back from an expedition." |
| `laHarparMarvin.json` `introduction2.message` | "…Every 5 completed contracts raise your Guild rank — I'll send you into new territory and open more of the guild store." | "The Guild assigns hunting contracts to capable adventurers. Slay the target, earn Explorer Tokens. I keep a few Guild supplies; the hall in Lirold has far more in stock." |
| `laHarparMarvin.json` `whatIsThisPlace1.message` | "…Complete enough tasks and I'll authorize expeditions into deeper, more dangerous territories." | "We map the unknown and thin out the dangers. Every monster you hunt under contract earns you Explorer Tokens. Complete enough and the Guild will send you into deeper, more dangerous territory." |
| `laHarparMarvin.json` `default.message` | "Back for more work, or just browsing? The guild always has contracts available." | "Back again? Sit down; I've always got time for a fighter." (works before and after the redirect) |
| `laHarparMarvin.json` `default` options | store, claim, task intro, task status | Kept, but gated on flag `met_liroldVarrow` **not** set; store opens at stage 0. Plus new options in §8a. |
| `laHarparElara.json` `marvinLocation.message` | "He is probably training people at the local exploration guild." | "He's probably at the tavern, training anyone who'll listen." |
| `laHarparTrader.json` `aboutPeople.message` | "…And Marvin just returned from an expedition—you'll find him near the guild." | "…And Marvin just returned from an expedition—you'll find him at the tavern." |
| `laHarparTrader.json` `aboutGuild.message` | "The Exploration Guild. It's the main hub for local adventurers. You should pay them a visit; they'll help you get prepared for the road." | "The Exploration Guild. Their hall's in Lirold, the capital, but Marvin's one of theirs — ask him first. They'll help you get prepared for the road." |
| `unlocks.json` `towns.laHarpar.body` | "…and seek out the Exploration Guild for bounty tasks." | "A fishing village lies nearby. The Map tab is now available — use it to travel there. Once inside, visit the Tavern for rumors and hunting contracts, and browse the Market for supplies." |

These stay: `Bartender#anyoneWhoCanTrainMe1` ("You can usually find him nearby"), `Elara#villagersOpinion`, `Elara#marvinInfo`, `Bartender#default.anyTrainer`.

## 6. The Guild Trial (Varrow)

| ID | Giver | Zone | Start gate | Steps | Item source | Rewards |
|---|---|---|---|---|---|---|
| `guildTrial` — **The Guild Trial** (next free `QuestID`; `la-harpar-quests.md` reserves 16–26, so 27) | Varrow (Guild hall) | The Upper Canopy → Mountain Pass | `level` 1 (the capital itself is gated behind the Matriarch) | 1. Kill 60 Canopy Bandits (`enemy` `canopyBandit` 60).<br>2. Kill the Troll once (`enemy` `troll` 1). | none (kills only) | 5000 XP, 1000 gold, 1 skill point, 1 `guildShortsword`. Completing it unlocks Slatefall (`slatefall-and-the-deeper-mines.md` §3). |

Step descriptions (plain English, `quests-data.ts`):
1. "The castle has a price on the outlaws who fled into the Spires. Kill 60 canopy bandits."
2. "A troll sits on the castle's mine road below the Pass. Kill it so the road can open."

- **Kill counts:** both steps count kills made after the step starts (`stepKillBaselines`). The Troll is far below the player by now; step 2 is a short walk back for the story, not a fight.
- **Reward scale:** matches *What Lurks at the Top* (5000 XP, 1000 gold, 1 skill point), without its Skill Point Book and Harpy Crown. The weapon replaces those. Quest XP and gold are flat while Zone rewards double per tier, so late quests pay little next to kills; that is true of every shipped quest. Balance is the main thread's call (`npm run sim`).

**Clue beats:**
- **Step 1 turn-in:** the Canopy Bandits are Port Stocksmar's own runaways; the castle's bounty clerks will be pleased. Varrow then explains the mine road. The castle shut it two winters ago when the Slatefall mine came down, and a troll has made the Pass end its home.
- **Step 2 turn-in:** Guild steel and the Guild's writ for the east gate. "Slatefall's been cut off on our side for two winters. Go and see why."

### New weapon (for `/add-equipment-item`)

| Field | Value |
|---|---|
| ID / name | `guildShortsword` / **Guild Shortsword** (next free `ItemID`; `la-harpar-quests.md` reserves 134–143, so 144) |
| Slot / type | weapon, `damageType` physical, tier **rare** |
| Stats (start) | `attackPower` 8, `attackSpeed` 0.1 (faster swings), `critChance` 4 |
| Value | ~6000 |
| Why this tier | Above the Ashwood Bow (6 AP, 5 crit), a tier-6 reward, and the best weapon today. It comes after the Harpy Crown (5 AP, 3 crit helmet), the tier-7 reward. The attack speed matches Marvin's "count the time between swings" tip. |
| One line | Guild-issue steel, short and light, made for long hunts. Every hunter who passes the Guildmaster's trial carries one. |

Icon needed (`/generate-2d-asset`).

## 7. Combat tips (true today)

Taught by **Marvin** in the La Harpar Tavern, from the start, when the player needs them. It fits his role: the shipped Bartender and Elara lines already call him the man who trains fighters. Varrow does not teach (owner call: copy the branch to her if wanted). Each tip is one node (§8a). Only mechanics that work now; nothing about Splash or Overkill (no effect yet).

| Tip | What Marvin says it does | Source |
|---|---|---|
| Waves | Deeper Waves have more HP and pay more XP and gold. Drops and the shiny chance don't scale, so farm materials on low Waves. | `zones-waves-unlocks.md` Wave scaling |
| Bosses | The last Wave is the Boss alone, far tougher. Its kill opens the next Zone. Nothing hits back, so a stalled Boss just wastes time: go back, get stronger. | `zones-waves-unlocks.md`; `game-loop-and-combat.md` |
| Speed | `attackSpeed` is time between attacks. Lower it with gear, the Attack Speed node or Haste. Haste is a buff and can be cast between fights. | `game-loop-and-combat.md`; `spells-and-buffs.md`; `skill-tree-data.ts` |
| Weaknesses | Needs the Weaknesses node (after Money Maker at level 5). A hit whose element matches the enemy's weakness deals more. Weapons hit physical; Fire Strike is fire. | `game-loop-and-combat.md` Damage step 4; `skill-tree-data.ts`; `enemies-data.ts` |
| Crits | `critChance` is how often, `critMulti` how hard (base ×1.2). Spells crit only with Spell Crit. | `game-loop-and-combat.md` Damage step 2; `player.ts`; `skill-tree.md` |
| Shinies | A recoloured spawn pays ×5 XP, ×10 gold and rolls its drops 10 times. Shiny chance is 0 until Shiny Hunter. | `enemies-shiny-pets-bestiary.md` |

## 8. Dialogue scripts

### 8a. La Harpar Marvin (`laHarparMarvin`, shipped tree, additions only)

`default` gains one option, placed after "How are my contracts going?" (existing `taskStatus`):
- "Teach me something about fighting." → tips **(new)**

#### tips (new)
**Shown when:** from default or any tip node
> Training, then. I teach what keeps recruits paid and moving. Pick a subject.

1. "How deep should I push?" → tipWaves
2. "A boss won't go down." → tipBosses
3. "How do I hit faster?" → tipSpeed
4. "Do monsters have weak spots?" → tipWeakness
5. "Tell me about critical hits." → tipCrit
6. "I saw a monster with odd colours." → tipShiny
7. "That's enough for today." → default

#### tipWaves (new)
> Deeper waves have tougher beasts, and they pay more coin and experience per kill. Drops don't care how deep you are, so farm materials on the early waves, where kills come fast.

1. "Something else." → tips
2. "Thanks, Marvin." → default

#### tipBosses (new)
> A boss holds the last wave alone, far tougher than its pack, and the road beyond opens only when it falls. It won't kill you; it'll just waste your day. Fall back a few waves, get stronger, come back.

1. "Something else." → tips
2. "Thanks, Marvin." → default

#### tipSpeed (new)
> Count the time between your swings, not their weight. Cut it with gear, the Attack Speed node or Haste, and every other number you have pays out faster. Haste holds between fights, so cast it before the next one shows.

1. "Something else." → tips
2. "Thanks, Marvin." → default

#### tipWeakness (new)
> Every beast flinches from one element, but you won't see it until you study Weaknesses in the skill tree, past Money Maker. Then matching hits land harder. Fire Strike burns wolves, goblins and green slimes; plain steel suits crabs, gulls and goats.

1. "Something else." → tips
2. "Thanks, Marvin." → default

#### tipCrit (new)
> Crit chance is how often, the multiplier is how hard. Chance alone gets you small crits, so build both. Spells never crit until you learn Spell Crit.

1. "Something else." → tips
2. "Thanks, Marvin." → default

#### tipShiny (new)
> Lucky you. Those pay several times the coin and experience and drop far more loot. Most hunters never see one; train your eye with Shiny Hunter and you will.

1. "Something else." → tips
2. "Thanks, Marvin." → default

#### Marvin's default hub (changed)
Message as in §5 ("Back again? Sit down; I've always got time for a fighter."). Options, in hub order:

1. Quest turn-ins and progress for `la-harpar-quests.md` S4/S6/T3 (if those ship), not flag-gated
2. "I've finished a contract." → taskClaimed (only if a task is complete **and** flag `met_liroldVarrow` not set) *(existing `claimTasks`)*
3. "How are my contracts going?" → taskInProgress (only if a task is in progress **and** flag not set) *(existing `taskStatus`)*
4. "I'd like a hunt task." → taskIntro (only if a task slot is free **and** flag not set) *(existing `taskIntro`)*
5. "Show me the guild store." → close · effect: open shop `explorersGuildStore`, stage 0 (only if flag not set) *(existing `store`)*
6. "Contracts? Supplies?" → redirectVarrow **(new)** (only if flag `met_liroldVarrow` set)
7. "Teach me something about fighting." → tips **(new)**
8. "What is the Exploration Guild?" → whatIsThisPlace1 *(existing)*
9. "Where's the Guild hall?" → aboutHall **(new)**
10. "See you around, Marvin." → end *(existing)*

#### aboutHall (new, on `laHarparMarvin`)
**Shown when:** from default
> Lirold, the capital. The Guildmaster keeps the ledgers there, and the hall has far more in stock than my pack. You'll get there when you've got the legs for it.

1. "Who's the Guildmaster?" → aboutVarrow **(new)**
2. "Got it." → default

#### aboutVarrow (new, on `laHarparMarvin`)
> Odile Varrow. She sent me on my last trip and she'll get my report before anyone else does. Don't ask me where; ask her, and watch her not answer.

1. "Fair enough." → default

#### redirectVarrow (new, on `laHarparMarvin`)
**Shown when:** flag `met_liroldVarrow` set
> You've met Varrow, so you're on her ledger now, not mine. Contracts and supplies go through the hall. I'll stick to teaching.

1. "Fair enough." → default
2. "Then teach me something." → tips

Marvin's shipped `introduction1`, `introduction2`, `whatIsThisPlace1` and `default` messages change as in §5.

### 8b. Guildmaster Varrow (`liroldVarrow`, new NPC, namespace `dialogues/liroldVarrow`)

`firstMeetNodeId` = `arrival`, default = `default`. Her first-meet options set flag `met_liroldVarrow`, which moves the Guild from Marvin to her. Voice: `docs/character/lirold/varrow.md`: precise, ledger words, calls the player "hunter", dry.

#### arrival (new)
**Shown when:** first meeting (`met_liroldVarrow` not set)
> So you're the hunter. Mawood's traders talk of a stranger who killed a tree the size of a tower, and Marvin's letters say the same with fewer words. I'm Odile Varrow, Guildmaster.

1. "Marvin sent me." → arrivalMarvin · effect: set flag `met_liroldVarrow` (only if flag `met_laHarparMarvin` set)
2. "What is this place?" → introduction · effect: set flag `met_liroldVarrow` (only if flag `met_laHarparMarvin` not set)

#### arrivalMarvin (new)
> He sends everyone; few arrive. Your contracts are in my ledger now, and the hall stocks what his pack couldn't. Spend your tokens.

1. "Gladly." → default

#### introduction (new)
> The Exploration Guild's hall. We map the unknown and thin out the dangers; contracts earn Explorer Tokens, and every 5 raise your rank. Contracts and supplies come through me.

1. "Understood." → default

#### default (new)
**Shown when:** returning player
> The hall's open, hunter. Contracts, the store, or something with more teeth?

Options, in hub order (turn-ins, in progress, offers, then the rest):

1. "The troll's dead. The road is clear." → questComplete · effect: advance quest `guildTrial` (only if `guildTrial` ready to turn in at step 2)
2. "Sixty bandits. The castle can pay up." → questStep1Complete · effect: advance quest `guildTrial` (only if `guildTrial` ready to turn in at step 1)
3. "I've finished a contract." → taskClaimed (only if a task is complete)
4. "About your trial..." → questProgress1 (only if `guildTrial` active at step 1) / questProgress2 (only if active at step 2). One option, two results.
5. "How are my contracts going?" → taskInProgress (only if a task is in progress; includes the per-task cancel options)
6. "Got any real work? Not just contracts." → questOffer (only if `guildTrial` available)
7. "I'd like a hunt task." → taskIntro (only if a task slot is free)
7b. Turn-ins and progress for `la-harpar-quests.md` Marvin quests are not copied: they stay with Marvin.
8. "What has the Guild heard about me?" → deeds (one result per deed quest below, each "only if <quest> completed", all to `deeds`) / deedsNone (fallback)
9. "Teach me something about fighting." → noTips
10. "Why is the hall here and not on the coast?" → aboutCapital
11. "Where did you send Marvin?" → aboutExpedition
12. "Show me the guild store." → close · effect: open shop `explorersGuildStore`, stage 1
13. "Good day, Guildmaster." → end

#### taskIntro, taskInProgress, taskClaimed
Same guild effects as `laHarparMarvin`; text may be copied as is.

#### noTips (new)
> I keep ledgers, not a training yard. Marvin teaches, in La Harpar, and he's good at it.

1. "Fair enough." → default

#### aboutCapital (new)
> Charts are worth nothing in a fishing village. The castle pays for ours, the ledgers live here, and every road in Port Stocksmar starts at these walls.

1. "Makes sense." → default

#### aboutExpedition (new)
> Where I wanted charts. The charts aren't finished, so neither is the answer. Raise your rank and ask me again.

1. "I will." → default

#### deeds (new)
**Shown when:** at least one deed quest completed
> The ledgers keep more than contracts, hunter. Traders talk and Marvin writes. Ask.

1. "You heard about the beach?" → deedBeach (only if `clearingOutTheBeach` completed)
2. "And the Trader's basement?" → deedRats (only if `ratsWereRats` completed)
3. "The gnoll warchief?" → deedGnolls (only if `warTrophies` completed)
4. "The tree in the Deepwood?" → deedTreant (only if `theBlightedHeart` completed)
5. "The harpy queen?" → deedMatriarch (only if `whatLurksAtTheTop` completed)
6. "Theron Tidecaller's trail?" → deedCaptain (only if `whereTheWeatherBreaks` completed) **(proposed quest, `la-harpar-quests.md` T4; drop this option if T4 doesn't ship)**
7. "That's enough about me." → default

Each deed node offers: 1. "What else?" → deeds · 2. "That's enough about me." → default

#### deedBeach (new)
> Marvin writes that you broke the crab gang on Horseshoe Beach. He adds that Josh told everyone, sober. Marvin underlined "sober".

#### deedRats (new)
> The Trader's basement is clean, and he tells every caravan the rats were "this big". Small job. The Guild notes who finishes small jobs.

#### deedGnolls (new)
> A Mawood carver's lumber stopped vanishing after a certain warchief died three times. Mawood sends few letters. That one reached my desk.

#### deedTreant (new)
> Corwin's tree. The black sap's stopped and the Deepwood is going quiet, the traders say. The castle doesn't care about trees; I do, because that forest is on no chart of ours.

#### deedMatriarch (new)
> The harpy queen of the Spires. Her feathers are already fetching a price in our market. Good work; better work that you came down again.

#### deedCaptain (new, proposed)
> You found Theron Tidecaller's trail over the Pass. Elara has written to this hall every season for five years. She'll owe you; so does the Guild.

#### deedsNone (new)
**Shown when:** no deed quest completed (fallback; in practice unreachable, since the capital unlocks after *The Blighted Heart*)
> Nothing in the ledgers yet but a name. Names are cheap, hunter; contracts aren't.

1. "Then give me one." → default

#### questOffer (new)
**Shown when:** `guildTrial` available
> Contracts are for anyone with a blade; Guild steel is for hunters I trust. The castle has a price on the outlaws who fled into the Spires. Sixty of them, then a real job.

1. "Consider it done." → default · effect: start quest `guildTrial`
2. "Not yet." → default

#### questProgress1 (new)
> Sixty canopy bandits. They're Port Stocksmar's own runaways, and the bounty clerks count ears.

1. "On my way." → default

#### questStep1Complete (new)
> Good. Now the job. The castle shut its mine road two winters ago when Slatefall's mine came down, and a troll has moved onto the Pass end of it. Kill it.

1. "The road will be clear." → default

#### questProgress2 (new)
> The troll on the Pass, at the head of the mine road. You've killed one before; the ledger says so. Again.

1. "Back to it." → default

#### questComplete (new)
**Shown when:** after `guildTrial` completes (rewards: 5000 XP, 1000 gold, 1 skill point, Guild Shortsword; needs 1 free inventory slot, the dialogue disables the option otherwise)
> Clean work, hunter. Guild steel, and the Guild's writ for the east gate. Slatefall's been cut off on our side for two winters; go and see why, and take my apprentice's questions seriously.

1. "Thank you, Guildmaster." → default

### Needs a new effect or condition
- **Shop stages:** optional `minStage` on `ShopItem` (default 0) and optional `stage` on the dialogue `shop` effect (default 0); items with `minStage` > `stage` are hidden. `ShopStore`/`ShopComponent` filter by the stage the shop was opened with (`TownsStore.openShop` must carry it). Main thread builds it (`/add-dialogue-effect`).
- **`talkToMarvin`:** opens Varrow (Lirold, Guild hall) once flag `met_liroldVarrow` is set, Marvin (La Harpar, Tavern) before.
- Everything else exists: quest states, `flag` conditions (`met_liroldVarrow` set / not set), guild task states; quest, guild, shop and flag effects (`docs/systems/dialogue.md`). Slatefall's `questCompleted` unlock condition is in `slatefall-and-the-deeper-mines.md`.

## 9. New content

| Kind | ID | One line |
|---|---|---|
| Unlock rule | Upper Canopy wave 15 → `lirold` | With the `unlocks:towns.lirold` popup. |
| Building | `explorationGuild` moves from La Harpar to Lirold | La Harpar loses it; Marvin moves into the La Harpar Tavern. |
| NPC | `liroldVarrow` (Guildmaster Odile Varrow) | Guild head in Lirold: full contracts, store at stage 1, trial, deeds. Sets `met_liroldVarrow`. |
| NPC change | `laHarparMarvin` | Guild member in the Tavern: contracts and stage-0 store until `met_liroldVarrow`, then redirects; tips always. |
| Shop | `explorersGuildStore` stages | §5; stage 0 / stage 1 split; new items `thirdContract`, `varrowsSeal`, `guildPack` (`/add-equipment-item` or the shop's upgrade-item pattern). |
| Quest | `guildTrial` (27) | 60 Canopy Bandits, then the Troll; unlocks Slatefall. |
| Item | `guildShortsword` (144) | Rare physical weapon, 8 AP, +0.1 attack speed, 4% crit; quest reward. |
| Dialogue | tips, `aboutHall`, `aboutVarrow` on `laHarparMarvin` | §8a. |
| Map | Capital marker at (600, 1180) on the 3072×2048 map | Shipped 2026-10-31. |
| Art | Capital Town background, Guild hall background (repaint), Varrow portrait, `guildShortsword` icon | `/generate-2d-asset` |

The renames (Lirold, Elderreach) are shipped. The map marker is live at (600, 1180).

**Docs to update on implementation:** `docs/systems/towns-shops-guild.md` (Guild hall in Lirold, Marvin in the Tavern, shop stages, `talkToMarvin` switch), `docs/systems/zones-waves-unlocks.md` (new rules), `docs/character/laHarpar/README.md`, `docs/lore/` (proposed → shipped).
