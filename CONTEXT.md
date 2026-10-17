# Context

Domain glossary for yet-another-idle-rpg. Use these terms in code, issues and refactor proposals.

## Combat

**Hit**: one resolved damage instance against an enemy (auto-attack, melee spell or magic spell). Carries final damage, whether it crit, and whether it struck a weakness.

## Quests

**Quest status**: where a quest stands for the player: `available`, `active` (at a step), `completed` or `failed`. Derived from quest progression, never stored separately.

## Progression

**Unlock rule**: an entry in `UNLOCK_RULES` pairing a condition (wave reached, level reached, item owned) with a target (town, feature). Zone unlocks are not unlock rules; they follow zone topology (`nextZoneId` on the boss wave).

## Inventory

**Inventory capacity**: the number of inventory slots the player owns, given by the `inventorySlots` stat. Any stat source can grow it (skills, equipment, quests, dialogue effects).

**Page**: a 40-slot view of the inventory. Capacity beyond 40 adds pages.

## Art

**Style Family**: a named art recipe (target size, style, reference images, post-processing) that a generated asset belongs to. Every generated asset belongs to exactly one family, for example `item-pixel` or `town-painterly`.

**Size tier**: the named on-screen size class of an enemy sprite (`tiny`, `small`, `medium`, `large`), taken from the creature's lore. The tier sets the sprite's longer side in pixels; 256 is the hard maximum.
