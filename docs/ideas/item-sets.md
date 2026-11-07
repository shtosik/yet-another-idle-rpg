# Item sets

**Scope:** S-M · **Status:** Proposed

Wearing 2 / 4 / 5 pieces of a set gives bonus stats. Motivates farming a specific zone and mixing in non-set pieces as a trade-off.

## Example sets (from existing and planned gear)
- **Turtle Shell** (helmet, chest, legs, boots, gloves — exists): 2pc +HP-style defensive stat, 4pc +gold find, 5pc +% drop chance from beach enemies.
- **Bandit's Garb** (Long Path, planned): crit focus.
- **Hunter's Kit** (Mawood Hunter's Lodge, planned): bonus vs beasts, attack speed.
- **Elarion's Regalia** (Mawood magic, planned): mana regen, magic damage multiplier.

Monsters don't fight back, so set bonuses lean on offense, speed, loot and economy, not defense.

## Rules
- `ItemSet` data: `id`, `pieces: ItemID[]`, `bonuses: { count, stats }[]`.
- Bonuses go into the `stats()` computed as one more derived source (ADR 0002).
- Tooltip lists pieces (owned/equipped highlighted) and bonus tiers.

## Ties
Gear upgrading (`gear-upgrading.md`), loadouts (`loadouts.md`), achievements ("complete a set").

## Touch-points
New `src/data/item-sets-data.ts` + enum, `player.store.ts` (`stats`), item tooltip, `docs/systems/player-stats-inventory-equipment.md`.
