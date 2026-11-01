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
| `wharfRunnersBoots` **(new)** | rare | 3000 | 1 | no | Safe roads: +2 attack power, +5% gold. Replaces the Machete (owner call 3). |
| `venisonRoastRecipe` (recipe scroll) | uncommon | 300 | 1 | no | Deer and Goats are on La Harpar's road (The Long Path, Mountain Pass). Today it only drops from the Goat (1 in 12). Same price as Fish Apple Pie Recipe (both value 100). Crafted at the Cooking Pot, which this shop sells. |

### Mawood (`mawoodApothecary`, Sylvie; `mawoodMagicShop`, Elarion)

| Shop | Item | Tier | Price | Stock | Refreshable | Why |
|---|---|---|---|---|---|---|
| Apothecary | `minorManaPotion` | normal | 60 | 20 | yes | Medicine. Today it is sold only for Explorer Tokens (Guild store) or crafted. Value 30; 60 is above the craft cost (Vial of Water 15 + Apple 25), so crafting stays the cheap way. |
| Apothecary | `greaterManaPotionRecipe` **(new)** (recipe scroll) | uncommon | 300 | 1 | no | Sylvie's own remedy: spider silk resists the blight (`aboutCorruptionSpreading`). Priced like the other uncommon recipe scrolls. |
| Magic shop | `rootwalkerBoots` **(new)** | rare | 6000 | 1 | no | +3 magic damage, +3 max mana. Replaces the Spellweaver Amulet (owner call 4). |

Note: the apothecary itself opens only after *Silk and Water* or at Friendly (above), so a player who reaches Honored always has access.

**Why the Mawood recipe is new:** every existing recipe scroll is already easy to get (Crab Stew, Cheese Platter: 1 in 10 boss drops and the Guild store; Fish Apple Pie and Earth Rune: sold), arena-only (Gladiator's Helm, which would undercut the Arena Chest), uncraftable (Hunter's Feast needs cooking level 3), or taken by La Harpar (Venison Roast). See **Owner calls**.

## Revered: quest line and dialogue

**Status:** implementation-ready (checked against `src/` on `feat/reputation-revered-quests`, 2026-10-31). The Revered lines `onTheHouse`, `aboutHeirloom`/`aboutHeirloomWho`, `reveredCommissions` and `reveredFirstShoot` are **shipped** (PR 91); they are listed below for context only, don't change them.

Reputation is already high by Revered, and the player is in or past the Upper Canopy (Mawood's own quests give 525 of Mawood's 600; La Harpar's give 60, so La Harpar Revered comes almost entirely from turn-ins). Rewards match **War Trophies** (4000 XP, 800 gold, Skill Point Book) and **What Lurks at the Top** / **The Blighted Heart** (5000 XP, 1000 gold, 1 skill point; without their Skill Point Book and item). They use existing enemies, zones, items and NPCs; the only new things are the four quest IDs. Each quest's reputation reward is 75–100, so the four together give 375 of the 900 between Revered and Exalted. Turn-ins stay the main road to Exalted.

### The story

At Revered the towns give the player what they give their own people: work that matters to the town's future. La Harpar wants a **safe trade road** over the Mountain Pass to Mawood, where "nobody new ever comes through" and only the odd merchant reaches Sylvie's, and a **feast** for Lirold buyers renewing the fish contract. Mawood wants Sylvie's **antidote** finished and Brenna's blight-brittle **walkways rebuilt** with clean timber. Corwin blesses the work and is honest that the forest will take years. Nothing is healed for good.

### Quests

`QuestID` ends at `whatLurksAtTheTop = 15` and nothing from `la-harpar-quests.md` has shipped, so use 16–19 in the order below. Names go in `quests.json` `names`; step descriptions are plain English in `quests-data.ts` (`localization.md`).

| ID (QuestID) | Name | Giver | Start gate | Rewards (matched to) |
|---|---|---|---|---|
| `safePassage` (16) | Safe Passage | Trader (`laHarparTrader`) | La Harpar Revered; `silkAndWater` completed | +100 La Harpar, +25 Mawood, 4000 XP, 800 gold (War Trophies, the cross-town reputation in place of the book) |
| `lastOrders` (17) | Last Orders | Bartender (`laHarparBartender`) | La Harpar Revered | +75 La Harpar, 4000 XP, 800 gold, 1 `skillPointBook` (War Trophies) |
| `aCleanCure` (18) | A Clean Cure | Sylvie (`mawoodSylvie`) | Mawood Revered; `theInfestation` completed | +100 Mawood, 4000 XP, 800 gold, 1 `skillPointBook` (War Trophies) |
| `rootsAndRafters` (19) | Roots and Rafters | Brenna (`mawoodBrenn`) | Mawood Revered; `warTrophies` completed; `theBlightedHeart` completed | +100 Mawood, 5000 XP, 1000 gold, 1 `unspentSkillPoints` (What Lurks at the Top) |

Start gates are `{ type: 'reputation', townId, tier: ReputationTier.revered }` plus `{ type: 'quest', questId, step: QUEST_STEP_AFTER_COMPLETED }`. Rewards list the `reputation` reward first, like the other quests.

**Steps** (`description` is the journal line, verbatim):

| Quest | Step | `turnInNpc` | `requirements` | `description` |
|---|---|---|---|---|
| Safe Passage | 1 | `laHarparTrader` | enemy `troll` 3; enemy `goblinScavenger` 40 | `La Harpar's trader wants the Mountain Pass safe for his carts. I need to kill the Troll 3 times and 40 goblin scavengers.` |
| Safe Passage | 2 | `mawoodSylvie` | `[]` | `The road over the Pass is clear. The trader asked me to tell Sylvie in Mawood that La Harpar is open for business.` |
| Last Orders | 1 | `laHarparBartender` | item `venisonRoast` 10; item `fishApplePie` 10 | `Bartender in La Harpar tavern asked me to bring her 10 venison roasts and 10 fish & apple pies for the buyers from Lirold.` |
| A Clean Cure | 1 | `mawoodSylvie` | item `elderSilk` 10; item `spiderFang` 5 | `Sylvie is close to an antidote. She needs 10 elder silk and 5 spider fangs from the Deepwood.` |
| A Clean Cure | 2 | `mawoodSylvie` | enemy `corruptedSapling` 30 | `Sylvie gave me a tincture to test. I need to kill 30 corrupted saplings in the Elderwood Wilds.` |
| Roots and Rafters | 1 | `mawoodBrenn` | item `ancientWood` 30; item `spiderSilk` 20 | `Brenna is rebuilding Mawood's blighted walkways. She needs 30 ancient wood and 20 spider silk.` |
| Roots and Rafters | 2 | `mawoodCorwin` | `[]` | `The first walkway is up. Brenna asked me to fetch Corwin from the Elder's Tree to bless it.` |

**Sources, checked in `src/`:**
- Troll: Mountain Pass boss; Goblin Scavenger: Mountain Pass (`zones-data.ts`). Kill steps count kills since the step started.
- Venison Roast: Cooking Pot (cooking 2), 3 Venison + 1 Apple, recipe sold by the Trader at La Harpar Honored. Fish & Apple Pie: Cooking Pot, 2 Fish Meat + 2 Apple + 1 Cheese, recipe sold by the Trader. Venison: Deer (The Long Path) and Goat (Mountain Pass), 1 in 3. Fish Meat, Apple and the Cooking Pot: Trader; Cheese: Trader at Honored. Honored always comes before Revered, so both recipes are buyable when *Last Orders* opens.
- Elder Silk (1–2, 1 in 3) and Spider Fang (1 in 4): Elder Spider, The Deepwood. Corrupted Sapling: Elderwood Wilds.
- Ancient Wood: Treant Sprout (1 in 3) and Gnarled Treant (1–5, always), The Deepwood. Spider Silk: Forest Spider (1–2, 1 in 3), Elderwood Wilds.

Notes for wiring:
- `requirements: []` makes a talk step ready at once (`canAdvanceQuest` returns true on an empty list). So the giver's "on step 2" node must test `active` with `step: 2`, and come after the step 1 `readyToAdvance` result.
- *Roots and Rafters* asks for Ancient Wood (Brenna's turn-in item) and Spider Silk (Sylvie's). Turn-ins already keep back what the current step of an active quest needs (`dialogue.md`, `reputationTurnIn`), so they don't clash. *A Clean Cure* takes Elder Silk, which no turn-in uses.
- *Roots and Rafters* needs `theBlightedHeart` completed because Corwin's turn-in leads into the shipped `reveredFirstShoot` ("the first in two years"), whose own option `default.recovery` requires `theBlightedHeart`. Without it a player could reach Mawood Revered through turn-ins (`warTrophies` needs only `theSapThatBurns`) and hear about recovery while the Gnarled Treant still lives.
- *Last Orders* steps take crafted food, so the player needs both recipes; Honored (and with it the Venison Roast Recipe) always comes before Revered, so the tier alone is the gate.

### Clue beats

- **Safe Passage, step 1 (Trader):** the Troll and the goblins are why so few carts cross the Pass. With the road clear, the Trader sends his first crate of salt fish up to Mawood.
- **Safe Passage, step 2 (Sylvie):** Sylvie gets a taste of home and places a standing order for vials and coastal herbs.
- **Last Orders:** buyers from Lirold are coming to renew the fish contract. The Bartender wants them fed so well they forget to haggle.
- **A Clean Cure, step 1:** elder silk and fangs from the deep nests are the purest samples Sylvie can get; she can finally work.
- **A Clean Cure, step 2:** the tincture slows the rot. It doesn't undo it, and trees that have fully turned are beyond it.
- **Roots and Rafters, step 1:** the blight has made half the lower walkways brittle (corrupted bark "becomes brittle and porous", `mawoodBrenn.json` `aboutBrennCorruption`). Brenna rebuilds them with clean old-growth wood and silk lashings.
- **Roots and Rafters, step 2 (Corwin):** Corwin blesses the new walkway, then (shipped `reveredFirstShoot`) reports one silver shoot in the outer Wilds, the first in two years. The rest will take years.

### Dialogue scripts

Quest hub order is turn-ins, then in-progress, then offers (`dialogue.md`). Each Revered quest's results go **above** the giver's existing quest results. Each talk-step turn-in is its own option on the NPC's `default` node, shown only while that step is ready.

#### La Harpar: Trader (`laHarparTrader.json`)

`default.opt6` ("Do you need help with anything?") results, in order: `safePassage` ready to advance step 1 → questSafePassageStep1Complete; `safePassage` active step 2 → questSafePassageStep2; `safePassage` active → questSafePassageProgress; `safePassage` available → questSafePassage; then today's two results (`ratsWereRats` completed → questCompleted, available → questOffer). After *Safe Passage* the option falls through to questCompleted, as today.

##### questSafePassage (new)
**Shown when:** `default.opt6`, quest `safePassage` available
> Aye, and it's a proper job, for someone the whole village trusts. That troll and his goblins on the Mountain Pass turn back every cart I send to Mawood. Clear the road and I'll open the finest trade route this side of the mountains!

1. "A new market? I'll clear the road." → default · effect: start `safePassage`
2. "Not today." → default

##### questSafePassageProgress (new)
**Shown when:** `default.opt6`, quest `safePassage` active (step 1, not ready)
> The troll three times, and forty of those scavengers. Carts don't argue with goblins, and neither do I.

1. "Working on it." → default

##### questSafePassageStep1Complete (new)
**Shown when:** `default.opt6`, quest `safePassage` ready to advance, step 1
> The road's clear? Then the first crate of salt fish goes up today, aye! Find Sylvie at the apothecary in Mawood and tell her La Harpar is open for business.

1. "I'll tell her." → default · effect: advance `safePassage`

##### questSafePassageStep2 (new)
**Shown when:** `default.opt6`, quest `safePassage` active, step 2
> Off to Mawood with you. Sylvie, at the apothecary. And don't eat the salt fish on the way.

1. "On my way." → default

#### Mawood: Sylvie (`mawoodSylvie.json`), Safe Passage

New `default` option `default.safePassage` **(new)**, above `default.work`: "The La Harpar trader sends his regards. And salt fish." **Shown when:** quest `safePassage` ready to advance, step 2 → safePassageComplete.

##### safePassageComplete (new)
> Salt fish from La Harpar! I haven't smelled that since I left the coast. Tell him I'll take vials, coastal herbs, anything he can send over the Pass.

1. "I'll pass it on." → default · effect: advance `safePassage` (completes it)

#### La Harpar: Bartender (`laHarparBartender.json`)

`default.anyWork` results: put the three `lastOrders` results first (ready to advance step 1 → questLastOrdersComplete; active → questLastOrdersProgress; available → questLastOrders), then today's `meatShortage` results unchanged. They sit above the paid result, so they never charge the 40 gold (the player is past Friendly anyway).

##### questLastOrders (new)
**Shown when:** `default.anyWork`, quest `lastOrders` available
> Buyers from Lirold are coming to renew the fish contract, and I want them fed so well they forget to haggle. Ten venison roasts and ten fish and apple pies. You cook, I charm.

1. "Twenty plates, coming up." → default · effect: start `lastOrders`
2. "I'm no cook." → default

##### questLastOrdersProgress (new)
**Shown when:** `default.anyWork`, quest `lastOrders` active (not ready)
> Ten roasts, ten pies. Hot ones. Lirold folk can tell.

1. "Working on it." → default

##### questLastOrdersComplete (new)
**Shown when:** `default.anyWork`, quest `lastOrders` ready to advance, step 1
> Smells like a signed contract. Here, you've earned this. And don't tell anyone I paid you.

1. "My lips are sealed." → default · effect: advance `lastOrders`

##### onTheHouse (shipped)
`default.onTheHouse`, La Harpar Revered. Not part of a quest.

#### La Harpar: Josh (`laHarparJosh.json`)

##### aboutHeirloom, aboutHeirloomWho (shipped)
`talkReady` option, La Harpar Revered and `clearingOutTheBeach` completed. Deepens T-16 without answering it; fits `la-harpar-quests.md` S7 (Josh's brother) if that ships, and doesn't need it.

#### Mawood: Sylvie (`mawoodSylvie.json`), A Clean Cure

`default.work` results: put the `aCleanCure` results above the Infestation results, in this order: ready to advance step 2 → questCleanCureComplete; ready to advance step 1 → questCleanCureStep1Complete; active step 2 → questCleanCureProgress2; active → questCleanCureProgress1; available → questCleanCure.

##### questCleanCure (new)
**Shown when:** `default.work`, quest `aCleanCure` available
> I think I'm close to the antidote. Truly close, this time! I need the purest samples there are: ten bundles of elder silk and five spider fangs from the Deepwood nests.

1. "Clean samples. I'll get them." → default · effect: start `aCleanCure`
2. "Later, Sylvie." → default

##### questCleanCureProgress1 (new)
**Shown when:** `default.work`, quest `aCleanCure` active, step 1 (not ready)
> Ten elder silk, five spider fangs. The Deepwood spiders, please, not the ones in my supply cabinet.

1. "Working on it." → default

##### questCleanCureProgress2 (new)
**Shown when:** `default.work`, quest `aCleanCure` active, step 2 (not ready)
> Thirty corrupted saplings in the Wilds. I'll be here, biting my nails.

1. "Working on it." → default

##### questCleanCureStep1Complete (new)
**Shown when:** `default.work`, quest `aCleanCure` ready to advance, step 1
> These are perfect. Now the hard part: take this tincture into the Wilds and bring down thirty corrupted saplings. If I'm right, the rot in their roots slows wherever it touches.

1. "Thirty saplings." → default · effect: advance `aCleanCure`

##### questCleanCureComplete (new)
**Shown when:** `default.work`, quest `aCleanCure` ready to advance, step 2
> It slows it! It doesn't undo it, and the trees that have fully turned are beyond saving, but it slows it. That's years we didn't have, so take this. I mean it.

1. "Years is a start." → default · effect: advance `aCleanCure` (completes it)

#### Mawood: Brenna (`mawoodBrenn.json`), Roots and Rafters

`default.work` results: put the `rootsAndRafters` results above War Trophies, in this order: ready to advance step 1 → questRootsAndRaftersStep1Complete; active step 2 → questRootsAndRaftersStep2; active → questRootsAndRaftersProgress; available → questRootsAndRafters.

##### questRootsAndRafters (new)
**Shown when:** `default.work`, quest `rootsAndRafters` available
> Half the walkways on the lower platforms have gone brittle with the blight. I'm rebuilding them properly: thirty pieces of clean ancient wood and twenty bundles of spider silk for the lashings. I'll know if it's tainted, so don't try.

1. "Thirty ancient wood, twenty silk. Done." → default · effect: start `rootsAndRafters`
2. "Give me time." → default

##### questRootsAndRaftersProgress (new)
**Shown when:** `default.work`, quest `rootsAndRafters` active, step 1 (not ready)
> Thirty ancient wood, twenty spider silk. Clean, or it goes back.

1. "Understood." → default

##### questRootsAndRaftersStep1Complete (new)
**Shown when:** `default.work`, quest `rootsAndRafters` ready to advance, step 1
> Not a black vein in the lot. The first walkway goes up tonight, so fetch Corwin from the Elder's Tree. He'll want to bless it.

1. "I'll get him." → default · effect: advance `rootsAndRafters`

##### questRootsAndRaftersStep2 (new)
**Shown when:** `default.work`, quest `rootsAndRafters` active, step 2
> Corwin. Elder's Tree. Go on.

1. "Going." → default

##### reveredCommissions (shipped)
`default.commissions`, Mawood Revered and `rawMaterials` completed. Not part of a quest.

#### Mawood: Corwin (`mawoodCorwin.json`)

New `default` option `default.rootsAndRafters` **(new)**, above `default.work`: "Brenna asks you to bless the new walkway." **Shown when:** quest `rootsAndRafters` ready to advance, step 2 → rootsAndRaftersComplete.

##### rootsAndRaftersComplete (new)
> Clean wood, lashed with silk. Mawood builds up again, as it always has, and I will bless it gladly. Take this, traveler; you have rebuilt more than a walkway.

1. "Thank you, Elder. And the forest?" → reveredFirstShoot · effect: advance `rootsAndRafters` (completes it)

##### reveredFirstShoot (shipped)
Also reached from `default.recovery` (Mawood Revered and `theBlightedHeart` completed). Its text ("One silver shoot in the outer Wilds…") answers the turn-in's option, and the start gate above keeps both routes to it after *The Blighted Heart*.

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
| Item (boots) | `wharfRunnersBoots` | Wharf Runner's Boots: rare, +2 attack power, +5% gold. Sold by the Trader at La Harpar Honored, 3000. |
| Item (boots) | `rootwalkerBoots` | Rootwalker Boots: rare, +3 magic damage, +3 max mana. Sold by Elarion at Mawood Honored, 6000. |
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
