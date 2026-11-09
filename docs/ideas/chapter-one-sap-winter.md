# Chapter One: The Sap Winter

**Scope:** M · **Status:** Proposed: story arc, two new quests (*The Quiet Road*, *The Same Winter*) and dialogue for La Harpar and Mawood NPCs, the side Zone The Goat Cleft, and a new quest mechanic: search spots and hidden passages (§4a). How a chapter shows in the UI (labels, markers, title card) is left open by the owner (2026-11-09).

The game's first overarching storyline. It runs from La Harpar to Lirold's unlock and is led by **Marvin**. Its thread is the corruption the Mawood quests already tell. Chapter Two starts in Lirold, with the Exploration Guild and Slatefall.

**Owner decisions (2026-11-09):**
- Marvin leads Chapter One. Varrow posted him in La Harpar to find out about the corruption, which ties in with the Guild's move to Lirold ([`north-lirold-and-exploration-guild.md`](north-lirold-and-exploration-guild.md)).
- Elara and Theron (the Tidecaller questline, [`la-harpar-quests.md`](la-harpar-quests.md)) are a longer side story, separate from the corruption. Nothing in Chapter One mentions Theron, Messatan or the Sceptre.
- The hidden truth is "both": a failing old seal under the roots, and someone helping it fail (§6). It stays hidden for the whole of Chapter One.
- Chapter One ends once the Upper Canopy is cleared and Lirold unlocks. Chapter Two starts in Lirold.
- Chapter as a system (quest panel label, main-quest marker, title card): open.

## 1. Lore already in the game

| Fact | Source |
|---|---|
| Black sap first appeared two years ago; the Spires' "pulse" has been poisoned since. | `mawoodCorwin.json` `aboutMawood`, `aboutForest` |
| The druid's corruption "has been seeping outward for centuries". The two-year date and the centuries don't add up (T-08). | `mawoodCorwin.json` `questTheSap` |
| Gnolls planted root-bundles "deliberately — or following someone's orders" (T-11). | `mawoodFinn.json` `aboutCorruption` |
| After the Treant: "The pulse in this wood is quiet… Not a sound. It's done." | `mawoodCorwin.json` `questBlightedHeartComplete` |
| Corrupted heartwood conducts arcane energy, and the corruption made earth magic volatile (T-19). | `mawoodElarion.json` `aboutElarion`, `aboutMagic` |
| Platform three's spring is contaminated. | `mawoodSylvie.json` `questSilkWater` |
| The harpies were "more aggressive than usual" (T-13). After the Matriarch, Milo finds a door in the tallest Spire (T-12). | `mawoodMilo.json` `aboutCanopy`, `questWhatLurksPostQuest` |
| The Farming Guild's seed went black "the winter the sap appeared"; locals call it the sap winter (T-30, T-31). | `farmWarden.json`, `farmDrover.json` |
| Merchants pass through Mawood to Sylvie's. The Trader has no Mawood road until *Safe Passage*. | `mawoodMilo.json` `intro1`; `quests-data.ts` `safePassage` |
| Lirold unlocks at Upper Canopy wave 15. | `src/data/unlock-conditions.ts` |
| Proposed: Marvin keeps the Guild's road book, a record of every cart through a Guild post on the coast road, the Pass and the mine road. Varrow sent him on his last expedition, and he stays in La Harpar. | `liroldPhurgo.json` `coldForgeRecord` (shipped); [`north-lirold-and-exploration-guild.md`](north-lirold-and-exploration-guild.md) §5, §8a (proposed) |
| Proposed: in Slatefall the stone "sang" the same winter the mine collapsed (T-27). | [`slatefall-and-the-deeper-mines.md`](slatefall-and-the-deeper-mines.md) |

## 2. The story

Two winters ago the Exploration Guild's post on the Mountain Pass stopped answering. Its last runner, **Hobb**, set out from Mawood with a sealed letter from Elder Corwin, addressed to the Guild: *send anyone*. He never reached the coast. The goblins on the Pass have had his satchel ever since, in a cleft only runners used. Nobody came to Mawood because nobody got the letter.

Marvin came home from his expedition to a letter of his own. Varrow told him to stay in La Harpar, the nearest Guild hand to the Pass, and find out why the post went quiet and why the Mawood carts stopped. He has the road book, a column of loads that never arrived, and no wish to climb the Pass himself. So he sends the player.

The player brings Corwin's letter two years late, and the Mawood quests run as they do now. The Treant dies and the forest goes quiet. Then the witnesses start to disagree with the quiet. The pulse did not stop; it went down and south. The Warchief carried a token that no gnoll carved. From the Matriarch's nest, Milo has seen a line of dead crowns running south over the ridge, toward walls and a castle. Corwin writes a second letter, to the Guild in Lirold, and this time he hands it to someone who will get there. Marvin reads the address and sends the player on. Chapter Two opens at Varrow's table.

**What the player should feel:** the Treant fight is a win. The quiet afterwards is the hook.

## 3. Chapter map

| Act | Where | Level band (approx.) | Content | New work |
|---|---|---|---|---|
| Prologue | La Harpar, the Pass, the Goat Cleft | ~Long Path end → Mountain Pass | *The Quiet Road* steps 1–2 (the burned post, the cleft); sprinkle lines from the Bartender, Trader and Josh | 1 quest, 2 quest items, 1 side Zone with a new Boss, 2 battle spots, dialogue |
| Act I | Mawood | Elderwood Wilds → Deepwood | *The Quiet Road* step 3 (the letter); existing *Signs of Rot → Fetishes and Fangs → The Sap That Burns → The Blighted Heart* | Corwin hub options and a turn-in node |
| Act II | Mawood, Upper Canopy | Deepwood → Upper Canopy | Post-Treant lines from Corwin, Elarion, Sylvie and Milo; *The Same Winter* steps 1–4 (the trunk under the stair) | 1 quest, 3 quest items, 1 Town spot, dialogue |
| Close | La Harpar | Upper Canopy cleared, Lirold unlocked | *The Same Winter* step 5 (Marvin) | Marvin nodes |

The existing Mawood quests keep their data. They become Chapter One by framing only. How the panel shows that is the open system question.

## 4. Quests

Rewards are matched to existing quests, as noted. Balance is the main thread's call (`npm run sim`).

| Quest (ID) | Giver | Start gate | Steps | Item sources | Rewards |
|---|---|---|---|---|---|
| **The Quiet Road** (`theQuietRoad`) | Marvin (La Harpar) | Bandit killed ×1 (lifetime; the player has reached the Pass) | 1. Bring 1 `passPostDaybook` — turn in at **Marvin**.<br>2. Bring 1 `hobbsSatchel` — turn in at **Marvin**. His turn-in result gives 1 `corwinsLetter`.<br>3. Bring 1 `corwinsLetter` — turn in at **Corwin** (Mawood). | Daybook: **search spot** "the burned Guild post" on the Mountain Pass battle screen, step 1 only (§4a). Satchel: **Goblin Packrat**, the Boss of the new side Zone **The Goat Cleft**, 1 in 1 while step 2 is active. The Cleft opens from a **hidden passage** on the Mountain Pass battle screen, step 2 onward (§4a). Letter: given by Marvin (`give` effect). | 3500 XP, 700 gold, 1 skill point, 20 La Harpar reputation. Matched to *The Sap That Burns* (3000 / 600), plus a little for the extra step and the Boss. |
| **The Same Winter** (`theSameWinter`) | Corwin | `theBlightedHeart` completed **and** `theQuietRoad` completed | 1. Bring 1 `warchiefsToken` — turn in at **Finn**.<br>2. Bring 1 `corwinsRitualNotes` — turn in at **Elarion**.<br>3. Talk to **Milo**; requires `whatLurksAtTheTop` completed.<br>4. Talk to **Corwin** (no requirements). His turn-in result gives 1 `corwinsSecondLetter`.<br>5. Talk to **Marvin** (no requirements). | Token: **Gnoll Warchief**, 1 in 3 while step 1 is active. Notes: **search spot** "the trunk under the stair" in the Elder's Tree building, step 2 only (§4a). Second letter: given by Corwin (`give` effect). | 5000 XP, 1000 gold, 1 skill point, 50 Mawood reputation. Matched to *What Lurks at the Top* (5000 / 1000 / 1 SP), without the Skill Point Book. |

Notes:
- *The Quiet Road* step 3 can sit open until Mawood unlocks at Elderwood Wilds wave 4. The quest panel's "Talk to Corwin" link waits for the Town.
- *Signs of Rot* is **not** gated on the letter, so players who skip Marvin are not locked out. **Owner call** (§8).
- *The Same Winter* needs *The Quiet Road*, so the chapter always starts and ends with Marvin. A player who reached Mawood first can still pick it up from Marvin; step 1 then needs a trip back to the Pass.
- `corwinsSecondLetter` is **not** consumed in Chapter One. Chapter Two's first quest takes it to Varrow.
- The Finn (`warchiefsToken`) and Elarion (`corwinsRitualNotes`) turn-ins keep their item. Today a turn-in always takes a step's items (`requirement-handlers.ts` `item.consumed`), so `ItemRequirement` gets `keep?: true`, for which `consumed` returns nothing.

## 4a. Search spots and hidden passages (new quest mechanic)

Owner request (2026-11-09): things in a battle or Town screen the player can click. The player finds them through hints, not markers. Lore, placement and rules are here; the code design is the main thread's.

**Three kinds:**
- **Search spot.** Something drawn into a battle background or a Building's background. Clicking it gives an item and a line of found text (what the player sees or reads).
- **Hidden passage.** Something drawn into a battle background. Once found, it unlocks a side Zone and moves the player into it.
- **Secret (future, not in Chapter One).** A search spot or passage tied to no quest, hidden "here and there" for players who look: a cache, a note, a shortcut. Its hints come from idle talk, books and found text, never from a quest step.

**When a click works (owner decision 2026-11-09):**
- A spot that belongs to a quest works only during the step that needs it. Before that step, and once its item is held, it is plain scenery and a click does nothing.
- A secret works whenever the player finds it, once per save; after that it is scenery. Its condition can be anything (always, after a quest, from some level), but never "while a quest step is active".

**Not obvious (owner decision 2026-11-09):**
- Spots are **baked into the background art**. They're there whether or not a quest needs them, so they never appear, glow or change. No outline, sparkle, icon, tutorial pulse or highlight on hover.
- **No cursor change on hover** (owner decision 2026-11-09, for now). A spot can't be found by sweeping the mouse, so the hints must be exact enough to aim by. If players get stuck, revisit this; a glow stays off the table.
- The quest panel gives no zone link or "Talk to" link for a spot step. The step text repeats the hint in the player's own words, so a player coming back after a week can still find it.
- **Hints come from the world:** an NPC's directions, a letter, a book's text (the item's description, read in the inventory), found text from an earlier spot. Each spot has at least two hints, from different sources, that together describe what it looks like and where it is on the screen ("behind the switchbacks", "worn smooth at shoulder height", "goblin marks beside it").

**Hidden Zones are full Zones (owner decision 2026-11-09):** a hidden Zone is its own entry in Zone data, with its own ID, tier, Waves, Boss, background and mastery reward. Once found, it appears on the world map with a marker. It has the same mechanics as any other Zone: stars or mastery, kill counters, offline progress, Bestiary entries and quest kill requirements. Only how it unlocks differs: by finding the passage, not by a Wave reached. It stays unlocked for good; the passage needs no second click (the map takes the player there).

**Code rules** (review 2026-11-09):
- A found passage grants its Zone through `UnlockService.grant`: a third Zone unlock path beside the boss chain and town entrances. No `UNLOCK_RULES` entry (rules never target Zones); the Zone is saved in `unlockedContent.zones` like any other. Update `GLOSSARY.md` "Zone unlock" and `zones-waves-unlocks.md`.
- A spot gives its item through the Item grant (the Quest tab has no cap, so it always fits).
- An item description used as a hint needs a description line in the item tooltip; no item shows one today (`known-issues.md`).
- Spot positions must line up with the art at every window size. Backgrounds use `background-size: cover` today and the battle panel's shape changes with window width, so the crop moves. Owner decision (2026-11-09): backgrounds move onto a fixed-ratio stage first ([`../plans/scene-stage.md`](../plans/scene-stage.md)), and spots are found by a scene mask (a same-size PNG, one flat colour per spot), not by coordinates.

Build order: [`../plans/chapter-one-sap-winter.md`](../plans/chapter-one-sap-winter.md).

**Fiction rules** (for dialogue and text that point to them):
- The NPC says where, as a person would: "the trunk under the stair", "a cleft only goats and runners use". Never "click", "look on the screen" or "highlighted".
- Found text is one or two sentences in the narrator's plain voice, never an NPC's.

### Spots in Chapter One

| Spot | Kind | Where in the art | Works when | Gives / does | Hints | Found text |
|---|---|---|---|---|---|---|
| The burned Guild post | Search spot | Mountain Pass background, any Wave: a small stone hut base with no roof, at the roadside, left of the path | *The Quiet Road* step 1 | 1 `passPostDaybook` | Marvin: a hut off the road, stone below and timber above, timber likely gone; under the floor stone. Step text: "Find the Guild post on the Pass and look under its floor stone." | A post-hut with its roof burned off. Under the floor stone, where a runner would know to look, a daybook wrapped in oilcloth. |
| The goat cleft | Hidden passage | Mountain Pass background, all Waves: a dark vertical crack in the rock face behind the switchbacks, with scratched goblin marks beside it | *The Quiet Road* step 2 (the first time); afterwards the Zone is on the map | Unlocks **The Goat Cleft** and moves the player there | The daybook's description: Hobb's last line, "going round by the cleft". Marvin: behind the switchbacks, a goat turns sideways in it, rock worn smooth. The burned post's found text can add "goblin marks scratched on the stone, pointing up the slope". | A crack in the rock behind the switchbacks, too narrow for a cart, worn smooth at shoulder height. Past the goblin marks, it opens. |
| The trunk under the stair | Search spot | Elder's Tree background: a strapped trunk wedged under the stair | *The Same Winter* step 2 | 1 `corwinsRitualNotes` | Elarion: "the trunk under the stair at the Elder's Tree". Step text repeats it. | An old trunk wedged under the stair, its strap stiff with age. Under folded robes, a sheaf of bark-paper covered in a younger man's handwriting, and drawings. |

The first draft had the cleft only from Wave 10. That is dropped: baked art is in every Wave, so the cleft works on any Wave of step 2.

The art for these is new work: the Mountain Pass background needs the post-hut and the cleft painted in, and the Elder's Tree background needs the trunk. Each must read as ordinary scenery, small enough to miss and clear enough to find with the hint.

### The Goat Cleft (new side Zone)

| | |
|---|---|
| **Where** | Off the Mountain Pass, behind the switchbacks. It is not on the main route: no `previousZoneId`/`nextZoneId` link changes, and the passage is its only way in until it is found. Once found, it has its own world map marker beside the Pass. |
| **Tier** | 4, with enemy stats about the same as the Mountain Pass (owner decision 2026-11-09). 8 Waves (owner decision), shorter than the Pass's 15. |
| **Enemies** | **Goat** (existing; goats use the cleft too), **Rock Viper** (new), **Goblin Hoarder** (new). |
| **Boss** | **Goblin Packrat** (new). |
| **Lore** | The runners' short-cut round the switchbacks. The goblins found it and made it their store. Hobb's satchel is here; Hobb is not (T-34 stays open). |
| **Art** | Narrow grey cleft, a strip of sky, goblin junk-piles of packs and cart wheels, a single Guild post-stake with an orange rag. |
| **Mastery reward** | The Zone formula for tier 4 (50 × tier² gold, 3 × tier tokens): 800 gold and 12 Explorer Tokens, plus 5 Viperskin and 5 Pack Leather. |
| **Shared enemy** | The Goat is in both the Pass and the Cleft. Nothing breaks, but: Goat Tasks roll twice as often (the Task pool lists it once per Zone, `tasks.ts`); Goat kills on the Pass count toward the Cleft's Hunter star (bestiary rank is per enemy); quest kill links go to the first unlocked Zone in `ZONES_DATA` order, so the Cleft's entry goes after the Pass. `zones-waves-unlocks.md` "No enemy is shared between zones" changes to allow it. `npm run sim` doesn't cover the Cleft (its route is hard-coded). |
| **Why hunt here later** | It is the only source of Viperskin, Viper Venom and Pack Leather, the materials of the **Viperskin set**, the game's first ranged-damage gear, and of the Packrat's two pieces of gear. |

### New enemies

| Enemy | Kind (`EnemyType`) | Weakness | Look | Drops |
|---|---|---|---|---|
| **Rock Viper** | reptile | earth | A grey-brown snake the colour of the cleft wall. It strikes from cracks at head height. | Viperskin (common, about 1 in 4), Viper Venom (about 1 in 6), pet |
| **Goblin Hoarder** | goblin, humanoid | fire | A goblin under a sack bigger than it is, swinging whatever it pulled out last. Burns well. | Pack Leather (common, about 1 in 4), Stick and Stone (as the Scavenger), Lost Trade Goods (rare, about 1 in 20, sells for gold), Viperskin patterns (rare, below), pet |
| **Goblin Packrat** (Boss) | goblin, humanoid | water | A goblin under a heap of stolen packs, strapped on with buckled Guild leather like armour, swinging a sack of stones. It wears a pair of runner's boots far too big for it. | `hobbsSatchel` (1 in 1 while *The Quiet Road* step 2 is active), Buckled Harness (about 1 in 15), Runner's Boots (about 1 in 15), pet |

Weaknesses: earth and fire are new to this stretch, so they reward carrying a second element. Water on the Packrat matches the Goblin Scavenger. Drop rates copy the Pass (Troll gear 1 in 15, Goat pelts 1 in 4). Stats and balance are the main thread's call (`npm run sim`).

### New items

| Item | Type | Source | One line | Use (proposed) |
|---|---|---|---|---|
| **Viperskin** | material | Rock Viper | Thin grey scales that bend without cracking. | The Viperskin set's main material; also an animal material for Wick's orders (the cleft as a source Zone). |
| **Viper Venom** | material | Rock Viper | A stoppered drop of venom, cloudy and cold. | Treats the set's gloves and hood (below). A later use for Sylvie or an antidote is open. |
| **Pack Leather** | material | Goblin Hoarder | Straps and patches cut from other people's luggage. | Straps and backing for the Viperskin set. |
| **Lost Trade Goods** | junk (sellable) | Goblin Hoarder | Something a carter was very sorry to lose. | Sells to the Trader. |
| **Buckled Harness** | chest | Goblin Packrat | Guild straps and buckles from a dozen stolen packs, riveted into something like armour. | A Pass-tier chest piece, matched to the Troll Hide Vest. Its stats are the main thread's call; a loot-flavoured stat (gold find) fits a hoarder. |
| **Runner's Boots** | boots | Goblin Packrat | Worn soft by six years of the Pass. Not his size. | Boots with a speed-type stat, matching a runner. Which stat is the main thread's call. |

### The Viperskin set (ranged gear)

Owner decision (2026-11-09): Viperskin crafts a whole set that boosts ranged damage. Nothing in the game boosts ranged damage today, though ranged weapons exist (`WeaponCategory.ranged`, e.g. Finn's Ashwood Bow). That makes this the first gear for a bow build.

| Piece | Slot | Recipe (workbench) | One line |
|---|---|---|---|
| **Viperskin Hood** | helmet | Viperskin, Pack Leather, Viper Venom | Treated so the rain runs off; you hear better in it, somehow. |
| **Viperskin Jerkin** | chest | Viperskin, Pack Leather | Grey scale over goblin-salvaged straps. Moves when you draw. |
| **Viperskin Leggings** | legs | Viperskin, Pack Leather | Quiet on rock. |
| **Viperskin Boots** | boots | Viperskin, Pack Leather | Light enough for the cleft, which is the point. |
| **Viperskin Gloves** | gloves | Viperskin, Pack Leather, Viper Venom | Venom-cured grips that don't slip on a bowstring. |

Five pieces in the slots the Turtle Shell set uses (`docs/ideas/item-sets.md`). The Packrat's Buckled Harness and Runner's Boots compete with the Jerkin and Boots on purpose: loot or set.

**How it boosts ranged damage:**
- **Needs a new stat:** `rangedDamageMultiplier`, mirroring `meleeDamageMultiplier` (`hit-resolution.ts`, `player.ts`, `stat-rows.ts`, `app.json`): it multiplies auto-attacks with a ranged weapon and ranged spells. Each piece carries a little of it. The offline simulation gets the ranged flag too (`offline-simulation.ts` passes only `isMeleeWeapon` today), or offline progress undercounts bow builds.
- **No set bonus** (owner decision 2026-11-09): item sets don't exist yet, so the pieces carry the stat alone and the set is a set in name only.
- `item-sets.md` plans a **Hunter's Kit** (Mawood, "bonus vs beasts, attack speed"). The Viperskin set is the ranged-damage one, so keep the two from overlapping.

**How the recipes are learned (proposed):** a carter's pattern book, torn up. The Goblin Hoarders carry the **Viperskin patterns**, one recipe scroll per piece, each about 1 in 40, so the set is a hunt as much as a craft (about 90 Hoarder kills for all five). A known recipe's scroll can't be used (`PlayerStore.useItem`), so duplicates get a small sell value. Recipe scrolls already exist (`docs/systems/consumables-camp-crafting.md`). The alternative is to have Brenna (Hunter's Lodge) teach them once the player brings her Viperskin. Owner call.

Lore: the cleft's vipers are why runners wore viperskin on the Pass at all. A runner's kit was always viperskin, and the patterns came down in the carts the goblins robbed.

**Not used in Chapter One (planted for later):** the warm door in the tallest Spire (T-12, T-35) is the obvious hidden passage for Chapter Two or later. It could be a spot on the Upper Canopy battle screen that gives only found text ("Warm as a stove. It doesn't move.") until a later quest opens it.

## 5. Clue beats

- **Daybook (Marvin):** the Pass post's last entry is in Hobb's hand: up from Mawood, bound for the coast, goblins on the switchbacks, "going round by the cleft". Nothing after. Marvin knows the cleft only from the book: runners used it and carts can't.
- **Satchel (Marvin):** a Guild runner's satchel with a Pass-post stamp two winters old, and a sealed letter addressed to the Exploration Guild. Marvin won't open it: "Not ours to open. Ours to carry." He finds Hobb's line in the road book, still open.
- **Letter (Corwin):** he recognises his own hand. He wrote it the first winter of the sap and asked for anyone. "You are the anyone. Two years late, and welcome all the same."
- **Token (Finn):** a disc of bone on a cord, cut with marks. The Warchief wore it under his armour. The knotwork matches the root-bundles, and Finn has never seen a gnoll tie a knot that neat.
- **Elarion:** the token hums like the corrupted roots did, faintly, even now. The marks aren't runes. "Older grammar." He needs something to compare them with, and knows Corwin kept notes the night his ritual went wrong. With the notes, he finds one of the token's marks drawn there, decades ago, by Corwin, from what the Spire "said" to him. Whoever made the token writes in a grammar Corwin heard before the sap ever came (T-09).
- **Milo:** from the nest he saw a line of grey, dead crowns running south, over the ridge, "like someone drew it", toward walls and a castle. The door in the Spire is warm.
- **Corwin:** he knows the player has been in his trunk, and he doesn't take the notes back. The quiet is not rest. The pulse went down under the roots and south. Whatever woke the old wound is not in the Deepwood. He writes to the Guild again and hands the letter over himself.
- **Marvin:** reads the address and admits why he's in La Harpar. He sends the player to Varrow in Lirold.

## 6. Hidden truth (bible only, never stated in Chapter One)

Owner decision (2026-11-09): "both".

1. **The seal.** Something very old under the Silverwood roots was sealed long ago. The druid whose ritual consumed the Spire (T-10) was tied to that seal. Two winters ago the seal began to fail. Everything that winter is one event seen from four places: the black sap rising, the Treant's old wound reopening, the Farming Guild's seed blackening, and (proposed) Slatefall's stone singing and the Stone Warden waking.
2. **The hand.** Someone knows the seal is failing and is helping it along. They gave the gnolls the root-bundles and the Warchief his token (T-11). Their marks are on the token. Where they come from is open; the chants and howls past the uncrossable mountain (T-05) are a candidate, not a fact.
3. **Why two winters ago:** open. Theron taking Primula's Sceptre five years ago is a candidate the bible keeps. The Tidecaller side story must never confirm it, and Chapter One never mentions it. **Owner call.**
4. **Marvin's expedition** (T-17) stays secret. Whether it saw anything of the seal or the hand is open.

## 7. Dialogue scripts

Voices: `docs/character/laHarpar/marvin.md`, `bartender.md`, `trader.md`, `josh.md`; `docs/character/mawood/*.md`. Marvin's tree is the proposed full replacement in [`north-lirold-and-exploration-guild.md`](north-lirold-and-exploration-guild.md) §8a. The nodes below are **additions** to it, and work on the shipped tree too. Every node below is **(new)** unless marked otherwise.

### Marvin (`laHarparMarvin`)

Hub additions, in hub order: turn-ins first, then in progress, then the offer.

1. "That Guild runner's satchel. I've got it." → quietRoadSatchel · effect: advance `theQuietRoad` (only if ready at step 2)
2. "I found the post's daybook." → quietRoadDaybook · effect: advance `theQuietRoad` (only if ready at step 1)
3. "Corwin sent this down with me." → sameWinterEnd · effect: advance `theSameWinter` (only if ready at step 5)
4. "About that runner..." → quietRoadProgress (only if `theQuietRoad` active at step 1) / quietRoadProgress2 (only if active at step 2)
5. "Anything the Guild needs doing up the Pass?" → quietRoadOffer (only if `theQuietRoad` available)
6. "Why are you really in La Harpar?" → aboutPosting (only if `theSameWinter` completed)

#### quietRoadOffer
> Say you're keeping the books for a road. Every cart, every load, every stamp at every post. Then one winter a whole post stops stamping. No cart through it, nothing back out. Not one line in two years. What do you do?

1. "Go and look." → quietRoadOffer2
2. "Send someone else to look." → quietRoadOffer2
3. "Not my road." → default

#### quietRoadOffer2
> Right, and somebody has to. The Guild kept a post halfway up the Mountain Pass. A runner called Hobb carried the Mawood post down through it, every month for six years. He was never once late. He set out two winters back and that's where my book stops. The post's still up there, what's left of it. Every post keeps a daybook, under the floor stone, where a runner knows to look and a goblin doesn't. Find it and bring it to me.

1. "I'll find it." → default · effect: start `theQuietRoad`
2. "Two years is a long time to leave a man on a mountain." → quietRoadWhy

#### quietRoadWhy
> It is. I wasn't here for it. I was out past where anybody has a map, and I came home to a letter telling me to stay put and find out what happened on that road. So I'm finding out. I'd go up myself if…

Well. You're going.

1. "I'm going." → default · effect: start `theQuietRoad`
2. "Ask me again later." → default

#### quietRoadProgress
> The post sits off the road on the Pass, a hut, stone below and timber above. If the timber's gone, the stone's still there. Look under the floor.

1. "I'll find it." → default

#### quietRoadDaybook
**Shown when:** `theQuietRoad` ready at step 1. The turn-in takes `passPostDaybook`. He reads the last page twice.
> That's his hand. "Up from Mawood, bound for the coast. Goblins on the switchbacks. Going round by the cleft." And that's the last line anyone wrote in it.

Say you're a runner with a satchel, and there's goblins on the road. You don't fight them. You go the way carts can't. There's a cleft behind the switchbacks; I've never seen it, only read about it in here, runners' business. If the goblins found it too, that's where your satchel is. Higher up the Pass than you'll want to be.

1. "Then I'll go higher." → default
2. "What if Hobb's in there?" → quietRoadHobbMaybe

#### quietRoadHobbMaybe
> Then you tell me, and I'll write it down properly, and I'll be the one to tell the Bartender why she isn't getting paid. Bring the satchel either way.

1. "I will." → default

#### quietRoadProgress2
> The cleft. Behind the switchbacks, past the halfway mark. Narrow enough that a goat turns sideways. Look for where the rock's worn smooth.

1. "I'll find it." → default

#### quietRoadSatchel
**Shown when:** `theQuietRoad` ready at step 2. The turn-in takes `hobbsSatchel`.
> That's Guild leather, and that's the Pass stamp. Two winters old. He made the post, then. Somewhere below it…

There's a letter in here, still sealed. "To the Exploration Guild." From Mawood, past the Pass, by the look of the wax. Not ours to open. Ours to carry. I'll close Hobb's line in the book tonight. You take this where it was going.

1. "To Mawood, then." → default · effect: give 1 `corwinsLetter`
2. "Who's it from?" → quietRoadWho · effect: give 1 `corwinsLetter`

#### quietRoadWho
> The wax has a leaf pressed in it, and I've only seen that on one man's post: the elder up there, Corwin. If he sealed it, he expected an answer, and for two years he hasn't had one. Go and give him one.

1. "I will." → default

#### sameWinterEnd
**Shown when:** `theSameWinter` ready at step 5. The letter is **not** taken.
> Another one. Same leaf in the wax. And look at that hand, he's pressed so hard he's nearly gone through the paper. "To the Exploration Guild, Lirold."

Not me, then. Her.

1. "Who's her?" → sameWinterVarrow
2. "You're the Guild, as far as I've seen." → sameWinterVarrow

#### sameWinterVarrow
> Odile Varrow. She runs the Guild from the capital, down the coast road from the beach. She sent me home to watch the Pass road, and I've watched it, and you're what I've got to show her. Take it to her yourself. She'll ask how far it is from the nest to her east gate. Think before you answer.

1. "Then I'm going to Lirold." → end · effect: advance `theSameWinter`

#### aboutPosting
**Shown when:** `theSameWinter` completed.
> Because the Guildmaster told me to be. I came home off that last trip wanting a bed and a month of nobody asking me anything, and there was her letter on the table. Stay in La Harpar. Watch the Pass road. Write down every cart that doesn't come down it and every rumour from the north. Say you're her. Three runners gone in two winters, and your traders telling you the trees up there are bleeding. You'd want someone sitting at the bottom of that road with a book. So I sat.

1. "And now?" → aboutPostingNow
2. "You could have told me." → aboutPostingNow

#### aboutPostingNow
> Now I've a letter in my book with your name next to it, and Hobb's line is closed. That's more than I had at midsummer.

1. "Fair." → default

### Corwin (`mawoodCorwin`)

Hub additions, in hub order. They sit with his existing quest options.

1. "A letter from the Guild post. It's yours, I think." → quietRoadLetter · effect: advance `theQuietRoad` (only if ready at step 3)
2. "I've spoken to Milo." → sameWinterLetter · effect: advance `theSameWinter` (only if ready at step 4)
3. "About this winter business..." → sameWinterProgress (only if `theSameWinter` active at steps 1–3)
4. "You said the Spires went quiet." → sameWinterOffer (only if `theSameWinter` available)

#### quietRoadLetter
**Shown when:** `theQuietRoad` ready at step 3. The turn-in takes `corwinsLetter`. He reads it before he speaks.
> This is my hand. I wrote this the first winter the sap came, when I still believed someone on the coast would read it and come. I asked for anyone.

You are the anyone. Two years late, and welcome all the same. The runner?

1. "Dead on the Pass, I think." → quietRoadHobb
2. "Nobody knows." → quietRoadHobb

#### quietRoadHobb
> Hobb. He ate at my table the night before he left, and complained about the stairs. I had it in my head, all this while, that the Guild had read it and decided we were not worth the climb. I am glad to be wrong about them, and sorry to be wrong for this reason.

1. "What did the letter ask for?" → corruptionLore *(existing node)*
2. "I'm here now." → default

#### sameWinterOffer
**Shown when:** `theBlightedHeart` and `theQuietRoad` completed, `theSameWinter` available.
> I did. I told you it was done, and I meant it, for a day. Then I lay down on the boards that night and felt it. Not in the Spires. Under them. Faint, the way you hear a cart on a far road. The wound in the Deepwood was old. Something reopened it, and that something did not die with the Treant.

1. "Then where is it?" → sameWinterOffer2
2. "You're tired, Elder. It's over." → sameWinterTired

#### sameWinterTired
> I am tired. That is not the same as wrong. Come back when you've stopped wanting it to be over. I did, and it took me a night.

1. "All right. Tell me." → sameWinterOffer2
2. "Another time." → default

#### sameWinterOffer2
> I don't know. Finn has been back to the Warchief's camps since you broke them, and he came home quieter than he went. Ask him what the Warchief wore. Bring whatever it is to Elarion before you bring it to me. He will want to set fire to it, and I will want to know what it is first.

1. "I'll see Finn." → default · effect: start `theSameWinter`
2. "Not yet." → default

#### sameWinterProgress
> Finn, then Elarion, then the boy. Each one of them has felt it from a different side, and none of them has said so to me.

1. "I'm on it." → default

#### sameWinterLetter
**Shown when:** `theSameWinter` ready at step 4.
> You've been in my trunk. No, keep them. I would have said no if you'd asked, and I'm glad you didn't. Elarion found his mark in there, I suppose. I drew it the night the Spire took me. I thought it was the Spire's word. I've thought so for forty years.

South, Milo says. Over the ridge, toward a castle. My Spires have stood since before there was a castle there to be south of.

Give me a moment.

*(He writes. It takes a while. He presses the leaf into the wax himself.)*

> To the Exploration Guild, in Lirold, since Hobb's satchel says that's where they keep their table now. I asked for anyone the first time. This time I'm asking for whoever reads charts for a living. Take it down yourself, please. I've trusted the road once already.

1. "It'll get there." → default · effect: advance `theSameWinter`, give 1 `corwinsSecondLetter`

### Finn (`mawoodFinn`)

Hub additions: turn-in, progress.

1. "The Warchief's token." → sameWinterToken · effect: advance `theSameWinter` (only if ready at step 1)
2. "Corwin says the Warchief wore something." → sameWinterFinnProgress (only if `theSameWinter` active at step 1)

#### sameWinterFinnProgress
> A disc. Bone. On a cord under his armour. I saw it when you dropped him and I didn't go near it. New Warchief's wearing one too. Get it.

1. "On my way." → default

#### sameWinterToken
**Shown when:** `theSameWinter` ready at step 1. The token is **not** taken, because Elarion needs it at step 2.
> Look at the knot on the cord. Same as the bundles. I've watched gnolls a long time. They tie a knot like they're strangling something. This one's neat.

Somebody ties these for them. Take it to the wizard. Don't wear it.

1. "Wasn't planning to." → default

### Elarion (`mawoodElarion`)

Hub additions, in hub order:

1. "Here are Corwin's notes." → sameWinterElarionNotes · effect: advance `theSameWinter` (only if ready at step 2)
2. "Finn found this on the Warchief." → sameWinterElarion (only if `theSameWinter` active at step 2 and not ready)

#### sameWinterElarion
> Oh, that's unpleasant. Hold still, don't hand it to me, I'd like to keep my eyebrows.

It hums. Faintly, but it does, the same note the heartwood had before you went down there and stopped it. And these marks aren't runes, not any I was taught in Drenhollow. It's an older grammar. Someone wrote a word into this bone and the word is still being said.

I need something to hold it against. Corwin kept notes the night his ritual went wrong; he told me so once, when he'd had the elderberry wine, and has denied it ever since. He won't lend them to me. He might to you. Ask him. No, actually, don't ask him, he'll say no. They're in the trunk under the stair at the Elder's Tree.

1. "You want me to go through his things?" → sameWinterElarionTrunk
2. "Under the stair. Fine." → default

#### sameWinterElarionTrunk
> I want you to borrow forty-year-old paper from a man who'd hand it over himself if he weren't embarrassed by it. I'll take the blame. I usually do, it's practically my job here.

1. "On your head, then." → default

#### sameWinterElarionNotes
**Shown when:** `theSameWinter` ready at step 2. The turn-in does **not** take the notes (Corwin sees them at step 4).
> Look at this. He was what, twenty? Lovely penmanship, dreadful theory. Pages of it, and here…

There. Third line down. That's the mark on the token, near enough the same stroke. He drew it from whatever the Spire showed him that night, decades before anyone saw black sap. So either the Spire speaks the same old grammar as whoever carved that bone, or whoever carved that bone has been talking a long time.

I don't like either of those. Show Corwin. And ask Milo what he saw from the nest. He's been describing it at my counter for a week, to anyone holding still, and I've been holding still badly.

1. "Milo?" → sameWinterElarionMilo
2. "I'll take it to Corwin." → default

#### sameWinterElarionMilo
> He climbs. He sees. He comes down and tells the wrong people. Go.

1. "Going." → default

### Milo (`mawoodMilo`)

Hub addition: "Elarion says you saw something from the nest." → sameWinterMilo · effect: advance `theSameWinter` (only if ready at step 3, which needs `whatLurksAtTheTop` completed)

Before *What Lurks at the Top* is done, step 3's requirement shows in the quest panel and Milo's option stays hidden.

#### sameWinterMilo
> Yes! Finally somebody asks. Okay. So from the nest you can see really far, right, farther than anyone, and south there's a line. Of trees. Dead ones, just the tops, grey. Going in a line over the ridge. Not wiggly like a river. Like someone drew it with a stick.

And at the end, way way off, there are walls. And a castle! A real one.

1. "Did you tell Corwin?" → sameWinterMiloDoor
2. "A line, going south." → sameWinterMiloDoor

#### sameWinterMiloDoor
> No, because he'd tell me to stop climbing. Also, the door's warm now. The one in the Spire. It wasn't before. I put my hand on it and it was like a stove. You tell him. He listens to you.

1. "I'll tell him." → default

### Sylvie (`mawoodSylvie`)

Idle addition, after `theBlightedHeart`: "Has the spring cleared?" → springStill

#### springStill
> No, and I'd like someone to explain that to me. The Treant's dead and the saplings are greening, and platform three still tastes of pennies. I've stopped bottling it. I've started writing down which mornings it's worse. Tuesdays, if you want to know, which is ridiculous.

1. "Keep writing it down." → default

### La Harpar sprinkles (prologue)

Optional, one or two lines each. None mentions Theron.

#### Bartender: "Did you know a Guild runner called Hobb?" → bartenderHobb (only if `theQuietRoad` active or completed)
> Know him? He owes me for four suppers and a bottle of the good stuff. Two winters. Said he'd settle up on the way back down. That'll be 20 coins for the memory, and no, it doesn't go on his tab.

1. "Here." → default · effect: pay 20 gold
2. "Put it on mine." → default

#### Trader: "Anything new?" → traderMawoodGoods
> New? Nothing's come down off that Pass in two winters, that's what's new. We used to get Mawood salves with the goat carts, wrapped in leaves, sealed in green wax. Sold them faster than fish. The last crate I had, the wax had gone black right through. Couldn't sell a jar. Aye, I still have it, if you're buying curiosities.

1. "Not today." → default

#### Josh, after the paid beer: "What's over the Pass?" → joshCarts
> Over it? Dunno, mate, never been. The carts used to come down with this mushroom spirit from up there. Green. Tasted like a forest floor, in a good way. Two winters ago the carts stopped, and now I drink this. Life's cruel.

1. "Tragic." → talkReady

## 8. Owner calls

1. **Signs of Rot stays ungated.** *Signs of Rot* is not gated on *The Quiet Road*. Players who skip Marvin keep the current flow. Alternative: gate it, so the chapter is the only way in.
2. **The runner's name is Hobb.** No clash found in shipped text or docs.
3. **The Guild post on the Pass is new canon.** Marvin's road book already lists Pass posts (`Phurgo#coldForgeRecord`). The post itself was never placed on a map.
4. **"Three runners gone in two winters"** (Marvin `aboutPosting`) adds two unnamed runners. They are candidates for Varrow's open entries (T-32), but nothing confirms it.
5. **Corwin knows the Guild is in Lirold** from "Hobb's satchel" (his `sameWinterLetter` line). This assumes the satchel holds a Guild post sheet naming the hall. If the Guild move doesn't ship, change his line to "To the Exploration Guild."
6. **Varrow's `arrival` already asks about the nest view.** Marvin's `sameWinterVarrow` warns the player she will. If Chapter Two adds a letter turn-in at her table, her `arrival` needs one more option ("Corwin of Mawood sent this.").
7. **The Warchief token is reused from step 1 through step 4.** It is a quest item that is never taken. Keep it (`ItemType.quest`, unsellable) as a Chapter Two clue, or have Corwin take it at step 4.
8. **Theron as the cause of the seal failing** is kept in the bible as a candidate only (§6.3).
9. **The Goat Cleft is a full Zone** (owner decision): 8 Waves, Pass-level strength, two new enemies, a new Boss, a new background and two repainted backgrounds.
10. **Viperskin recipes come from Hoarder drops** (patterns, about 1 in 40 each) rather than from Brenna. No set bonus until item sets exist (owner decision); ranged-damage numbers are the main thread's call.
11. **The Packrat's chest piece is a Buckled Harness** (owner decision: no new weapon). A gold-find stat is suggested.
12. **Corwin's ritual mark matches the token.** This is the strongest new canon here: the hand's grammar was in the Spires decades before the sap (T-09, T-11). It points Chapter Two at "old" rather than "new" enemies. Cut the match and keep only the notes if that's too much.
13. **Elarion sends the player through Corwin's trunk.** Corwin forgives it on screen. If taking things from an Elder feels wrong for the game's tone, Corwin can instead say where the notes are, and Elarion's `sameWinterElarionTrunk` goes.

## 9. New items and NPCs

| Item (`ItemType.quest`, unsellable) | Source | One line |
|---|---|---|
| `passPostDaybook` — Pass Post Daybook | Search spot: the burned Guild post, Mountain Pass battle screen, *The Quiet Road* step 1 | A runners' daybook in oilcloth. The last entry is Hobb's: "Going round by the cleft." |
| `hobbsSatchel` — Hobb's Satchel | Goblin Packrat (Goat Cleft Boss), 1 in 1 while *The Quiet Road* step 2 is active | A Guild runner's leather satchel, Pass-post stamp, two winters old. |
| `corwinsRitualNotes` — Corwin's Ritual Notes | Search spot: the trunk under the stair, Elder's Tree, *The Same Winter* step 2 | Forty-year-old bark-paper in a young man's hand, with drawings of what a Spire showed him. Never taken. |
| `corwinsLetter` — Corwin's Letter | Given by Marvin at *The Quiet Road* step 1 | Sealed with a leaf pressed in green wax. "To the Exploration Guild." |
| `warchiefsToken` — Warchief's Token | Gnoll Warchief, 1 in 3 while *The Same Winter* step 1 is active | A bone disc on a neatly knotted cord, cut with marks no one in Mawood can read. |
| `corwinsSecondLetter` — Corwin's Second Letter | Given by Corwin at *The Same Winter* step 4 | "To the Exploration Guild, in Lirold." Pressed so hard the pen nearly went through. |

| New | Kind | One line |
|---|---|---|
| **The Goat Cleft** | Side Zone, tier 4, 8 Waves, its own Zone entry | The Pass runners' short-cut, now a goblin store; entered by the hidden passage, then from the map (§4a). |
| **Rock Viper** | Enemy | A wall-coloured snake striking from cracks. |
| **Goblin Hoarder** | Enemy | A goblin under a sack bigger than it is. |
| **Goblin Packrat** | Boss enemy | A goblin under a heap of stolen packs and Guild leather, which it swings like a flail; wears runner's boots. |

The Cleft's materials, junk and gear are listed in §4a, New items.

No new NPCs. Hobb is named but never met.

## 10. For the main thread

- `/add-quest` for `theQuietRoad` and `theSameWinter`: data, i18n, start gates, quest-only drops (`requiredActiveQuestId`), `give` effects at the two turn-ins.
- `/add-npc-dialogue` (expand) for Marvin, Corwin, Finn, Elarion, Milo, Sylvie, the Bartender, the Trader and Josh, with the nodes in §7. Then `/audit-dialogue` on each, for hub order.
- Update `docs/systems/quests.md` with a *Chapter One* section, and add a `CHANGELOG.md` line.
- Chapter UI is left open by the owner. Don't build it with this.
- **Search spots and hidden passages need a system design first** (§4a): a spot list per battle background and per Building, shown by quest step, giving an item or unlocking a Zone; a new system doc. Touch-points: quest requirements (an item from a spot fits the existing `item` requirement; add `keep?: true`), `UnlockService.grant` for a found passage (not `unlock-conditions.ts`), battle and Building views (spot placement, open in §4a Code rules), the item tooltip (description line), and the quest panel (no change: item rows have no zone link already).
- `GLOSSARY.md`: add Search spot, Hidden passage, Secret, Side Zone and Found text; change "Zone unlock" for the third path. Chapter waits for the chapter UI decision.
- The Goat Cleft is a normal `ZONES_DATA` entry with no route links. Check the world map, Zone mastery, offline progress and the Bestiary for any assumption that every Zone sits on the `previousZoneId`/`nextZoneId` chain.
- `/add-enemy-and-zone` for the Goat Cleft, Rock Viper, Goblin Hoarder and Goblin Packrat; `/add-equipment-item` for the Buckled Harness, Runner's Boots and the five Viperskin pieces; `/add-recipe-or-consumable` for the five Viperskin recipes and their pattern scrolls; a new `rangedDamageMultiplier` stat (stats, battle damage, offline simulation, tooltips); `/add-shiny-variant` for the three new pets; Wick's order pool for Viperskin.
- `/generate-2d-asset` for the Cleft background, three enemy sprites and the item icons, and to repaint the Mountain Pass (post-hut, cleft) and Elder's Tree (trunk) backgrounds with the spots baked in.
