# World

Regions, Towns, Zones and geography. Source shorthand: `Josh#key` = `src/assets/locales/en/dialogues/laHarparJosh.json` key (same for every NPC file); other `.json` files are in `src/assets/locales/en/`. Data-only facts (not shown as text) cite `src/data/`.

## Regions

| Region | Known facts | Source |
|---|---|---|
| Elderreach | One of the 4 known Regions (`Josh#regionsInfo` names it). Holds Mawood and, by extension, the Elderwood (Silverwood Spires): owner decision, data only (no line says Mawood is in it). Renamed from Southback (owner decision, 2026-10-27, shipped). | `Josh#regionsInfo`, `map.json` `regions.elderreach`, `towns-data.ts` Mawood `regionId` |
| Port Stocksmar | La Harpar's Region. Capital: Lirold. La Harpar is its largest fish exporter. Slatefall is proposed as a third Town in it. | `Josh#regionsInfo`, `Josh#beachName`, `Trader#aboutVillage` |
| Greefic Hill | Beyond it stands an "uncrossable mountain" (see Unknown lands). | `Josh#unknownRegions` |
| Saint Nestroud | One of the 4 known Regions. Nothing else said. | `Josh#regionsInfo` |

- "4 known regions"; the word *known* implies unknown ones. `Josh#regionsInfo`, `Josh#unknownRegions`
- La Harpar and Lirold are in Port Stocksmar; Mawood is in Elderreach (owner decision, closes old thread T-07). `src/data/towns-data.ts` `regionId` (not shown as text)
- So the route crosses a Region border somewhere between Port Stocksmar's Plains and the Elderwood Wilds; nothing says where. The Mountain Pass is the natural border. Finn reached the Elderwood going "north out of the plains" (`Finn#aboutFinn`), so Elderreach lies north of the Plains.
- Renames (owner decision 2026-10-27, shipped): North Lirold → Lirold, Southback → Elderreach, so no place name points the wrong way.

## Towns

| Town | Facts | Source |
|---|---|---|
| La Harpar | Fishing village on Horseshoe Beach; "the most well-known fishing village in the area". Largest fish exporter in Port Stocksmar; fishermen famous across all four Regions; vital trade partner of Lirold "for a long time". Exports fish and seafood; overstocked on turtle shells. | `Josh#placeInfo`, `Elara#fatherIntro`, `Trader#aboutVillage`, `Trader#aboutFishermen`, `Josh#tradeInfo` |
| | Unlock text: "A fishing village lies nearby." (Owner decision: La Harpar is a fishing village, not a port town.) | `unlocks.json` `towns.laHarpar.body` |
| Lirold | Capital of the Region (Port Stocksmar); named North Lirold until the 2026-10-27 rename (shipped). Has one Building so far, the Arena (below); it has no map marker yet (the old one at (730, 110) is commented out and in the wrong place, see below), so it is reached from the map's Towns list. | `Josh#beachName`, `map.json` `towns.lirold`, `towns-data.ts`, `world-map-data.ts` |
| | Lies **south of Horseshoe Beach**: a large city inside stone walls with a castle at its centre. A road runs from it to the Mountain Pass, with a mine near the Pass. Owner decision (2026-10-27); no shipped text yet. It stands inland, not on the water, with a mountain range rising behind it (owner decision, town art). | owner decision, `docs/ideas/north-lirold-and-exploration-guild.md` |
| | Unlocks after the Elderwood chain (Harpy Matriarch kill): seen from her nest, reached by going back over the Pass and down the coast road. North gate on the coast road, east gate on the castle's mine road (closed except with a Guild writ). Slate roofs from Slatefall. Home of the Exploration Guild's only hall, run by Guildmaster Odile Varrow (Marvin stays in La Harpar). **(proposed, `docs/ideas/north-lirold-and-exploration-guild.md`)** | — |
| | Its first Building is the Arena (`map.json` `buildings.liroldArena`), the Combat Arena's home; built on the arena branch, not yet released. Unlock popup rewritten to the Matriarch's-nest reveal **(proposed, `docs/ideas/lirold-arena-master.md` §3)**. | `towns-data.ts`, `unlock-conditions.ts` |
| Slatefall | Miners' village on the castle's mine road between the capital and the Mountain Pass, on the Pass's southern slope. Quarries the capital's slate; the castle's mine, shut two winters ago; the road is barred at the Pass end. Tavern *The Last Lamp*; Hedda Brask, Old Tobin, Pell. Unlocks when *The Guild Trial* completes, after the capital. Port Stocksmar. **(proposed, `docs/ideas/slatefall-and-the-deeper-mines.md`)** | — |
| Mawood | Elderreach (owner decision). Vertical Town on platforms between the Silverwood Spires, ~300 years old. Built "up, in the light" because the forest floor "belongs to roots and rot". Few travelers; merchants pass through to Sylvie's. | `Corwin#aboutMawood`, `unlocks.json` `towns.mawood.body`, `Milo#intro1` |

### La Harpar Buildings

| Building (`map.json` `buildings.*`) | Who | Notes |
|---|---|---|
| Tavern (`tavern`) | Bartender, Josh | "A tavern. Duh." `Josh#placeInfo`, `Bartender#whatIsThisPlace1` |
| Market (`market`) | Trader, Elara | `towns-data.ts` |
| Shop (`shop`) | Trader | "The only shop in town". `Trader#intro1` |
| Basement (`tradersBasement`) | — | Trader's cellar, rat-infested; Zone Trader's Basement. `Trader#questOffer`, `Trader#questCompleted` |
| Exploration Guild (`explorationGuild`) | Marvin | "Main hub for local adventurers". `Trader#aboutGuild`. Removed; the Guild's only hall is in Lirold, and Marvin (a member, not its head) moves into the Tavern, handling contracts and a few Guild supplies until the player meets Varrow. **(proposed, `docs/ideas/north-lirold-and-exploration-guild.md` §5)** |

### Lirold Buildings

| Building | Who | Notes |
|---|---|---|
| Arena (`liroldArena`) | Ludo Crane, Master of the Arena (`NpcID.liroldArenaMaster`) | Sand floor ringed by stone stands; the castle holds its charter, Ludo keeps the sand. Twenty Waves against one sandglass (ten minutes) for a 10,000 gold fee; a new challenger is let in 30 minutes after their last entry. Regular Waves are Elderwood beasts bought from trappers (`arena-data.ts`); champions on Waves 5, 10, 15 and 20 (factions.md, Arena champions). Charter, trappers, Ludo: **(proposed, `docs/ideas/lirold-arena-master.md`)** |
| Exploration Guild (`explorationGuild`, moved) | Guildmaster Odile Varrow | **(proposed, `docs/ideas/north-lirold-and-exploration-guild.md` §4)** |

### Mawood Buildings

| Building | Who | Notes |
|---|---|---|
| Elder's Tree (`main`) | Elder Corwin | `map.json` |
| Apothecary (`mawoodApothecary`) | Sylvie | Carved into "Spire four, if you count from the east side". `Sylvie#intro1` |
| Hunter's Lodge (`mawoodHunterLodge`) | Finn Ashwood, Brenna the Carver | `towns-data.ts` |
| Magic Shop (`mawoodMagicShop`) | Elarion | Glowing runes on the door; wards. `Elarion#intro1`, `Elarion#default` |
| High Platform (`mawoodHighPlatform`) | Milo | Top platforms, near the canopy. `Milo#intro1` |
| To the Deepwood (`deepwoodEntrance`) | — | Zone gate; opens with quest The Sap That Burns. `towns-data.ts` |
| Rope-Lift (`upperCanopyEntrance`) | — | Zone gate; opens with quest Feathers for a Kite. `towns-data.ts` |

- Platform three has a spring, now contaminated. `Sylvie#questSilkWater`
- Lower platforms overrun by spiders. `Sylvie#questInfestation`

## Zones (route order)

| Zone (`zones.json`) | Tier | Enemies | Boss | Lore | Source |
|---|---|---|---|---|---|
| Horseshoe Beach | 1 | Crab, Seagull, Turtle | Gangster Crab | Named for its shape. "Animal overpopulation"; crab infestation. | `Josh#beachName`, `Josh#workInfo`, `Trader#aboutLiving` |
| Trader's Basement | 1 | Rat | Giant Rat | The Trader's cellar. | `Trader#questOffer` |
| Plains | 2 | Green/Red/Blue Slime | King Slime | Open grassland beyond the beach. | `unlocks.json` `zones.plains.body` |
| The Long Path | 3 | Deer, Wolf, Goblin Scout | Bandit | — | `zones-data.ts` |
| Mountain Pass | 4 | Goat, Mountain Bat, Goblin Scavenger | Troll | Crossable; travelers rarely come "this time of year". | `Sylvie#intro1`, `Corwin#intro1` |
| Elderwood Wilds | 5 | Forest Spider, Gnoll Scout, Corrupted Sapling | Gnoll Warchief | Past the Pass "the trees close in and the sky disappears". Outer rim; worst blight; gnoll camps; spider nests in later Waves. | `unlocks.json` `zones.elderwoodWilds.body`, `Sylvie#aboutCorruptionSpreading`, `Sylvie#questInfestationProgress` |
| The Deepwood | 6 | Elder Spider, Forest Bear, Bog Skeleton, Treant Sprout | Gnarled Treant | Heart of the blight; home of the old one-eared bear; fungi "spectacular" before the corruption. | `Corwin#questBlightedHeart`, `Finn#questBigGame`, `Sylvie#aboutSylvieMawood` |
| The Upper Canopy | 7 | Harpy, Giant Eagle, Canopy Bandit | Harpy Matriarch | Harpy nests above Mawood; Matriarch's huge nest; a door in the tallest Spire. | `Milo#aboutCanopy*`, `Milo#questWhatLurksPostQuest` |
| Deeper Mines | 8 | Goblin Tunneler, Rockback Beetle, Goblin Sapper | Goblin Foreman | Slatefall mine's upper levels, taken by goblins from the Pass after the castle shut the mine. Entered from Slatefall. **(proposed, `docs/ideas/slatefall-and-the-deeper-mines.md`)** | — |
| Lower Shafts | 9 | Rubble Golem, Cave Salamander, Miner's Shade | Stone Warden | The collapsed dig where Oswin Brask's crew was lost; cut-stone stairs, older than the mine, lead down. **(proposed, `docs/ideas/slatefall-and-the-deeper-mines.md`)** | — |

## Geography

- Elderwood lies **north** of the Plains (Finn "followed game trails north out of the plains"). `Finn#aboutFinn`
- Route: Horseshoe Beach → Plains → The Long Path → Mountain Pass → Elderwood Wilds → Mawood. `zones-data.ts` `previousZoneId`/`nextZoneId`, `Corwin#intro1`
- Silverwood Spires: giant trees "older than any kingdom that ever stood in this region"; roots "deeper than you can dig"; may think "in slow pulses". Only place Silverwood grows. `Corwin#aboutForest`, `Brenna#aboutBrennOrigin`
- Silverwood bark calcifies with age: oldest is "harder than iron and lighter than leather", smells of rain. `Brenna#aboutBrenn`
- Magic in Mawood is "earthbound", carried up by deep roots; local stone absorbs ambient magic. `Elarion#aboutMagic`, `Elarion#aboutRunes`
- Spider silk is medicinal and resists the blight's spores. `Sylvie#aboutSylvieMawood`, `Sylvie#aboutCorruptionSpreading`
- Coastal settlements include La Harpar; "the south" has smiths. `Sylvie#aboutSylvie`, `Brenna#aboutBrennOrigin`
- Lirold lies south of Horseshoe Beach; a road links it to the Mountain Pass, with a mine near the Pass. Owner decision (2026-10-27).
- The castle's mine road links the capital to the Mountain Pass through Slatefall, but has been barred at the Pass end since the mine collapsed two winters ago (a Troll squats on it). So the player reaches the capital the long way: back over the Pass, down the zone route and along the coast road south from Horseshoe Beach. **(proposed, `docs/ideas/north-lirold-and-exploration-guild.md` §3)**
- The capital is first seen from the Harpy Matriarch's nest, the highest point in the game. **(proposed, same doc §2)**
### Map placement (proposed, not art)
`docs/ideas/north-lirold-and-exploration-guild.md` §3a: canvas extended at the bottom to ~2794×1100; Lirold ~(470, 930); coast road from the beach; mine road east then north to the Pass (1250, 550), barred at ~(1245, 610); Slatefall ~(1180, 840); mine mouth ~(1230, 780).

### Design-only setting (not in shipped text)
`docs/design/mawood-and-elderwood-zones.md`: Spires hundreds of metres high, pale silver-grey; forest floor in twilight lit by bioluminescent moss; lowest platforms ~20 m up. Use for art; not canon until shipped.

## Unknown lands

| Place | Facts | Source |
|---|---|---|
| The uncrossable mountain | Beyond Greefic Hill. "Some magical force and unpredictable weather". No one who tried came back, nor those who searched for them. Chants and howls heard from the surrounding forest. | `Josh#unknownRegions`, `Josh#dangerMountain`, `Josh#mountainRumors` |
| Drenhollow | A city with a court and "terrible politics"; Elarion was court mage there. Region unknown. | `Elarion#aboutElarion` |
| Messatan | Ancient civilisation ruled by Queen Primula; location unknown, possibly a fairytale. | `Elara#primulaInfo`, `Elara#fairytaleInfo` |
| Door in the tallest Spire | Up in the Upper Canopy; "old wood, old iron"; Milo can't open it. | `Milo#questWhatLurksPostQuest` |
