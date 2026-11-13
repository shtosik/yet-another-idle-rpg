import { DamageElement } from '../../enums/damage-element.enum'
import { EnemyType } from '../../enums/enemy-type.enum'
import { PlayerStat } from '../../types/player/player-stat.type'

export interface Hit {
  damage: number
  isCrit: boolean
  isWeaknessHit: boolean
}

export interface HitInput {
  stats: Record<PlayerStat, number>
  /** Base magic damage of the spell; 0 means a physical hit (auto-attack or melee spell). */
  magicDamage: number
  /** A melee hit: an auto-attack with a melee weapon (or none), or a melee spell. Uses `meleeDamageMultiplier`. */
  isMelee: boolean
  /** A ranged hit: an auto-attack with a ranged weapon, or a ranged spell. Uses `rangedDamageMultiplier`. */
  isRanged: boolean
  damageType: DamageElement
  enemyWeakness: DamageElement | undefined
  enemyTypes: EnemyType[]
  hasWeaknessSkill: boolean
  hasSpellCritSkill: boolean
  /** A guaranteed crit (Ambush), even at 0 crit chance. */
  forceCrit?: boolean
}

const physicalMultiplier = (input: HitInput, stats: Record<PlayerStat, number>) => {
  if (input.isMelee) return stats.meleeDamageMultiplier
  return input.isRanged ? stats.rangedDamageMultiplier : 1
}

const capitalize = (name: string) => name.charAt(0).toUpperCase() + name.slice(1)

/**
 * Pure damage rules. `rng` returns a value in [0, 1).
 * Damage stays fractional through every multiplier and is rounded once at the end (minimum 1).
 */
export function resolveHit(input: HitInput, rng: () => number = Math.random): Hit {
  const { stats, magicDamage, damageType, enemyWeakness, enemyTypes } = input

  const isMagic = magicDamage > 0
  let damage = isMagic
    ? (magicDamage + stats.magicDamage) * stats.magicDamageMultiplier
    : stats.attackPower * physicalMultiplier(input, stats)

  const canCrit = stats.critChance > 0 && (!isMagic || input.hasSpellCritSkill)
  const isCrit = !!input.forceCrit || (canCrit && rng() * 100 <= stats.critChance)
  if (isCrit) damage *= stats.critMulti

  const isWeaknessHit = input.hasWeaknessSkill && enemyWeakness === damageType
  if (isWeaknessHit) {
    const multiplierStat = `extra${capitalize(DamageElement[damageType])}DamageMultiplier` as PlayerStat
    damage *= stats[multiplierStat]
  }

  const typeBonus = enemyTypes.reduce((sum, type) => {
    const statName = `damageVs${capitalize(EnemyType[type])}` as PlayerStat
    return sum + stats[statName]
  }, 0)
  if (typeBonus > 0) damage *= 1 + typeBonus

  return { damage: Math.max(1, Math.round(damage)), isCrit, isWeaknessHit }
}
