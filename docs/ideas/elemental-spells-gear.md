# Elemental spells & gear expansion

**Scope:** M · **Status:** Accepted (2026-10-25), batch 1 implemented (`feat/elemental-spells`), batch 2 implemented (`feat/magic-gear`)

More spells and more gear, magic and non-magic, for the zones that exist today. Shipped in batches.

## Why
- 3 spells (Fire Strike, Haste, Double Attack); Fire Strike is the only element. Weaknesses are 16 fire, 9 physical, 4 air, 2 water, 0 earth (31 enemies). Traders' Basement and The Deepwood are almost all fire.
- Every element already has an `extra<Element>DamageMultiplier` stat and spells pass their `damageType` to `resolveHit`, so a new strike spell is data plus an icon.
- 7 weapons, all `DamageElement.physical` (`magicStaff` too); one item in belt, boots, gloves, legs, ring and cape. No element gear exists.

## Owner decisions
- **Offline**: no offline casting. Players swap gear before going offline; [loadouts](loadouts.md) make that one click. "Offline gear" (auto-swap on going offline) is a later idea.
- **Weakness gate**: the Weaknesses skill still gates weakness damage; fine, since the whole tree is visible once unlocked.
- **Auto-cast** is its own feature with 5 levels from different sources ([auto-cast](auto-cast.md)). New spells need nothing special for it.
- **Melee weapons** can carry an element, not only staves and wands.
- **Balance** through `npm run sim`; weakness and spell kill speed through `npm run sim -- --weaknesses` (the plain sim models neither).

## Skill tree: element branches
Magic is reorganised so each element is its own branch:
- **Root**: the four strike spells (Fire Strike, Tidal Lash, Gale Cut, Stone Spike) each require `origin` and fan out across the magic sector (launch 30°, spread with `turn`). The player starts magic by picking an element.
- **Shared magic core** (max mana, mana regen, magic damage, spell crit, spell cooldown) requires `any` one strike spell. Today these hang off Fire Strike; they move, and get explicit positions between the element branches, since an `any` node is placed at the average of its prerequisites.
- **Each element branch** (batch 1): strike spell → +10% damage of that element (max 5, the `extra<Element>DamageMultiplier` stat) → one spell perk (−cooldown or −mana for that spell).
- Ambush (physical) belongs to the damage branch.
- Possibly new `SkillBranch` values per element (colours, grouping); `BRANCH_LAUNCH` in `skill-tree-graph.ts` needs an entry per value.
- Existing saves stay valid: Fire Strike still hangs off the origin, and the core accepts it as its spell. No save version bump.

## Spells
| Spell | Element | Shape |
|---|---|---|
| Fire Strike | fire | exists (15 damage, 2 mana, 60 s) |
| Tidal Lash | water | as Fire Strike, slightly cheaper mana |
| Gale Cut | air | lower damage, shorter cooldown |
| Stone Spike | earth | higher damage, longer cooldown |
| Ambush | physical | next hit is a guaranteed crit; spell scroll from the Guild store ([Explorer Token shop](explorer-token-shop.md)) |

Light and dark stay unused until later zones need them.

## Weakness rebalance
Spread weaknesses so each zone has 2+ elements; target about 6 enemies per element (fire, water, air, earth, physical). Use `/add-monster-weakness`, check kill speed with `npm run sim -- --weaknesses` (the plain `npm run sim` covers progression only), CHANGELOG as `nerf`/`buff` where kill speed shifts.

## Gear
Two build paths:
- **Physical**: `attackPower`, `critChance`, `critMulti`, `attackSpeed`. Dagger/sword/axe/bow lines, at least one new weapon per zone tier (1–7); some melee weapons with an element. Armor outside the Turtle Shell set: leather (beach/plains), bandit gear (Long Path), goblin/troll gear (Mountain Pass), gnoll/bear gear (Mawood).
- **Magic**: `magicDamage`, `magicDamageMultiplier`, mana, mana regen, spell cooldown. Staves and wands per tier with a `damageType` (Coral Wand: water, Gale Staff: air, Rootwood Staff: earth); robes, hoods, amulets and rings with mana and magic damage.
- **Sources**: zone-themed drops, the Mawood Magic Shop for magic gear, the La Harpar shop for basics, Workbench recipes, quest rewards. About 40 items; art through `/generate-2d-asset`, items through `/add-equipment-item`.

## Batches
1. **Spells and weaknesses**: Tidal Lash, Gale Cut, Stone Spike; magic tree reorganised into element branches; weakness rebalance.
2. **Magic gear** (done): owner direction 2026-10-26: magic weapons keep a small Attack Power (about a third of a melee weapon of the tier) so melee stays the auto-attack path; magic gear starts in the Plains; some comes from the Rune Altar; unique staves can grant a spell while equipped.
   - Slime Wand (water, Blue Slime), Ember Wand (fire, Goblin Scout), Gale Staff (air, Mountain Bat), Spellweaver Amulet (Elder Spider) and Stormcaller (air, unique, grants Thunderstorm, the first damage-over-time spell; Harpy Matriarch) drop.
   - Apprentice Robe (La Harpar shop), Mystic Hood (Mawood Magic Shop).
   - Rune Altar recipes: Rootwood Staff (earth), Mana Ring, Sage Robe.
3. **Physical gear**: a weapon per zone tier (some with an element), empty armor slots filled with zone drops.
4. **Spell scrolls and Ambush**: a scroll item that unlocks a spell, Guild store entry.

## Touch-points
`spells-data.ts`, `spell-id.enum.ts`, `skill-tree-data.ts`, `skill-tree-graph.ts`, `skill-node-id.enum.ts`, `enemies-data.ts`, `src/data/items/*-items.data.ts`, `shops-data.ts`, `recipes-data.ts`, i18n, `docs/systems/spells-and-buffs.md`, `docs/systems/skill-tree.md`.
