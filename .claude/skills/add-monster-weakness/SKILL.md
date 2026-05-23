---
name: add-monster-weakness
description: Use when assigning or changing an enemy's elemental weakness, giving a weapon or magic spell a non-physical damage type, adding a new DamageElement, or tuning weakness damage multipliers. Triggers on phrases like "make this enemy weak to ice", "give the bow a fire damage type", "add a poison element", "balance fire weakness damage", "the weakness multiplier is too strong".
---

# Add / Modify a Monster Weakness

The weakness system is a triangle: **enemy** has a `weakness`, **weapon or spell** has a `damageType`, and the **player** has per-element `extra<X>DamageMultiplier` stats. When all three line up *and* the `SkillPointID.weaknesses` skill node is unlocked, damage is multiplied and the popup shows "(strong)".

## Prerequisites — read first

- `src/enums/damage-element.enum.ts` — the `DamageElement` enum. Numeric values, do **not** renumber.
- `src/interfaces/enemy.interface.ts` — `Enemy.weakness?: DamageElement`.
- `src/interfaces/item.interface.ts` — `EquipmentItem.damageType?: DamageElement`.
- `src/data/spells-data.ts` — `SpellMagicEffectProps.damageType: DamageElement`.
- `src/app/services/battle-manager.service.ts` — `doDamage` is the single place the multiplier is applied.
- `src/app/store/player/player.store.ts` — `equippedWeaponDamageType` computed (the fallback used when no `damageType` is passed to `doDamage`).
- `src/app/components/game/battle/enemy/monster-debuff-bar/` — the weakness icon under the HP bar.

## How damage type is determined per attack

Inside `BattleManagerService.doDamage(magicDamage, isDoubleAttack, damageType?)`:

| Source                          | Caller                                       | Damage type used                                       |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------ |
| Auto-attack (game loop)         | `GameIntervalService` → `doDamage()`         | `playerStore.equippedWeaponDamageType()` (weapon)      |
| Melee spell (e.g. doubleAttack) | `castSpell` → `doDamage(0, true)`            | `playerStore.equippedWeaponDamageType()` (weapon)      |
| Magic spell                     | `castSpell` → `doDamage(base, false, type)`  | the spell's `effect.damageType` (explicit)             |

Unarmed → falls back to `DamageElement.physical`.

## Step 1 — Set or change an enemy's weakness

`src/data/enemies-data.ts`:

```ts
[EnemyID.iceGolem]: {
  id: EnemyID.iceGolem,
  maxHp: 80,
  experience: 12,
  weakness: DamageElement.fire,   // ← here
  drops: [...],
  url: './assets/img/enemies/iceGolem.png',
  zones: [ZoneID.frozenPeak],
},
```

The field is optional — omit it for "no weakness" (the debuff bar simply won't render).

## Step 2 — Give a weapon a damage type

`src/data/items-data.ts` — every entry with `slot: EquipmentSlot.weapon` should declare a `damageType`. All shipped weapons are `DamageElement.physical`.

```ts
[ItemID.flameSword]: {
  id: ItemID.flameSword,
  tier: ItemTier.rare,
  url: './assets/img/items/flameSword.png',
  value: 2000,
  type: ItemType.equipment,
  slot: EquipmentSlot.weapon,
  damageType: DamageElement.fire,   // ← non-physical weapon
  stats: [{ id: 'attackPower', amount: 8 }],
},
```

Omitting `damageType` on a weapon silently falls back to `physical`. That's fine for plain weapons but easy to forget on themed ones — set it explicitly.

## Step 3 — Give a magic spell a damage type

`src/data/spells-data.ts` — `damageType` is **required** on `SpellMagicEffectProps`. TypeScript will fail the build if you forget.

```ts
[SpellID.iceShard]: {
  id: 3,
  baseManaCost: 3,
  baseCooldown: 80,
  url: './assets/img/skills/iceShard.png',
  effect: {
    type: SpellType.magic,
    baseDamage: 18,
    damageType: DamageElement.water,   // ← here
  },
},
```

Melee spells (`SpellType.melee`) and buff spells (`SpellType.buff`) do **not** take a `damageType` — melee inherits the weapon's at strike time, buffs deal no direct damage.

## Step 4 — Add a new DamageElement (rarely needed)

Adding e.g. `poison` is a five-touch change:

1. `src/enums/damage-element.enum.ts` — append the new variant. Do **not** renumber existing values (saved player stats depend on them).
2. `src/types/player/player-stat.type.ts` — add `'extraPoisonDamageMultiplier'` to both the union and the `multiplierStats` list.
3. `src/app/store/player/player.ts` — add `extraPoisonDamageMultiplier: 1.2` to `statsInitialState`. Default 1.2 = +20%; **any other base will silently shift balance for the entire game**.
4. `src/app/components/game/battle/enemy/monster-debuff-bar/monster-debuff-bar.component.ts` — add a `WEAKNESS_ICONS` entry pointing at the new icon (e.g. `./assets/img/icons/poisonWeakness.png`). The `Record<DamageElement, string>` type will fail the build if missed.
5. `src/assets/locales/en/app.json` — add `elements.poison` (tooltip) and `playerStats.extraPoisonDamageMultiplier`.
6. Drop the icon at `src/assets/img/icons/poisonWeakness.png` — the bar uses `NgOptimizedImage` and will 404 noisily if missing.

## Step 5 — Tuning the multiplier

The multiplier is **the player stat itself**, not a constant. To re-balance:

- **Global base** for an element — change `statsInitialState.extra<X>DamageMultiplier` in `src/app/store/player/player.ts`. Existing save files keep the old value; you only see the change after `resetState()`.
- **Granted by an item** — add an `EquipmentItemPossibleStat`:
  ```ts
  stats: [
    { id: 'attackPower', amount: 4 },
    { id: 'extraFireDamageMultiplier', amount: 0.2 },  // +0.2 → 1.4 effective
  ],
  ```
  These stack additively with the base because `updatePlayerStats` adds raw amounts.
- **Granted by a skill node** — wire the unlock into the player stats the same way other skill-tree stat bonuses do (search `updatePlayerStats` in `player.store.ts` for examples).

## Step 6 — Smoke test

1. Equip a weapon (or stay unarmed → `physical`).
2. Enter combat against an enemy with **no** weakness: damage popup shows no "(strong)" label, debuff bar is empty.
3. Enter combat against an enemy whose `weakness` matches your weapon's `damageType`:
   - **Without** `SkillPointID.weaknesses` unlocked → no icon, no "(strong)", normal damage.
   - Unlock it in the skill tree → fire icon (or relevant element) appears under HP bar, basic attacks deal ~1.2× and popup shows "(strong)".
4. Cast a magic spell whose `effect.damageType` matches the same weakness → also "(strong)" + ~1.2×.
5. Cast a magic spell whose type does **not** match → normal damage, no label.
6. `npm run build` passes.

## Common mistakes

- Adding a new `DamageElement` variant but forgetting the `WEAKNESS_ICONS` map in `monster-debuff-bar.component.ts` — `Record<DamageElement, string>` will fail typecheck.
- Forgetting `damageType` on a non-physical weapon — silently defaults to `physical`, so the weapon never triggers fire/ice weaknesses no matter what its name suggests.
- Renumbering `DamageElement` enum values — corrupts every saved enemy `weakness` and player `extra<X>DamageMultiplier` stat. Always append.
- Setting the initial multiplier to `0` instead of `1.2` — every weakness hit deals **zero** damage. The convention is "1.0 = no bonus", "1.2 = +20%".
- Trying to add `damageType` to a `SpellType.melee` spell — the union doesn't allow it. Melee spells use the weapon's type by design.
- Putting the weakness icon outside `src/assets/img/icons/` — the component hard-codes that folder; either follow the convention or update `WEAKNESS_ICONS`.

## How "(strong)" surfaces in the UI

- `BattleManagerService.doDamage` computes `isStrong = hasWeaknessSkill && enemy.weakness === effectiveDamageType` and passes it to `animations.showDamage(damage, isCrit, isStrong)`.
- `AnimationsService.damageEvent` is a signal; `DamagePopupComponent` mirrors it into a `FloatingDamage` and renders `(strong)` (translation key `app:damage.strong`) when `isStrong` is true.
- The label is styled via `.strong-label` in `damage-popup.component.sass` — currently small/blue. Change there for global restyling.
