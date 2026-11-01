# History

Timeline relative to the present (the player's arrival). Source shorthand as in world.md (`Corwin#key` = `dialogues/mawoodCorwin.json`). "Inferred" rows are deductions from shipped lines, not stated outright.

## Timeline

| When | Event | Source |
|---|---|---|
| Before any kingdom | Silverwood Spires already stand. | `Corwin#aboutForest` |
| Ancient | Messatan, ruled by Queen Primula; "believed to be long gone"; Primula's Sceptre. | `Elara#primulaInfo` |
| Centuries ago | A druid's failed ritual consumes a Silverwood Spire (the Gnarled Treant); its corruption "has been seeping outward for centuries". | `Corwin#questTheSap`, `Corwin#questBlightedHeart` |
| ~300 years ago | Mawood founded on platforms. | `Corwin#aboutMawood`, `Brenna#questRawMaterialsComplete` ("remembers three hundred years") |
| "A long time" | La Harpar becomes Lirold's trade partner. | `Trader#aboutFishermen` |
| Decades ago | Corwin's ritual to commune with a Spire fails; bark grows on him and still spreads. | `Corwin#intro2` |
| Unknown, years ago | Finn, aged 17, follows game trails north from the plains into the Elderwood and stays. | `Finn#aboutFinn` |
| 8 years ago | A treant takes Finn's leg ("before the corruption"); he now walks on a carved oak branch. | `Finn#aboutLeg` |
| 8 years ago | Milo born in Mawood to trader parents, who later leave without him. | `Milo#aboutMilo` |
| 5 years ago | Captain Theron Tidecaller goes missing. | `Elara#fatherIntro` |
| "Years ago" (≤5) | Elara moves to La Harpar to look for him. | `Elara#apology`, `Elara#fatherIntro` |
| Inferred, ≤5 years ago | Sylvie leaves La Harpar for Mawood while Elara is there searching. | `Sylvie#aboutElara` |
| 2 years ago | Black sap first appears; Spires' pulse disturbed. | `Corwin#aboutMawood`, `Corwin#aboutForest`, `Corwin#questBlightedHeartComplete` |
| Inferred, ≤2 years ago | Elarion comes from Drenhollow after reports of magical resonance in the (corrupted) roots; opens the Magic Shop when funds run out. | `Elarion#aboutElarion` |
| "Months" | Gnolls plant root-bundles at camp edges. Spiders reach Mawood's lower platforms. | `Finn#aboutCorruption`, `Sylvie#questInfestationComplete` |
| This month | Gnolls raid Brenna's lumber three times. | `Brenna#questWarTrophies` |
| A few days ago | Marvin returns to La Harpar from an expedition. | `Elara#marvinInfo`, `Trader#aboutPeople` |

## Player-driven events (in quest order)

| Quest (`quests.json`) | Outcome | Source |
|---|---|---|
| Meat shortage | Bartender gets 30 Crab Meat. | `quests-data.ts`, `Bartender#anyWorkForMe1` |
| Clearing out the beach | Beach cleared; Josh gives Josh's Heirloom. He had kept the ring for someone who went up the mountain and never came back for it (who is unsaid; see T-05). | `Josh#workInfo`, `Josh#missionCheck`, `Josh#aboutHeirloom`, `quests-data.ts` |
| Rats, We are rats | Trader's Basement cleared. | `Trader#default.opt1`, `Trader#questCompleted` |
| A tale of a captain | Started; cannot finish (Captain's Letter has no source). | `quests-data.ts`, `docs/systems/quests.md` |
| Signs of Rot | Resin shows the blight is "more virulent than two years ago"; gnolls implicated. | `Corwin#questSignsOfRotComplete` |
| Fetishes and Fangs | Warchief's master bundle taken; gnolls were carriers, not source. | `Finn#questFetchesComplete`, `Corwin#questTheSap` |
| The Sap That Burns | Corwin brews the sap to stop the Treant's regeneration. | `Corwin#questTheSapComplete` |
| The Blighted Heart | Gnarled Treant killed; the Spires go quiet; Deepwood to recover over "years, perhaps decades"; gnolls to scatter. | `Corwin#questBlightedHeartComplete`, `Corwin#postQuestLore` |
| Silk and Water / The Infestation | Sylvie resupplied; spiders pushed back. | `Sylvie#questSilkWaterComplete`, `Sylvie#questInfestationComplete` |
| Prove Your Aim / Big Game | Finn's trust; old one-eared bear spared; Ashwood Bow. | `Finn#questProveYourAimComplete`, `Finn#questBigGameComplete` |
| Raw Materials / War Trophies | Silverwood Chestplate; Warchief killed three times. | `Brenna#questRawMaterialsComplete`, `Brenna#questWarTrophiesComplete` |
| Feathers for a Kite / What Lurks at the Top | Harpy Matriarch killed; Milo reaches the nest, finds the Harpy Crown and a door in the tallest Spire. | `Milo#questWhatLurksComplete`, `Milo#questWhatLurksPostQuest` |

## Proposed (not shipped)
- Theron's ship *Saltwind* wrecked on Horseshoe Beach 5 years ago; he walked inland over the Mountain Pass into the Elderwood. **(proposed, `docs/ideas/la-harpar-quests.md`)**
- Bandits sold a captain's coat in Lirold four years ago. **(proposed, `docs/ideas/la-harpar-quests.md`)**
- Josh's brother went up the mountain years ago and never returned. **(proposed, `docs/ideas/la-harpar-quests.md`)**
- Marvin's last expedition was sent by Guildmaster Odile Varrow; he came home to La Harpar (his birthplace) and stays there, in the Tavern, handling contracts and a few Guild supplies until the player meets Varrow, and writing her letters about the player. **(proposed, `docs/ideas/north-lirold-and-exploration-guild.md` §2, §5)**
- Long ago: the Lirold Arena opens under a castle charter. Later, Ludo Crane holds its sand eleven seasons unbeaten, loses a knee to a cart wheel and becomes its master. **(proposed, `docs/ideas/lirold-arena-master.md`)**
- Last spring: trappers deliver Yad to the Arena in a crate, origin unsaid; no challenger beats it until the player. **(proposed, same doc; T-28)**
- Player-driven: the player clears the Arena (Yad killed), any number of times. **(proposed, `docs/ideas/combat-arena.md`)**
- Unknown, before the mine: someone cuts stone stairs deep under the Slatefall hillside; the Stone Warden stands in them. **(proposed, `docs/ideas/slatefall-and-the-deeper-mines.md`)**
- Long ago: Slatefall quarries slate for Lirold's roofs and mines iron for its walls; the castle owns the mine. **(proposed, `docs/ideas/slatefall-and-the-deeper-mines.md`)**
- Two winters ago, the week before the collapse: Tobin hears the stone "sing". **(proposed, same doc)**
- Two winters ago (the same winter the black sap first appears; hinted, never confirmed, T-27): foreman Oswin Brask's crew of six (Bram, Nell, the Corrie twins, Dace) breaks into the old stairs in the Lower Shafts and is lost; the rock starts moving; the castle shuts the mine and bars its road at the Pass end. Goblins from the Pass take the upper levels; a Troll moves onto the road. Corwin's Spires "flinched" that winter; Sylvie's platform-three spring went bad. **(proposed, `docs/ideas/slatefall-and-the-deeper-mines.md` §2, §7)**
- Player-driven: *The Guild Trial* (after the Harpy Matriarch). Sixty Canopy Bandits, outlaws who fled the capital's law, are killed, then the Troll on the mine road; the player gets Guild steel and the writ for the castle's east gate. **(proposed, `docs/ideas/north-lirold-and-exploration-guild.md` §6)**
- Player-driven, at Revered reputation: *Safe Passage* (the Troll and goblins cleared off the Mountain Pass; the La Harpar Trader opens a trade road to Mawood, and Sylvie places a standing order); *Last Orders* (the Bartender feasts Lirold buyers renewing the fish contract); *A Clean Cure* (Sylvie's antidote slows the rot in young saplings but doesn't undo it); *Roots and Rafters* (after The Blighted Heart, Brenna rebuilds the lower walkways the blight made brittle; Corwin blesses them and reports the first silver shoot in two years, with recovery still years away). **(proposed, `docs/ideas/town-reputation-tier-rewards.md`)**
- Player-driven: *Lamps in the Dark*, *What the Deep Keeps*, *The Last Shift*, *Charting the Deep*. Goblins cleared from the Deeper Mines; Oswin's badge and helm found; the lost crew laid to rest; the stairs found; the Stone Warden killed; the stairs stay sealed; Pell copies the Warden's marks for Varrow. **(proposed, `docs/ideas/slatefall-and-the-deeper-mines.md`)**
