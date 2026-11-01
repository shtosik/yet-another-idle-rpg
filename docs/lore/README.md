# Lore

Canon for the game's world, kept by the `lore-keeper` agent. Shipped in-game text wins over these docs; every fact names its source, and facts from unbuilt proposals are marked as proposed.

Files (the agent creates each one from shipped text the first time it is needed):

- [world.md](world.md) — Regions, Towns, geography, the known and unknown parts of the map; proposed Lirold Forge.
- [history.md](history.md) — timeline of past events, with dates relative to the present; proposed Cold Forge recovery.
- [factions.md](factions.md) — peoples, organisations and creature groups (Exploration Guild, Messatan, gnolls, crab gang); proposed first dwarf and Pathfinder's Seal tradition.
- [dwarves.md](dwarves.md) — **(proposed)** foundations: Keldrath, underground Bramhold, everyday customs and Toric's move to Lirold; wider history and mystery links left open.
- [threads.md](threads.md) — open mysteries and setups not yet answered, with where each was planted; boundaries protecting Slatefall and Marvin's expedition.

NPC characters live in `docs/character/`, zone and town designs in `docs/design/`, quest proposals in `docs/ideas/`.

Proposed facts citing `la-harpar-quests.md` (the Tidecaller questline) come from a proposed draft; treat them as unconfirmed until it ships.

Toric is an owner-approved dwarf Blacksmith who loves apple pie (2026-11-01 brief); his Forge, *The Cold Forge*, taste for coastal cooking and Pathfinder's Seal lore are **proposed**, sourced to [gear upgrading](../ideas/gear-upgrading.md) and [its lore companion](../ideas/gear-upgrading-cold-forge.md). Step 4 uses shipped Fish & Apple Pie by owner decision; the dish already appears in *Last Orders* (`src/assets/locales/en/items.json` `names.fishApplePie`; `dialogues/laHarparBartender.json` `questLastOrders`). These proposals do not make Slatefall, Varrow or the Lirold Exploration Guild hall shipped canon. Ludo Crane's Arena dialogue is shipped; Marvin remains at La Harpar's Exploration Guild in shipped data.

The same owner's follow-up fixes Toric's Forge Tongs as `ItemType.quest`, exactly 1 required, with a Goblin Scavenger drop of **1 in 50** only during active `theColdForge`: `drop(ItemID.toricsForgeTongs, 1, 1, 50)` (last argument: "1 in N"). [Dwarven foundations](dwarves.md) are all **(proposed)**, including names, geography and Toric's departure; any link to T-25, T-26 or T-27 is undecided.
