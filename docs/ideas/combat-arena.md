# Combat Arena

**Scope:** M · **Status:** In progress. Shipped: batch 1 (weapon categories, Melee Damage Multiplier, Molten Cape), batch 2 (the run, Lirold's Arena, the Arena Master; `docs/systems/arena.md`), batch 3 (the champions' abilities; fee and cape rescaled for the later gate), batch 4 (the Arena Chest, `ItemType.chest`). Not built: the rare arena-only recipe scroll in the chest (needs a new recipe).

A timed gauntlet: clear 20 waves before the clock runs out. Fixed difficulty, so it doesn't scale with player power. An overpowered player is meant to stomp it. The main reward is the **Molten Cape** (attack power + melee damage).

The arena is **not a zone**: no stars, no wave navigation, no `zonesProgression`. You go in and fight. The run ends when the timer runs out, when you click Leave, or when Yad dies. Played actively, can't run offline.

## Core loop
- Entered from the **Arena building in Lirold**, the capital (owner decision). Lirold and the Arena unlock **after the Mawood Zones**, on the Harpy Matriarch's kill (owner decision, following `north-lirold-and-exploration-guild.md`). Lirold has no world-map marker yet; the map's town buttons reach it.
- **Entry fee**: 10,000 gold (owner decision, rescaled with the cape once the gate moved past the Mawood Zones; the cape is +20 Attack Power and sells for 5,000). Owner rule: blocked when the player can't afford it.
- **Run**: 20 waves of fixed enemies, `enemiesPerWave` low (3–5). Mini-bosses on waves 5, 10 and 15, Yad, the Arena Champion, on wave 20. Waves advance automatically.
- **Timer**: one clock for the whole run (e.g. 10 min).
- **Zone combat pauses** while in the arena. One active battle, reusing `BattleStore`. Leaving returns the player to their zone.
- **Fail state**: timer hits 0. Enemies still never hit back (`game-loop-and-combat.md`).
- **Leave or fail**: no cape, partial gold/XP for kills made. Entry fee not refunded.
- **Clear**: every clear gives a Molten Cape and an Arena Chest. The first clear also gives 2 Skill Point Books. A best-time record is kept. See Rewards below.
- Respawn delay: 0.5 s in the arena (2 s in Zones).
- **Away mid-run** (owner decision): the clock is wall time and keeps running; a run that expires while away fails on return with kill rewards kept. No offline Zone kills for that time.
- Batch 2 rewards: the Molten Cape (every clear) and 2 Skill Point Books (first clear) wait in `arenaRewards` until they fit; batch 4 adds the Arena Chest to every clear.

Sizing: a player at the gate tier with decent gear clears with ~20% to spare when they handle the boss mechanics well and fails when they ignore them. `npm run sim` can model the passive part.

## Arena Master
An NPC at the entrance explains the rules (timer, fee, leave) and hints at what the fights need without spelling it out, e.g. "Yad's guard shifts like the weather. A fighter with one trick won't last." Via `/add-npc-dialogue`.

## Enemies
Regular enemies use default behaviour (plain auto-attack targets). Each mini-boss and Yad has one unique ability, and each one tests a different skill.

### Mini-boss 1 (wave 5): the Brute: clicking
- Big HP pool, the longest fight before Yad if ignored.
- A **weak point** appears on the sprite for a few seconds (e.g. 3 s). Clicking it gives `+X% damage` for 10 s (e.g. +50%).
- Only one weak point at a time. After it's clicked or expires, the next one comes 30 s later.
- Teaches: watch the screen.

### Mini-boss 2 (wave 10): the Arcanist: magic penalty
- Magic hits on this boss **cost time**: 20% of the magic damage dealt, as seconds off the timer.
- Capped so a big spell doesn't end the run: at most 5 s per hit and 60 s per fight.
- Only magic spells count. Staff auto-attacks are `attackPower` hits and cost no time.
- Damage-over-time ticks (Thunderstorm) count: each tick does its damage and costs time, capped per hit like any other. Casting it here is the player's call (owner decision).
- Teaches: hold spells. It sets up Yad, where magic is needed again.

### Mini-boss 3 (wave 15): the Burrower: finding
- Every 20 s it burrows and 3 dirt mounds appear. One has a small tell (it shakes).
- Clicking the right mound brings it up stunned: +damage taken for 5 s.
- A wrong pick, or none within 4 s, makes it resurface healed 10% of max HP.
- While burrowed, attacks pause (nothing to hit), but the Burrower is still the current enemy and the player stays in combat. So a running damage-over-time spell (Thunderstorm) keeps counting down and its ticks are spent with nothing to hit, unlike between enemies, where its timer pauses (owner decision).
- Teaches: read the tell and react.

### Yad, the Arena Champion (wave 20): elemental shields
- At random intervals (e.g. every 15–30 s) Yad raises a **shield of fire, air or water** (random element, never the same one twice in a row). The element is shown clearly (icon, colour, aura on the sprite).
- While shielded, only hits of the **shield's element** do damage. Every other hit lands **0** (shown as "0" or "Immune" in the damage popup). An Ambush forced crit of the wrong element also lands 0 and still uses one of its charges.
- Element hits break the shield (a shield HP bar, or a set number of hits). Then Yad takes normal damage until the next shield.
- The player needs a weapon or spell of each of the three elements on hand. Swapping weapons mid-fight is fine, and a loadout makes it quick (`loadouts.md`). The Arena Master hints at this.

## Damage categories
Weapons get a **category**: melee (swords, axes, clubs), ranged (bows) or magic (staves). Melee spells (`SpellType.melee`) count as melee.
- Data: a `weaponCategory` field on weapon items (`woodenBow`, `ashwoodBow` ranged, `magicStaff` magic). `PlayerStore` exposes the equipped weapon's category, like `equippedWeaponDamageType`.
- Only one new stat for now: `meleeDamageMultiplier` (in `multiplierStats`), needed by the cape. `resolveHit` step 1: a melee hit uses `attackPower × meleeDamageMultiplier`.
- Ranged and magic-weapon (staff) auto-attacks use plain `attackPower` (owner decision), not `magicDamage`. A ranged multiplier gets added when an item needs it.

## Molten Cape
- Slot `EquipmentSlot.cape`. Stats: flat `attackPower` + `meleeDamageMultiplier` (e.g. +15%).
- Art brief: black cloth with a glowing orange lava-crack honeycomb pattern, a jagged ragged hem and a dark iron hook clasp at the collar. Back-view icon, transparent background. Owner provided a reference image. Via `/generate-2d-asset`.
- Best-in-slot for its tier. Later tiers get a better cape or a gear upgrading path.
- Sellable. Each clear gives one, so extra capes turn into gold. Keep its sell price below the entry fee, so selling capes alone isn't a profit loop; the chest is the profit.

## Rewards
No arena tokens or arena shop. The Explorer Token shop already exists, and the game shouldn't turn into a shop simulator.

Every clear:
- **Molten Cape** (see above).
- **Arena Chest**: a few rolls (e.g. 3) on a weighted table:
  - Common: gold, tier resources (materials from zones around the arena's unlock tier), food and potions.
  - Uncommon: recipe scrolls, more resources.
  - Rare: an arena-only recipe scroll.
  - Never skill points: the 2 Skill Point Books on the first clear are the only ones the arena gives (owner decision).

First clear only: **2 Skill Point Books** (`ItemID.skillPointBook`, already exists).

Leave or fail: no cape and no chest, only the gold and XP of the kills made.

**Arena Chest is an inventory item** (owner decision). The player opens it from the inventory and can save chests up.
- New openable item type: item data carries a loot table id, and the inventory shows an Open action (like Use on consumables).
- Rolls happen on open, not at clear time. The contents show in a small modal.
- Stackable, so saved chests take one slot.
- Opening is blocked while there isn't space for the worst-case contents (owner rule: no actions that lose items to a full inventory).
- Reusable later for other chests (bounties, achievements).

**Inventory space at clear**: a clear gives 2 items (cape, chest), and the first clear gives 4 (plus 2 books). Following the owner rule for quest turn-ins, the clear modal's Claim button is blocked while there isn't enough space. The rewards wait (saved with the run result) until the player makes room.

Later tiers (optional): Arena II and III with harder fixed rosters and a better cape (Molten Cape → Infernal Cape), reusing the same boss mechanics.

## Touch-points
New `arena-data.ts` (roster, timer, fee, boss abilities), `BattleStore` (arena run state, timer, boss ability state), `GameIntervalService` (arena tick: timer, ability timers), boss-ability overlay component in `battle/` (weak point, dirt mounds, shield indicator), `resolveHit` (melee multiplier, shield immunity, Arcanist penalty), `PlayerStat`, weapon item data (`weaponCategory`), cape item data (`/add-equipment-item`), Arena Master NPC dialogue, openable item type and chest loot table, clear reward modal, Lirold (`towns-data.ts` Arena building, town unlock, background), Burrower case in the damage-over-time tick (`BattleManagerService.tickDamageOverTime`), i18n namespace, offline progress (skip while in the arena), `docs/systems/game-loop-and-combat.md`.
