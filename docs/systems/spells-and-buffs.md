# Spells and buffs

## Purpose
Active abilities on a 5-slot spell bar under the battle view. Spells cost mana and have cooldowns. They deal melee or magic damage, or grant a timed **buff** that raises a stat.

## Key files
- `src/data/spells-data.ts:SPELLS_DATA` — per spell: `baseManaCost`, `baseCooldown` (seconds), icon `url`, `effect`.
- `src/interfaces/spell.interface.ts:SpellProps` — `effect` is `SpellMeleeEffectProps` (double attack), `SpellMagicEffectProps` (`baseDamage`, `damageType`) or `SpellBuffEffectProps` (`stat`, `amount`, `duration` in seconds).
- `src/enums/ids/spell-id.enum.ts:SpellID`, `src/enums/spell-type.enum.ts:SpellType`.
- `src/app/services/battle-manager.service.ts` — `canCast`, `castSpell`, `spellCooldown`, `isSpellSlotLocked`, `equipSpell`, `unequipSpell`, `tickSpells`.
- `src/app/store/battle/battle.store.ts` — `equippedSpells` (5 slots, each `{ spellId, cooldownRemainingMs }`), `activeBuffs` (`{ spellId, msRemaining }`), `tickSpellTimers`.
- `src/app/store/player/player.store.ts` — `unlockedSpells` (spell → level), `spellbookUnlocked`, mana and `regenMana`; `stats` includes active buffs.
- `src/app/components/game/battle/battle-footer/` — spell bar and `spell-slot/`; `src/app/components/game/spellbook/` — palette for drag-and-drop equipping.

## Data flow
1. **Unlock**: buying a `spell` skill node levels the spell in `unlockedSpells` and auto-equips it into a free slot (see `skill-tree.md`).
2. **Spellbook tab**: appears after buying the Spellbook item in the Mawood Magic Shop (`ShopComponent` calls `unlockSpellbook`). It lists unlocked, unequipped spells; dragging moves them on and off the bar.
3. **Cast** (`castSpell`), only when `canCast`: the spell is equipped, its slot is off cooldown, the player can pay the mana, and either an enemy is alive (melee, magic) or the buff isn't already active (buffs work between fights). Then: pay `baseManaCost`, set the slot's cooldown to `spellCooldown` = `max(1, baseCooldown − spellCooldownReduction)` seconds, and:
   - melee: `doDamage` with double attack;
   - magic: `doDamage` with `baseDamage` and the spell's element (see `game-loop-and-combat.md`);
   - buff: add to `activeBuffs` for `duration + increasedSpellDuration` seconds. The stat is derived from `activeBuffs`, nothing is added to stats directly. A buff with `percent: true` scales the stat after every flat modifier (Haste: attack interval −20%), so it keeps its strength as gear improves.
4. **Tick** (every game tick, by the real time elapsed): slot cooldowns and buffs count down in ms; a buff is removed when it reaches 0 and its stat disappears with it. While away, cooldowns and buffs count down by the whole gap, and no spells are cast offline (`offline-progress.md`).
5. **Mana** regenerates 1 point per `manaRegenRate` ms up to `maxMana`.

## Invariants & gotchas
- **Cooldowns belong to the slot.** While a slot is on cooldown its spell can't be dragged off the bar or swapped, and nothing can be dropped onto it (`cdkDragDisabled`, `onSlotDrop`, `unequipSpell`). Refund and respec remove the spell anyway (`unequipSpell(id, true)`).
- `spellCooldown` never drops below `MIN_SPELL_COOLDOWN_IN_SECONDS` (1 s).
- Spell names and descriptions: `spells:names.<SpellID key>.name` / `.desc`.

## Known issues
- Buying a multi-level spell node levels the spell only once (latent: all spell nodes have `maxLevel` 1).
- Fire Strike barely beats auto-attacks (spell numbers wait for magic gear); spell descriptions hard-code numbers from data.

## How to extend
New spell: append a `SpellID`, add a `SPELLS_DATA` entry, a `spell` skill node with `spellId`, icon under `assets/img/skills/`, and `spells:names` keys. A new effect shape needs a new `SpellEffectProps` variant and a `castSpell` case (and a `canCast` rule if it needs a target).
