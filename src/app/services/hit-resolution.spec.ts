import { HitInput, resolveHit } from './hit-resolution'
import { statsInitialState } from '../store/player/player'
import { DamageElement } from '../../enums/damage-element.enum'

describe('resolveHit', () => {
  const alwaysCrit = () => 0
  const input = (stats: Partial<typeof statsInitialState> = {}): HitInput => ({
    stats: { ...statsInitialState, ...stats },
    magicDamage: 0,
    isDoubleAttack: false,
    isMelee: true,
    damageType: DamageElement.physical,
    enemyWeakness: undefined,
    enemyTypes: [],
    hasWeaknessSkill: false,
    hasSpellCritSkill: false,
  })

  it('does not inflate a small crit', () => {
    const hit = resolveHit(input({ attackPower: 1, critChance: 100, critMulti: 1.2 }), alwaysCrit)

    expect(hit.isCrit).toBeTrue()
    expect(hit.damage).toBe(1)
  })

  it('rounds once after every multiplier', () => {
    // 3 × 1.2 crit × 1.2 weakness = 4.32
    const hit = resolveHit({
      ...input({ attackPower: 3, critChance: 100 }),
      enemyWeakness: DamageElement.physical,
      hasWeaknessSkill: true,
    }, alwaysCrit)

    expect(hit.damage).toBe(4)
  })

  it('crits when forced, even at 0 crit chance', () => {
    const neverCrit = () => 0.99
    const hit = resolveHit({ ...input({ attackPower: 10, critChance: 0, critMulti: 2 }), forceCrit: true }, neverCrit)

    expect(hit.isCrit).toBeTrue()
    expect(hit.damage).toBe(20)
  })

  it('applies the melee multiplier to melee hits only', () => {
    const stats = { attackPower: 10, meleeDamageMultiplier: 1.5 }

    expect(resolveHit(input(stats)).damage).toBe(15)
    expect(resolveHit({ ...input(stats), isMelee: false }).damage).toBe(10)
  })

  it('deals at least 1', () => {
    expect(resolveHit(input({ attackPower: 0 })).damage).toBe(1)
  })
})
