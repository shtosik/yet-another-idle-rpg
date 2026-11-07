# Farm dialogue and quest scripts (commit C10)

**Scope:** M · **Status:** Done (wired in plan commit C10 on `feat/farm`)

Scripts for [the Farm & Farming Guild](farm-and-husbandry.md) (owns the rules) in the plan's C10 ([`farm-implementation-plan.md`](farm-implementation-plan.md)). Voices: [Marta](../character/farm/marta-tillbrook.md), [Wick](../character/farm/wick.md), Sylvie (`src/assets/locales/en/dialogues/mawoodSylvie.json`: warm, chatty, "I know I talk a lot"). Names are placeholders (farm doc §1).

## Lore already in the game

| Fact | Source |
|---|---|
| Sylvie runs the apothecary in Spire four, grew up near La Harpar, talks a lot, needs silk and clean water. | `mawoodSylvie.json` `intro1`, `intro2`, `questSilkWater` |
| The black sap is two years old; Corwin keeps saying it is containable. | `mawoodSylvie.json` `aboutCorruptionSpreading` |
| Sylvie's herb shelf was hit by the blight ("the plants here were extraordinary, before"). | `mawoodSylvie.json` `aboutSylvie` |
| Farm, Guild, Marta, Wick, seeds, the Hare, the title | proposed, `docs/ideas/farm-and-husbandry.md` |

## NPC ids (confirmed against the farm doc §2 item 5 and §3)

`farmWarden` (Marta), `farmDrover` (Wick). Existing: `mawoodSylvie`, Corwin's existing NPC key. Flags: `met_farmWarden`, `met_farmDrover` (engine), `warden_gave_pet` (farm doc §9a). Guild reputation condition below is written `reputation farmingGuild` (the `ReputationID` after C1).

Tags used in scripts: **Shown when** = result conditions. `→` = next node. Option order in a hub: turn-ins, in-progress, offers, then business and lore, then goodbye.

---

# 1. Sylvie (`mawoodSylvie`): new nodes that start and close Sylvie's part of the chain

Add to the existing `default` node (below the existing quest options, per "all turn-ins, then in-progress, then offers"):

| Position | Option text | Shown when | → |
|---|---|---|---|
| turn-in | "I have the silverleaf." | quest `silverleafForSylvie` ready to turn in | `questSilverleafComplete` · effect: end quest |
| in-progress | "About the silverleaf..." | quest `silverleafForSylvie` active | `questSilverleafProgress` |
| in-progress | "About the Farming Guild..." | quest `seedsFromTheTerrace` active | `questTerraceProgress` |
| offer | "Is something wrong with the herb shelf?" | quest `silverleafForSylvie` available | `questSilverleaf` |
| offer | "You mentioned a farming guild?" | quest `seedsFromTheTerrace` available | `questTerrace` |

## questTerrace (new)
**Shown when:** quest `seedsFromTheTerrace` available (`silkAndWater` completed)
> You've been so good to me, dear, and I keep thinking: there's a Farming Guild north of the Pass. Growers. I've written to them for years. I told them about you.

1. "What do they want?" → questTerraceAsk

## questTerraceAsk (new)
> Hands, mostly. Their seed lines went black in the sap winter and they shut the gate. But they'd open it for someone who fights out there. Take my letter to the Warden. Keep anything that looks like seed, dear. The Warden will want to see it.

1. "I'll take the letter." → end · effect: start quest `seedsFromTheTerrace` (start result: give Guild Letter, unlock Site `farm`, unlock profession Farming at expertise 1)
2. "Not right now." → default

## questTerraceProgress (new)
**Shown when:** quest `seedsFromTheTerrace` active
> Take the road north, past the Pass. The Warden is called Marta, and she's blunt. Don't take it personally. I do talk a lot, but she doesn't.

1. "I'll find her." → end

## questSilverleaf (new)
**Shown when:** quest `silverleafForSylvie` available (`wheatForTheGuild` completed, Farming expertise 5)
> My herb shelf is so thin! The black-bark lines were burned. Silverleaf, though... the Guild could grow it. You can grow it. Six leaves would restock me.

1. "I'll bring silverleaf." → end · effect: start quest `silverleafForSylvie`
2. "Later, Sylvie." → default

## questSilverleafProgress (new)
**Shown when:** quest `silverleafForSylvie` active
> Six silverleaf. The seeds drop from deer on The Long Path, and the terraces do the rest. No rush. Well, a little rush.

1. "Working on it." → end

## questSilverleafComplete (new)
**Shown when:** quest `silverleafForSylvie` ready to turn in
> Oh, look at the colour on these! Fresh silverleaf, in Mawood, again. Here's the tonic recipe, and the thanks of a woman with a full shelf.

1. "Glad to help." → end (rewards per the quest table, section 4)

## Corwin (existing key): one closing line for `theGrowersTable`
Add to Corwin's `default` node: option "Marta has cooked for the first time in two years." → `farmFinaleLine` **(new)**
**Shown when:** quest `theGrowersTable` completed and flag `corwin_heard_table` not set
> Fresh bread on a Mawood wind. I haven't smelled that since the sap. So it's containable after all. Well done, walker.

1. "Thank you." → default · effect: set flag `corwin_heard_table`

---

# 2. Marta (`farmWarden`)

Start node: `default` (0). First-meet node: `intro1` (`firstMeetNodeId`). Every first-meet exit sets `met_farmWarden`.

## intro1
**Shown when:** flag `met_farmWarden` not set (engine)
> The gate's open because Sylvie vouches for you. Don't make her regret it.

1. "Sylvie said you could teach me to farm." → introSeeds (only if condition `farmSeeds` at least 1)
2. "Sylvie said you could teach me to farm." → introNoSeeds (otherwise)
3. "Here's her letter." → introLetter (only if has Guild Letter)

(Option 3 is optional flavour; drop it if the main thread wants fewer branches. Option 1 and 2 share text; the engine picks the first passing result.)

## introLetter (new)
> Hm. Her hand. All right. She says you carry silk through the Elderwood. That counts for something.

1. "She talks about you a lot." → introSeeds (if `farmSeeds` at least 1) / introNoSeeds (otherwise)

## introSeeds (new)
**Shown when:** `farmSeeds` at least 1
> You've already found seeds, walker. Monsters carry wild seed, a few in every dozen. Everything that stuck to you since the beach went into the Guild's tally. It doesn't weigh on your pack.

1. "I never noticed any seeds." → introSeedsWhy
2. "Show me." → introGate · effect: set flag `met_farmWarden`
3. "Tell me about the Guild." → aboutGuild

## introSeedsWhy (new)
> You wouldn't. A seed's small and a fight's loud. The list left of the plots is your tally. Slimes, gulls, deer, goats: they all carry some.

1. "Show me." → introGate · effect: set flag `met_farmWarden`

## introNoSeeds (new)
**Shown when:** no seeds counted
> Nothing in the tally yet. Monsters carry wild seed, a few in every dozen. Meanwhile I sell turnip seed, twenty gold. Plant that first.

1. "I'll take some." → shop · effect: set flag `met_farmWarden`, open Marta's shop
2. "I'll go find some." → end · effect: set flag `met_farmWarden`

## introGate (new)
> Through the gate, then. Plot one's yours. Pick a seed from the list, then pick the plot.

1. "Thanks." → end · effect: pulse the Gate button (tutorial beat 2), and, if quest `seedsFromTheTerrace` active, end that quest (talk step; rewards 600 XP, 100 gold, Guild reputation 10, 5 Turnip Seeds)

(If the player skips this node, the `default` hub's first turn-in option does the same.)

## default (quest hub, then orders, shop, lore)
> Speak, walker. Daylight's short.

Options in this order (all with the shown-when listed):

| # | Option text | Shown when | → / effect |
|---|---|---|---|
| 1 | "Letter delivered." | quest `seedsFromTheTerrace` active (talk step) | `introGate` |
| 2 | "I've got the turnips." | quest `theFirstFurrow` ready to turn in | `questFurrowComplete` · end quest |
| 3 | "I've got the wheat." | quest `wheatForTheGuild` ready | `questWheatComplete` · end quest |
| 4 | "I've got the apples." | quest `anOrchardAgain` ready | `questOrchardComplete` · end quest |
| 5 | "The stew and the pie are ready." | quest `theGrowersTable` ready | `questTableComplete` · end quest |
| 6 | "About my order..." | quest `marthasOrder` ready | `orderComplete` · complete order (`completeOrder`) |
| 7 | "About the first furrow..." | quest `theFirstFurrow` active | `questFurrowProgress` |
| 8 | "About the wheat..." | quest `wheatForTheGuild` active | `questWheatProgress` |
| 9 | "About the orchard..." | quest `anOrchardAgain` active | `questOrchardProgress` |
| 10 | "About the Growers' Table..." | quest `theGrowersTable` active | `questTableProgress` |
| 11 | "About my order..." | quest `marthasOrder` active | `orderProgress` |
| 12 | "Where do I begin?" | quest `theFirstFurrow` available | `questFurrow` |
| 13 | "The Guild needs more wheat?" | quest `wheatForTheGuild` available | `questWheat` |
| 14 | "The orchard burned, you said?" | quest `anOrchardAgain` available | `questOrchard` |
| 15 | "Honored folk get something..." | quest `theGrowersTable` available | `questTable` |
| 16 | "Any order for me?" | quest `marthasOrder` available **and** `turnInCooldown order:marthasOrder` ready | `orderOffer` |
| 17 | "Any order for me?" (disabled tag **"Ready in 1 h 12 m"**) | `turnInCooldown order:marthasOrder` cooling | `orderCooling` |
| 18 | "Let me see your seeds." | quest `theFirstFurrow` started or completed | open Marta's shop |
| 19 | "Here's something for the pet." | see **Exalted gift** | `petGift` |
| 20 | "Tell me about the Guild." | always | `aboutGuild` |
| 21 | "Why did you close the gate?" | always | `aboutGate` |
| 22 | "Goodbye." | always | end |

The cooldown tag is the dialogue option's disabled tag (farm doc §4a "UI"), same style as "N more gold needed"; the text is built from the remaining time, `Ready in {{time}}`. The "Any order" option is listed once per state (two results, first passing wins).

## aboutGuild (new)
> Growers. Seed lines kept pure and passed hand to hand. Two winters ago half the vaults sprouted black. We shut the gate. Now we need hands.

1. "I'll be those hands." → default
2. "What about the blight?" → aboutGate

## aboutGate (new)
> Closed it. Not sorry. The sap came through the Spires and took half of what we had. A stranger could have carried more.

1. "And now?" → default
2. "Understood." → end

## questFurrow (new)
**Shown when:** quest `theFirstFurrow` available (`seedsFromTheTerrace` completed)
> First lesson. Plant turnip. Four, to start. Plot one, pick the seed, wait fifteen minutes. Go hit something. Dirt doesn't care how brave you are.

1. "I'll plant it." → end · effect: start quest `theFirstFurrow`
2. "Later." → default

## questFurrowProgress (new)
**Shown when:** quest `theFirstFurrow` active
> Four turnips. Through the gate, plot one. Fifteen minutes, walker.

1. "On it." → end

## questFurrowComplete (new)
**Shown when:** quest `theFirstFurrow` ready to turn in
> Not bad. First one's yours to eat. I'll pay you in coin and seed. And I've an order for you now, if you want the work.

1. "Thank you." → default · effect: end quest (rewards: 800 XP, 150 gold, Guild reputation 15, 30 Farming XP, 5 Wheat Seeds)

## questWheat (new)
**Shown when:** quest `wheatForTheGuild` available
> Wheat now. Ten. The plots run side by side, so use more than one. Slimes carry the seed. I sell it too, once you're Friendly.

1. "Ten wheat." → end · effect: start quest `wheatForTheGuild`
2. "Later." → default

## questWheatProgress (new)
**Shown when:** quest `wheatForTheGuild` active
> Ten wheat, walker. Forty-five minutes a plot. Use two.

1. "On it." → end

## questWheatComplete (new)
**Shown when:** quest `wheatForTheGuild` ready to turn in
> Ten! In a day. Well. Here's the Guild's bread recipe, and my thanks. Wick has something for you, too.

1. "I'll find Wick." → default · effect: end quest (800 XP, 150 gold, Guild reputation 25, 100 Farming XP, Farmer's Bread recipe scroll)

## questOrchard (new)
**Shown when:** quest `anOrchardAgain` available (`silverleafForSylvie` completed, Farming expertise 8)
> The orchard burned in the sap winter. Twelve apples from our own trees would say the Guild is open again. Goats on the Pass carry the seed. The trees take four hours.

1. "Twelve apples." → end · effect: start quest `anOrchardAgain`
2. "Later." → default

## questOrchardProgress (new)
**Shown when:** quest `anOrchardAgain` active
> Twelve apples. Goats on the Mountain Pass carry the seed. Four hours a tree.

1. "On it." → end

## questOrchardComplete (new)
**Shown when:** quest `anOrchardAgain` ready to turn in
> Apples. From our own ground. ... Take a plot. A new one, by the south wall. It's yours.

1. "Thank you, Warden." → default · effect: end quest (1200 XP, 250 gold, Guild reputation 40, 1500 Farming XP; +1 plot)

## questTable (new)
**Shown when:** quest `theGrowersTable` available (`anOrchardAgain` completed and Farming Guild Honored)
> Honored folk get my pie recipe, walker. It's in the shop. Cook me five turnip stew and five harvest pie. I haven't cooked in two years.

1. "Five and five." → end · effect: start quest `theGrowersTable`
2. "Later." → default
3. "Not Honored yet." → default (disabled with reputation lock text `Requires Farming Guild Honored`)

## questTableProgress (new)
**Shown when:** quest `theGrowersTable` active
> Five stew, five pie. Fire Pit for the stew, Cooking Pot for the pie. Cheese from a Giant Rat, or buy it. Rats don't make cheese, walker. They steal it.

1. "Working on it." → end

## questTableComplete (new)
**Shown when:** quest `theGrowersTable` ready to turn in
> ... Warm. Salt's right. Sit. I'll eat first. Take the plot. And tell Corwin the Guild has bread.

1. "I will." → default · effect: end quest (2500 XP, 500 gold, Skill Point Book, Guild reputation 60, 3000 Farming XP; +1 plot)

## Guild orders (Marta): `marthasOrder`

Opened by `theFirstFurrow`; repeatable; own 2 h cooldown. The picked crop and amount (10-20) are rolled at start (farm doc §4a).

### orderOffer (new)
**Shown when:** quest `marthasOrder` available and cooldown ready
> The larder's low. I need **{{amount}} {{item}}**. Bring it, and the Guild pays you for it.

1. "I'll bring it." → end · effect: start quest `marthasOrder` (rolls and saves the pick)
2. "Not now." → default

### orderProgress (new)
**Shown when:** quest `marthasOrder` active
> {{amount}} {{item}}, walker. The plots won't hurry for you.

1. "On it." → end

### orderComplete (new)
**Shown when:** quest `marthasOrder` ready to turn in
> That'll do. Come back in two hours, walker.

1. "See you then." → default · effect: complete order (items taken, reputation, gold, Farming XP, cooldown starts)

### orderCooling (new)
**Shown when:** `turnInCooldown order:marthasOrder` cooling
> Not yet. The larder's not that empty. Come back later.

1. "All right." → default

## petGift (new): Exalted
**Shown when:** reputation `farmingGuild` at least Exalted and flag `warden_gave_pet` not set. The option is disabled with the Pets-tab slot tag if the Pets tab is full.
> There's a hare on the terraces. Nobody keeps it. It keeps itself. Feed it and it will find the ripe row first. It likes you.

1. "I'll take care of it." → petGiftDone · effect: give Pet Terrace Hare (`petFarmingGuildHare`), set flag `warden_gave_pet`
2. "Not now." → default

### petGiftDone (new)
> Hand of the Terraces. That's what the Guild calls you now. Wear it well, walker.

1. "Thank you." → default

(The title `Hand of the Terraces` is granted automatically at Exalted; the line is flavour. Equip the hare in the pet slot to use its bonuses, per the farm doc §9a.)

## Shop
Opened by the **"Let me see your seeds."** option (default, #18) and by `introNoSeeds` option 1. It uses the `shop` effect with Marta's `npcShops` entry (farm doc §7: Turnip Seeds always, Wheat Seeds from Friendly, Harvest Pie recipe at Honored, Mushroom Stew recipe at Revered). Hidden before `theFirstFurrow` is started except via `introNoSeeds`.

---

# 3. Wick (`farmDrover`)

Start node: `default`. First-meet node: `intro1`; its exits set `met_farmDrover`. His order opens at `wheatForTheGuild` completed.

## intro1
**Shown when:** flag `met_farmDrover` not set
> Oh. Um. You're the one Sylvie... the walker. I'm Wick. I do the, um, animals. Well. There aren't any now.

1. "What happened to the herd?" → introHerd · effect: set flag `met_farmDrover`
2. "Nice to meet you, Wick." → end · effect: set flag `met_farmDrover`

## introHerd (new)
> The sap. Winter before last. I keep the tack oiled anyway. Somebody should. In case.

1. "That's kind of you." → default

## default
> Um... yes? Hello. Do you need something?

| # | Option text | Shown when | → / effect |
|---|---|---|---|
| 1 | "About your order..." | quest `wicksOrder` ready to turn in | `orderComplete` · complete order |
| 2 | "About your order..." | quest `wicksOrder` active | `orderProgress` |
| 3 | "Any order for me?" | quest `wicksOrder` available and `turnInCooldown order:wicksOrder` ready | `orderOffer` |
| 4 | "Any order for me?" (disabled tag **"Ready in 1 h 12 m"**) | `turnInCooldown order:wicksOrder` cooling | `orderCooling` |
| 5 | "What do you do here?" | always | `aboutWick` |
| 6 | "Goodbye." | always | end |

If `wheatForTheGuild` is not completed, options 3 and 4 are replaced by one disabled line "Marta has to trust you first" (no node), or are simply hidden (default: hidden).

## aboutWick (new)
> I'm the drover. And the tanner's boy. Pelts for the, um, saddle blankets. And fangs. For the fence. Charms, I mean.

1. "Fence charms?" → aboutWickCharms
2. "Thanks." → default

## aboutWickCharms (new)
> Fangs keep things off. Maybe. I label them so I know which ones I tried.

1. "Good idea." → default

## orderOffer (new)
**Shown when:** quest `wicksOrder` available and cooldown ready
> Um. I need **{{amount}} {{item}}**. For the... things. If you have some. Please?

1. "I'll bring them." → end · effect: start quest `wicksOrder` (rolls pick from the pool: tier-eligible entries whose source Zone is unlocked)
2. "Not now." → default

## orderProgress (new)
**Shown when:** quest `wicksOrder` active
> {{amount}} {{item}}. No rush. ... well, a little.

1. "On it." → end

## orderComplete (new)
**Shown when:** quest `wicksOrder` ready to turn in
> Oh! That's... perfect. Thank you. Come back in two hours? If that's all right.

1. "See you then." → default · effect: complete order (cooldown starts)

## orderCooling (new)
**Shown when:** `turnInCooldown order:wicksOrder` cooling
> Not yet, um. I'm still labelling the last ones.

1. "All right." → default

---

# 4. Quest text (per quest, for `quests.json`)

Names follow the farm doc §4; descriptions are short (quest panel). `{{n}}` is a quantity.

| ID | Name | Description | Step text | Clue beat (what the turn-in reveals) |
|---|---|---|---|---|
| `seedsFromTheTerrace` | Seeds from the Terrace | Sylvie has a letter for the Farming Guild north of the Pass. | 1. Talk to Warden Marta at the farm. | The Guild shut its gate two winters ago when the seed lines turned black. Sylvie's word is why a stranger gets in. |
| `theFirstFurrow` | The First Furrow | Marta wants the first crop of the season. | 1. Bring 4 Turnip. | A turnip is a minute of patience times fifteen; Marta lets you eat the first one. |
| `wheatForTheGuild` | Wheat for the Guild | The Guild needs wheat, and monsters carry the seed. | 1. Bring 10 Wheat. | The Guild needs wild seed; the player is the supply line. Plots run in parallel. |
| `silverleafForSylvie` | Silverleaf for Sylvie | Sylvie's herb shelf is thin. A field can fill it. | 1. Bring 6 Silverleaf. | The black-bark herb lines were burned; the apothecary's shelf is mostly bare. |
| `anOrchardAgain` | An Orchard Again | The Guild wants apples from its own trees. | 1. Bring 12 Apple. | The orchard burned in the sap winter. Planting apples says the Guild is open again (the blighted sapling that drops them is the cure). |
| `theGrowersTable` | The Growers' Table | Marta will cook again for the first time in two years. | 1. Bring 5 Turnip Stew and 5 Harvest Pie. | Marta cooks again; the player's hands made the meal. Corwin hears of it. |
| `marthasOrder` | Marta's Order | Marta needs crops for the larder. | 1. Bring {{amount}} {{item}}. | None (repeatable; flavour only). |
| `wicksOrder` | Wick's Order | Wick needs animal materials for tack and charms. | 1. Bring {{amount}} {{item}}. | None (repeatable; flavour only). |

Completion text (quest-completed modal), repeatable orders: "Marta's next order in 2 h" / "Wick's next order in 2 h" (farm doc §4a).

Rewards: copied from the farm doc §4 table (scale matched to *Silk and Water*: 800 XP, 150 gold, Skill Point Book; the finale to *The Blighted Heart* halved). Order rewards are rolled (farm doc §4a), reputation, gold and Farming XP only, no items.

---

# 5. Needs a new effect or condition

Compared with `docs/systems/dialogue.md` (shipped: quest, reputation, arena, flag, item/stat, `reputationTurnIn`, `forge`, `shop`, `give`, `deduct`) and the farm doc §10/§12 list.

| New | Use | In the farm doc? |
|---|---|---|
| Condition `farmSeeds` `{ atLeast: n }` | Marta's `introSeeds` vs `introNoSeeds` | yes (§6a) |
| Condition `turnInCooldown` `{ key, state: 'ready' \| 'cooling' }` | Order offer vs "Ready in…" option | yes (§4a, C3) |
| Option disabled tag with remaining time ("Ready in 1 h 12 m") | Order and bundle options | yes (§4a UI) |
| Effect `unlockSite` (`farm`) | Start result of `seedsFromTheTerrace` | yes (§2) |
| Effect `unlockProfession` (Farming, expertise 1) | same | yes (C2) |
| Condition `professionLevel` | Sylvie's silverleaf and Marta's orchard offers (the quests' start requirements also gate; used for the lock label) | yes (C2) |
| Quest requirement `pickedItems`; effect `completeOrder` | Order progress and turn-in labels | yes (§4a) |
| Condition `reputation` keyed by `ReputationID` (`farmingGuild`) | Pet gift, Honored finale lock | yes (C1) |
| Effect `pulseGate` (tutorial) | Marta's `introGate` pulse | **new**: optional; skip if the Gate button pulses from state (quest `theFirstFurrow` not yet completed) instead of dialogue |
| Item `guildLetter` given by `giveItem` | Sylvie's start result | yes (§4) |

---

# 6. For the main thread

- `/add-npc-dialogue`: `farmWarden`, `farmDrover`, plus new nodes on `mawoodSylvie` and Corwin (`farmFinaleLine`).
- `/add-quest`: the six chain quests, `marthasOrder`, `wicksOrder` (text above; rewards and pools from the farm doc §4, §4a).
- `/add-dialogue-effect`: `farmSeeds`, plus the C2 and C3 effects (`unlockProfession`, `professionLevel`, `unlockSite`, `turnInCooldown`).
- Docs: `quests.md`, `dialogue.md`, `towns-shops-guild.md`, `docs/lore/` (new Farming Guild entry: Marta, Wick, the Guild's seed lines, the burned orchard; timeline: black sap 2 years ago, gate closed since).
