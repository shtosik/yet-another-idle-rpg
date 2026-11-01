# The Cold Forge — Toric, Quest and dialogue

**Status: proposed, 2026-11-01.** Lore companion to [Gear upgrading](gear-upgrading.md); its Owner decisions and mechanics remain authoritative. This file is a script for implementation, not shipped content.

## Lore already in the game

| Fact | Source |
|---|---|
| Lirold is Port Stocksmar's capital. Its only shipped Building is the Arena, with Ludo Crane. | `src/assets/locales/en/dialogues/laHarparJosh.json` `beachName`; `src/data/towns-data.ts` `TownID.lirold` |
| Ludo is Master of the Arena, eleven seasons champion; a cart wheel took his knee. He calls the player "challenger", performs for the crowd and deals with trappers. | `src/assets/locales/en/dialogues/liroldArenaMaster.json` `intro1`, `aboutLudo`, `aboutArena` |
| Marvin is the Exploration Guild's head in shipped text, in its La Harpar Building. His work includes mapping and hunting contracts. | `src/assets/locales/en/dialogues/laHarparMarvin.json` `introduction1`, `whatIsThisPlace1`; `src/data/towns-data.ts` |
| Marvin recently returned from an expedition; its destination is unstated. | `src/assets/locales/en/dialogues/laHarparElara.json` `marvinInfo`; `laHarparTrader.json` `aboutPeople` |
| Goblin Scavengers and the Troll are in the Mountain Pass. Ancient Wood drops from Treant Sprouts and the Gnarled Treant in the Deepwood. | `src/data/zones-data.ts`; `src/data/enemies-data.ts` corresponding entries; item names in `src/assets/locales/en/items.json` |
| Apple is shipped and sold by La Harpar's Trader without a reputation gate. Fish & Apple Pie (`ItemID.fishApplePie`) is shipped; recipe `RecipeID.fishApplePie` uses 2 Fish Meat, 2 Apple and 1 Cheese at Cooking station level 2, makes 1 and has `requiresUnlock`. Learn it from the Fish & Apple Pie Recipe sold in a La Harpar shop. Trader Cheese needs La Harpar Honored. | `src/data/recipes-data.ts` `fishApplePie`; `src/data/shops-data.ts` `laHarparShop`; `src/assets/locales/en/items.json` `names.apple`, `names.fishApplePie`, `names.fishApplePieRecipe` |
| Last Orders already asks for 10 Fish & Apple Pie alongside 10 Venison Roast to feed Lirold buyers renewing the fish contract; the Bartender insists on serving them hot. | `src/assets/locales/en/quests.json` `names.lastOrders`; `src/assets/locales/en/dialogues/laHarparBartender.json` `questLastOrders`, `questLastOrdersProgress`; `src/data/quests-data.ts` `QuestID.lastOrders` |
| Lirold opens at Upper Canopy Wave 15, after the Harpy Matriarch; earlier Towns and the Deepwood are already reachable. | `docs/systems/zones-waves-unlocks.md`; `src/data/unlock-conditions.ts` |
| Item requirements consume inventory items on advancement; talking is an empty-requirements Step turned in at its named NPC. | `docs/systems/quests.md`; `docs/systems/dialogue.md` |

No dwarf, dwarven homeland or dwarf history was found in shipped English locales or source definitions (search: `dwarf`, `dwarves`, `dwarven`, `dwarfs`). Toric's dwarf identity is an owner requirement. The [dwarven foundations](../lore/dwarves.md) supply **(proposed)** Keldrath, his homeland north beyond Elderreach, and Bramhold, his underground home, with a few everyday customs and a voluntary departure for his own Lirold workshop. Wider history and any link to ancient ruins remain open.

## Proposal boundaries

Slatefall's name, castle-owned iron mine and closure two winters ago are **proposed background**, taken from [Slatefall & the Deeper Mines](slatefall-and-the-deeper-mines.md). These few facts can debut in Toric's dialogue without implementing Slatefall's Town, mine Zones, NPCs or Quests. They do not establish why the mine closed or what happened underground.

Ludo's memory of the cart and Marvin's retained delivery record are new proposed local history. Neither visited the mine in this story. Toric was its customer, not Oswin's replacement or a witness to the lost crew. The tongs were taken from a cart stranded on the Mountain Pass, outside the closed mine road; the player never crosses the barrier.

Keep Oswin's badge for Hedda, mine charting for Pell, Iron Ore for the mine/gathering proposals, and the Troll/writ for *The Guild Trial*. No Warden, stairs, singing stone, blight explanation or dwarven authorship is revealed here. Do not swap Marvin's Step to Varrow: this delivery check works before or after the proposed Exploration Guild relocation and leaves his expedition (T-17) unanswered.

## Story

Toric has kept the Forge tidy through two winters without its regular Slatefall deliveries. Ludo saw the cart that lost Toric his heavy tongs; recovering them leads to an old delivery record Marvin can check in La Harpar. The record confirms the tools belong to Toric and that their last load was worked iron, giving him a practical reason to resume work with salvage. Fish & Apple Pie, a taste he picked up from coastal traders, gives the apple-pie lover an excuse to sit down and admit he has been waiting for the past to return. With fuel and his tools back, he lights the hearth and offers to strengthen the matching gear the player already finds.

## Quest design

| ID | Giver | Zone | Start gate | Steps | Clue or item source | Rewards |
|---|---|---|---|---|---|---|
| `theColdForge` — **The Cold Forge** | Toric, Forge, Lirold | Mountain Pass; Deepwood for fuel | Quest available once the player can reach Toric in unlocked Lirold; no extra level, reputation or proposed Quest gate | 1. Talk to Ludo.<br>2. Bring 1 Toric's Forge Tongs to Toric.<br>3. Talk to Marvin.<br>4. Bring 1 Fish & Apple Pie to Toric.<br>5. Bring 10 Ancient Wood to Toric. | Goblin Scavengers carry the tongs; Marvin checks the stamp in a retained delivery record; shipped Fish & Apple Pie uses its existing recipe scroll and Cooking station level 2; Ancient Wood is shipped Deepwood loot. | Upgrade service; proposed 2000 XP, 400 gold |

**Reward scale:** two-fifths of *What Lurks at the Top*'s shipped 5000 XP / 1000 gold (`src/data/quests-data.ts` `whatLurksAtTheTop`), without its reputation, skill point, Skill Point Book or Harpy Crown. This Quest revisits lower Zones and rewards a service. Main thread tunes XP/gold rewards with the economy simulation; the tongs drop rate is owner-decided below.

### Mechanical Step contract

| Step | Journal description | Requirements | Turn-in NPC | Result |
|---|---|---|---|---|
| 1 | Ask Ludo Crane at Lirold's Arena what happened to Toric's delivery cart. | Empty requirements: talk Step | Ludo Crane (`liroldArenaMaster`) | Advance to Step 2; identify Goblin Scavengers in the Mountain Pass. |
| 2 | Recover Toric's Forge Tongs from Goblin Scavengers in the Mountain Pass and return them to Toric. | Item `toricsForgeTongs`, amount 1 | Toric (`liroldToric`, proposed) | Consume 1 tongs; advance to Step 3; Toric reads the old stamp aloud. |
| 3 | Ask Marvin at the Exploration Guild in La Harpar to check Toric's old delivery record. | Empty requirements: talk Step | Marvin (`laHarparMarvin`) | Advance to Step 4; confirm salvage is available; ask the player to make Toric stop for lunch. |
| 4 | Bring Toric one Fish & Apple Pie at Lirold's Forge. | Item `ItemID.fishApplePie`, amount 1 | Toric | Consume 1 Fish & Apple Pie; advance to Step 5. |
| 5 | Bring Toric 10 Ancient Wood for charcoal at Lirold's Forge. | Item `ancientWood`, amount 10 | Toric | Consume 10 wood; final advance completes Quest and awards XP/gold; completed Quest gates upgrade access. |

Accepting the offer starts Step 1. Empty-requirements Steps are immediately ready, but only the named NPC advances them. "Return to Toric" after Marvin is fulfilled by the pie Step, not an invisible talk flag. No Step checks a gear identity/tier/upgrade pair, runs a merge, tracks a meal being cooked or changes a Zone. Items may be obtained ahead of time; their delivery, rather than crafting history, is checked. Never require the player to carry the already-returned tongs to Marvin.

**Owner-decided tongs source:** Toric's Forge Tongs are a Quest item (`ItemType.quest`), with exactly 1 required at Step 2. Goblin Scavengers in the Mountain Pass drop one at **1 in 50**: `drop(ItemID.toricsForgeTongs, 1, 1, 50)`; the last argument means "1 in N", not a percentage. Use the existing quest-only drop mechanism with `requiredActiveQuestId` set to `QuestID.theColdForge`, so drops roll only while `theColdForge` is active. Owner rule for all quest-only drops: an item drops only while the active Step that asks for it is unmet, and never beyond the missing amount. So the tongs can't drop before Step 2 or after delivery, and only one ever exists. Today's mechanism is Quest-wide only, so this needs a change in `kill-rewards.ts`.

### Pie choice

**Fish & Apple Pie** (`ItemID.fishApplePie`) is the owner's Step 4 choice. Use shipped recipe `RecipeID.fishApplePie`: **2 Fish Meat + 2 Apple + 1 Cheese → 1 Fish & Apple Pie, Cooking station level 2**, with `requiresUnlock`. The player learns it by using the Fish & Apple Pie Recipe sold in a La Harpar shop (`src/data/shops-data.ts`). Cooking station level 2 and that recipe unlock are existing preparation requirements; buying Cheese from the Trader requires La Harpar Honored. They are not extra Quest start gates, and the Step checks only delivery of one pie.

Toric still loves apple pie; coastal traders taught him to enjoy the fish filling as a hearty workshop lunch. That personal taste fits the shipped *Last Orders* dialogue, where Lirold buyers are served fish and apple pies; it establishes no wider dwarven food custom. Carry one pie uneaten for this Step. Reuse its shipped name, recipe, icon, consumable effect, duration and value; no new pie item, recipe or i18n keys are needed. Nothing about the Forge depends on a consumable effect, and *Last Orders* is not a prerequisite.

### Clue beats

- **Ludo:** the shortage has a small, recoverable human cost: Toric's tools are still on the ordinary Pass route. A closed mine does not make the whole mountain inaccessible.
- **Tongs:** Toric recognises his grip and stamp; the record concerns deliveries, not the fate of a mining crew. He sends the player to someone who keeps paperwork.
- **Marvin:** there was useful worked iron on the old cart; salvage is a sensible workshop trade. He mentions the Exploration Guild's Pathfinder's Seal tradition without requiring one or revealing his expedition.
- **Pie:** Toric admits what has kept him waiting; letting someone care for him precedes accepting a new kind of work.
- **Charcoal:** the hearth burns again. The mine remains closed; Toric can now offer merges using the normal upgrade rules.

## Dialogue conventions

All keys below are camelCase. Toric's keys are **new** under proposed namespace `dialogues/liroldToric`; Ludo and Marvin keep existing `default` nodes and receive only the marked additions. Messages have at most three sentences; options have at most one. `end` closes dialogue rather than naming another node.

Toric: `firstMeetNodeId` = `intro1`, returning start node = `default`. On every first-meet exit, set `met_` plus Toric's actual NPC enum value, following the current dialogue convention; `met_liroldToric` is a descriptive placeholder, not the literal saved numeric flag. Ludo and Marvin retain their shipped first-meet paths and flags; those already lead back to their hubs, where these additions are reachable.

Quest turn-ins appear before in-progress options, then the offer, then other business. Each turn-in is gated by Quest ready-to-advance **and its exact Step**; its effect is only advance. The Quest store consumes items, so never add a second item-take effect. In-progress reminders use active + exact Step, including when a talk Step is already ready elsewhere.

## Toric — new dialogue tree

### intro1 (new)
**Shown when:** first meeting; all exits set Toric's met flag.
> Toric, blacksmith. Mind the tools; they're cleaner than the floor, and I'd like them to stay that way. If you've come for hot work, the hearth's cold.

1. "Why is the hearth cold?" → aboutForge · effect: set Toric's met flag.
2. "I'll let you work." → end · effect: set Toric's met flag.

### default (new)
**Shown when:** returning player, or after another node.
> Come in. What needs seeing to?

1. "Here's the wood for your hearth." → coldForgeComplete · only if ready at Step 5; effect: advance `theColdForge`.
2. "One Fish & Apple Pie, Toric." → coldForgePie · only if ready at Step 4; effect: advance `theColdForge`.
3. "I've brought your forge tongs." → coldForgeTongs · only if ready at Step 2; effect: advance `theColdForge`.
4. "About getting the hearth going..." → coldForgeProgressFive / coldForgeProgressFour / coldForgeProgressThree / coldForgeProgressTwo / coldForgeProgressOne · results in that order, each only if active at its matching Step.
5. "Can I help you get it burning again?" → coldForgeOffer · only if `theColdForge` available.
6. "Upgrade gear." → end · only if `theColdForge` completed; effect: open the Forge panel (**new effect needed**, below).
7. "Tell me about the Forge." → aboutForgeRestored if Quest completed; otherwise → aboutForge.
8. "You really like apple pie?" → aboutPie.
9. "Where did you live before Lirold?" → aboutHome.
10. "Goodbye, Toric." → end.

### aboutForge (new)
**Shown when:** first meeting or Quest not completed.
> Slatefall sent my iron until the castle shut the mine two winters ago. I've kept busy with cold repairs, but the hearth's been waiting. Then scavengers took my heavy tongs off a stranded cart on the Pass.

1. "Can I help?" → coldForgeOffer if Quest available; otherwise → default.
2. "I'll leave you to it." → end.

### aboutForgeRestored (new)
**Shown when:** `theColdForge` completed.
> The mine is still shut, but there's useful metal coming through this door again. Two matching pieces give me something to work with. I'll show you the cost before the hammer falls.

1. "Upgrade gear." → end · effect: open the Forge panel; only if Quest completed.
2. "Good to see the fire back." → default.

### aboutPie (new)
> Apple pie makes a person sit down properly. Coastal traders got me used to La Harpar's fish filling; a proper lunch for a long day at the anvil. Bring it hot, and I'll put the hammer down.

1. "I'll remember that." → default.

### aboutHome (new)
**Lore: (proposed), [dwarven foundations](../lore/dwarves.md).** Available before and after the Quest.
> Bramhold, under the highlands of Keldrath, north beyond Elderreach. Workshops off the halls, trading doors to the surface. I miss the shared table more than the ceiling.

1. "What is life like there?" → aboutHomeLife.
2. "Why did you leave?" → aboutLeaving.
3. "Back to business." → default.

### aboutHomeLife (new)
**Lore: (proposed), [dwarven foundations](../lore/dwarves.md).**
> We tally a repaired joint so the next pair of hands knows where to look; a good repair earns its place beside new work. Supper is often mushroom-and-barley stew, dark bread and baked apples. We say surface folk promise faster than metal cools, but keep your word and there's a chair for you.

1. "Why exchange that for Lirold?" → aboutLeaving.
2. "Back to business." → default.

### aboutLeaving (new)
**Lore: (proposed), [dwarven foundations](../lore/dwarves.md).**
> I wanted a workshop of my own, and work I hadn't learned by heart. Traders spoke of Lirold's repairs and Slatefall iron, so I came here before the mine closed. No one sent me away; I chose this hearth.

1. "I hope it serves you well." → default.

### coldForgeOffer (new)
**Shown when:** `theColdForge` available; every incoming offer route shares this gate.
> Ludo Crane saw what became of my cart, and he remembers every load that might have fed his Arena. Ask him about the tongs. We'll see what can be saved before we talk about new iron.

1. "I'll ask Ludo at the Arena." → default · effect: start `theColdForge`.
2. "Another time." → default.

### coldForgeProgressOne (new)
**Shown when:** active at Step 1.
> Ludo Crane, at the Arena. Ask about my stranded cart, not his eleven seasons, unless you've brought a chair.

1. "I'll find him." → end.
2. "Something else first." → default.

### coldForgeProgressTwo (new)
**Shown when:** active at Step 2.
> Goblin Scavengers, up on the Mountain Pass. My tongs have a square notch by the hinge. Bring them back here.

1. "I'll keep looking." → end.
2. "Something else first." → default.

### coldForgeTongs (new)
**Shown when:** reached after Step 2 advancement.
> Jaws still meet, and that's my notch. The old delivery stamp is here too; tell Marvin in La Harpar it was Toric's last Slatefall load. He keeps the Exploration Guild's road records.

1. "I'll ask him to check it." → default.

### coldForgeProgressThree (new)
**Shown when:** active at Step 3; this option does not advance the ready talk Step.
> Marvin, in La Harpar. Tell him the stamp says Toric's last Slatefall load; he won't need the tongs in his lap to find a record.

1. "I'll go to La Harpar." → end.
2. "Something else first." → default.

### coldForgeProgressFour (new)
**Shown when:** active at Step 4.
> Marvin's right about one thing: I haven't stopped for a proper meal. Bring me one Fish & Apple Pie, hot enough to make me put the hammer down. La Harpar sells the recipe; you'll need Cooking level two.

1. "One Fish & Apple Pie." → end.
2. "Something else first." → default.

### coldForgePie (new)
**Shown when:** reached after Step 4 advancement.
> You've made room for me to sit down; I suppose I can make room for different work. I've been waiting for that old cart to come home. Bring ten Ancient Wood for charcoal, and we'll try the metal we've got.

1. "I'll bring the wood." → default.

### coldForgeProgressFive (new)
**Shown when:** active at Step 5.
> Ten Ancient Wood will make the charcoal I need. The Deepwood's treants carry it. Then I can put these tongs back to work.

1. "I'll bring it." → end.
2. "Something else first." → default.

### coldForgeComplete (new)
**Shown when:** reached after final advancement; Quest completion awards the proposed 2000 XP / 400 gold.
> There she goes; I'd forgotten how the hearth sounds. Bring two pieces of the same gear, matching rarity and upgrade level, and gold for the work. I'll make you one stronger piece.

1. "Upgrade gear." → end · only if Quest completed; effect: open the Forge panel.
2. "I'll come back with gear." → default.

The relighting is narrative, not a separate timed action. The player need not own matching gear to complete the Quest or select the service; the panel handles whether a merge is possible. Later failure rules remain those in the parent proposal, with the panel showing chance, cost and result before a merge.

## Ludo Crane — additions to shipped dialogue

Namespace: `dialogues/liroldArenaMaster`. Read with [Ludo's character](../character/lirold/ludo-crane.md) and shipped `liroldArenaMaster.json`; leave his first greeting, champions, fee and Arena branches intact.

### default (existing; add option)
**Shown when:** existing returning hub. Insert this Quest turn-in before other business.

1. "What happened to Toric's delivery cart?" → coldForgeLead · only if `theColdForge` ready at Step 1; effect: advance `theColdForge`.
2. "Why was this seal in an Arena Chest?" → pathfindersSealInfo · optional lore option, only if holding a Pathfinder's Seal and registration flag unset; place after Quest business and existing Arena actions.

### coldForgeLead (new)
**Shown when:** reached after Step 1 advancement.
> Ha, a rescue for the tongs, challenger! I saw that cart stranded up on the Mountain Pass; Goblin Scavengers carried off the tools, big tongs and all. Look for Toric's square notch by the hinge, then take them straight to him.

1. "I'll find the scavengers." → default.

### pathfindersSealInfo (new)
> The Exploration Guild leaves a few of those among the prizes, challenger. Finding a road out is useful when the last champion wants to keep you! Show it to Marvin in La Harpar; he keeps the register.

1. "I'll ask Marvin." → default.

## Marvin — additions to shipped dialogue

Namespace: `dialogues/laHarparMarvin`. Use [Marvin's voice](../character/laHarpar/marvin.md), but his proposed relocation/title change is not a prerequisite. Today's placement is **Exploration Guild, La Harpar**. These lines do not change his shipped claim to be its head or identify where his last expedition went.

### default (existing; add options)
**Shown when:** existing returning hub. Quest turn-in first, then Seal registration before ordinary contract/store options; preserve any other Quest hub ordering when integrating.

1. "Can you check Toric's last Slatefall delivery?" → coldForgeRecord · only if `theColdForge` ready at Step 3; effect: advance `theColdForge`.
2. "Register this Pathfinder's Seal." → sealRegistered · only if has 1 `pathfindersSeal` and flag `pathfindersSealRegistered` unset; require 1 Seal, then proposed atomic effect: register the Seal, consume exactly 1 and persist its permanent benefit.
3. "What did the Pathfinder's Seal teach me?" → sealReminder · only if flag `pathfindersSealRegistered` set.

### coldForgeRecord (new)
**Shown when:** reached after Step 3 advancement.
> Toric's last Slatefall load: worked iron and his own tools, recorded here before the road closed. He can work salvage while the mine stays shut, but get him to stop for a meal first. One Fish & Apple Pie should do it; the recipe is sold here in La Harpar.

1. "Is salvage Exploration Guild business?" → coldForgeSalvage.
2. "I'll bring him a pie." → default.

### coldForgeSalvage (new)
> We map the unknown and bring useful things home. A Pathfinder's Seal earns a place in our salvage register and a lesson in spotting sound gear. Find one among Ludo's Arena Chest prizes and bring it here; Toric doesn't need it to light his hearth.

1. "Understood." → default.

### sealRegistered (new)
**Shown when:** reached after successful one-time registration; never reachable by a second Seal.
> Your name's in the salvage register. Look along the grain, check the seams, and keep the pieces somebody else would pass over. From now on, ten percent of your gear drops will arrive at +1.

1. "I'll put that to use." → default.

### sealReminder (new)
**Shown when:** `pathfindersSealRegistered` set.
> Ten percent of your gear drops arrive at +1. You learned what to look for; the lesson stays with you. Another seal won't teach it twice.

1. "Thanks, Marvin." → default.

## Pathfinder's Seal — item lore

Retain **Pathfinder's Seal**, proposed `pathfindersSeal`. Quest-type item, rare Arena Chest reward, handed in once to the Exploration Guild via Marvin. Brass route-in-a-ring design, worn inspection notch; no royal crest, dwarf rune or new faction. Suggested description:

> An Exploration Guild seal for those who find a way home with something worth keeping. Marvin in La Harpar can enter its bearer in the salvage register.

The register and lesson are proposed customs, not a new Building, spendable currency, Guild rank or prerequisite for ordinary Tasks. Registration permanently makes 10% of gear drops arrive at +1, exactly as settled in the parent proposal. Keep the numeric line in sync if the tunable percentage changes. Never promise double loot, a +1 on every item, cheaper merges across all drops, or an upgraded unique Arena reward.

Registration requires no Forge Quest completion. The chest rolls a Seal (1 in 10 chests) only while the player neither holds one nor has registered one, so duplicates never exist. Quest-only drops roll only up to the amount the active Step still needs (owner rule), so no surplus tongs exist either; no disposal mechanic is needed.

## Needs a new effect or condition

- **Open the Forge panel:** current dialogue effects cover Quests, stats, items, shops, flags, Exploration Guild Tasks, Arena and reputation turn-ins, not gear upgrading. Add a dedicated Forge-opening effect; require `theColdForge` completed wherever the panel can be opened. No new Quest requirement type is needed.
- **Register Pathfinder's Seal once:** a new atomic effect must recheck possession and non-registration, take one Seal, persist the one-time benefit and expose its flag for reminders/chest suppression. Existing item/flag conditions can show the option; a prose flag alone cannot make +1 drops happen. Main thread owns effect shape, save handling and drop integration; this document does not invent an existing stat/effect.
- Quest completion itself is an existing condition and can gate the service; don't add a redundant Forge-unlocked reward flag. Pie crafting uses ordinary recipe support. All five Steps use existing requirement forms.

## New content inventory

- **NPC Toric** (`liroldToric`, proposed): dwarf Blacksmith and Quest giver; [character and portrait brief](../character/lirold/toric.md).
- **Building Forge** (proposed key `liroldForge`): accessible workshop in Lirold; upgrade service after the Quest.
- **Quest The Cold Forge** (`theColdForge`): five Steps defined above; no numeric IDs reserved.
- **Toric's Forge Tongs** (`ItemID.toricsForgeTongs`, `ItemType.quest`): unsellable, indestructible Quest item; exactly 1 required. Existing Goblin Scavengers drop one at the owner-decided **1 in 50**, only while `theColdForge` is active: `drop(ItemID.toricsForgeTongs, 1, 1, 50)` (last argument: "1 in N"). Marked by a square notch and old delivery stamp.
- **Pathfinder's Seal** (`pathfindersSeal`): unsellable, indestructible Quest item; permanent salvage lesson registered once with Marvin.
- **No new enemy, Zone, Region, mining resource or ingredient.** The delivery record, salvage register and Toric's pie plate are narrative props, not inventory items.

## Owner calls

1. **Fish & Apple Pie:** the owner settled Step 4 on the shipped item and recipe, including their existing unlock and Cooking station level 2 requirements. Chose coastal traders as the source of Toric's taste for the fish filling; this personal history is proposed and may be overturned. No new pie content or food balance is needed.
2. **Dwarven foundations (proposed):** **Keldrath**, beyond the drawn map north of Elderreach, and underground **Bramhold**, Toric's home; both names owner-approved 2026-11-01. Chose shared workshops and kitchens, repair tallies, simple suppers, wary warmth toward surface customers and Toric's voluntary departure for his own Forge. These fill his home conversations; borders, rulers, origins, lifespan and wider history stay open in [dwarves.md](../lore/dwarves.md). Any link to the stairs, Warden's marks or black sap (T-25–T-27) is undecided.
3. **Local history:** chose Toric's two winters of cold repairs, stolen tongs, Ludo's cart sighting and Marvin's retained delivery record. Introduce only the proposed mine's closure background now; reserve its tragedy and discoveries for the mine Quests.
4. **Quest scope and tuning:** five Steps, one new tool item, no demonstration merge or free +1 reward. The owner decided the tongs are `ItemType.quest`, exactly 1 required, dropped only during active `theColdForge` at **1 in 50** (`drop(ItemID.toricsForgeTongs, 1, 1, 50)`, last argument "1 in N"). Quest-only drops stop at the amount the active Step still needs (owner rule). Only the proposed 2000 XP / 400 gold rewards remain to settle.
5. **Seal:** retain Pathfinder's Seal and add an Exploration Guild salvage-register tradition, Arena prizes and a permanent lesson. Marvin handles registration with today's shipped placement; any future handover to Varrow is separate. Owner-decided: 1 in 10 Arena Chests, rolled only while the player neither holds nor has registered a Seal.

## For the main thread

Implement Toric and the Forge with `/add-npc-dialogue` and `/add-town-building`, the five-Step Quest and tongs source with `/add-quest`, and Forge-opening / Seal registration with `/add-dialogue-effect`. Step 4 consumes 1 existing `ItemID.fishApplePie`; reuse its shipped recipe and pie i18n keys. The item merge, derived stats, save and chest work follow the parent proposal; this pass changes only Markdown. Read the corresponding system docs before implementation and update them to actual shipped behavior then. Add the player-facing changelog entry when implemented; this proposal does not announce the feature as live.
