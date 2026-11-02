# Gear upgrading

**Scope:** M-L · **Status:** Proposed (revision 2, 2026-11-01)

Merge two copies of the same piece of gear into one copy a level higher, at a new Blacksmith in Lirold. Duplicate drops and shop gear get a lasting purpose. A quest opens the Forge.

**Owner decisions (2026-11-01):**
- Merging, not resources: two copies at +N make one at +N+1.
- Cap +5 at first. +6 to +10 come later, with better upgrades.
- Failure costs only the gold and the sacrificed copy; the base copy stays.
- Shop gear counts. Its limit is time: shops refresh one copy per hour.
- Unique gear (quest rewards, one-in-stock shop items, chest-only items) can't be upgraded for now.
- The Arena Chest's rare reward is permanent once handed in to the Exploration Guild. More sources may come later.
- Equipped gear takes part in merges (see Rules).
- Gold cost follows the item's value.
- The Blacksmith is Toric, a dwarf who loves apple pie; one quest Step brings him the shipped Fish & Apple Pie (`ItemID.fishApplePie`).
- Toric's Forge Tongs are a Quest item (`ItemType.quest`); exactly 1 is required. Goblin Scavengers drop them at **1 in 50**, only while `theColdForge` is active: `drop(ItemID.toricsForgeTongs, 1, 1, 50)` (the last argument means "1 in N").
- **No leftover Quest items** (all quest-only drops, not only this Quest): a quest-only drop rolls only while the player still needs it, that is while the active Step that asks for the item isn't met yet, and never for more than the missing amount. Today `kill-rewards.ts` checks only that the Quest is active (`requiredActiveQuestId`), so items keep dropping after the Step is met or delivered.
- Pathfinder's Seal: **1 in 10 Arena Chests**, until it is registered.

## Naming
**Upgrade level** (`upgradeLevel`, shown as `+N`). Not "tier": `ItemTier` is already the rarity (Trash to Legendary), and items stack per `id + tier`. Add *Upgrade level* to `GLOSSARY.md` with _Avoid_: tier, rank.

## Rules
- **Merge**: two copies with the same `id + tier + upgradeLevel` → one copy at `upgradeLevel + 1`, plus gold. Every new item starts at +0.
- **Gold cost** follows the item's `value`, so early gear is cheap to upgrade and late gear expensive: +N → +N+1 costs `value × 2^N × k` (`k` tunable, start at 1: the sell price of the copy being sacrificed). Merging one item from +0 to +5 costs `80 × value × k` in all.
- **Chance**: 100% up to +5. Later, past +5: +6 90%, +7 80%, +8 70%, +9 60%, +10 50%.
- **Failure** (only past +5): the gold and the sacrificed copy are lost; the base copy keeps its level.
- **Stats**: each level adds +10% (tunable) of the item's base stats, rounded. +5 is a milestone: it adds another +25% of base on top, and the item frame gets a mark. +10 gets the same later.
- **Stacks**: gear stacks per `id + tier + upgradeLevel`, so a stack of five +0 Makeshift Clubs merges straight from the inventory. No per-copy state.
- **Equipped gear**: an equipped copy can be the base or the sacrifice. As the base, the merged copy replaces it in the slot. As the sacrifice, it disappears and the slot empties.
- **Upgradable**: equipment that isn't `unique` (a new item flag on quest rewards, one-in-stock items and chest-only gear). Pets are not upgradable.
- **Selling**: sell price × `2^upgradeLevel` (it took that many +0 copies), so a merge never loses sell value.
- **Stats stay derived**: `stats()` reads `upgradeLevel` on equipped items.

### Cost in copies
A +N item takes `2^N` copies at +0: 32 for +5. For the later cap (failure loses only the sacrifice), one success at +N costs `1 + 1/p` copies of +N on average: about 68 copies of +0 for +6, 152 for +7, 369 for +8, 984 for +9, 2,952 for +10. Gold per attempt is the second brake.

## The Blacksmith
New Building **Forge** in Lirold, with **Toric**, a dwarf who loves apple pie. Character and portrait brief: [Toric](../character/lirold/toric.md). He is patient with damaged tools and impatient with people who throw useful things away; apple pie is the one subject that makes him put his hammer down.

Slatefall's closure cut off his regular iron deliveries two winters ago. He has kept the Forge open for cold repairs, but his hearth is out and his heavy tongs were stolen from a stranded delivery cart on the Mountain Pass. Recovering them and checking an old delivery record gives him a way forward: strengthen matching pieces of existing gear instead of waiting for new iron. This restores one workshop; it neither reopens the mine nor ends Lirold's wider supply problems.

Before *The Cold Forge* is completed, Toric offers conversation and its Quest hub. Afterward his returning-player hub includes **Upgrade gear**, opening the Forge panel: pick a stack (or an equipped item) and merge, with the chance, the gold cost and the stats before and after. The Forge Building is accessible as soon as Lirold opens; the upgrade service is gated by Quest completion. Ludo Crane remains at the Arena; no Lirold Exploration Guild hall is required.

## Quest: The Cold Forge
**Proposed Quest `theColdForge`, giver Toric, start gate: Lirold accessible, Quest not started.** Accepting Toric's offer starts Step 1; the introduction is not a separate Step.

1. **Talk to Ludo Crane at the Arena.** He last saw Toric's stranded delivery cart on the Mountain Pass; Goblin Scavengers took its tools.
2. **Bring 1 Toric's Forge Tongs to Toric.** New Quest item `ItemID.toricsForgeTongs` (`ItemType.quest`), dropped by Goblin Scavengers in the Mountain Pass at **1 in 50**, only while `theColdForge` is active: `drop(ItemID.toricsForgeTongs, 1, 1, 50)`. Exactly 1 is required; the last drop argument means "1 in N". The old delivery stamp on the tongs gives Toric a record for Marvin to check.
3. **Talk to Marvin in La Harpar.** At the shipped Exploration Guild Building, he checks a retained delivery record: the tongs belong to Toric, and the cart carried already-worked iron. He recommends salvage while the mine remains closed; he has not charted or visited Slatefall in this story.
4. **Bring 1 Fish & Apple Pie to Toric.** Existing item `ItemID.fishApplePie`; recipe `RecipeID.fishApplePie` at Cooking station level 2 uses 2 Fish Meat, 2 Apple and 1 Cheese to make 1. It requires learning the Fish & Apple Pie Recipe sold in La Harpar. Toric picked up a taste for the fish filling from coastal traders; he finally sits down for a meal and admits he has been waiting for the old trade to return rather than trying a different kind of work.
5. **Bring 10 Ancient Wood to Toric.** Existing drops from Treant Sprouts and the Gnarled Treant in the Deepwood. Toric makes charcoal and relights the hearth; completing this Step opens **Upgrade gear**.

Reward proposal: the upgrade service, **2000 XP and 400 gold**. This takes two-fifths of the XP/gold of the nearby *What Lurks at the Top* (5000 XP, 1000 gold), with no skill point or gear reward, because it revisits earlier Zones and gives a permanent service. Final balance belongs to the main thread. There is no weapon-pair requirement or free +1 item; the player's first merge uses the normal Forge panel.

Uses Slatefall's closure as proposed background from [Slatefall & the Deeper Mines](slatefall-and-the-deeper-mines.md), without requiring its Town, Zones or Quests. No Iron Ore, Oswin's badge, mine survey, Troll kill or Guild writ is involved. Marvin keeps his Step even if Varrow's proposal ships; his local delivery check reveals nothing about his expedition. Full canon table, Step requirements, clue beats, scripts and Owner calls: [The Cold Forge — lore and dialogue](gear-upgrading-cold-forge.md).

## Pathfinder's Seal
Keep **Pathfinder's Seal** (`pathfindersSeal`). A brass Exploration Guild token showing an open route through a ring, with a small inspection notch on its rim. It recognises an explorer who brings useful things home as well as finding a way out; the Arena keeps a few among its prizes for challengers who can return alive. This is a proposed connection between the Arena and the Exploration Guild, not a Guild rank or permission to enter Slatefall.

Arena Chest reward, **1 in 10 chests** ([Combat Arena](../systems/arena.md)). Register it once with **Marvin at the Exploration Guild in La Harpar**. He enters the player's name in the salvage register and teaches what to look for in recovered gear: the permanent benefit is learned judgement, not an enchantment spent on each drop. From then on, permanently, **10% (tunable) of gear drops arrive at +1**. Each such drop already embodies its first merge; the benefit does not halve the copies needed across all drops.

The chest rolls it only while the player neither holds an unregistered Seal nor has registered one, so no second Seal exists. Quest-type item so it can't be sold or destroyed. Registration is independent of *The Cold Forge* and needs neither its completion nor Varrow's proposed hall. Marvin's scripts and the proposed one-time registration effect are in [the companion](gear-upgrading-cold-forge.md). If the Exploration Guild relocation ships later, decide registration ownership then; this proposal remains implementable with today's Marvin.

## Later
- Cap +10 with the chances above, opened by a Forge upgrade or a second Blacksmith quest.
- **Lucky Strike** skill tree node: X% chance a successful merge gives +2 instead of +1.
- Gathering skills (`gathering-skills.md`) or Slatefall iron as an extra cost past +5.
- More sources of the Seal's effect, or a stronger second Seal.
- Item sets (`item-sets.md`): upgrading set pieces as the late-game path.
- Achievements: "upgrade an item to +5".

## Open
- `k` for the gold cost (check with `npm run sim`).
- Lore pass complete; Step 4 uses shipped Fish & Apple Pie and the tongs are a Quest item, exactly 1 required, with a Quest-active-only 1-in-50 drop by owner decision. The [dwarven foundations](../lore/dwarves.md) are proposed; their names, Keldrath and Bramhold, are owner-approved (2026-11-01). The everyday details, Toric's personal history and the XP/gold rewards still await approval. See the [companion's Owner calls](gear-upgrading-cold-forge.md#owner-calls). Forge art, the Forge-opening dialogue effect and the Seal's permanent registration effect remain implementation work.
- Seal name retained: **Pathfinder's Seal**.

## Touch-points
`inventory.ts` (stack key `id + tier + upgradeLevel`), `EquipmentItem` (`upgradeLevel`), destroy, drops (`processBattleEnd`, offline; quest-only drops capped at the missing amount in `kill-rewards.ts`, `docs/systems/quests.md`), shop sell price, `player.store.ts` `stats`, item tooltip and slot (`+N`), a new Forge panel, `towns-data.ts` (Forge Building), Blacksmith dialogue and quest, Marvin's Seal option, `arena-data.ts` (chest loot), save migration (missing `upgradeLevel` = 0), `docs/systems/player-stats-inventory-equipment.md`, `GLOSSARY.md`.
