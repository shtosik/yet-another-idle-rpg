# Slatefall & the Deeper Mines

**Scope:** M-L · **Status:** Proposed (revision 2, 2026-10-27; roster accepted: Hedda, Tobin, Pell)

> `la-harpar-quests.md` (the Tidecaller questline) is a separate draft, not in `docs/ideas/` yet. Lines below that cite it are conditional on it shipping.

A miners' village on the castle's mine road between Lirold and the Mountain Pass, with two combat Zones under it: the **Deeper Mines** and the **Lower Shafts**. It comes after Lirold in the climb. Companion to [`north-lirold-and-exploration-guild.md`](north-lirold-and-exploration-guild.md), which has the road, the map brief and *The Guild Trial* that opens Slatefall.

New here: one Town (2 Buildings, 3 NPCs), two Zones, 8 enemies, 2 enemy types, 4 quests, 4 items, Mawood hint lines.

## 1. Lore already in the game

| Fact | Source |
|---|---|
| Lirold is the capital of Port Stocksmar. | `laHarparJosh.json` `beachName` |
| Mountain Pass: Goats, Mountain Bats, Goblin Scavengers; Troll Boss. Crossable; few travelers "this time of year". | `zones-data.ts`, `mawoodSylvie.json` `intro1`, `mawoodCorwin.json` `intro1` |
| Black sap first appeared 2 years ago; the Spires think "in slow pulses you feel in the soles of your feet", and something "has been poisoning those thoughts for two years". Nobody knows what changed then (T-08). | `mawoodCorwin.json` `aboutMawood`, `aboutForest` |
| The spring near Mawood's platform three is contaminated. | `mawoodSylvie.json` `questSilkWater` |
| The Upper Canopy is the last Zone (tier 7; means 384 HP / 576 XP / 288 gold; Harpy Matriarch 9600/5760/2880). | `zones-data.ts`, `enemies-data.ts` |
| No ore, mine or miner exists in shipped text. The gathering proposal wants Iron Ore. | `docs/ideas/gathering-skills.md` Mining |
| Proposed: Theron's journal says "something under the roots is singing the storms". | `docs/ideas/la-harpar-quests.md` T4 (proposed) |

## 2. The story

**Slatefall** quarries the slate on Lirold's roofs and once dug the iron in its walls; the castle owns the mine. Two winters ago, the same winter the black sap appeared in the Elderwood (nobody here knows that), foreman Oswin Brask took a crew of six down for a richer vein. In the lowest level they broke into cut-stone stairs going down that no Slatefall crew had dug. The week before, Old Tobin swears, the stone *sang*. The crew didn't come up. The loose rock started to move, and lamps were seen where no one was working. The castle shut the mine and barred its road at the Pass end. Goblins from the Pass moved into the empty upper levels, and a Troll moved onto the road.

The player arrives with the Guild's writ after *The Guild Trial*. They do four things:
- Clear the goblins out of the Deeper Mines and bring back Oswin's badge.
- Go down into the Lower Shafts and lay the dead crew to rest.
- Find the stairs, and kill the Stone Warden, the thing that came up them.
- Help Pell, Guildmaster Varrow's apprentice, chart the mine for the castle.

Some questions stay open:
- Where the stairs lead and who cut them (T-25).
- What the marks on the Warden mean (T-26).
- Whether the singing stone and the black sap are one event (T-27). Dialogue hints at this but never confirms it (§7).

## 3. The Town: Slatefall

| Field | Value |
|---|---|
| Name / ID | **Slatefall** / `TownID.slatefall` (3) |
| Region | Port Stocksmar (`RegionID.portStocksmar`): the castle's mine on the capital's own road. |
| Unlock | `guildTrial` completed → town `slatefall`, with a notification. **Needs a new `UnlockCondition`** `questCompleted` (`questId`), and `UnlockService` must re-check rules when quest state changes, not only on kills (`zones-waves-unlocks.md` Known issues). Fallback without code: *The Guild Trial* also rewards a `guildWrit` item and the rule is `hasItem` `guildWrit`. Owner call; the pick is `questCompleted` (no inventory clutter). |
| Why after Lirold | Slatefall sits on the castle's road. That road is barred at the Pass end, and the castle's east gate is closed to it except with a writ. The only way in is through the capital with the Guild's writ. |
| Look (Town background) | A cramped village of slate-roofed stone cottages on a mountainside terrace; spoil heaps, a quarry face, ore-cart rails ending at a timbered mine mouth; a tavern with a lamp hung over its door; the road climbing past above. |

**Popup** (`unlocks.json` `towns.slatefall`):
- title: "Slatefall Discovered!"
- body: "Through Lirold's east gate, the castle's mine road climbs to a village of slate roofs under the Pass. Travel there from the Map. Slatefall's mine has been shut for two winters, and the miners at the Tavern want to know why."

### Buildings

| Building | `TownBuildingID` | Who | Notes |
|---|---|---|---|
| Tavern, called *The Last Lamp* in dialogue | `slatefallTavern` (label "Tavern") | Hedda, Tobin, Pell | All three NPCs, like La Harpar's Tavern holds two. |
| Mine Entrance | `mineEntrance` (label "Mine Entrance") | — | Zone entrance to the Deeper Mines, no `url`, `questRequirement` `lampsInTheDark` (hidden until Hedda's quest starts). |

### NPCs

| Name / `NpcID` | Role | Personality | Wants | Character file |
|---|---|---|---|---|
| **Hedda Brask** / `slatefallHedda` | Tavern keeper, the foreman's widow; quest giver | Dry, practical, pours strong and talks less. Grief kept behind the bar. | The mine open so Slatefall survives, and to know what happened to Oswin. | `docs/character/slatefall/hedda.md` |
| **Old Tobin** / `slatefallTobin` | Retired miner; lore NPC, quest giver | Half-deaf, loud, stubborn; repeats himself. Came up "the week the stone sang". | Someone to see the stairs and prove he isn't mad, and his old crew at rest. | `docs/character/slatefall/tobin.md` |
| **Pell** / `slatefallPell` | Exploration Guild apprentice mapmaker from Lirold; quest giver | Nervous, precise, never been underground; quotes the Guildmaster. | A finished chart for the castle, and Varrow's nod. | `docs/character/slatefall/pell.md` |

## 4. The mine Zones

Two Zones going down, after Lirold: the **Deeper Mines** at tier 8 and the **Lower Shafts** at tier 9, continuing the chain past the Upper Canopy (tier 7).

**Scale.** Following the Zone chain rule (`zones-waves-unlocks.md`), each tier doubles: tier 8 means 768 HP / 1152 XP / 576 gold; tier 9 means 1536 / 2304 / 1152. A Boss has 25× mean HP and 10× rewards. Checked against the Upper Canopy in `enemies-data.ts` (means 384 / 576 / 288, Matriarch 9600 / 5760 / 2880). Waves follow the Upper Canopy: maxWave 15, enemiesPerWave 8.

**No enemy reuse.** "No enemy is shared between zones" (`zones-waves-unlocks.md`). Every enemy is new, but reuses existing `EnemyType`s where they fit and existing drops (Stone, Earth Rune, Fire Rune, Vial Of Water). New types: `insect`, `golem`. Each enemy also gets its `petDrop` / `shinyPetDrops` pet items (`/add-enemy-and-zone`).

### Zone A — Deeper Mines (`deeperMines`, ZoneID 9)

> *The upper levels below the village: timber props, rails, abandoned carts, and goblins everywhere.*

**Unlock:** Mine Entrance in Slatefall, opened by starting `lampsInTheDark` (town entrance path, `ENTRANCE_ZONES_BY_QUEST`).
**Stats:** tier 8, maxWave 15, enemiesPerWave 8. previousZoneId none, nextZoneId `lowerShafts`.

| EnemyID | Name | Types | HP | XP | Gold | Weakness | Drops | Look |
|---|---|---|---|---|---|---|---|---|
| 31 | `goblinTunneler` — Goblin Tunneler | goblin, humanoid | 672 | 1056 | 576 | fire | Stone 1–2 (1/3), Iron Ore 1 (1/5) | A goblin in a dented miner's helmet, dragging a pick taller than itself. |
| 32 | `rockbackBeetle` — Rockback Beetle | insect (new) | 832 | 1216 | 480 | physical | Stone 1 (1/3), Earth Rune 1 (1/5) | A dog-sized beetle whose shell is crusted with slate. |
| 33 | `goblinSapper` — Goblin Sapper | goblin, humanoid | 800 | 1184 | 672 | water | Fire Rune 1 (1/5), Iron Ore 1 (1/6) | A goblin with a lit fuse in its teeth and a satchel of black powder. |

Means: 768 HP, 1152 XP, 576 gold.

**Boss (EnemyID 34): `goblinForeman` — Goblin Foreman**
- Types: goblin, humanoid · Weakness: air (as the Bandit and Gnoll Warchief)
- HP 19200, XP 11520, gold 5760
- Drops: Iron Ore 2–4 (1/1), Fire Rune 2–4 (1/2), `foremansBadge` 1 (1/1, only while `lampsInTheDark` is active)
- Look: the biggest goblin in the mine, riding an ore cart, a brass foreman's badge pinned crooked on its chest.
- Its kill opens the Lower Shafts (Boss chain). Popup `unlocks.json` `zones.lowerShafts`: title "New Area: Lower Shafts", body "Past the Foreman's cart the rails run down into the dark. Below the goblins' reach the rock itself moves, and lamps burn where no one is working."

### Zone B — Lower Shafts (`lowerShafts`, ZoneID 10)

> *The castle's last dig: collapsed props, flooded sumps, the lost crew's lamps still lit, and at the bottom, stairs nobody here cut.*

**Unlock:** Goblin Foreman kill (`deeperMines.nextZoneId`). Reached by the Deeper Mines' nav arrows and its own world map marker.
**Stats:** tier 9, maxWave 15, enemiesPerWave 8. previousZoneId `deeperMines`, no next (the stairs stay closed, T-25).

| EnemyID | Name | Types | HP | XP | Gold | Weakness | Drops | Look |
|---|---|---|---|---|---|---|---|---|
| 35 | `rubbleGolem` — Rubble Golem | golem (new) | 1920 | 2720 | 1120 | physical | Stone 1–3 (1/2), Earth Rune 1 (1/4) | A knee-high heap of broken slate held together by faintly glowing seams. |
| 36 | `caveSalamander` — Cave Salamander | reptile | 1248 | 2080 | 960 | water | Fire Rune 1 (1/5), Vial Of Water 1 (1/8) | A pale, blind salamander as long as a man, glowing orange from inside. |
| 37 | `minersShade` — Miner's Shade | undead | 1440 | 2112 | 1376 | fire | Iron Ore 1 (1/3), Vial Of Water 1 (1/8) | A grey, half-see-through miner with a lamp that still burns, wearing a Slatefall crew mark. |

Means: 1536 HP, 2304 XP, 1152 gold.

**Boss (EnemyID 38): `stoneWarden` — Stone Warden**
- Types: golem · Weakness: water
- HP 38400, XP 23040, gold 11520
- Drops: `wardenCore` 1 (1/2), Stone 2–5 (1/1), Earth Rune 2–4 (1/2)
- Look: a carved stone giant, older than the mine, its chest worn with marks no one in Slatefall can read. The rubble golems are chips of it.

## 5. Quests

QuestIDs continue after `guildTrial` (27).

| ID | Giver | Zone | Start gate | Steps | Item source | Rewards |
|---|---|---|---|---|---|---|
| `lampsInTheDark` — **Lamps in the Dark** (28) | Hedda | Deeper Mines | `level` 1 (Slatefall itself needs `guildTrial`). Starting it opens the Mine Entrance. | 1. Kill 30 Goblin Tunnelers (`enemy` `goblinTunneler` 30).<br>2. Bring 1 `foremansBadge`. | Badge: **Goblin Foreman**, 1 in 1 while active | 5000 XP, 1000 gold, 1 skill point |
| `whatTheDeepKeeps` — **What the Deep Keeps** (29) | Tobin | Lower Shafts | `lampsInTheDark` completed | 1. Kill 40 Miner's Shades (`enemy` `minersShade` 40).<br>2. Clear 50 on wave 12 of the Lower Shafts (`wave` `lowerShafts` 12, 50). | none | 5000 XP, 1000 gold |
| `theLastShift` — **The Last Shift** (30) | Hedda | Lower Shafts | `whatTheDeepKeeps` completed | 1. Kill the Stone Warden (`enemy` `stoneWarden` 1). | none | 6000 XP, 1200 gold, 1 skill point, 1 `foremansHelm` |
| `chartingTheDeep` — **Charting the Deep** (31) | Pell | Both | Goblin Foreman killed ×1 (lifetime) | 1. Bring 10 `ironOre`.<br>2. Clear 50 on wave 14 of the Lower Shafts (`wave` `lowerShafts` 14, 50). | Ore: Goblin Tunneler, Goblin Sapper, Miner's Shade, Goblin Foreman | 5000 XP, 1000 gold, 1 `skillPointBook` |

**Reward scale:** matched to *What Lurks at the Top* (5000 XP, 1000 gold, 1 skill point, Skill Point Book, Harpy Crown), the last shipped quest. Each mine quest takes one or two of its parts. *The Last Shift*, the finale, is slightly above it in XP and gold. Quest XP and gold are flat while kill rewards double per tier, so at tier 8–9 the quests pay mostly in skill points and the helm. Balance is the main thread's call (`npm run sim`).

Step descriptions (`quests-data.ts`):
- Lamps in the Dark: 1. "Hedda wants the goblins out of the Deeper Mines: kill 30 goblin tunnelers." 2. "The goblin foreman wears Oswin Brask's badge. Bring it to Hedda."
- What the Deep Keeps: 1. "Tobin's old crew still walks the Lower Shafts. Lay 40 miner's shades to rest." 2. "Tobin swears there are stairs at the bottom. Push to wave 12 of the Lower Shafts and see."
- The Last Shift: 1. "Something came up those stairs. Kill the Stone Warden."
- Charting the Deep: 1. "Pell needs ore samples for the castle: bring 10 iron ore." 2. "Pell needs the bottom charted: clear wave 14 of the Lower Shafts."

### Clue beats
- **Lamps in the Dark, 1:** goblins came down from the Pass after the castle shut the mine and haul its tools up the mountain. Their boss wears a brass badge.
- **Lamps in the Dark, 2:** the badge is Oswin's, caked in the grey mud found only in the Lower Shafts: he got that far. Points to Tobin.
- **What the Deep Keeps, 1:** the shades wear Slatefall crew marks; they were standing by their lamps, not hunting.
- **What the Deep Keeps, 2:** the stairs are real: cut stone going down, marks on the steps. Something big climbed them.
- **The Last Shift:** the Warden falls, the rock goes still. Hedda gets Oswin's helm from the crew's last camp and gives it to the player. The upper levels can reopen; the stairs stay sealed.
- **Charting the Deep:** Pell's chart goes to the castle and the Guild. He copies the Warden's marks for Varrow (T-26, T-17).

## 6. Dialogue scripts

Hub order follows `dialogue.md`: turn-ins, in progress, offers, then the rest. Every first-meet node sets `met_<npcId>`.

### Hedda (`slatefallHedda`, namespace `dialogues/slatefallHedda`)

`firstMeetNodeId` = `intro1`, default = `default`.

#### intro1
**Shown when:** first meeting
> Guild writ on your belt, so you're either brave or lost. I'm Hedda; this is the Last Lamp. Drink, sit, or ask.

1. "What happened to the mine?" → aboutMine · effect: set flag `met_slatefallHedda`
2. "Just passing through." → default · effect: set flag `met_slatefallHedda`

#### default
**Shown when:** returning player
> Lamp's lit. What'll it be?

1. "Here's Oswin's badge." → lampsComplete · effect: advance quest `lampsInTheDark` (only if ready to turn in at step 2)
2. "The tunnelers are dealt with." → lampsStep1Complete · effect: advance quest `lampsInTheDark` (only if ready to turn in at step 1)
3. "The Stone Warden is dead." → lastShiftComplete · effect: advance quest `theLastShift` (only if ready to turn in)
4. "About the goblins..." → lampsProgress1 (only if `lampsInTheDark` active at step 1) / lampsProgress2 (only if active at step 2)
5. "About the thing below..." → lastShiftProgress (only if `theLastShift` active)
6. "Need anything done?" → lampsOffer (only if `lampsInTheDark` available) / lastShiftOffer (only if `theLastShift` available)
7. "Tell me about the mine." → aboutMine
8. "Who was Oswin?" → aboutOswinEnd (only if `theLastShift` completed) / aboutOswinAfter (only if `lampsInTheDark` completed) / aboutOswin (fallback)
9. "Tell me about Slatefall." → aboutSlatefall
10. "Goodbye, Hedda." → end

#### aboutMine
> The castle's mine: iron for Lirold's walls, slate for every roof in it. Two winters back the bottom came down with the crew inside, and the castle shut the lot.

1. "And now?" → aboutMineNow
2. "I see." → default

#### aboutMineNow
> Now goblins from the Pass live in the upper levels and carry our tools up the mountain. The castle won't reopen it until somebody counts the cost. That's you, I suppose.

1. "I suppose it is." → default

#### aboutOswin
> My husband. Foreman. He took the crew down after a richer vein and didn't come up.

1. "I'm sorry." → default

#### aboutOswinAfter
> He got as far as the Lower Shafts. That's further than the castle ever looked.

1. "I'll find the rest." → default

#### aboutOswinEnd
> He's with his crew, and the rock's still. That'll do.

1. "It will." → default

#### aboutSlatefall
> Forty houses, one tavern, a quarry, and a mine nobody's allowed in. We roof the capital and the capital forgets us. Lamps stay lit, though.

1. "Good to know." → default

#### lampsOffer
**Shown when:** `lampsInTheDark` available
> Clear the goblins out of the Deeper Mines: thirty tunnelers, then their boss. He's wearing something of mine.

1. "I'll get it back." → default · effect: start quest `lampsInTheDark`
2. "Not today." → default

#### lampsProgress1
> Thirty tunnelers. They're the ones wearing our helmets.

1. "Back to it." → default

#### lampsStep1Complete
> Good. Their boss rides an ore cart at the bottom of the Deeper Mines with a brass badge on. That badge was my husband's; bring it back.

1. "I will." → default

#### lampsProgress2
> The one in the cart, last wave down. Brass badge.

1. "On my way." → default

#### lampsComplete
**Shown when:** after `lampsInTheDark` completes (rewards: 5000 XP, 1000 gold, 1 skill point)
> Oswin's. It's caked in the grey mud you only get in the Lower Shafts, so he got that far. Talk to Tobin; he was the last one up.

1. "I'll find Tobin." → default

#### lastShiftOffer
**Shown when:** `theLastShift` available
> Tobin says there are stairs, and something came up them. Whatever it is, it's why the rock moves. Kill it.

1. "It's done." → default · effect: start quest `theLastShift`
2. "Give me time." → default

#### lastShiftProgress
> The thing at the bottom of the Lower Shafts. Tobin calls it a warden. I call it the reason I'm a widow.

1. "Not for long." → default

#### lastShiftComplete
**Shown when:** after `theLastShift` completes (rewards: 6000 XP, 1200 gold, 1 skill point, Foreman's Helm; needs 1 free slot)
> The rock's gone still. That's Oswin's helm, lamp and all; take it, he'd hate it rusting on a hook. We'll open the upper levels by spring.

1. "Thank you, Hedda." → default

### Tobin (`slatefallTobin`, namespace `dialogues/slatefallTobin`)

`firstMeetNodeId` = `intro1`, default = `default`. Speech habits: "Eh?", shouts a word in capitals now and then, repeats the key word.

#### intro1
**Shown when:** first meeting
> Eh? Speak up! Tobin. Forty years down that mine, and I came up the week the stone SANG.

1. "The stone sang?" → aboutSinging · effect: set flag `met_slatefallTobin`
2. "Nice to meet you, Tobin." → default · effect: set flag `met_slatefallTobin`

#### default
**Shown when:** returning player
> Eh? You again. Good. Sit where I can hear you.

1. "I found the stairs." → deepComplete · effect: advance quest `whatTheDeepKeeps` (only if ready to turn in at step 2)
2. "Your crew is at rest." → deepStep1Complete · effect: advance quest `whatTheDeepKeeps` (only if ready to turn in at step 1)
3. "About your crew..." → deepProgress1 (only if `whatTheDeepKeeps` active at step 1) / deepProgress2 (only if active at step 2)
4. "Need help, Tobin?" → deepOffer (only if `whatTheDeepKeeps` available)
5. "Tell me about the singing." → aboutSinging
6. "In Mawood, the trees started bleeding black sap two winters ago." → aboutSingingMawood (only if `theBlightedHeart` completed)
7. "Who was in your crew?" → aboutCrew
8. "Goodbye, Tobin." → end

#### aboutSinging
> Two winters back. Low, under your boots, like a bell you feel in your teeth. A week later the bottom came down, and nobody believed deaf old Tobin heard ANYTHING.

1. "I believe you." → default
2. "Sounds like the cold talking." → default

#### aboutSingingMawood (new hint, T-27)
> Two winters, you say. Trees bleeding up north, stone singing down here, same winter. Say that in the capital and they'll lock us both up.

1. "Maybe it's nothing." → default

#### aboutCrew
> Six, with Oswin: Bram, Nell, the Corrie twins, young Dace. Good diggers. Nobody brought them up.

1. "I'm sorry." → default

#### deepOffer
**Shown when:** `whatTheDeepKeeps` available
> If Oswin got to the Lower Shafts, then the lamps down there are my crew. Put them to rest, then go to the bottom and see the stairs. I SAW them, whatever the castle says.

1. "I'll go down." → default · effect: start quest `whatTheDeepKeeps`
2. "Not yet." → default

#### deepProgress1
> Forty shades. Eh? FORTY. They carry lamps; you'll know them.

1. "I'll know them." → default

#### deepStep1Complete
> Crew marks? Then they're mine, and they're done waiting. Now go to the bottom, twelve levels down, and tell me I'm mad.

1. "Twelve levels." → default

#### deepProgress2
> The bottom. Twelve levels down. Stairs. STAIRS.

1. "Going." → default

#### deepComplete
**Shown when:** after `whatTheDeepKeeps` completes (rewards: 5000 XP, 1000 gold)
> Cut stone going down, and marks on the steps? Told you. The stone sang, and something climbed those stairs to hear it.

1. "Hedda should know." → default

### Pell (`slatefallPell`, namespace `dialogues/slatefallPell`)

`firstMeetNodeId` = `intro1`, default = `default`. Speech habits: starts sentences twice, quotes the Guildmaster ("The Guildmaster says…"), apologises for asking.

#### intro1
**Shown when:** first meeting
> Oh! You're — you must be the one the Guildmaster wrote about. Pell, her apprentice. I'm meant to chart the mine, but I've never been under anything deeper than a cellar.

1. "What did she write?" → pellLetter · effect: set flag `met_slatefallPell`
2. "Good to meet you, Pell." → default · effect: set flag `met_slatefallPell`

#### default
**Shown when:** returning player
> The chart's still mostly blank. Did you, um, need something?

1. "The bottom levels are charted." → chartComplete · effect: advance quest `chartingTheDeep` (only if ready to turn in at step 2)
2. "Here's the ore." → chartStep1Complete · effect: advance quest `chartingTheDeep` (only if ready to turn in at step 1)
3. "About the chart..." → chartProgress1 (only if `chartingTheDeep` active at step 1) / chartProgress2 (only if active at step 2)
4. "Need a hand with the chart?" → chartOffer (only if `chartingTheDeep` available)
5. "About the Warden's marks..." → aboutMarks (only if `theLastShift` completed)
6. "What did the Guildmaster write about me?" → pellLetter
7. "How's the apprenticeship?" → aboutPell
8. "Goodbye, Pell." → end

#### pellLetter (acknowledges the player's deeds, gated)
Results of the option, first match wins:
- (only if `whatLurksAtTheTop` completed) → pellLetterSpires
- fallback → pellLetterPlain

#### pellLetterSpires
> "Killed the harpy queen of the Spires. Finishes things." That's the whole letter. From the Guildmaster, that's practically a parade.

1. "Sounds like him." → default

#### pellLetterPlain
> "Finishes things." That's the whole letter. From the Guildmaster, that's practically a parade.

1. "Sounds like him." → default

#### aboutPell
> Two years at the map table. The Guildmaster says a chart nobody walked is just a story. So I'm walking — well, you're walking, and I'm writing it down.

1. "Fair trade." → default

#### chartOffer
**Shown when:** `chartingTheDeep` available
> The castle wants to know if the mine's worth reopening. I need ten ore samples, and someone to reach the bottom levels while I draw. The Guildmaster said you'd say yes.

1. "She was right." → default · effect: start quest `chartingTheDeep`
2. "Ask me later." → default

#### chartProgress1
> Ten iron ore. The goblins carry it, and the — the shades, apparently. I'm told.

1. "I'll bring it." → default

#### chartStep1Complete
> Good ore. The castle will like that. Now the hard part: fourteen levels down the Lower Shafts, so I can finish the bottom of the map.

1. "Fourteen levels." → default

#### chartProgress2
> Fourteen levels down. I'll draw from what you tell me. Please notice things.

1. "I'll notice." → default

#### chartComplete
**Shown when:** after `chartingTheDeep` completes (rewards: 5000 XP, 1000 gold, Skill Point Book; needs 1 free slot)
> A whole mine on one sheet. The castle gets a copy, the Guild gets the original. The Guildmaster will pretend she isn't impressed.

1. "He'll be impressed." → default

#### aboutMarks
**Shown when:** `theLastShift` completed
> I copied the marks off the Warden for the Guildmaster. She sent back one line: "Where else have you seen these?" I haven't. Have you?

1. "Maybe. On the old roots in Mawood." → aboutMarksMawood (only if `glyphsBeneathTheSpires` completed) **(proposed quest, `la-harpar-quests.md` T5; drop if it doesn't ship)**
2. "No." → default

#### aboutMarksMawood
> Corwin's roots? Then she knew before she asked. She always does.

1. "She always does." → default

## 7. Mawood hint lines (collapse ↔ black sap, T-27)

Hints only: each speaker notices the timing, nobody draws the line. Mawood comes before Slatefall in the climb, so these are return visits.

### Corwin (`mawoodCorwin`, shipped tree)
`default` gains, before "Goodbye, Elder.":
- "Miners at Slatefall say the stone sang two winters ago." → aboutSlatefallSong **(new)** (only if `whatTheDeepKeeps` completed)

#### aboutSlatefallSong (new)
> Two winters. The Spires flinched then, all at once, like a sleeper at a noise; I took it for the blight waking. I never asked what made the noise.

1. "Maybe something did." → default

### Sylvie (`mawoodSylvie`, shipped tree)
`default` gains, before "Take care of yourself.":
- "Slatefall's mine came down two winters ago." → aboutSlatefallSpring **(new)** (only if `lampsInTheDark` completed)

#### aboutSlatefallSpring (new)
> Two winters? That's when the spring on platform three went bad. Spring water comes up from very deep... I'm sure it's nothing.

1. "Probably nothing." → default

Tobin's `aboutSingingMawood` (§6) is the third side of the hint. If `la-harpar-quests.md` T4 ships, Theron's "something under the roots is singing the storms" echoes Tobin's "the stone sang"; leave it as an echo.

## 8. New content

| Kind | ID | One line |
|---|---|---|
| Town | `slatefall` (3) | Miners' village on the castle's mine road; unlocks when `guildTrial` completes. |
| Unlock condition | `questCompleted` | New `UnlockCondition` (`questId`); `UnlockService` re-checks on quest changes. Fallback `hasItem` `guildWrit`. |
| Building | `slatefallTavern` | The Last Lamp; Hedda, Tobin, Pell. |
| Building | `mineEntrance` | Zone entrance to the Deeper Mines, needs `lampsInTheDark` started. |
| NPC | `slatefallHedda` | Tavern keeper, foreman's widow; Lamps in the Dark, The Last Shift. |
| NPC | `slatefallTobin` | Half-deaf retired miner; What the Deep Keeps; the singing-stone hint. |
| NPC | `slatefallPell` | Guild apprentice mapmaker; Charting the Deep. |
| Zone | `deeperMines` (9) | Tier 8, goblin-held upper levels. |
| Zone | `lowerShafts` (10) | Tier 9, the collapsed dig and the old stairs. |
| EnemyType | `insect`, `golem` | Rockback Beetle; Rubble Golem and Stone Warden. |
| Enemy | `goblinTunneler` (31) | Goblin with a stolen helmet and pick; fire-weak. |
| Enemy | `rockbackBeetle` (32) | Slate-shelled beetle; physical-weak. |
| Enemy | `goblinSapper` (33) | Goblin with a lit fuse; water-weak. |
| Enemy | `goblinForeman` (34) | Deeper Mines Boss; rides an ore cart, wears Oswin's badge; air-weak. |
| Enemy | `rubbleGolem` (35) | Heap of slate on glowing seams; physical-weak. |
| Enemy | `caveSalamander` (36) | Blind salamander glowing from inside; water-weak. |
| Enemy | `minersShade` (37) | Lost Slatefall miner with a burning lamp; fire-weak. |
| Enemy | `stoneWarden` (38) | Lower Shafts Boss; carved stone giant from the old stairs; water-weak. |
| Item | `ironOre` (145) | Resource; the mine's iron. Same item the gathering proposal's Mining would yield. |
| Item | `foremansBadge` (146) | Quest item; Oswin Brask's brass badge. |
| Item | `wardenCore` (147) | Resource; the Warden's glowing heart-stone; a later gear-upgrading material. |
| Item | `foremansHelm` (148) | Rare helmet, `attackPower` 6, `critChance` 3, value ~6000. Just above the Harpy Crown (5 AP, 3 crit). Oswin's helmet, lamp and all. |
| Dialogue | Corwin `aboutSlatefallSong`, Sylvie `aboutSlatefallSpring` | §7 hints. |
| Art | Slatefall and Tavern backgrounds, 2 Zone backgrounds, 8 enemy sprites, 4 item icons, 3 portraits | `/generate-2d-asset`; portrait briefs in `docs/character/slatefall/`. |

ItemIDs assume `guildShortsword` = 144; shift if taken.

**Docs to update on implementation:** `docs/systems/zones-waves-unlocks.md` (new condition, entrance, Zone chain, Known issue on quest-driven unlocks), `docs/systems/towns-shops-guild.md` (new Town), `docs/lore/` (proposed → shipped).
