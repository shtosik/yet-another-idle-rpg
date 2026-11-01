# Changelog

Player-facing changes per release, newest first. The game shows this file in Settings → What's new.
Versions follow [Semantic Versioning](https://semver.org/). Each note is `- [type] text`, and the type picks its badge:
`feature` (green), `bug` (red, a bug fix), `buff` (cyan), `nerf` (purple).
New notes go under `[Unreleased]`; `npm run release -- <major|minor|patch>` moves them into a version (docs/deployment.md).

## [Unreleased]
- [feature] The equipment window is now a proper character sheet: every slot sits in its place around your character with a label, empty slots say what goes there, and the header counts what you have on. Hover a slot for details; right-click, Enter or Space unequips.
- [feature] New fonts: Cinzel for titles and tabs, Alegreya Sans for everything else, so descriptions, numbers and dialogue are much easier to read than the old pixel font.
- [feature] Equip and unequip items with right-click instead of left-click, the same as using consumables. Left-click no longer swaps gear by accident.
- [feature] Item, equipment and zone star tooltips are bigger, left-aligned and easier to scan; item names show in their tier colour.
- [feature] Dialogue text and answers are bigger, and town building labels no longer grow when you hover them.
- [feature] The quest log, bestiary, stats panel, crafting panel, popups, top menu, XP and gold bar, and battle bar have bigger, clearer text. Long quest names and requirements wrap instead of being cut off.
- [feature] Inventory, quest log and camp tabs share one look: a yellow line runs along the whole tab strip and the active tab opens into the panel.
- [feature] Recipes no longer show a "Missing" line; the ingredient counters already show what you still need.
- [bug] Item tooltips now show the unit on seconds bonuses (e.g. "+5s Spell Cooldown Reduction", not "+5").
- [feature] Town pets: reach Exalted to get a pet. In La Harpar the Bartender gives the Tavern Cat (food effects ×1.5); in Mawood, Corwin gives the Rootglow Moth (+10 s to buff spells). Each is given once and can't be sold.
- [bug] A quest turn-in no longer completes if you used up one of its items while the dialogue was open.
- [feature] Reputation tier rewards. Friendly: the Bartender and Josh answer for free, and Sylvie opens her shop to friends of Mawood. Honored: new stock in the Trader's shop (Cheese, Venison Roast Recipe, Wharf Runner's Boots), Sylvie's apothecary (Minor Mana Potion, Greater Mana Potion Recipe) and Elarion's magic shop (Rootwalker Boots). Revered: four new quests (Safe Passage from the Trader, Last Orders from the Bartender, A Clean Cure from Sylvie, Roots and Rafters from Brenna), and a few townsfolk have something new to say.
- [feature] Titles: Friendly and Exalted with a town earn a title (Friend of La Harpar, Toast of La Harpar, Friend of Mawood, Keeper of Mawood). Pick the one to show on the stats panel.
- [feature] Greater Mana Potion: restores 15 mana. Learn the recipe from Sylvie's apothecary at Mawood Honored, then brew it with a Vial of Water and 3 Spider Silk.
- [feature] Reputation turn-ins: four townsfolk take bundles of drops for reputation, as often as you like. In La Harpar, the Bartender takes 20 Crab Meat and Josh (once he'll talk to you: buy him a beer, or be Friendly with La Harpar) 20 Feathers, for 10 reputation each. In Mawood, Sylvie takes 15 Spider Silk for 15 and Brenna 10 Ancient Wood for 25. Hand over one bundle or all your full bundles at once; items your active quests still need are kept back. Once you reach Exalted with a town, its turn-ins close.
- [feature] Town reputation: La Harpar and Mawood quests now also give reputation with their town. Reach Friendly, Honored, Revered and Exalted; a message shows when you reach a new tier. The quest panel's Reputation tab shows your tier and progress in each town you've found, and the town view shows your tier next to the town's name.

## [0.2.0] - 2026-10-31
- [feature] The world map is redrawn and now reaches south, with Lirold's castle under the Ironspine mountains, the Saltmere gulf and the Blackwater Fens. Lirold and the Trader's Basement have their own map markers.
- [feature] When an enemy drop is lost because its inventory tab is full, the battle view now shows which tab was full and what was lost.
- [feature] You can destroy items from your inventory: hover an item and click the red x (quest items can't be destroyed). It destroys the whole stack and asks first. In Settings you can choose the lowest item tier that asks for confirmation; by default every tier does.
- [feature] New Exploration skills for inventory space: Pack Rat, Gear, Consumables and Materials Pouches, and Bottomless Pack, up to +11 slots in each of the Gear, Consumables and Materials tabs.
- [feature] The inventory is split into tabs: Gear, Consumables, Materials, Pets and Quest. Gear, Consumables and Materials have 20 slots each, Pets has a slot for every pet, and Quest items never run out of room. A full tab only blocks its own items: a full Materials tab no longer loses gear drops. Your items move to their tabs; a tab that holds more than fits keeps them all until you use or sell some. Each tab shows how full it is ("Materials 16/20", in red when full), and the Pets tab lists the pets you own out of all there are.
- [feature] Messages about missing inventory space now say which tab needs room: crafting, shops, quest turn-ins and other dialogue rewards, chests, zone mastery chests, and skill refunds or respec.
- [feature] The Guild Satchel now gives +2 slots to each of Gear, Consumables and Materials, and the Guild store has one.
- [feature] The Arena Chest only needs room for what it actually gives, not 4 empty slots. If the rewards don't fit, the chest stays closed and keeps the same rewards for when you make room.
- [feature] Recipes, spell scrolls and pets can now be sold, so duplicates no longer take up a slot for good.
- [feature] Every arena clear also gives an Arena Chest: right-click it in your inventory for four rewards: gold, Elderwood and Canopy materials, runes, mana potions, the Gladiator's Helm recipe (a new workbench helmet), and rarely the War Cry spell scroll (+25% melee damage for 15 s) or Patron's Gloves (+10% gold and XP), or one of the four champions' pets. Opening needs 4 empty inventory slots.
- [feature] The Arena takes a new challenger 30 minutes after their last entry.
- [feature] Each arena champion has a trick: click the Brute's weak point for +50% damage, hold your spells against the Arcanist (magic hits cost you time), pick the shaking mound when the Burrower digs in, and hit Yad with a spell or weapon of its shield's element (fire, air or water) to break it.
- [feature] The Combat Arena opens in Lirold after the Mawood Zones: pay the Arena Master 10,000 gold, then clear 20 waves and four arena champions in 10 minutes to win the Molten Cape (and 2 Skill Point Books the first time). Leaving or running out of time keeps the gold and XP from your kills.
- [feature] Lirold unlocks once the Harpy Matriarch falls; travel there from the Map's town buttons.
- [feature] Weapons are now melee, ranged (bows) or magic (staves and wands). A new Melee Damage Multiplier stat boosts melee auto-attacks and Double Attack.
- [nerf] Ambush's guaranteed crits now apply to melee hits only; bow and staff auto-attacks no longer use them up.
- [feature] The capital is now called Lirold and the Southback region is now Elderreach, home of Mawood. La Harpar's welcome message now calls it a fishing village.
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
