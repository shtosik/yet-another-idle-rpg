# Yet Another Idle RPG

Browser idle RPG: the player auto-battles enemies in zones, levels a skill tree, gears up, and runs quests from towns.

## World

**Region**:
A named area of the world map that groups zones and towns.
_Avoid_: Area, location, map

**Zone**:
A combat area with its own enemy pool, waves and boss.
_Avoid_: Area, location, map, stage

**Wave**:
The player's progress counter inside a zone; the zone's boss appears at the last wave.
_Avoid_: Stage, level

**Town**:
A non-combat hub made of buildings.
_Avoid_: City, location

**Building**:
One place inside a town, holding NPCs and objects such as zone entrances.
_Avoid_: Tab, room

## Enemies

**Shiny**:
A rare variant of an enemy with a recolored sprite and better drops.
_Avoid_: Rare, elite, variant

**Pet**:
An equippable companion item; both normal and shiny enemies can drop one.
_Avoid_: Companion, familiar

## Combat

**Element**:
The damage type of a hit (fire, water, physical, …).
Code: `DamageElement`
_Avoid_: Damage type, affinity

**Weakness**:
The one element an enemy takes extra damage from.
_Avoid_: Vulnerability, resistance

**Buff**:
A timed effect granted by casting a spell.
_Avoid_: Using it for consumable effects

**Consumable slot**:
The food or potion slot, active while an eaten or drunk item's effect lasts.
_Avoid_: Buff slot

**Auto-eat**:
Automatically refilling an empty consumable slot from the inventory.
_Avoid_: Auto-use, auto-consume

## Skill tree

**Branch**:
One of the skill tree's themed sections (exploration, damage, magic).
Code: `SkillBranch`
_Avoid_: Region, tree section

**Node**:
One unlockable entry in the skill tree.
Code: `SkillNodeID`
_Avoid_: Skill point, skill

**Skill point**:
The currency earned on level-up and spent to unlock nodes.
_Avoid_: Using it for a node

**Respec**:
Refunding all unlocked nodes back into skill points.
_Avoid_: Reset, refund

## Progression

**Quest**:
A multi-step story objective given by an NPC, with rewards on completion.
_Avoid_: Mission, task

**Quest step**:
One stage of a quest that must be completed before the next one opens.
_Avoid_: Stage, objective

**Exploration Guild**:
The town building that hands out tasks for guild tokens.
_Avoid_: Guild (alone), adventurers' guild

**Task**:
A repeatable Exploration Guild contract to kill a set number of one monster, separate from quests.
_Avoid_: Quest, bounty, mission

**Zone unlock**:
A zone opens when the boss of the zone before it is defeated.
_Avoid_: Using unlock rules for zones

**Unlock rule**:
A condition (wave reached, item held, level reached) that opens a town or feature.
_Avoid_: Unlock condition, requirement

## Crafting

**Camp**:
The player's crafting base, holding the stations.
_Avoid_: Crafting tab, base

**Station**:
A crafting place in the camp where recipes are made.
_Avoid_: Workbench, crafting table

**Recipe**:
A known formula turning ingredient items into a result item at a station.
_Avoid_: Blueprint, formula
