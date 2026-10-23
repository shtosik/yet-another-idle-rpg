# Player stats are derived from their sources, not accumulated

`PlayerStore.stats` is a computed signal: `statsInitialState` plus a modifier from every source the player has right now (equipment, stat skill nodes, active buffs, active consumable effects, permanent bonuses), with saved **resources** (`experience`, `level`, `unspentSkillPoints`, `goldCoins`, `mana`) laid on top. The old design kept one persisted `stats` record and had every source do `+=` on gain and an exact mirror `−=` on loss.

We switched because the accumulated record could only drift. A rebalanced item or node left its old delta on every save that had it applied, `statsInitialState` changes never reached saves, float sums drifted (`attackSpeed` 2.7000000000000006), and every equip/unequip, buff expiry, consumable expiry and respec had to undo itself exactly or the save was corrupted for good. Derived stats make each of those a non-event: removing the source removes the stat.

## Consequences

- `updatePlayerStats` only earns or spends resources, or adds a **permanent bonus** (`PlayerState.permanentBonuses`) for things with no source to derive from: used reward items, quest stat rewards, dialogue stat effects, debug grants. Equipment, nodes, buffs and consumables never call it for their stats.
- `PlayerStore` injects `BattleStore` to read `activeBuffs` and `consumableSlots`. To avoid a DI cycle, `BattleStore` no longer injects `PlayerStore`; `startBattle` takes `shinyChance` as an argument.
- Inverted stats (`attackSpeed`, `manaRegenRate`, `shopRefreshCooldown`) are inverted in `deriveStats`, still "positive = better" in data.
- Each derived stat is rounded to 6 decimals, which removes float drift from display and comparisons.
- `mana` shows at most `maxMana`; an effect also lowers stored mana when `maxMana` drops, so mana can't reappear when it rises again.
- `stats()` recomputes only when a source changes: buff and consumable countdowns go through id-list computeds with an equality check, and the mana regen timer is not a stat. Mana regen writes `resources` only when a point is gained.
- Old saves are not migrated (pre-release); clear `localStorage`.

## Rejected

- **Recompute the accumulated record on load** (keep `+=`/`−=`, rebuild once at startup). Fixes stale saves, but keeps the mirror rule and its bugs at runtime.
- **A separate `StatsService`** owning the computed. Would avoid the store-to-store injection, but every reader already uses `playerStore.stats()`, and store methods (inventory capacity, mana regen) need the derived values internally.
