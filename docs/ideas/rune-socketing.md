# Rune socketing / enchanting

**Scope:** M · **Status:** Proposed

Equipment gets 1–2 sockets. Slotting a rune adds an elemental bonus (e.g. fire rune → `extraFireDamageMultiplier`). Runes become a meaningful sink without being a spell cost.

## Why
Runes drop from many enemies, are sold in two shops and are craftable, but nothing consumes them (repo audit 3.4).

## Sketch
- `EquipmentItem.sockets?: number`. Equipment stacks by id, so socket state lives on the equipped slot, e.g. `socketed: Record<EquipmentSlotKey, ItemID[]>`.
- Rune → stat: fire → fire dmg, water → water dmg, air → air dmg or attackSpeed, earth → earth dmg or attackPower.
- Unsocketing destroys the rune (sink) or costs gold.
- Synergy with enemy weaknesses.

## Touch-points
`item.interface.ts`, `player.store.ts` equip/unequip stat application, equipment component UI, `RUNE_ITEM_IDS`.
