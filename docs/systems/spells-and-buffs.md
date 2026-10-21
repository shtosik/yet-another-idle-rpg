# Spells and buffs

## Purpose
Active abilities on a 5-slot spell bar under the battle view. Spells cost mana and have cooldowns. They deal melee or magic damage, or grant a timed **buff** that raises a stat.

## Key files
- `src/data/spells-data.ts:SPELLS_DATA` — per spell: `baseManaCost`, `baseCooldown` (seconds), icon `url`, `effect`.
- `src/interfaces/spell.interface.ts:SpellProps` — `effect` is `SpellMeleeEffectProps` (double attack), `SpellMagicEffectProps` (`baseDamage`, `damageType`) or `SpellBuffEffectProps` (`stat`, `amount`, `duration` in seconds).
- `src/enums/ids/spell-id.enum.ts:SpellID`, `src/enums/spell-type.enum.ts:SpellType`.
- `src/app/services/battle-manager.service.ts:castSpell`, `equipSpell`, `unequipSpell`, `tickSpells`.
- `src/app/store/battle/battle.store.ts` — `equippedSpells` (5 slots, each `{ spellId, cooldownRemaining }`), `activeBuffs` (`{ spellId, secondsRemaining }`).
- `src/app/store/player/player.store.ts` — `unlockedSpells` (spell → level), `spellbookUnlocked`, mana stats and `regenMana`.
- `src/app/components/game/battle/battle-footer/` — spell bar and `spell-slot/`; `src/app/components/game/spellbook/` — palette for drag-and-drop equipping.

## Data flow
1. **Unlock**: buying a `spell` skill node levels the spell in `unlockedSpells` and auto-equips it into a free slot (see `skill-tree.md`).
2. **Spellbook tab**: appears after buying the Spellbook item in the Mawood Magic Shop (`ShopComponent` calls `unlockSpellbook`). It lists unlocked, unequipped spells; dragging moves them on and off the bar.
3. **Cast** (`castSpell`): pay `baseManaCost`, set cooldown to `baseCooldown − spellCooldownReduction`, then:
   - melee: `doDamage` with double attack;
   - magic: `doDamage` with `baseDamage` and the spell's element (see `game-loop-and-combat.md`);
   - buff: add to `activeBuffs` for `duration + increasedSpellDuration` seconds and add `amount` to the stat.
4. **Tick** (once per second): cooldowns count down; expiring buffs subtract their `amount` again.
5. **Mana** regenerates 1 point per `manaRegenRate` ms up to `maxMana`.

## Invariants & gotchas
- A buff's stat change lives in `PlayerStore.stats` while the buff itself lives in `BattleStore.activeBuffs`. The `−` on expiry must always run; anything that drops `activeBuffs` without it makes the buff permanent.
- Re-casting an active buff charges nothing and only resets the cooldown.
- Cooldowns are stored per equipped slot, not per spell.
- Spell names and descriptions: `spells:names.<SpellID key>.name` / `.desc`.

## Known issues
- Dragging a spell off the bar and back resets its cooldown to 0.
- `castSpell` has no guards of its own (cooldown, enemy alive); the UI enforces them. Cooldown can go negative when reduction exceeds the base.
- Buff and cooldown timing is off by up to 1 second (global 1-second phase; expiry at `<= 1`).
- Mana can stay above `maxMana` after `maxMana` drops.
- Buying a multi-level spell node levels the spell only once (latent: all spell nodes have `maxLevel` 1).
- Haste is weak (≈2% DPS); Fire Strike barely beats auto-attacks; spell descriptions hard-code numbers from data.

## How to extend
New spell: append a `SpellID`, add a `SPELLS_DATA` entry, a `spell` skill node with `spellId`, icon under `assets/img/skills/`, and `spells:names` keys. A new effect shape needs a new `SpellEffectProps` variant and a `castSpell` case.
