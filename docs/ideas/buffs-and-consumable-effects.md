# Buffs and consumable effects

**Scope:** S-M · **Status:** Open question

Today there are two separate timed-effect systems:
- **Buffs** come only from spells: `BattleStore.activeBuffs` (`{ spellId, secondsRemaining }`), stat looked up in `SPELLS_DATA` on expiry. See [spells-and-buffs](../systems/spells-and-buffs.md).
- **Consumable effects** live in the food and potion **consumable slots**: `BattleStore.consumableSlots` (`ActiveConsumable` with a stat snapshot and a slot lock). See [consumables-camp-crafting](../systems/consumables-camp-crafting.md).

Both add stats on start and subtract them on expiry, tick once per second, and show icons in the battle footer.

## Open question
Unify them into one "timed effect" model (source: spell or item; one expiry path; one UI list), or keep them separate because slots and locks are a consumable-only rule?

Things to weigh:
- One expiry path removes a class of "stat never reverted" bugs (see accumulated stats in [player-stats-inventory-equipment](../systems/player-stats-inventory-equipment.md)).
- If stats become derived instead of accumulated, both systems become a list of active modifiers and the question mostly answers itself.
- Glossary today keeps the words apart: **Buff** = spell, **consumable slot** = food/potion.
