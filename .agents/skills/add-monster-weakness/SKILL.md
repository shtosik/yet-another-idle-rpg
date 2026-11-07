---
name: add-monster-weakness
description: Use when assigning or changing an enemy's elemental weakness, giving a weapon or magic spell a non-physical element, adding a new DamageElement, or tuning weakness multipliers. Triggers on "make this enemy weak to ice", "give the bow a fire damage type", "add a poison element", "balance fire weakness damage", "the weakness multiplier is too strong".
---

# Weaknesses and elements

A weakness hit needs all three: the enemy's `weakness`, a hit of the same element, and the `weaknesses` skill node. It then multiplies damage by the player's `extra<Element>DamageMultiplier` stat (base 1.2). The math lives in `src/app/services/hit-resolution.ts:resolveHit`; see `docs/systems/game-loop-and-combat.md` for the full order.

The hit's element: auto-attacks and the melee spell use the weapon's `damageType` (`PlayerStore.equippedWeaponDamageType`, physical when unarmed or unset); magic spells use their own `effect.damageType`.

## Pick the branch

**Enemy weakness** — set `weakness: DamageElement.<x>` on the enemy in `src/data/enemies-data.ts`. Omit it for none. The weakness icon under the HP bar appears once the node is unlocked.

**Weapon element** — set `damageType: DamageElement.<x>` on the weapon in `src/data/items/weapons-items.data.ts`. Non-weapons ignore `damageType`; to boost an element on armor, add an `extra<Element>DamageMultiplier` stat instead.

**Spell element** — `damageType` is required on magic spells in `src/data/spells-data.ts`; melee and buff spells have none.

**Tune the multiplier** — base values are in `statsInitialState` (`src/app/store/player/player.ts`); items and skill nodes add to them (`0.2` = +20 points on the 1.2 base). Stats are derived, so existing saves pick up a new base immediately.

**New element** (e.g. poison):
1. Append it to `src/enums/damage-element.enum.ts:DamageElement`.
2. Add `extra<Element>DamageMultiplier` to the `PlayerStat` union and `multiplierStats` (`src/types/player/player-stat.type.ts`), with base `1.2` in `statsInitialState`. The name must be `extra` + capitalized element key + `DamageMultiplier`, because `resolveHit` builds it from the enum key.
3. Add an entry to `WEAKNESS_ICONS` in `src/app/components/game/battle/enemy/monster-debuff-bar/monster-debuff-bar.component.ts` and generate the icon `src/assets/img/icons/<element>Weakness.png` with `/generate-2d-asset`.
4. Add `app:elements.<element>` and `app:playerStats.extra<Element>DamageMultiplier` to `src/assets/locales/en/app.json`.

Done when `npm run check` passes, and in the dev server (with the `weaknesses` node) a matching hit shows the "(strong)" popup and a non-matching hit doesn't.
