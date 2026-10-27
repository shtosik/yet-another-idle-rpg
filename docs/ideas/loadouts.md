# Loadouts

**Scope:** S · **Status:** Accepted (2026-10-25)

Saved gear sets swapped with one click: a magic set for active play, a physical set before going offline (spells aren't cast offline, see [elemental spells & gear](elemental-spells-gear.md)).

## Rules
- **3 loadouts**, gear only: all 11 equipment slots, pet included. The spell bar is not part of a loadout.
- Each loadout stores, per slot, the item id and tier (or empty). Saved in `PlayerStore` (new key defaults in; no save version bump).
- **Save**: "Save current gear" into a slot; rename optional.
- **Swap** (one click, Equipment panel):
  - Equips every loadout item found in the inventory or already equipped; a slot whose item is missing (sold, used in a recipe) is skipped and listed afterwards ("Skipped: ring, cape").
  - A loadout slot left empty unequips that slot.
  - Never loses items: if the gear coming off needs more inventory space than is free, the whole swap is refused, matching the unequip rule (`canUnequip`). Gear with `inventorySlots` (bags, belts) changes capacity during the swap; check the final state with `canChangeInventorySlots`.
  - Same id in two slots (two rings later) needs two copies in the inventory.

## Later
- **Offline gear**: mark one loadout to swap in automatically when the game goes offline and back on return.
- Loadouts could also store the spell bar once [auto-cast](auto-cast.md) makes spell order matter.

## Touch-points
`player.store.ts` (`equipItem`, `unequipItem`, `canEquip`, `canUnequip`, inventory checks), equipment component, i18n, `docs/systems/player-stats-inventory-equipment.md`.
