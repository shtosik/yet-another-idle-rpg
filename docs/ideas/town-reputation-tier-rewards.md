# Town reputation: tier rewards and titles

**Scope:** M · **Status:** Proposed (draft by `lore-keeper`, 2026-10-31) · Step 3 of [Town reputation](town-reputation.md); the Exalted pet is step 4 and is not designed here.

The content for each reputation tier at **La Harpar** and **Mawood**: titles, Friendly dialogue, Honored shop stock and recipe scrolls, Revered quests and lines. Every ID below exists in `src/` unless it is listed under [New content](#new-content). Numbers are first guesses; tune them with `npm run sim -- --reputation`.

Tiers: Neutral 0, Friendly 50, Honored 200, Revered 600, Exalted 1500 (`ReputationTier` in `src/enums/reputation-tier.enum.ts`). Locks and requirements use `{ type: 'reputation', townId, tier }` (`ReputationRequirement`, `src/data/quests-data.ts`).

## Lore already in the game

| Fact | Source |
|---|---|
| The Bartender "monetises talk": "Ask away, though my answers aren't free." She charges 20, 40 and 60 gold, once each. | `laHarparBartender.json` `default`, `whatIsThisPlace1`; `laHarparBartender.ts` flags `bartender_paid_for_*` |
| Josh talks only after the player pays 20 gold for his beer, once. | `laHarparJosh.json` `payBeer`, `laHarparJosh.ts` flag `josh_paid_beer` |
| Josh gives away his family heirloom (a ring) for clearing the beach, and nothing says why. | `quests-data.ts` `clearingOutTheBeach`, `items.json` `joshsHeirloom`, `docs/lore/threads.md` T-16 |
| Josh: nobody who tried the mountain came back, "then friends or family members tried to search", and they didn't come back either. | `laHarparJosh.json` `dangerMountain` |
| La Harpar is Port Stocksmar's largest fish exporter and "a vital partner to Lirold for a long time". | `laHarparTrader.json` `aboutVillage`, `aboutFishermen` |
| "Nobody new ever comes through the Pass this time of year." Sylvie grew up near La Harpar and trained there. | `mawoodSylvie.json` `intro1`, `intro2`, `aboutSylvie` |
| Sylvie is "working on an antidote, but without clean samples it's slow going". Spider silk resists the blight's spores. | `mawoodSylvie.json` `aboutCorruption`, `aboutCorruptionSpreading` |
| No Mawood NPC charges for answers. Sylvie opens the apothecary only after *Silk and Water*. | `src/data/dialogues/mawoodTown/*.ts`, `mawoodSylvie.ts` `browseWares` |
| The Deepwood "will recover over years, perhaps decades". | `mawoodCorwin.json` `postQuestLore` |
| Brenna can't source clean Silverwood any more; the gnolls raid her lumber stocks. | `mawoodBrenn.json` `aboutBrennCorruption`, `questWarTrophies` |
| The highest cooking station is the Cooking Pot (level 2). Hunter's Feast needs cooking level 3, so it can't be crafted yet. | `station-items.data.ts`, `recipes-data.ts` `huntersFeast` |
| Venison Roast Recipe only drops from the Goat (Mountain Pass), 1 in 12. No shop sells it. | `enemies-data.ts` `goat` |

## Summary

| Tier | La Harpar | Mawood |
|---|---|---|
| Friendly | Title **Friend of La Harpar**; the Bartender and Josh answer for free | Title **Friend of Mawood**; Sylvie opens the apothecary to a Friendly player before *Silk and Water* |
| Honored | Trader's shop: Cheese, **Wharf Runner's Boots** (new), **Venison Roast Recipe** | Apothecary: Minor Mana Potion, **Greater Mana Potion Recipe** (new); Magic shop: **Rootwalker Boots** (new) |
| Revered | Quests *Safe Passage* (Trader) and *Last Orders* (Bartender); lines from the Bartender and Josh | Quests *A Clean Cure* (Sylvie) and *Roots and Rafters* (Brenna → Corwin); lines from Corwin and Brenna |
| Exalted | Title **Toast of La Harpar**; pet (step 4) | Title **Keeper of Mawood**; pet (step 4) |

## Titles

Display names only, no stats (`GLOSSARY.md` **Title**). i18n keys under a new `titles` namespace or the reputation keys, the main thread's choice.

| Town | Tier | Title | Why |
|---|---|---|---|
| La Harpar | Friendly | Friend of La Harpar | The design doc's example. |
| La Harpar | Exalted | Toast of La Harpar | A tavern town: the player is now the one everyone drinks to. |
| Mawood | Friendly | Friend of Mawood | Same pattern as La Harpar. |
| Mawood | Exalted | Keeper of Mawood | The town keeps going because of the player; it does not claim the forest is healed. |

## Friendly: dialogue

The dialogue engine takes the first result whose conditions pass, so each free result goes **before** the paid one. Conditions are AND-only, which is why Friendly gets its own result instead of an OR with the flag.

### La Harpar: the Bartender

`default.whatIsThisPlace` is the only paid answer whose text names the price ("That'll be 20 coins"), so a Friendly player needs a free version of that node. `anyWork` and `anyTrainer` reuse their nodes: their text never mentions money.

Results for each paid option, in order:
1. **(new)** Shown when La Harpar Friendly → the same node as today, no gold, no flag. For `whatIsThisPlace` go to `whatIsThisPlaceFree` instead.
2. Today's paid result (flag not set, pay, set flag).
3. Today's free repeat.

### whatIsThisPlaceFree (new)
**Shown when:** La Harpar Friendly, option `default.whatIsThisPlace`
> A tavern. Are you blind? Don't reach for your purse, this one's on the house. You've been good for business.

1. "Well, I can't argue with that." → default (reuse `whatIsThisPlace1.opt1`)

### La Harpar: Josh

`greeting.opt1` results, in order:
1. Flag `josh_paid_beer` set → talkReady (today).
2. **(new)** La Harpar Friendly → talkFree · effect: set flag `josh_paid_beer` (no gold), so he greets the player with talkReady from then on.
3. → payBeer (today).

### talkFree (new)
**Shown when:** La Harpar Friendly and flag `josh_paid_beer` not set
> You again? Sit down. Half the beach owes you a drink, so I reckon I can talk for free. Once.

1. "Once is all I need." → talkReady

### Mawood: Sylvie (perk)

No Mawood NPC charges for answers, so Mawood's Friendly perk is trust: Sylvie lets a Friendly player into the apothecary before *Silk and Water*. Mawood Friendly comes from *Signs of Rot* (25) and *Prove Your Aim* (45), so the Mortar and Pestle and Vials of Water open a little earlier.

`default.browseWares` results, in order:
1. `silkAndWater` completed → open `mawoodApothecary` (today).
2. **(new)** Mawood Friendly → open `mawoodApothecary`.

## Honored: shop stock and recipe scrolls

Each row gets `minReputation: { townId, tier: ReputationTier.honored }` next to the shop's other items. Prices follow each shop's markup: shops sell at about 3× an item's `value` (Apprentice Robe 500 → 1500, Magic Staff 800 → 3000), recipe scrolls at 3× (Fish Apple Pie Recipe 100 → 300), and basic food matches the stall (Apple 25, Fish Meat 10).

### La Harpar (`laHarparShop`, the Trader)

| Item | Tier | Price | Stock | Refreshable | Why |
|---|---|---|---|---|---|
| `cheese` | normal | 30 | 99 | yes | Provisions. Today it only drops from rats (Rat 1 in 8, Giant Rat 1 in 2), yet four cooking recipes need it (Baked Apple, Cheese Platter, Fish Apple Pie, Hunter's Feast). Next to Apple at 25. |
| `machete` | uncommon | 3000 | 1 | no | Safe roads: only the Bandit drops it (1 in 80). Value 1000; between Wooden Bow (2500) and the Skill Point Book (5000). |
| `venisonRoastRecipe` (recipe scroll) | uncommon | 300 | 1 | no | Deer and Goats are on La Harpar's road (The Long Path, Mountain Pass). Today it only drops from the Goat (1 in 12). Same price as Fish Apple Pie Recipe (both value 100). Crafted at the Cooking Pot, which this shop sells. |

### Mawood (`mawoodApothecary`, Sylvie; `mawoodMagicShop`, Elarion)

| Shop | Item | Tier | Price | Stock | Refreshable | Why |
|---|---|---|---|---|---|---|
| Apothecary | `minorManaPotion` | normal | 60 | 20 | yes | Medicine. Today it is sold only for Explorer Tokens (Guild store) or crafted. Value 30; 60 is above the craft cost (Vial of Water 15 + Apple 25), so crafting stays the cheap way. |
| Apothecary | `greaterManaPotionRecipe` **(new)** (recipe scroll) | uncommon | 300 | 1 | no | Sylvie's own remedy: spider silk resists the blight (`aboutCorruptionSpreading`). Priced like the other uncommon recipe scrolls. |
| Magic shop | `spellweaverAmulet` | rare | 12000 | 1 | no | Only the Elder Spider drops it (1 in 60). Value 4000 × 3. |

Note: the apothecary itself opens only after *Silk and Water* or at Friendly (above), so a player who reaches Honored always has access.

**Why the Mawood recipe is new:** every existing recipe scroll is already easy to get (Crab Stew, Cheese Platter: 1 in 10 boss drops and the Guild store; Fish Apple Pie and Earth Rune: sold), arena-only (Gladiator's Helm, which would undercut the Arena Chest), uncraftable (Hunter's Feast needs cooking level 3), or taken by La Harpar (Venison Roast). See **Owner calls**.

## Revered: quest line and dialogue

Reputation is already high by Revered, and the player is in or past the Upper Canopy (Mawood's own quests give 525 of Mawood's 600; La Harpar's give 60, so La Harpar Revered comes almost entirely from turn-ins). Rewards match **War Trophies** (4000 XP, 800 gold, Skill Point Book) and **What Lurks at the Top** / **The Blighted Heart** (5000 XP, 1000 gold, 1 skill point). They use existing enemies, zones, items and NPCs; the only new things are the quest IDs and the Greater Mana Potion. Each quest's reputation reward is 75–100, so the four together give 375 of the 900 between Revered and Exalted. Turn-ins stay the main road to Exalted.

### The story

At Revered the towns give the player what they give their own people: work that matters to the town's future. La Harpar wants a **safe trade road** over the Mountain Pass to Mawood, which no traveller crosses "this time of year", and a **feast** for a Lirold trade party. Mawood wants Sylvie's **antidote** finished and Brenna's **platforms rebuilt** with clean timber. Corwin blesses the work and is honest that the forest will take years. Nothing is healed for good.

### Quests

Use the next free `QuestID` when implementing: `la-harpar-quests.md` proposes 16–26, so check what has shipped first.

| Quest (ID) | Giver | Zone | Start gate | Steps | Item source | Rewards (matched to) |
|---|---|---|---|---|---|---|
| **Safe Passage** (`safePassage`) | Trader (`laHarparTrader`) | Mountain Pass | La Harpar Revered **and** `silkAndWater` completed (the player knows Sylvie) | 1. Kill the Troll 3 times and 40 Goblin Scavengers (turn in: Trader)<br>2. Talk to Sylvie in Mawood (turn in: `mawoodSylvie`, `requirements: []`) | — | 4000 XP, 800 gold, **+100 La Harpar**, **+25 Mawood** (War Trophies: kill a Boss 3 times) |
| **Last Orders** (`lastOrders`) | Bartender (`laHarparBartender`) | — (cooking) | La Harpar Revered | 1. Bring 10 `venisonRoast` and 10 `fishApplePie` | Crafted at the Cooking Pot from the Honored Venison Roast Recipe and the Trader's Fish Apple Pie Recipe | 4000 XP, 800 gold, 1 `skillPointBook`, **+75 La Harpar** (War Trophies) |
| **A Clean Cure** (`aCleanCure`) | Sylvie (`mawoodSylvie`) | The Deepwood, Elderwood Wilds | Mawood Revered **and** `theInfestation` completed | 1. Bring 10 `elderSilk` and 5 `spiderFang` (turn in: Sylvie)<br>2. Kill 30 Corrupted Saplings (turn in: Sylvie) | Elder Spider (Deepwood) | 4000 XP, 800 gold, 1 `skillPointBook`, **+100 Mawood** (War Trophies) |
| **Roots and Rafters** (`rootsAndRafters`) | Brenna (`mawoodBrenn`) | The Deepwood | Mawood Revered **and** `warTrophies` completed | 1. Bring 30 `ancientWood` and 20 `spiderSilk` (turn in: Brenna)<br>2. Talk to Corwin (turn in: `mawoodCorwin`, `requirements: []`) | Treant Sprout, Gnarled Treant; Forest Spider | 5000 XP, 1000 gold, 1 skill point, **+100 Mawood** (What Lurks at the Top) |

Notes for wiring:
- `requirements: []` makes a talk step ready at once (`canAdvanceQuest` returns true on an empty list).
- *Roots and Rafters* and *A Clean Cure* ask for Ancient Wood and Spider Silk, the items Brenna's and Sylvie's turn-ins take. Turn-ins already keep back what the current step of an active quest needs (`town-reputation.md` Turn-ins), so these don't clash.
- *Last Orders* steps take crafted food, so the player needs both recipes. That's why its start gate is the Revered tier alone: Honored, and with it the Venison Roast Recipe, always comes first.

### Clue beats

- **Safe Passage, step 1 (Trader):** the Troll and the goblins are why "nobody comes through the Pass". With the road clear, the Trader sends his first crate of salt fish up to Mawood.
- **Safe Passage, step 2 (Sylvie):** Sylvie gets a taste of home ("La Harpar salt fish! I haven't smelled that in years") and places a standing order for vials and coastal herbs.
- **Last Orders:** a party of Lirold buyers is coming to renew the fish contract. The Bartender wants them fed so well they "forget to haggle".
- **A Clean Cure, step 1:** elder silk from the deep nests is cleaner than anything in the Wilds; Sylvie can finally work.
- **A Clean Cure, step 2:** the test works on saplings that haven't fully turned. It slows the rot, it doesn't undo it, and the old trees are beyond it.
- **Roots and Rafters, step 1:** Brenna rebuilds the platforms the gnolls stripped. Clean old-growth wood, silk lashings.
- **Roots and Rafters, step 2 (Corwin):** Corwin blesses the new platform and reports one silver shoot in the outer Wilds, the first in two years. The rest will take years.

### Dialogue scripts

Quest hub order is turn-ins, then in-progress, then offers (`dialogue.md`). Each Revered offer goes **first among the offers** in the giver's hub. Each talk-step turn-in is its own option on the NPC's `default` node, shown only while that step is `readyToAdvance`.

#### La Harpar: Trader (`laHarparTrader.json`)

##### questSafePassage (new)
**Shown when:** `default.opt6`, quest `safePassage` available
> Aye, I've a proper job for someone the whole village trusts. That troll on the Mountain Pass has kept every cart off the road to Mawood. Clear it for good and I'll open a trade route nobody else has.

1. "A new market? I'll clear the road." → default · effect: start `safePassage`
2. "Not today." → default

##### questSafePassageProgress (new)
**Shown when:** `default.opt6`, quest `safePassage` active, step 1 not ready
> The troll three times, and forty of those scavengers. Carts don't argue with goblins, and neither do I.

1. "Working on it." → default

##### questSafePassageStep1Complete (new)
**Shown when:** `default.opt6`, quest `safePassage` ready to advance, step 1
> The road's clear? Then the first crate of salt fish goes up today. Find the herbalist in Mawood, Sylvie, and tell her La Harpar is open for business.

1. "I'll tell her." → default · effect: advance `safePassage`

##### questSafePassageStep2 (new, in progress)
**Shown when:** `default.opt6`, quest `safePassage` on step 2
> Off you go to Mawood. Sylvie, at the apothecary. Don't eat the samples.

1. "On my way." → default

#### Mawood: Sylvie (`mawoodSylvie.json`)

New `default` option **(new)** `default.safePassage`: "The La Harpar trader sends his regards. And salt fish." Shown when quest `safePassage` ready to advance, step 2 → safePassageComplete.

##### safePassageComplete (new)
> Salt fish from La Harpar! I haven't smelled that since I left the coast. A trade road over the Pass? Tell him I'll take vials, coastal herbs, everything. Thank you!

1. "I'll pass it on." → default · effect: advance `safePassage` (completes it)

#### La Harpar: Bartender (`laHarparBartender.json`)

`default.anyWork` becomes a hub (turn-in, in progress, offer for `lastOrders`, then today's `meatShortage` results).

##### questLastOrders (new)
**Shown when:** `default.anyWork`, quest `lastOrders` available
> Buyers from Lirold are coming to renew the fish contract, and I want them fed so well they forget to haggle. Ten venison roasts and ten fish apple pies. You cook, I charm.

1. "Twenty plates, coming up." → default · effect: start `lastOrders`
2. "I'm no cook." → default

##### questLastOrdersProgress (new)
**Shown when:** `default.anyWork`, quest `lastOrders` active
> Ten roasts, ten pies. Hot ones. Lirold folk can tell.

1. "Working on it." → default

##### questLastOrdersComplete (new)
**Shown when:** `default.anyWork`, quest `lastOrders` ready to advance, step 1
> Smells like a signed contract. Here, you've earned this. And don't tell anyone I paid you.

1. "My lips are sealed." → default · effect: advance `lastOrders`

##### onTheHouse (new, Revered line)
New `default` option `default.onTheHouse`: "The usual, please." **Shown when:** La Harpar Revered → onTheHouse
> One ale, on the house. Don't get used to it. ...Fine. Get a little used to it.

1. "Cheers." → default

#### La Harpar: Josh (`laHarparJosh.json`)

##### aboutHeirloom (new, Revered line)
New `talkReady` option `talkReady.opt6`: "About that heirloom you gave me..." **Shown when:** La Harpar Revered **and** quest `clearingOutTheBeach` completed → aboutHeirloom
> That ring? I kept it for someone who went up the mountain and never came back for it. I've waited long enough. Better on a hand that goes places.

1. "I'll take care of it." → talkReady
2. "Who was it?" → aboutHeirloomWho

##### aboutHeirloomWho (new)
> Buy me a beer some other year and maybe I'll tell you.

1. "Fair enough." → talkReady

This deepens T-16 without answering it. It fits `la-harpar-quests.md` S7 (Josh's brother lost on the mountain) if that ships, and doesn't need it.

#### Mawood: Sylvie (`mawoodSylvie.json`), A Clean Cure

`default.work` hub: put the `aCleanCure` results (step 2 turn-in, step 1 turn-in, in progress, offer) above the Infestation results.

##### questCleanCure (new)
**Shown when:** `default.work`, quest `aCleanCure` available
> I think I'm close to the antidote. Truly close, this time. I need clean samples: ten bundles of elder silk and five fangs from the deep nests. Nothing from the outer Wilds, it's all tainted.

1. "Clean samples. I'll get them." → default · effect: start `aCleanCure`
2. "Later, Sylvie." → default

##### questCleanCureProgress (new)
**Shown when:** `default.work`, quest `aCleanCure` active, current step not ready
> Step 1: Ten elder silk, five spider fangs. The Deepwood spiders, please, not the ones in my cabinet.
> Step 2: Thirty saplings. Watch whether they rot slower. I'll be here, biting my nails.

(Two nodes, `questCleanCureProgress1` and `questCleanCureProgress2`, one per step.)

1. "Working on it." → default

##### questCleanCureStep1Complete (new)
**Shown when:** `default.work`, quest `aCleanCure` ready to advance, step 1
> These are perfect. Now the hard part: coat your blade with this and cut down thirty corrupted saplings in the Wilds. If I'm right, the rot slows where it touches.

1. "Thirty saplings." → default · effect: advance `aCleanCure`

##### questCleanCureComplete (new)
**Shown when:** `default.work`, quest `aCleanCure` ready to advance, step 2
> It slows it. It doesn't undo it, and the old trees are too far gone, but it slows it. That's years we didn't have. Take this. I mean it.

1. "Years is a start." → default · effect: advance `aCleanCure`

#### Mawood: Brenna (`mawoodBrenn.json`), Roots and Rafters

`default.work` hub: `rootsAndRafters` results above War Trophies.

##### questRootsAndRafters (new)
**Shown when:** `default.work`, quest `rootsAndRafters` available
> The gnolls stripped half the walkways on the east Spires for firewood. I'm rebuilding them properly: thirty pieces of clean ancient wood and twenty bundles of spider silk for the lashings. You're the only one I'd trust to tell clean from tainted.

1. "Thirty wood, twenty silk." → default · effect: start `rootsAndRafters`
2. "Not right now." → default

##### questRootsAndRaftersProgress (new)
**Shown when:** `default.work`, quest `rootsAndRafters` active, step 1 not ready
> Thirty ancient wood, twenty silk. Clean, or it goes back.

1. "Understood." → default

##### questRootsAndRaftersStep1Complete (new)
**Shown when:** `default.work`, quest `rootsAndRafters` ready to advance, step 1
> Feel that. Not a black vein in the lot. The first platform goes up tonight. Fetch Corwin, would you? He'll want to bless it, and I want him to see it.

1. "I'll get him." → default · effect: advance `rootsAndRafters`

##### questRootsAndRaftersStep2 (new)
**Shown when:** `default.work`, quest `rootsAndRafters` on step 2
> Corwin. Elder's Tree. Go on.

1. "Going." → default

##### reveredCommissions (new, Revered line)
New `default` option `default.commissions`: "Taking commissions again?" **Shown when:** Mawood Revered **and** quest `rawMaterials` completed → reveredCommissions
> Slowly. Clean bark is coming in again, a few pieces a week. The craft isn't dying with the forest after all. Don't make me say thank you.

1. "Wouldn't dream of it." → default

#### Mawood: Corwin (`mawoodCorwin.json`)

New `default` option `default.rootsAndRafters`: "Brenna asks you to bless the new platform." Shown when quest `rootsAndRafters` ready to advance, step 2 → rootsAndRaftersComplete.

##### rootsAndRaftersComplete (new)
> A platform of clean wood, lashed with silk. Mawood building up again, as it always has. I'll bless it. And take this, traveler. You have rebuilt more than a walkway.

1. "Thank you, Elder." → reveredFirstShoot · effect: advance `rootsAndRafters` (completes it)

##### reveredFirstShoot (new, Revered line)
Also a new `default` option `default.recovery`: "How is the forest?" **Shown when:** Mawood Revered **and** quest `theBlightedHeart` completed → reveredFirstShoot
> One silver shoot in the outer Wilds. One, the first in two years. The rest will take years, perhaps more than I have left. But it is one more than last spring.

1. "One is a start." → default

## Lock text

Locks name the town and tier and never say "Rank" (the Guild's term, `GLOSSARY.md`):
- Shop item: "Requires La Harpar Honored — 140/200".
- Quest gate: Revered offers simply don't show before Revered (start results are hidden unless the quest is `available`). The Reputation tab doesn't list rewards (`quest-panel.md`), so no other lock text is needed.

## New content

| Kind | ID | Description |
|---|---|---|
| Quest | `safePassage` | Safe Passage. Trader, La Harpar Revered; see the table above. |
| Quest | `lastOrders` | Last Orders. Bartender, La Harpar Revered. |
| Quest | `aCleanCure` | A Clean Cure. Sylvie, Mawood Revered. |
| Quest | `rootsAndRafters` | Roots and Rafters. Brenna, then Corwin, Mawood Revered. |
| Item (potion) | `greaterManaPotion` | Greater Mana Potion: restores 15 mana (Minor restores 5), 2 min cooldown, value 80. Icon: recolour of `minorManaPotion`. |
| Item (recipe scroll) | `greaterManaPotionRecipe` | Teaches `greaterManaPotion` (`requiresUnlock`). Uncommon, value 100, alchemy recipe icon. |
| Recipe | `greaterManaPotion` | Alchemy (Mortar and Pestle), level 1: 1 `vialOfWater`, 3 `spiderSilk` → 1. |
| Titles | 4 | Friend of La Harpar, Toast of La Harpar, Friend of Mawood, Keeper of Mawood. |
| Dialogue nodes | see scripts | Every node marked **(new)** above, in the five existing namespaces. No new NPC or namespace. |

No new enemy, zone, NPC or flag (Josh's free talk reuses `josh_paid_beer`).

## Owner calls

1. **Mawood's recipe scroll is new** (Greater Mana Potion), because every existing scroll is easy to get, arena-only or uncraftable. Alternatives: give Mawood the Venison Roast Recipe (Finn is a hunter) and La Harpar the Crab Stew Recipe (easy to get already), or sell the Gladiator's Helm Recipe at Elarion's (undercuts the Arena Chest).
2. **Hunter's Feast stays uncraftable** (cooking level 3 has no station). Not fixed here: station gear is out of scope (`town-reputation.md`).
3. *(Settled: new Wharf Runner's Boots, rare, +2 attack power, +5% gold, 3000 gold, replace the Machete.)* **Machete at 3000 gold** gives La Harpar a mid-game weapon that only the Bandit drops. Swap it for the Stone Arrow (cape, only from the Harpy Matriarch) if it's too strong at that point.
4. *(Settled: new Rootwalker Boots, rare, +3 magic damage, +3 max mana, 6000 gold, replace the Spellweaver Amulet.)* **Spellweaver Amulet at Elarion's for 12000** makes a 1-in-60 drop purchasable. Drop the row if drops should stay the only source.
5. **Sylvie's Friendly perk** opens the apothecary earlier. It loosens a gate and never adds one, so the main-path rule holds.
6. **Josh's heirloom line** says the ring was kept for someone lost on the mountain (T-16, T-05). It names nobody, so `la-harpar-quests.md` S7 (his brother) still fits.
7. **Safe Passage credits Mawood +25** as well as La Harpar +100: the first cross-town reputation reward.
8. **Corwin's "one silver shoot"** is the first sign of recovery. It stays within "years, perhaps decades": no healing.
9. **The Bartender's default line** ("my answers aren't free") stays as it is at Friendly. A Friendly variant needs per-tier message text, which nodes don't support today.
10. Titles: **Toast of La Harpar** and **Keeper of Mawood** for Exalted.
