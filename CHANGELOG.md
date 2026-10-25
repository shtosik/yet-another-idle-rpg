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
