# Spells and buffs

## Purpose
Active abilities on a 5-slot spell bar under the battle view. Spells cost mana and have cooldowns. They deal melee or magic damage, or grant a timed **buff** that raises a stat.

## Key files
- `src/data/spells-data.ts:SPELLS_DATA` — per spell: `baseManaCost`, `baseCooldown` (seconds), icon `url`, `effect`, optional `perk` (skill node that cuts the spell's cooldown or mana per level). Strike spells: Fire Strike (fire), Tidal Lash (water, 1 mana), Gale Cut (air, 35 s), Stone Spike (earth, 26 damage, 90 s); plus Haste and Double Attack.
- `src/interfaces/spell.interface.ts:SpellProps` — `effect` is `SpellMeleeEffectProps` (double attack), `SpellMagicEffectProps` (`baseDamage`, `damageType`) or `SpellBuffEffectProps` (`stat`, `amount`, `duration` in seconds).
- `src/enums/ids/spell-id.enum.ts:SpellID`, `src/enums/spell-type.enum.ts:SpellType`.
- `src/app/services/battle-manager.service.ts` — `canCast`, `castSpell`, `manaCost`, `spellCooldown`, `isSpellSlotLocked`, `equipSpell`, `unequipSpell`, `tickSpells`.
- `src/app/store/battle/battle.store.ts` — `equippedSpells` (5 slots, each `{ spellId, cooldownRemainingMs }`), `activeBuffs` (`{ spellId, msRemaining }`), `tickSpellTimers`.
- `src/app/store/player/player.store.ts` — `unlockedSpells` (spell → level), `spellbookUnlocked`, mana and `regenMana`; `stats` includes active buffs.
- `src/app/components/game/battle/battle-footer/` — spell bar and `spell-slot/`; `src/app/components/game/spellbook/` — palette for drag-and-drop equipping.

## Data flow
1. **Unlock**: buying a `spell` skill node levels the spell in `unlockedSpells` and auto-equips it into a free slot (see `skill-tree.md`). A **spell scroll** (`ItemType.spellScroll`, `spellId`; Ambush Scroll in the Guild store, War Cry Scroll from the Arena Chest) levels the spell in `unlockedSpells` when used and auto-equips it the same way; it's refused for a spell already known, and a respec doesn't take it away (respec only levels down what skill nodes gave). Gear can also grant a spell (`EquipmentItem.spell`, Stormcaller: Thunderstorm): it is known only while equipped. `PlayerStore.knownSpellIds` is both together; the Spellbook palette and badge read it.
2. **Spellbook tab**: unlocks after buying the Spellbook item in the Mawood Magic Shop (`ShopComponent` calls `unlockSpellbook`). It lists unlocked, unequipped spells; dragging moves them on and off the bar. Unlocked spells that are off the spell bar and not yet in `seenSpells` count toward the navbar badge (`unseenSpells`); the tab marks them seen while it's open (`markSpellsSeen`). A spell auto-equipped on learning only counts once it is unequipped.
3. **Cast** (`castSpell`), only when `canCast`: the spell is equipped, its slot is off cooldown, the player can pay the mana, and either an enemy is alive (melee, magic, damage over time, which also can't be recast while running) or the buff or empower spell isn't already active (both work between fights). A running buff, damage-over-time or empower spell gets a green border on the spell bar. Then: pay `manaCost` = `max(1, baseManaCost − perk.manaPerLevel × perk level)`, set the slot's cooldown to `spellCooldown` = `max(1, baseCooldown − spellCooldownReduction − perk.cooldownPerLevel × perk level)` seconds, and:
   - melee: `doDamage` with double attack;
   - magic: `doDamage` with `baseDamage` and the spell's element (see `game-loop-and-combat.md`);
   - damage over time: add to `activeDamageOverTime` (Thunderstorm). Each game tick while an enemy is alive, `tickDamageOverTime` advances it hit by hit and does a magic hit (`damagePerHit`, the spell's element) every `interval` seconds, `duration` / `interval` hits in all. The clock stops at a kill and during respawns, so no hit is lost: the rest carries on to the next enemy. It's saved, so a reload only pauses it; an offline claim (`MIN_OFFLINE_CLAIM_IN_MS` or longer away) ends it;
   - empower: `BattleStore.empowered` = the spell and its `hits` (Ambush: 5). Each melee hit (Double Attack, and auto-attacks with a melee weapon or none; see `game-loop-and-combat.md`) uses one and is a guaranteed crit (`resolveHit`'s `forceCrit`, even at 0 crit chance); ranged and magic hits don't use them. It's saved and not time-based, so it waits across reloads and offline;
   - buff: add to `activeBuffs` for `duration + increasedSpellDuration` seconds. The stat is derived from `activeBuffs`, nothing is added to stats directly. A buff with `percent: true` scales the stat after every flat modifier (Haste: attack interval −20%), so it keeps its strength as gear improves.
4. **Tick** (every game tick, by the real time elapsed): slot cooldowns and buffs count down in ms; a buff is removed when it reaches 0 and its stat disappears with it. While away, cooldowns and buffs count down by the whole gap, and no spells are cast offline (`offline-progress.md`).
5. **Mana** regenerates 1 point per `manaRegenRate` ms up to `maxMana`.

## Invariants & gotchas
- **Cooldowns belong to the slot.** While a slot is on cooldown its spell can't be dragged off the bar or swapped, and nothing can be dropped onto it (`cdkDragDisabled`, `onSlotDrop`, `unequipSpell`). Refund and respec remove the spell anyway (`unequipSpell(id, true)`).
- **One source per spell** (owner rule): a skill node, a spell scroll or a piece of gear, never two (`npm run validate` checks). So a refund or respec only touches skill-tree spells, and a scroll spell or gear spell can't be half-removed by one.
- **A spell from gear leaves the spell bar with the gear, once its cooldown is over.** An effect in `PlayerStore` empties every slot whose spell isn't in `knownSpellIds` and is off cooldown. Until then the slot stays, greyed out and uncastable (`canCast` checks `knownSpellIds`), so its cooldown still locks the slot: taking the gear off can't free a slot for another spell, and putting it back keeps the cooldown. A running damage-over-time spell keeps going after the gear comes off.
- `spellCooldown` never drops below `MIN_SPELL_COOLDOWN_IN_SECONDS` (1 s).
- Spell names and descriptions: `spells:names.<SpellID key>.name` / `.desc`.

## Known issues
- Buying a multi-level spell node levels the spell only once (latent: all spell nodes have `maxLevel` 1).
- Strike spells are a small share of damage even with magic gear (one cast per 35–90 s against an auto-attack every few seconds); spell descriptions hard-code numbers from data.

## How to extend
New spell: append a `SpellID` (a spell granted by gear needs no skill node, only the item's `spell`), add a `SPELLS_DATA` entry (a `perk` needs its skill node), a `spell` skill node with `spellId` (a strike spell starts its element branch, see `skill-tree.md`), icon under `assets/img/skills/`, and `spells:names` keys. A new effect shape needs a new `SpellEffectProps` variant and a `castSpell` case (and a `canCast` rule if it needs a target).
