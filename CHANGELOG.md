# Changelog

Player-facing changes per release, newest first. The game shows this file in Settings → What's new.
Versions follow [Semantic Versioning](https://semver.org/). Each note is `- [type] text`, and the type picks its badge:
`feature` (green), `bug` (red, a bug fix), `buff` (cyan), `nerf` (purple).
New notes go under `[Unreleased]`; `npm run release -- <major|minor|patch>` moves them into a version (docs/deployment.md).

## [Unreleased]
- [feature] New navbar: the open tab is highlighted, locked features show greyed out, and Bestiary and Spellbook show a badge for new entries.
- [feature] Level, XP, gold and Explorer Tokens are always visible in a bar under the tabs; buying, selling and claiming Guild tasks show what you gained or spent.
- [feature] Camp recipes are now a compact icon grid with a Craftable filter; pick a recipe to see its ingredients and craft it.
- [feature] Quest panel: shows progress for each objective, marks quests ready to turn in, lets you pin quests to the top, jumps to the quest giver or the zone to fight in, keeps completed quests in a collapsible list, and has a Reputation tab for later.
- [feature] Map: opens zoomed in on the zone you're fighting in, has buttons to jump straight to unlocked towns, and its markers are easier to click.
- [feature] Skill tree opens zoomed in, so nodes no longer overlap.
- [feature] Shops are now a compact item grid: hover an item for details, prices show the shop's currency icon (coins, or tokens in the Guild store), and the slot shows why you can't buy (red border: can't afford, lock: rank or station level, faded: sold out). Shift-click buys up to five.
- [bug] Item tooltips in shops and reward windows no longer say "Click to equip" or "Right-click to use".
- [feature] Towns: conversations open inside the town view so your inventory stays visible, shopkeepers get a Shop button once you've browsed their wares, the town name is shown, building labels light up on hover, and backgrounds no longer pop in.
- [feature] Stats panel: stats are grouped (Combat, Magic, Progress, weakness and enemy-type damage) with clear units, more stats are shown once something changes them ("Show all stats" lists everything), and hovering a stat shows where it comes from: base, gear, skills, buffs, food and potions, and permanent bonuses. Level, XP and gold moved to the bar under the tabs. Each stat's tooltip also explains what it does.
- [feature] The Bestiary uses the full height of the middle area and shows each monster's XP and gold per kill, its types, its weakness (once you know the Weaknesses skill), and drops coloured by item tier. Stats and crafting text is slightly larger. On the map, town markers are as easy to see as zone markers and the zone you're fighting in is highlighted.
- [feature] Bestiary ranks: each monster earns up to 3 stars from kills (100, 1,000 and 10,000; bosses 10, 100 and 500), and each star adds to your drop multiplier against that monster (+0.05, +0.1, +0.15), shinies included. Shiny kills count toward the stars. The Bestiary shows how many entries you've completed and how close you are to the next star. Drop odds are now hidden until a monster reaches 3 stars.
- [bug] Bestiary: the monster picture no longer jumps when you show or hide the shiny drop table.
- [feature] Zone mastery: every zone has 3 stars next to its name. Conqueror: defeat the boss 10 times. Hunter: get every enemy in the zone to 1 Bestiary star. Shiny Hunter: defeat 10 shinies there. Click a finished star to claim a chest of gold, Explorer Tokens and resources from the zone. Each zone with all 3 stars gives +2% gold. The world map shows each zone's stars.
- [feature] Three new spells, one per element: Tidal Lash (water, cheap on mana), Gale Cut (air, short cooldown) and Stone Spike (earth, hits hard, long cooldown). Each one, and Fire Strike, starts its own branch in the skill tree with an Element Mastery node (stronger weakness hits, once you know the Weaknesses skill) and a perk that makes the spell faster or cheaper.
- [feature] Magic in the skill tree now starts with any of the four strike spells; Max Mana, Mana Regen, Magic Damage, Spell Crit and Spell Cooldown open once you have one.
- [nerf] Monster weaknesses are spread across all elements instead of mostly fire: about six monsters each are weak to fire, water, air, earth and physical, and every zone mixes at least two. Seagulls, forest bears, harpies and giant eagles are no longer weak to physical attacks.
- [bug] Bestiary: drop odds never show above 100%.
- [feature] Magic gear: wands and staves for each element (Slime Wand, Ember Wand, Gale Staff, Rootwood Staff), robes, a hood, a mana ring and a spell-cooldown amulet. They drop from the Plains onward, sell in La Harpar and the Mawood Magic Shop, and the Rune Altar crafts a few. A staff's element also applies to your auto-attacks.
- [feature] Stormcaller, a legendary staff from the Harpy Matriarch, teaches Thunderstorm while you hold it: a storm that strikes every 2 seconds for 10 seconds of fighting, pausing between enemies. Take the staff off and the spell leaves your spell bar once its cooldown is over.
- [feature] A spell that's running (a buff or a storm) has a green border on the spell bar.
- [feature] Item tooltips show a weapon's element.
- [feature] Melee gear for every zone: a new weapon for each tier from the Plains to the Upper Canopy (Stone Axe, Fang Spear, Goblin Firebrand, Troll Club, Gnoll Cleaver, Bog Hammer, Talon Blade), three of them with an element. The Troll now drops loot.
- [feature] Armor for the empty slots: a Leather set crafted from Deer Pelt that adds crit chance, Bearhide Gloves and Silkweave Legs at the Workbench, and the Bandit Bandana, Troll Hide Vest and Gnoll Warbelt as drops.
- [nerf] The Canopy Bandit no longer drops the Machete; the Giant Eagle drops the Talon Blade instead.
- [buff] The Weaknesses skill needs only 1 level of Money Maker instead of 5.
- [feature] Ambush: a new spell that makes your next 5 melee hits, Double Attack included, guaranteed critical hits. Learn it from the Ambush Scroll in the Guild store (rank 1, 25 Explorer Tokens). Spell scrolls teach a spell for good, even through a respec.
- [feature] Hovering a spell in the Spellbook shows its tooltip (mana, cooldown, what it does), like on the spell bar.
- [bug] Item tooltips show mana regen and attack speed as seconds off ("-3s Mana Regen") instead of raw numbers, and every bonus has its sign.

## [0.1.0] - 2026-10-24
- [feature] Battle: your hero auto-attacks through zone waves, with bosses, critical hits, strong hits and elemental weaknesses.
- [feature] Zones: Horseshoe Beach, Trader's Basement, Plains, The Long Path, Mountain Pass, Elderwood Wilds, The Deepwood and The Upper Canopy.
- [feature] Hero: levels and XP, stats, inventory and equipment slots for weapons, armor and jewelry.
- [feature] Skill tree with respec.
- [feature] Spells and buffs, with mana and a spellbook.
- [feature] Towns La Harpar and Mawood, with buildings, NPCs and dialogue.
- [feature] Quests from town NPCs.
- [feature] Shops: buy gear and supplies, sell your loot for gold.
- [feature] Exploration Guild: monster-hunting tasks, guild ranks, tokens and the guild store.
- [feature] Camp: crafting stations, recipes, food and potions.
- [feature] Shiny enemies and pets, and a bestiary of everything you have defeated.
- [feature] World map.
- [feature] Offline progress: your hero keeps fighting while you are away.
- [feature] Settings: export and import your save, and this changelog.
- [feature] A notice when a new version of the game is out.
