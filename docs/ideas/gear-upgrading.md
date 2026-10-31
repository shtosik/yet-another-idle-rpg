# Gear upgrading

**Scope:** M · **Status:** Proposed

Upgrade equipment from +1 to +5 (cap rises later) by spending gold and zone resources. Old drops stay useful, and resources get a lasting purpose.

## Rules
- Each level adds +10% (tunable) to the item's base stats, rounded.
- Cost per level: gold + resources from the item's own zone (turtle shell for Turtle Shell gear, silverwood for Silverwood Chestplate), growing per level.
- No failure chance / no item loss (idle-friendly). Optional later: a "lucky" proc that skips a level.
- Upgrade level stored per inventory/equipped item instance (`upgradeLevel`). Items with an upgrade level don't stack.
- Stats stay derived: equipped gear stats in `stats()` read `upgradeLevel`.

## Where
Workbench at the Camp, or a smith NPC. Max level gated by Workbench level and/or town reputation (`town-reputation.md`).

## Selling
Sell price rises with upgrade level (partial refund of the cost).

## Ties
Gathering skills (`gathering-skills.md`) can supply materials. Item sets (`item-sets.md`): upgrading set pieces is the late-game path. Achievements: "upgrade an item to +5".

## Open
- Inventory stacks per `id + tier` (Gear tab). `upgradeLevel` would join that key, like `tier` does, along with equipped slots, loadouts (they store id + tier) and destroy. Biggest cost of this feature.

## Touch-points
`player.store.ts` (inventory/equipment shape, `stats` computed), item tooltip, Workbench UI, `recipes-data.ts` or a new `upgrade-costs.ts`, `docs/systems/player-stats-inventory-equipment.md`.
