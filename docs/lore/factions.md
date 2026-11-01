# Factions

Peoples, organisations and creature groups. Source shorthand as in world.md. NPC personalities live in `docs/character/`.

## Peoples

| People | Facts | Source |
|---|---|---|
| Humans | Most NPCs; the player. | — |
| Elves | Elara is an elf; La Harpar villagers still stare at her ears years after she arrived. Nothing else said about elves as a people. | `Elara#greeting`, `Elara#apology` |
| Dwarves | Toric, Lirold's proposed Forge Blacksmith, is a dwarf who loves apple pie (owner brief, 2026-11-01). Coastal traders taught him to enjoy the shipped Fish & Apple Pie; this is his personal taste, not a dwarven custom. No earlier dwarf reference was found in shipped English text/source definitions. **(proposed)** foundations name Keldrath north beyond Elderreach and underground Bramhold, with shared workshops, repair tallies, shared suppers and wary warmth toward surface customers. Toric left voluntarily for his own Lirold workshop. Origins, lifespan, wider history and any link to the ancient mines remain open. | Owner brief; [dwarves.md](dwarves.md); `docs/character/lirold/toric.md`; **(proposed, `docs/ideas/gear-upgrading-cold-forge.md`)** |
| Messatan | Ancient civilisation under Queen Primula; no known proof it existed. Primula's Sceptre is its known relic. | `Elara#primulaInfo`, `Elara#fairytaleInfo`, `Elara#rumorSceptre` |

## Organisations

| Group | Facts | Source |
|---|---|---|
| Exploration Guild | Based in La Harpar, head: Marvin. "We map the unknown and thin out the dangers." Pays Explorer Tokens for hunting contracts; Guild rank rises every 5 contracts and opens new territory and store stock. | `Marvin#introduction1`, `Marvin#introduction2`, `Marvin#whatIsThisPlace1`, `shop.json` `explorersGuildStore` |
| | Pathfinder's Seals recognise explorers who return with useful finds. Some are Arena Chest prizes; Marvin registers a bearer once in a salvage register and teaches inspection of recovered gear, permanently making 10% of gear drops arrive at +1. This is learned judgement, not a spell, Guild rank or mine-access writ; it requires neither Toric's Quest nor Varrow's hall. **(proposed, `docs/ideas/gear-upgrading.md`, `docs/ideas/gear-upgrading-cold-forge.md`)** | Proposed item/custom; no shipped source yet |
| | Chartered by Lirold, which pays for its charts and honours Explorer Tokens. Its only hall stands in the capital; head: **Guildmaster Odile Varrow**, ex-cartographer, who knows the player's deeds from traders and Marvin's letters. Marvin is a member, not the head: La Harpar-born, sent by Varrow on his last expedition, now in the La Harpar Tavern, teaching, and handling contracts and a few Guild supplies until the player meets Varrow; after that the Guild's business goes through her, and the hall has more stock. Hunters who pass *The Guild Trial* carry a Guild Shortsword and the Guild's writ for the castle's east gate. Varrow's apprentice: Pell. **(proposed, `docs/ideas/north-lirold-and-exploration-guild.md`; shipped "head of the Exploration Guild" would change)** | — |
| Lirold castle | The capital has a castle at its centre (owner decision, 2026-10-27). Who holds it is not said anywhere (thread T-24). Owns the Slatefall mine; shut it and barred its road two winters ago; puts bounties on outlaws (the Canopy Bandits fled its law). **(mine, bounties: proposed, `docs/ideas/slatefall-and-the-deeper-mines.md`, `north-lirold-and-exploration-guild.md`)** | owner decision |
| Lirold Arena | Castle holds its charter; **Ludo Crane** is its master, eleven seasons unbeaten until a cart wheel took his knee and the castle gave him the gate. Buys Elderwood beasts from trappers; champions fight for the purse, all but Yad. These facts are shipped. "The capital's oldest show" remains a proposal. | `src/assets/locales/en/dialogues/liroldArenaMaster.json` `intro1`, `aboutArena`, `aboutLudo`; oldest-show claim: **(proposed, `docs/ideas/lirold-arena-master.md`)** |
| Slatefall miners | Village that quarries Lirold's slate and worked the castle's iron mine. Hedda Brask (tavern, foreman's widow), Old Tobin (retired, "the stone sang"), Pell (Guild apprentice from Lirold, Varrow's). **(proposed, `docs/ideas/slatefall-and-the-deeper-mines.md`)** | — |
| Treasure seekers | Not an organisation: no permit; "travel to the most dangerous places and hope no one else got there first". Seek ancient artifacts. Theron Tidecaller is one. | `Elara#treasureInfo`, `Elara#permitInfo` |
| La Harpar fishermen | Famous across all four Regions; decades of experience. | `Trader#aboutVillage`, `Trader#aboutFishermen` |
| Drenhollow court | Employed Elarion as court mage; "terrible politics". | `Elarion#aboutElarion` |
| Mawood | ~300-year-old platform Town led by Elder Corwin. | `Corwin#intro1`, `Corwin#aboutMawood` |

## Creature groups

| Group | Facts | Source |
|---|---|---|
| Crab gang | Gangster Crab is the Horseshoe Beach Boss; crabs overrun the beach. No dialogue about a "gang". | `enemies.json` `gangsterCrab`, `zones-data.ts`, `Trader#aboutLiving` |
| Goblins | Goblin Scouts (The Long Path), Goblin Scavengers (Mountain Pass). No dialogue. | `enemies.json`, `zones-data.ts` |
| | Moved from the Pass into Slatefall's abandoned upper workings; Tunnelers, Sappers and a Goblin Foreman wearing Oswin Brask's badge; they haul the mine's tools and ore up to the Pass. **(proposed, `docs/ideas/slatefall-and-the-deeper-mines.md`)** | — |
| Mine dead and stone | Miner's Shades (Oswin's lost crew, still holding their lamps), Rubble Golems (chips of the Warden) and the Stone Warden, a carved giant with unreadable marks that came up the old stairs. **(proposed, `docs/ideas/slatefall-and-the-deeper-mines.md`)** | — |
| Bandits | Bandit is The Long Path's Boss; Canopy Bandits in The Upper Canopy. No dialogue. | `enemies.json`, `zones-data.ts` |
| | Canopy Bandits are Port Stocksmar's own runaways, with a castle bounty on them. **(proposed, `docs/ideas/north-lirold-and-exploration-guild.md` §6)** | — |
| Gnolls | War-bands in the Elderwood Wilds led by a Warchief who moves camp. Planted blighted root-bundles (fetishes) at camp edges "for months"; carriers, not the source. Breathing the spores drives them mad. Raid Brenna's lumber. Expected to scatter once the blight ends. | `Finn#aboutCorruption`, `Finn#questFetchesProgress`, `Corwin#questTheSap`, `Sylvie#aboutCorruption`, `Brenna#questWarTrophies`, `Corwin#postQuestLore` |
| Treants | Lived in the Deepwood before the blight (one took Finn's leg 8 years ago); faster and less predictable since. Treant Sprouts are "younger treants" spawned by the corrupted Spire. | `Finn#aboutLeg`, `Finn#aboutLegDeepwood`, `Corwin#questTheSap` |
| Gnarled Treant | The Spire consumed by a long-dead druid's failed ritual; the blight's source; "the old druid's soul still clings" to its heartwood. Killed by the player. | `Corwin#questTheSap`, `Corwin#questBlightedHeart` |
| Harpies | Nest above Mawood's top platforms; ~30 tracked by Milo; dislike the ropes; "more aggressive than usual" lately. Led by the Harpy Matriarch, who wears "a crown of real feathers". | `Milo#intro1Short`, `Milo#aboutCanopy`, `Milo#aboutCanopyCloser`, `Milo#aboutCanopyBig`, `Milo#questWhatLurksProgress` |
| Forest Bears | Deepwood. One old bear "missing an ear" is Finn's to leave alone, for reasons he won't give. | `Finn#questBigGame` |
| Spiders | Forest Spiders nest in the Elderwood Wilds' later Waves and have invaded Mawood's lower platforms. | `Sylvie#questInfestation`, `Sylvie#questInfestationProgress` |
| Corrupted Saplings | Blighted young trees; black bark, smell of burnt wood, resin in the heartwood. | `Corwin#questSignsOfRot`, `Corwin#questSignsOfRotProgress` |
| Arena champions | Lirold Arena only (Waves 5, 10, 15, 20). **The Brute** (human): old wounds open mid-fight. **The Arcanist** (human): her ward drinks from the challenger's sandglass when a spell hits her. **The Burrower** (mammal): trappers pulled it from a turnip field south of the walls; the shaking mound hides it. These combat descriptions and the Burrower's origin are shipped. Patched-iron costume remains a concept **(proposed, `docs/ideas/lirold-arena-master.md` §2)**. | `src/assets/locales/en/dialogues/liroldArenaMaster.json` `aboutBrute`, `aboutArcanist`, `aboutBurrower`; names/types: `enemies.json`, `enemies-data.ts` |
| Yad | "Yad, the Arena Champion" (humanoid), Wave 20. A hulking crimson beast on huge fists with dark spikes (`docs/ideas/combat-arena.md` art). Fire, air or water guard, shifting "like the weather"; trappers delivered it in a crate last spring without naming its origin, with "Yad" chalked on the lid; the air turns stormy when its guard rises. These lines are shipped; origin stays open (T-28). Its unbeaten-before-the-player history remains **(proposed, `docs/ideas/lirold-arena-master.md`)**. | `src/assets/locales/en/dialogues/liroldArenaMaster.json` `aboutYad`, `yadOrigin`; `enemies.json` `arenaYad`, `app.json` `arena.result.cleared` |

## Design-only (not shipped)
`docs/design/mawood-and-elderwood-zones.md`: Bog Skeletons are "ancient warriors, partially absorbed by roots"; Canopy Bandits are outlaws who fled up and pay the Matriarch tribute; the Warchief wears "crude Mountain Pass armour".
