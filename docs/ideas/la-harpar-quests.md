# La Harpar quests & the Tidecaller questline

**Scope:** M · **Status:** Proposed

La Harpar (Horseshoe Beach, Trader's Basement, Plains, The Long Path, Mountain Pass) has 4 quests; Mawood has 12. This doc finishes **A Tale of a Captain** as a five-quest questline and adds 7 side quests across zones 1–5, all with existing zones and enemies. Quest-only drops, new items and keys are listed at the end.

## 1. Lore already in the game

| Fact | Source |
|---|---|
| La Harpar: fishing village on Horseshoe Beach, region Port Stocksmar, biggest fish exporter, trade partner of North Lirold (capital). Four known regions: Southback, Port Stocksmar, Greefic Hill, Saint Nestroud. | `dialogues/laHarparJosh.json` (`beachName`, `regionsInfo`), `laHarparTrader.json` (`aboutVillage`), `map.json` |
| Past Greefic Hill is an "uncrossable mountain": a magical force and unpredictable weather; nobody who tried came back, nor did the family who went looking. Chants and howls from the forest around it. | `laHarparJosh.json` (`unknownRegions`, `dangerMountain`, `mountainRumors`) |
| Elara, an elf, moved to La Harpar years ago to find her father **Captain Theron Tidecaller**: treasure seeker, missing 5 years, famous for discoveries and an "uncanny ability to predict weather". Naive, gives his money away, owns rare jewels nobody can locate. Last rumour: he sought **Primula's Sceptre** — Queen Primula of **Messatan**, an ancient civilisation thought to be a fairytale. | `laHarparElara.json`, `docs/character/laHarpar/elara.md` |
| Marvin: Exploration Guild head, just back from an expedition; the one villager Elara respects. | `laHarparMarvin.json`, `laHarparElara.json` (`villagersOpinion`) |
| Bartender (she) monetises talk, short of crab meat; Josh is a broke fisherman who talks for beer; the Trader is the town's info hub and has a rat-filled basement. | `docs/character/laHarpar/*.md` |
| Mawood lies past the Mountain Pass in the Elderwood (Silverwood Spires). The black sap appeared **2 years ago**; Corwin traces it to an ancient Spire consumed by "the failed ritual of a druid long dead". Gnolls carried the blight; the Gnarled Treant was its heart. | `mawoodCorwin.json`, `docs/design/mawood-and-elderwood-zones.md` |
| Sylvie trained as a herbalist in La Harpar, knows Elara ("a sea captain, missing somewhere past Horseshoe") and worries about her. | `mawoodSylvie.json` (`aboutElara*`) |
| Code state: `aTaleOfACaptain` has one step needing `captainsLetter`, which has no source; `rewards: []`. Elara's tree starts it ungated from `pirateInfo.opt1`, has no quest hub and no returning-player node (every visit opens on "stop staring"). | `src/data/quests-data.ts`, `src/data/dialogues/laHarparTown/laHarparElara.ts`, `docs/systems/quests.md` |

Threads to pull: the mountain's "woven" weather vs. Theron's weather sense; the chants past the mountain; Messatan as a real ruin under the Spires; Sylvie's link to Elara.

## 2. The Tidecaller questline (Elara)

**The story:** five years ago Theron's ship, the *Saltwind*, ran aground on the far horn of Horseshoe Beach in a storm he "didn't see coming — first time in thirty years". He decided the Sceptre was never across the sea: Messatan lies beyond the mountain, and its storms are made, not natural. He walked inland without ever entering La Harpar (Elara came later, following rumours). He lost his compass on the Plains, was robbed on the Long Path, sheltered in the troll's cave on the Mountain Pass, and went down into the Elderwood. He is not found. The questline ends with proof that he crossed alive, and the Messatan link in Mawood.

Elara's quests run alongside the main zone climb (levels ~3 → 12). Each turn-in is at Elara unless noted.

| # | Quest (ID) | Start gate | Steps | Clue source | Rewards |
|---|---|---|---|---|---|
| T1 | **A Tale of a Captain** (`aTaleOfACaptain`, 3, existing) | level 1 (keep) | 1. Bring 1 `captainsLetter` | **Gangster Crab** (Horseshoe Beach boss), 1 in 2 while active. "The crab gang hoards whatever washes up." | 1200 XP, 250 gold |
| T2 | **The Captain's Compass** (`theCaptainsCompass`, 16) | T1 completed | 1. Bring 1 `brassCompass` | **King Slime** (Plains boss), 1 in 2 while active. The letter says he lost it "crossing the wet fields"; slimes swallow metal. | 2000 XP, 400 gold |
| T3 | **Highway Robbery** (`highwayRobbery`, 17) | T2 completed | 1. Clear 50 on wave 15 of The Long Path — **turn in at Marvin**: guild records say a bandit crew sold a captain's coat in North Lirold four years ago and camps at the road's end.<br>2. Bring 1 `captainsLogbook` | **Bandit** (Long Path boss), 1 in 2 while active | 3000 XP, 600 gold, 1 skill point |
| T4 | **Where the Weather Breaks** (`whereTheWeatherBreaks`, 18) | T3 completed | 1. Kill 40 Goblin Scavengers and bring 3 `scavengedSeaCharts`<br>2. Bring 1 `weatheredJournal` | Charts: **Goblin Scavenger**, 1 in 4 while active (they looted his camp). Journal: **Troll** (Mountain Pass boss), 1 in 1 while active — its cave is where he waited out the storm. | 5000 XP, 1000 gold, 1 skill point, `tidecallersCompass` (amulet) |
| T5 | **Glyphs Beneath the Spires** (`glyphsBeneathTheSpires`, 19) — optional epilogue | T4 completed **and** `signsOfRot` started (player has reached Mawood) | 1. Show 1 `theronsSketch` to **Corwin** (Elara gives it on start with an item `give` effect). Corwin's turn-in gives 1 `corwinsTranslation`.<br>2. Bring 1 `corwinsTranslation` back to Elara; also requires `theBlightedHeart` completed | Corwin reads the marks | 4000 XP, 800 gold, flag `elara_knows_messatan` |

**Clue beats (dialogue text, not data):**
- **Letter (T1):** the wreck, "the Sceptre was never across the sea", "the mountain's storms are woven, not born". Elara learns he was a day's walk from her for years.
- **Compass (T2):** the needle doesn't point north, it points at the worst weather — towards the mountains. Elara keeps it.
- **Logbook (T3):** the bandit took his coin and left him alive. Last entry: heading up the pass with goblins trailing; "a cave halfway up, out of the wind".
- **Journal (T4):** he slipped out of the cave while the troll slept; the storm parted for an hour "as if something below let me through"; he went down into a forest of silver trees. "Something under the roots is singing the storms. If Messatan is anywhere, it's down there. E. — don't follow. (You will anyway.)" Elara can't cross the pass yet. She gives the player the compass, repaired: "It always pointed where he wanted to go. Maybe it'll point where you need to."
- **Corwin (T5):** the marks are Messatan, the same marks carved into the oldest Spire roots in the Deepwood. The druid whose ritual poisoned the Spire wore them. Corwin remembers a man who "knew the rain before it fell", five years ago, who went down to the roots. He can only read the last line once the Treant's pulse has stopped (hence the `theBlightedHeart` requirement): *"the Sceptre sleeps where the Spires drink."* Elara: "Primula's Sceptre is under the roots. So is my father."

**Mawood ties and future setup (no new zones):**
- Sylvie: new `aboutElara` result gated on T4 completed ("She found his trail. He crossed the pass alive.") that closes her worry thread.
- Corwin's 2-years-vs-5-years gap: leave it open whether Theron's descent woke the seep. **Owner call.** Recommendation: keep it ambiguous and don't make Theron the villain.
- `elara_knows_messatan` and the journal's "below the roots" line set up a future underground Messatan zone and Theron's rescue, with Elara as a possible companion or Mawood NPC.
- Theron's "rarest jewels" stay unexplained: a hook for a later treasure quest.

**Data notes:**
- Multi-step quests (T3, T4, T5) are supported by `QuestProps.steps`; each step needs its own `readyToAdvance` + `step` turn-in. T3 step 1 turns in at Marvin and T5 step 1 at Corwin (any NPC can advance any quest).
- Elara needs a proper tree: `firstMeetNodeId` = current greeting, a new `default` node with a quest hub. Order: all turn-ins (T1…T5, by step), then all in-progress, then all offers. Move T1's start behind an `available`-gated offer node (today it hides `pirateInfo.opt1` once started).
- When this ships, delete the "A Tale of a Captain is unfinished on purpose" owner decision in `docs/systems/quests.md`.

## 3. La Harpar side quests

XP and gold follow existing quests: beach/basement ≈ Meat Shortage / Rats (1000–1500 XP, 200–300 gold); later zones scale with zone gold (`npm run sim`: Long Path ≈ 4.6k gold, Mountain Pass ≈ 8.5k), staying below Mawood's opening quests in total value. Kill-count steps count kills made after the step starts (`stepKillBaselines`); start gates using boss kills read lifetime counts.

| # | Quest (ID) | Giver | Zone | Start gate | Steps | Rewards | Hook |
|---|---|---|---|---|---|---|---|
| S1 | **Gulls on the Roof** (`gullsOnTheRoof`, 20) | Bartender | Horseshoe Beach | `meatShortage` completed | Kill 40 Seagulls; bring 20 `feather` | 1000 XP, 200 gold, `crabStewRecipe` | "Those flying rats eat my fish faster than my customers do — and they don't pay either." |
| S2 | **Mending the Nets** (`mendingTheNets`, 21) | Josh | Horseshoe Beach | `clearingOutTheBeach` completed | Kill 60 Crabs; bring 6 `tornFishingNet` (**new**, Crab 1 in 6 while active) | 1200 XP, 250 gold, 10 `grilledFish` | No nets, no fish, no beer money. Josh is motivated for once. |
| S3 | **The Rat King** (`theRatKing`, 22) | Trader | Trader's Basement | `ratsWereRats` completed | Kill the Giant Rat 3 times; bring 5 `cheese` | 1500 XP, 300 gold, `cheesePlatterRecipe` | "They're back. And one of them is the size of a dog. And it's eating my stock." |
| S4 | **Know Your Enemy** (`knowYourEnemy`, 23) | Marvin | Plains | Gangster Crab killed ×1 | 1. Kill 15 Green (fire), 15 Red (water), 15 Blue (air) Slimes<br>2. Kill the King Slime once | 2000 XP, 400 gold, 1 skill point | Marvin's field lesson on weaknesses: each slime colour fears a different element. |
| S5 | **An Order from North Lirold** (`northLiroldOrder`, 24) | Trader | Long Path (+ Mountain Pass goats) | King Slime killed ×1 **and** `ratsWereRats` completed | Bring 15 `deerPelt`, 10 `wolfFangs` | 2500 XP, 800 gold | The capital wants pelts, not just fish. The Trader smells a new market. |
| S6 | **Charting the Goblins** (`chartingTheGoblins`, 25) | Marvin | The Long Path | `knowYourEnemy` completed **and** King Slime killed ×1 | Kill 40 Goblin Scouts; bring 5 `goblinMapScrap` (**new**, Goblin Scout 1 in 5 while active) | 3000 XP, 600 gold, `woodenBow` | Goblin scouts are mapping the road. Someone is planning more than a mugging. Pieced together, the scraps mark goblin camps up the Mountain Pass. |
| S7 | **Howls in the Pass** (`howlsInThePass`, 26) | Josh | Mountain Pass | `clearingOutTheBeach` completed **and** Bandit killed ×1 | Kill 40 Mountain Bats; clear 50 on wave 12 of Mountain Pass; bring 1 `rustyHookCharm` (**new**, Goblin Scavenger 1 in 10 while active) | 4000 XP, 800 gold, 1 skill point | Josh's brother went up the mountain years ago and never came back (his "friends or family" line). The charm comes back; the brother doesn't. Explains the drinking. |

**Cross-links:**
- If T4 and S7 are both completed, Josh gets a line: Theron's journal mentions burying a La Harpar fisherman with a hook charm on the pass (dialogue only, `quest` conditions).
- S6's map leads into T4's goblin scavengers.
- S4 teaches weaknesses before the Long Path's fire-weak roster.

**Per-NPC load after this:** Elara 5 (T1–T5), Josh 3, Trader 3, Bartender 2, Marvin 2 (+ T3 turn-in). La Harpar goes from 4 to 15 quests.

**Dialogue work:** Bartender `anyWork` and Trader `opt6` change from a single quest to a hub. Josh's hub sits behind his paid-beer flag (`josh_paid_beer`). Marvin gets a quest hub ahead of his guild options. Use `/add-quest` per quest, then `/audit-dialogue` per NPC.

**Watch:** S1 and S3 give recipe scrolls that also drop (Gangster Crab and Giant Rat, 1 in 10). Check what using a scroll for an already-known recipe does; if it's wasted, swap the reward for +150 gold.

## 4. Town reputation hooks (future)

Not built. This proposal only reserves the hooks; it fits with [town building upgrades & reputation](town-building-upgrades.md).

- **Earning:** add `{ type: 'reputation', townId, amount }` to quest rewards. Suggested: side quests 10–20, Tidecaller quests 25, T4 50. All 11 new quests plus the 4 existing ones ≈ 300 La Harpar rep.
- **Gating:** add a `reputation` `RequirementProps` and a `DialogueCondition` variant via `/add-dialogue-effect`; the skill already lists "checking reputation".
- **Tier ideas** (50 / 150 / 300):
  - *Known:* the Bartender stops charging for answers; Josh talks without beer.
  - *Trusted:* Trader discount or extra stock; a repeatable North Lirold order (S5 as a template).
  - *Honoured:* a rep-gated Bartender quest ("Last Orders") and Marvin's expedition offer into the T5 Messatan content.
- Corwin's quests would grant Mawood rep the same way. The T5 epilogue could give rep in both towns.

## 5. New content required

**QuestID** (`src/enums/ids/quest-id.enum.ts`): `theCaptainsCompass = 16`, `highwayRobbery = 17`, `whereTheWeatherBreaks = 18`, `glyphsBeneathTheSpires = 19`, `gullsOnTheRoof = 20`, `mendingTheNets = 21`, `theRatKing = 22`, `knowYourEnemy = 23`, `northLiroldOrder = 24`, `chartingTheGoblins = 25`, `howlsInThePass = 26`.

**ItemID** (take the next free ids when implementing — 134–143 were used by shipped items; `src/enums/ids/item-id.enum.ts`, quest items in `quest-item.data.ts`, `value: -1`, `ItemType.quest`):

| ID | Item | Type | Source |
|---|---|---|---|
| 18 | `captainsLetter` (exists) | quest | **add** Gangster Crab drop, 1/2, `requiredActiveQuestId: aTaleOfACaptain` |
| next free | `brassCompass` | quest | King Slime 1/2, T2 |
| next free | `captainsLogbook` | quest | Bandit 1/2, T3 |
| next free | `scavengedSeaCharts` | quest | Goblin Scavenger 1/4, T4 |
| next free | `weatheredJournal` | quest, rare | Troll 1/1, T4 |
| next free | `theronsSketch` | quest | Elara `give` on T5 start |
| next free | `corwinsTranslation` | quest | Corwin `give` on T5 step 1 turn-in |
| next free | `tornFishingNet` | quest | Crab 1/6, S2 |
| next free | `goblinMapScrap` | quest | Goblin Scout 1/5, S6 |
| next free | `rustyHookCharm` | quest | Goblin Scavenger 1/10, S7 |
| next free | `tidecallersCompass` | equipment, amulet, rare | T4 reward. Starting stats: `xpMultiplier` 0.2, `attackSpeed` 0.1; tune with `/add-equipment-item` against Trophy Necklace and Heartwood Amulet |

`letter.png` already exists for `captainsLetter`. The other 10 need icons (`/generate-2d-asset`).

**i18n keys:**
- `quests.json` `names.*`: the 11 quest names above (Title Case, matching Mawood).
- `items.json` `names.*`: the 10 new items.
- `dialogues/laHarparElara.json`: new hub `default` (offers, in-progress and turn-ins for T1–T5 plus the clue beats) and `firstMeet` (renamed current greeting).
- `dialogues/laHarparMarvin.json`: T3 step-1 turn-in, S4 and S6 offer, progress and complete.
- `dialogues/laHarparBartender.json`: S1.
- `dialogues/laHarparJosh.json`: S2, S7, and the T4×S7 line.
- `dialogues/laHarparTrader.json`: S3, S5.
- `dialogues/mawoodCorwin.json`: T5 step 1 and the "can't read the last line yet" branch.
- `dialogues/mawoodSylvie.json`: `aboutElara` result after T4.

No new namespaces.

**Flags:** `elara_knows_messatan`. Reputation needs code (§4) and is out of scope here.

**Docs on implementation:** `docs/systems/quests.md` (drop the unfinished-captain owner decision). Add this file to the `docs/ideas/README.md` table.
