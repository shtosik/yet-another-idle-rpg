# Gathering skills (professions)

**Scope:** M (MVP) / L (all professions) · **Status:** Proposed

Non-combat skills — fishing, foraging, woodcutting, mining, later farming and trapping — that the player runs **in zones that already exist**. They give every crafting input a source other than enemy drops or a shop, give Alchemy and late Cooking real content, and give the planned gear upgrading, town reputation, achievements and item sets the materials they need.

> **Naming.** `GLOSSARY.md` lists "skill" under *Avoid* for skill tree nodes, and players already have skill points. This doc calls these **professions** to stay clear of that. Proposed glossary entries are at the end.

## Where crafting inputs come from today

| Resource | Enemy sources | Shop | Used by |
|---|---|---|---|
| fishMeat | **none** | La Harpar shop, 10 g | Grilled Fish, Fish & Apple Pie, Hunter's Feast |
| apple | Corrupted Sapling (1/5) | La Harpar shop, 25 g | Baked Apple, Minor Mana Potion, Cheese Platter, Fish & Apple Pie |
| vialOfWater | Bandit, Mountain Bat, Forest Spider, Canopy Bandit | Sylvie, 15 g | Minor Mana Potion, Crab Stew |
| cheese | Rat, Giant Rat only | — | Baked Apple, Cheese Platter, Fish & Apple Pie, Hunter's Feast |
| crabMeat | Crab, Gangster Crab only | — | Crab Stew, Hunter's Feast, quest Meat Shortage |
| stick | beach enemies, Goblin Scavenger, Gnoll Scout, Corrupted Sapling | — | Fire Pit, Makeshift Club |
| stone | Seagull, Goblin Scavenger only | — | Fire Pit, Earth Rune |
| turtleShell | Turtle only | — | Turtle set (5 recipes), Camp unlock |
| slimeResidue / feather / wolfFangs | slimes / Seagull / wolves and gnolls | — | Water / Air / Fire Rune |
| ancientWood, bearPelt | Deepwood enemies only | — | quest Raw Materials (20 + 5); proposed gear recipes |
| deerPelt, spiderSilk, elderSilk, boneFragment, … | one zone each | — | nothing yet (`crafting-recipes.md` proposes uses) |

Gaps that professions fill:
- **Fish meat has no enemy source**; it can only be bought.
- **Alchemy has one recipe** (Minor Mana Potion) and its only reagents are apple and vial of water.
- **Mountain Pass can't host its own crafting tier**: its enemies drop only vial, deer pelt, stick and stone (`crafting-recipes.md`).
- **`captainsLetter` has no source** (A Tale of a Captain is unfinished on purpose, `docs/systems/quests.md`). A message in a bottle fished up at Horseshoe Beach is a natural source. Coordinate with the planned `la-harpar-quests.md`.

## 1. Candidate professions

Each profession has **gathering spots**: one per zone where it fits, on that zone's background. A spot has a level requirement, an action time, XP per action and a loot table (same shape as enemy drops: `id, min, max, chance` = 1 in N).

### Fishing — MVP
- **Fantasy:** La Harpar is a fishing village ("we mainly provide various fish and seafood", Josh). Cast a line off the beach, then into rivers and bogs further inland.
- **Spots:** Horseshoe Beach (shore, lvl 1), The Long Path (river, lvl 10), Mountain Pass (glacial stream, lvl 20), Deepwood (bog pools, lvl 30).
- **Outputs:** fishMeat (beach), crabMeat (beach, uncommon), **River Trout** (Long Path), **Mountain Char** (Mountain Pass), **Bog Eel** (Deepwood). Rare catches: **Message in a Bottle** (beach, only while A Tale of a Captain is active, via the existing `requiredActiveQuestId` drop field), **Pearl** (beach, sells high to the Trader, gem for rune socketing later), a sunken recipe scroll.
- **Feeds:** Cooking (Grilled Fish, Fish & Apple Pie, Hunter's Feast today; new trout, char and eel dishes), the proposed Fisher's Charm (`crafting-recipes.md`), the Trader's ×1.5 sea-catch sell preference.
- **New items:** River Trout, Mountain Char, Bog Eel, Pearl, Message in a Bottle (or reuse `captainsLetter` directly), 3–4 rods (tool gear), 2–3 fish dishes and their recipe scrolls.

### Foraging (herbalism)
- **Fantasy:** Sylvie the herbalist runs an apothecary on reagents from the forest floor.
- **Spots:** Plains (meadow, lvl 1), The Long Path (hedgerows, lvl 10), Elderwood Wilds (mossy roots, lvl 25), Deepwood (glowing fungi, lvl 35), Upper Canopy (canopy blossoms, lvl 45).
- **Outputs:** apple, stick, **Silverleaf**, **Wild Berries**, **Glowcap**, **Mana Moss**, **Canopy Blossom**. Rare: seeds (for farming), quest drops such as `corruptedResin` while Signs of Rot is active.
- **Feeds:** Alchemy (new potions: mana potion from Mana Moss instead of apple, a Swiftleaf Tonic for attack speed, a Gatherer's Brew for gathering speed); Cooking (berry tart, mushroom stew).
- **New items:** 5–6 herbs, 3–4 potions, sickles (tool gear), Alchemy level 3 station gear (Alchemy `maxLevel` is 2 today).

### Woodcutting
- **Fantasy:** Brenna the Carver works Silverwood bark into armor; she needs a steady supply of wood.
- **Spots:** Horseshoe Beach (driftwood, lvl 1), The Long Path (oak, lvl 10), Elderwood Wilds (Silverwood, lvl 25), Deepwood (ancient wood, lvl 35).
- **Outputs:** stick, **Oak Log**, **Silverwood Bark**, ancientWood (second source; Raw Materials needs 20), rare **Heartwood Knot**.
- **Feeds:** Workbench (bows, staffs, tools — rods and pickaxe handles), the proposed Ancientwood Staff and Elderwood Boots, Brenna's armor, town building upgrades.
- **New items:** Oak Log, Silverwood Bark, Heartwood Knot, axes (tool gear).

### Mining
- **Fantasy:** goblin scavengers pick at the Mountain Pass rock faces; the player can do it better.
- **Spots:** Horseshoe Beach (tide rocks, lvl 1: stone), Trader's Basement (cracked walls, lvl 5: stone, coal), Mountain Pass (ore veins, lvl 15), Elderwood Wilds (root-split boulders, lvl 30).
- **Outputs:** stone, **Coal**, **Copper Ore**, **Iron Ore**, rare **Rough Gem** (rune socketing, item sets).
- **Feeds:** Earth Rune (stone), Workbench tools and weapons (Stone Club), **gear upgrading** (ore per tier is the obvious upgrade material), town building upgrades. A smelting step (ore + coal → ingot) would need a Forge station; skip it in v1 and use ore directly.
- **New items:** Coal, Copper Ore, Iron Ore, Rough Gem, pickaxes (tool gear).

### Farming (Camp, later)
- **Fantasy:** a vegetable patch next to the Camp fire.
- **Where:** Camp, as a new tab with 2–4 plots. Not tied to a zone.
- **Loop:** plant a seed, wait real time (10 min – 4 h), harvest. Runs alongside everything else, offline included: growth is a timestamp, not a tick.
- **Outputs:** apple (orchard sapling), **Wheat**, **Potato**, herbs grown from foraged seeds; cheese stays a rat drop on purpose (Trader's Basement keeps a reason to exist).
- **Feeds:** Cooking (bread, pies), Alchemy (cultivated herbs).

### Trapping (Camp, later)
- **Fantasy:** Finn Ashwood, hunter and trapper, teaches snares.
- **Where:** set a trap on a zone the player has cleared; it fills over real time with that zone's hide and meat drops (deerPelt, bearPelt, crabMeat).
- **Feeds:** the proposed hide gear (Wolfhide Gloves, Bearhide Legs), Hunter's Kit set.
- **Note:** overlaps with combat drops by design; it's the "farm a dead zone while fighting elsewhere" tool. Keep yields well below combat.

## 2. Core loop

### Options

| | A. Parallel with combat | B. Activity replaces combat | C. Camp idle slots |
|---|---|---|---|
| How | Gathering runs every tick next to the fight, in the current zone. | Per zone the player picks **Fight** or a profession; gathering replaces the fight while active. | Send the hero's "helpers" on timed jobs from the Camp; each slot finishes after N minutes. |
| Choice | None: free materials on top of combat. | Real trade-off: materials and profession XP vs combat XP and gold. | Small: fill slots, come back. |
| Idle feel | Passive, but no decisions, UI clutter in the battle view. | Classic idle: one activity, switch when you need something. Zone choice matters twice. | Very idle, but disconnected from zones and from the hero. |
| 10 Hz tick | Cheap (one timer). | Cheap: one timer instead of the attack timer, a store patch only per action (every 3–6 s), fewer patches than combat. | Free: only per-second timestamp checks. |
| Offline | Must merge with the kill simulation (two loot streams per segment). | Simple: the offline claim simulates whichever activity was on. Closed form, cheaper than the kill simulation. | Trivial: compare timestamps. |
| Balance risk | High: every material becomes free; drops lose meaning. | Low: gathering costs combat time. | Medium: slot count and timers need tuning. |

### Recommendation: B for zone professions, C for farming and trapping

- **Fishing, foraging, woodcutting and mining are zone activities (B).** The battle view gets an activity switch (`Fight · Fish · Forage …`, only professions that are unlocked and have a spot in this zone). Switching clears the current enemy, exactly like changing wave. The spot replaces the enemy area: spot art, a progress bar per action, catch popups.
- **Farming and trapping are Camp timers (C)**, added later. They are the "always on" side, and cost nothing per tick.
- Why B: the game's only active decision today is where to fight. B keeps that decision and adds a second axis to it, with a real cost (no XP, gold or wave progress while gathering), so enemy drops keep their value. It fits the offline claim cleanly, and its tick cost is smaller than combat's.
- Not chosen: A makes gathering a free bonus that devalues every drop table, and complicates the offline simulation. Pure C loses the zone fantasy.

### Tick and offline behavior
- `GameIntervalService.tick`: `activity === 'fight' ? advanceCombat(delta) : advanceGathering(delta)`. `advanceGathering` mirrors the attack timer: `gatherTimer += delta`, one action per `actionMs` (overshoot carries, capped per tick like `MAX_ATTACKS_PER_TICK`). Only a completed action touches stores. Mana regen, spell timers and consumable timers keep running.
- **Offline claim:** if the saved activity is a profession, the claim simulates actions on that spot instead of kills: `actions = floor(segmentMs × offlineProgressRate ÷ actionMs)`, loot rolled per action with the seeded RNG (24 h at 4 s = 21 600 actions × a short loot table: cheap), XP applied with level-ups. Same 24 h cap, same segments for consumable effects (a Gatherer's Brew matters). No rolling-window slowdown is needed: gathering speed doesn't depend on damage, so the theoretical rate is the real one.
- The welcome-back modal shows "While you were away you fished 4 h 12 m: +312 Fish Meat, +40 Fishing XP …" instead of kills.

### Leveling
- Each profession levels 1–50 (MVP: cap 30). Per-level XP `20 × L²`: level 10 ≈ 5 700 XP total, level 25 ≈ 98 000, level 50 ≈ 808 000. At ~10 XP per action and 4 s per action at the first spot, level 10 is ~40 min of gathering; higher spots pay more XP per action, so level 25 is roughly 5–8 h and 50 a long tail. Tune with `npm run sim`.
- **Level gives:** access to spots (`requiredLevel`), −1% action time per level (cap −30%), and perk milestones at 10 / 25 / 40 (double-gather chance, rare-find chance, a second loot roll). Profession levels are separate from player level and give no skill points (open question).
- **Economy guard rails** (for the sim): an hour of gathering yields roughly the materials of 1.5–2 h of combat drops of the same tier, but sells for at most ~50% of the gold an hour of combat there earns. Gathering must not be the best gold farm.

### Tools as gear
| Option | Notes |
|---|---|
| **Tool gear** (like station gear) — recommended | `ItemType.toolUpgrade` with `professionId` and `tier`. Never enters the inventory; installs when the previous tier is installed (same rule as station gear in `PlayerStore.addItems`). Each tier lowers action time and unlocks better spots (`requiredToolTier`). No inventory clutter, no swapping. |
| Separate tool slot per profession | Tools with stats and rarity. More loot excitement, more UI, more inventory. A later upgrade if wanted. |
| Tool in the weapon slot | Swapping weapons to fish is friction an idle game shouldn't have. Rejected. |

Tool tiers per profession: tier 1 from the teacher (unlock), tier 2 bought (gold sink), tier 3–4 crafted at the Workbench from other professions' output (woodcutting logs + mining ore for a rod or pickaxe). This ties the professions together.

### Gathering stats (ADR 0002)
New derived `PlayerStat`s, so gear, food, potions, nodes and tools can all raise them through `PlayerStore.stats`:
- `gatherSpeed` (multiplier on action time, like `attackSpeed` but positive = faster),
- `gatherDoubleChance` (percent),
- `rareFindChance` (percent, multiplies the rare entries' chance).
Global, not per profession, to keep the stat list small; tools and levels apply per profession inside the gathering rules.

## 3. Tie-ins

- **Cooking:** fish dishes fill the empty Cooking levels: Grilled Trout (Cooking 1), Char Chowder (Cooking 2), Smoked Eel (Cooking 3, long duration for offline). `consumables-buff-slots.md`'s "better versions" (Seasoned Grilled Fish) use the new ingredients.
- **Alchemy:** herbs give Alchemy its content and a reason for a level-3 station gear. A **Gatherer's Brew** (`gatherSpeed`) is the first potion that helps a profession.
- **Workbench:** tools (rods, axes, pickaxes, sickles), bows and staffs from logs, the Stone Club from stone (`crafting-recipes.md`).
- **Quests:** new requirement types `professionLevel` and plain `item` steps already work for gathered items. Hooks:
  - Josh (La Harpar, fisherman): "Catch of the Day" unlocks Fishing.
  - Elara: Message in a Bottle from the beach as the clue for A Tale of a Captain.
  - Bartender: a fish-pie order, follow-up to Meat Shortage.
  - Sylvie: Silk and Water follow-up asking for herbs; unlocks Foraging.
  - Brenna: Raw Materials can now be met with chopped ancient wood; a follow-up asks for Silverwood Bark.
  - Finn: trapping questline.
- **Exploration Guild:** a new task kind "gather N of X" (target from unlocked spots, tier = spot's zone tier). Gives professions explorer tokens.
- **Town reputation (`town-reputation.md`):** resource turn-ins are already planned as a rep source (Sylvie takes herbs, Brenna takes hides). Professions make those turn-ins repeatable without combat: La Harpar rep from fish, Mawood rep from herbs and wood. Rep tiers can unlock tool tiers in shops.
- **Town building upgrades (`town-building-upgrades.md`):** wood, stone and ore are the natural building materials.
- **Gear upgrading (`gear-upgrading.md`):** ore and gems per tier as upgrade materials beside each zone's own drop. Mining becomes the long-term sink.
- **Achievements (planned `achievements.md`):** profession level milestones, "catch every fish", first rare catch, total actions.
- **Item sets (`item-sets.md`):** an **Angler's set** (hat, vest, boots) and a **Woodsman's set** with gathering stats; 2pc `gatherSpeed`, 3pc `rareFindChance`. Crafted from the profession's own output.
- **Catch log:** a bestiary-style page per profession (items found per spot, count). Reuses the bestiary pattern; feeds achievements.
- **Skill tree:** an exploration branch node or two later (`gatherDoubleChance`, auto-switch back to Fight on full inventory).
- **Pets:** a rare pet per profession (Hermit Crab from fishing, a Mushroom Sprite from foraging). Not "shiny": shinies are enemy variants.

## 4. Unlock path

| Profession | Teacher | Gate | Unlock |
|---|---|---|---|
| Fishing | **Josh** (La Harpar tavern, "a local fisherman") | after his beer flag and Clearing Out the Beach | quest "Catch of the Day" start gives the Driftwood Rod (tool tier 1), which unlocks Fishing. The Bartender's "anyone who could train me?" line can point to him too. |
| Foraging | **Sylvie** (Mawood apothecary) | after Silk and Water | she gives a Herb Knife (tier 1). |
| Woodcutting | **Brenna** (Mawood Hunter's Lodge) | after Raw Materials | she gives a Hatchet. |
| Mining | no NPC fits yet | — | an item unlock: a **Battered Pickaxe** dropped by the Goblin Scavenger (Mountain Pass), using the existing `hasItem` unlock rule. Or a miner NPC in North Lirold, which has no buildings yet (owner call). |
| Farming | **Elder Corwin** (druid, forest restoration) | after The Blighted Heart | seeds and a Camp plot. |
| Trapping | **Finn** | after Big Game | Snare kit. |

Order matters: Fishing (La Harpar) is the only early profession; foraging and woodcutting arrive with Mawood. That leaves foraging spots in Plains and Long Path below the player's current tier when unlocked: fine, they're the low-level spots, and the player walks back for them.

Implementation: a new unlock target `{ type: 'profession', professionId }` in `UNLOCK_RULES` for item unlocks, and a dialogue effect `unlockProfession` for teachers (`/add-dialogue-effect`).

## 5. MVP slice: Fishing end-to-end

1. **Unlock:** Josh's "Catch of the Day" quest: start gives the Driftwood Rod and unlocks Fishing; step: hand in 10 Fish Meat and 1 River Trout; reward XP, gold, the Sturdy Rod recipe or a discount.
2. **Spots:** Horseshoe Beach (lvl 1) and The Long Path (lvl 10). Two is enough to prove spot gating and tiers.
3. **Items:** River Trout, Pearl, Message in a Bottle (if the owner wants it now; otherwise later), Driftwood Rod (t1), Sturdy Rod (t2, Trader, gold), one dish (Grilled Trout, Cooking 1).
4. **Systems:** profession XP and levels (cap 30), tool gear install, activity switch in the battle view, `advanceGathering` in the tick, offline gathering claim and modal text, `gatherSpeed` stat (no other new stats yet).
5. **UI:** activity switch, spot panel with progress bar and catch popups, Fishing level and XP bar (player stats panel or a small professions panel), item tooltips naming the spot.
6. **Docs and tooling:** new `docs/systems/gathering.md`, GLOSSARY entries, validator checks, a gathering line in `npm run sim`.

Done when a fresh save can unlock Fishing from Josh, fish on the beach online and offline, level to 10, reach the Long Path spot, buy the Sturdy Rod and cook Grilled Trout.

### Later expansions (suggested order)
1. Fishing spots 3–4 (Mountain Pass, Deepwood), dishes for Cooking 2–3, catch log.
2. Foraging + Alchemy content (largest content gap), `rareFindChance`, Gatherer's Brew.
3. Woodcutting + Workbench tool recipes (tier 3 tools from logs).
4. Mining + gear upgrading materials (pairs with `gear-upgrading.md`).
5. Guild gather tasks, reputation turn-ins, item sets, achievements.
6. Farming plots, then trapping, as Camp timers.

## 6. Data shapes, touch-points, open questions

### Data shapes (sketch)
```ts
// src/enums/ids/profession-id.enum.ts
export enum ProfessionID { fishing = 0, foraging = 1, woodcutting = 2, mining = 3 }

// src/enums/ids/gathering-spot-id.enum.ts
export enum GatheringSpotID { beachShore = 0, longPathRiver = 1 /* … */ }

// src/data/gathering-spots-data.ts
export interface GatheringSpot {
  id: GatheringSpotID
  professionId: ProfessionID
  zoneId: ZoneID
  requiredLevel: number
  requiredToolTier: number
  actionMs: number          // base time per action at tool tier 1, level 1
  experience: number        // profession XP per action
  loot: EnemyDrop[]         // reuse the drop shape, incl. requiredActiveQuestId
  url: string               // spot art over the zone background
}
// reverse lookup like ZONES_BY_ENEMY: src/data/helpers/spots-by-zone.ts

// src/data/professions-data.ts
export interface Profession {
  id: ProfessionID
  maxLevel: number
  perks: { level: number; perk: 'doubleGather' | 'rareFind' | 'extraRoll'; amount: number }[]
}

// Item: tool gear, mirrors station gear
export interface ToolUpgradeItem extends ItemData {
  type: ItemType.toolUpgrade
  professionId: ProfessionID
  tier: number
  speedBonus: number        // action time reduction at this tier
}

// PlayerStore state (progression; rewards already flow through addItems)
professions: Partial<Record<ProfessionID, { experience: number }>>  // level derived
tools: Partial<Record<ProfessionID, number>>                         // installed tier; missing = locked

// BattleStore state (what happens in the current zone; saved with the zone)
activity: { type: 'fight' } | { type: 'gather'; spotId: GatheringSpotID }

// Quests / unlocks
type ProfessionLevelRequirement = { type: 'professionLevel'; professionId: ProfessionID; level: number }
type ProfessionUnlockTarget = { type: 'profession'; professionId: ProfessionID }
```
Pure rules in `src/app/store/player/professions.ts` (level from XP, action time from level + tool + `gatherSpeed`, roll one action), with a spec like `camp.spec.ts`.

### Touch-points
- New: `profession-id.enum.ts`, `gathering-spot-id.enum.ts`, `gathering-spots-data.ts`, `professions-data.ts`, `helpers/spots-by-zone.ts`, `items/tool-items.data.ts` (merged in `items-data.ts`), `store/player/professions.ts` (+ spec), `services/offline-gathering.ts` (pure, beside `offline-simulation.ts`), battle-view spot component.
- `src/enums/items/item-type.enum.ts`, `src/interfaces/item.interface.ts` — `toolUpgrade`.
- `src/data/items/resources-items.data.ts`, `consumables-items.data.ts`, `recipes-data.ts` — new fish, herbs, dishes, recipes.
- `src/types/player/player-stat.type.ts`, `store/player/stats.ts` — gathering stats.
- `store/player/player.store.ts` — `professions`, `tools`, tool install in `addItems`, `applyGatherBatch` (like `applyKillBatch`).
- `store/battle/battle.store.ts` — `activity`, clear enemy on switch.
- `services/game-interval.service.ts` — `advanceGathering`.
- `services/offline-progress.service.ts`, `components/modals/welcome-back/` — gathering claims.
- `data/unlock-conditions.ts`, `store/player/player.store.ts` (`applyUnlockTarget`) — profession target.
- `data/quests-data.ts`, `store/quests/` — `professionLevel` requirement.
- Dialogue: `unlockProfession` effect and `professionLevel` condition (`/add-dialogue-effect`), `dialogues/laHarparTown/laHarparJosh.ts` + locales.
- `data/shops-data.ts` — Sturdy Rod at the Trader.
- `app.config.ts` — register a `professions` i18n namespace; `src/assets/locales/en/`.
- `scripts/validate-data.mjs` (spot loot items exist, one spot per profession per zone, tool tiers contiguous), `scripts/sim-economy.mjs` (gathering rates vs combat).
- Docs: new `docs/systems/gathering.md`, `GLOSSARY.md`, `docs/systems/offline-progress.md`, `game-loop-and-combat.md`, `consumables-camp-crafting.md`, `docs/ideas/README.md` status.

### Proposed glossary entries
- **Profession**: a non-combat skill with its own level (fishing, foraging, …). _Avoid_: skill, trade, job.
- **Gathering spot**: one profession's place in a zone, with a level requirement and loot table. _Avoid_: node (taken by the skill tree), resource node.
- **Activity**: what the player does in the current zone: fight or one profession. _Avoid_: mode, action.
- **Tool gear**: an item that installs or raises a profession's tool tier instead of entering the inventory. _Avoid_: tool item.

### Open questions for the owner
1. **Model:** OK with B (gathering replaces combat in the zone), or should gathering run in parallel at a reduced rate?
2. **Name:** "profession" in code and UI, or "skill" (clashes with the skill tree vocabulary)?
3. **Player XP:** do profession actions give any player XP (small trickle), or none, so combat stays the only way to level?
4. **Full inventory:** enemy drops are lost on a full inventory by design. For gathering, should the activity stop (and switch back to Fight) when nothing more fits, instead of wasting actions?
5. **Captain's letter:** may fishing be the source of `captainsLetter` (Message in a Bottle), or is that reserved for the La Harpar quest plan?
6. **Mining teacher:** item unlock (Battered Pickaxe from Goblin Scavengers) or a new miner NPC, possibly the first building in North Lirold?
7. **Tools:** station-like tool gear (no stats, no inventory), or real equipment in a separate tool slot?
8. **Prestige (`prestige.md`):** do profession levels and tools survive a rebirth?
9. **Level cap and perks:** 50 levels with perks at 10/25/40, or a shorter cap until more spots exist?
