# Buff Spell System — Analysis

## How it currently works

### Data flow

1. **Equip** (`BattleManagerService.equipSpell`): creates an `EquippedSpell` and pushes it to `BattleStore.equippedSpells`. For buff spells, it conditionally sets `duration = 0`.
2. **Cast** (`BattleManagerService.castSpell`): calls `BattleStore.updateSpellCooldown(spellId, cooldown, duration)` to arm both cooldown and duration, then immediately applies the stat change to `PlayerStore`.
3. **Tick** (`BattleStore.updateSpellDuration`, called every 1 s): decrements `cooldown` and — for buffs — `duration`. When `duration` ticks down to exactly `0`, it reads the effect from `SPELLS_DATA`, casts it to `SpellSupportStatBuffEffectProps`, and calls `playerStore.updatePlayerStats` with the negated amount to reverse the buff.

### Involved files

| File | Role |
|---|---|
| `src/interfaces/spells/equipped-spell.interface.ts` | `EquippedSpell` shape |
| `src/data/spells-data.ts` | Static spell definitions |
| `src/enums/spell-type.enum.ts` | `SpellType` enum |
| `src/app/store/battle/battle.store.ts` | Tick handler, cooldown/duration mutations |
| `src/app/services/battle-manager.service.ts` | Cast, equip, unequip logic |

---

## Problems

### 1. `EquippedSpell.spellType` is redundant

`spellType` is stored on every equipped spell, but it is always derivable from `SPELLS_DATA[spellId].effect.type`. The two can silently drift. `castSpell` re-reads from `SPELLS_DATA` anyway; `EquippedSpell` having its own copy serves no purpose.

### 2. `duration` is optional but semantically required for buffs

```ts
export interface EquippedSpell {
    spellId: SpellID
    spellType: SpellType
    cooldown: number
    duration?: number   // ← optional, but buff spells require it
}
```

TypeScript permits a buff spell with `duration = undefined`. If that happens, `duration > 0` in the tick handler silently short-circuits and the buff never expires without any error. The `equipSpell` method sets it via a conditional branch — easy to forget when adding new spell types.

### 3. Buff duration and spell cooldown are conflated in one object

Both concern different lifecycles: cooldown is "when can I cast again", duration is "how long is the current effect active". Putting them on the same object means the tick handler has to deal with both at once, and the `duration?: number` field is meaningless for non-buff spells (it just sits there at `undefined` or `0`).

### 4. Business logic inside a store — store calling another store

`updateSpellDuration` in `BattleStore` calls `playerStore.updatePlayerStats(statsToDecrement)` when a buff expires. A store mutating another store from a tick method is a side-effectful pattern that is hard to test and obscures data flow. This logic belongs in a service.

### 5. Buff re-cast stacks the stat without guarding

Casting a buff while it is already active applies the stat change a second time (line: `this.playerStore.updatePlayerStats([{ stat: ..., amount: ... }])`). The reversal at expiry only subtracts the amount once. Net result: the stat is permanently inflated after a double-cast, until the player reloads.

### 6. `castSpell` special-cases `SpellID.doubleAttack` by ID

```ts
if (spellId === SpellID.doubleAttack) {
  this.doDamage(0, true)
} else if (spellData.effect.type === SpellType.buff) { ...
} else if (spellData.effect.type === SpellType.magic) { ...
}
```

`doubleAttack` should be handled by its type (`SpellType.melee`), not by its specific ID. As more melee-type spells are added, each would need its own `if` branch.

---

## Proposed redesign

The core idea: **separate "spell slot with cooldown" from "active buff tracking"**.

### New interfaces

```ts
// replaces EquippedSpell — only owns what it actually needs
export interface EquippedSpell {
  spellId: SpellID
  cooldownRemaining: number   // renamed from `cooldown` for clarity
}

// new — tracks only active buff effects
export interface ActiveBuff {
  spellId: SpellID
  ticksRemaining: number
}
```

### BattleState changes

```ts
export interface BattleState {
  // ...existing fields...
  equippedSpells: EquippedSpell[]   // now leaner
  activeBuffs: ActiveBuff[]         // replaces duration on EquippedSpell
}

export const initialState: BattleState = {
  // ...
  equippedSpells: [],
  activeBuffs: [],
}
```

### Tick handler moves to a service

`updateSpellDuration` is removed from `BattleStore`. The tick is handled in `GameIntervalService` (or `BattleManagerService`) which already calls tick methods. The new tick method:

```ts
tickSpells(): void {
  // 1. Decrement cooldowns
  this.battleStore.tickCooldowns()

  // 2. Decrement active buff durations, collect expired ones
  const expired = this.battleStore.tickBuffs()   // returns spellIds whose ticks hit 0

  // 3. Reverse expired buff stats
  for (const spellId of expired) {
    const effect = SPELLS_DATA[spellId].effect as SpellSupportStatBuffEffectProps
    this.playerStore.updatePlayerStats([{ stat: effect.stat, amount: -effect.amount }])
  }
}
```

`BattleStore` gets two focused methods:

```ts
tickCooldowns(): void {
  patchState(store, (state) => ({
    equippedSpells: state.equippedSpells.map(s =>
      s.cooldownRemaining > 0 ? { ...s, cooldownRemaining: s.cooldownRemaining - 1 } : s
    ),
  }))
},

tickBuffs(): SpellID[] {
  const expired: SpellID[] = []
  patchState(store, (state) => {
    const next: ActiveBuff[] = []
    for (const buff of state.activeBuffs) {
      if (buff.ticksRemaining <= 1) {
        expired.push(buff.spellId)
      } else {
        next.push({ ...buff, ticksRemaining: buff.ticksRemaining - 1 })
      }
    }
    return { activeBuffs: next }
  })
  return expired
},
```

### `castSpell` uses a switch and guards re-cast

```ts
castSpell(spellId: SpellID): void {
  const spellData = SPELLS_DATA[spellId]
  const stats = this.playerStore.stats()
  const cooldown = spellData.baseCooldown - stats.spellCooldownReduction

  this.battleStore.setSpellCooldown(spellId, cooldown)

  switch (spellData.effect.type) {
    case SpellType.melee:
      this.doDamage(0, true)
      break

    case SpellType.magic:
      this.doDamage(spellData.effect.baseDamage)
      break

    case SpellType.buff: {
      const alreadyActive = this.battleStore.activeBuffs().some(b => b.spellId === spellId)
      if (alreadyActive) break   // no stacking

      const ticks = spellData.effect.duration + stats.increasedSpellDuration
      this.battleStore.addActiveBuff({ spellId, ticksRemaining: ticks })
      this.playerStore.updatePlayerStats([{ stat: spellData.effect.stat, amount: spellData.effect.amount }])
      break
    }
  }
}
```

### `equipSpell` becomes trivial

No more conditional `duration` field:

```ts
equipSpell(spellId: SpellID): void {
  if (this.battleStore.equippedSpells().some(s => s.spellId === spellId)) return
  this.battleStore.addSpell({ spellId, cooldownRemaining: 0 })
}
```

---

## Summary of improvements

| Issue | Current | Proposed |
|---|---|---|
| Redundant `spellType` | Stored on `EquippedSpell` | Removed — read from `SPELLS_DATA` when needed |
| Optional `duration` on all spells | `duration?: number` — silent failure | `activeBuffs` separate array, only populated when buff is active |
| Store calling other store | `updateSpellDuration` calls `playerStore` | Moved to service (`tickSpells`) |
| Buff stacking bug | Re-cast applies stat twice | Guard in `castSpell`: no-op if buff already active |
| Spell ID hardcoded in cast logic | `if (spellId === SpellID.doubleAttack)` | `switch (effect.type)` — works for all future melee spells |
| Cooldown and duration mixed | Same object, tick handler does both | Split: `tickCooldowns()` and `tickBuffs()` — single responsibility |

---

## Files that would change

- `src/interfaces/spells/equipped-spell.interface.ts` — leaner `EquippedSpell`, new `ActiveBuff`
- `src/app/store/battle/battle.store.ts` — add `activeBuffs`, replace `updateSpellDuration` with `tickCooldowns` / `tickBuffs` / `addActiveBuff` / `setSpellCooldown`
- `src/app/services/battle-manager.service.ts` — `castSpell` switch, `equipSpell` simplification, new `tickSpells` method
- `src/app/services/game-interval.service.ts` — call `tickSpells()` instead of `updateTick`

The data files (`spells-data.ts`, `spell-type.enum.ts`) and the UI spell components do not need to change.
