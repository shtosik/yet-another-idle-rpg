import { SpellProps } from '../../../interfaces/spell.interface'
import { SpellType } from '../../../enums/spell-type.enum'
import { SpellID } from '../../../enums/ids/spell-id.enum'
import { EquippedSpell } from '../../../interfaces/spells/equipped-spell.interface'
import { ConsumableEffect } from '../../../interfaces/consumable.interface'
import { SkillNodeID } from '../../../enums/ids/skill-node-id.enum'
import { manaGain } from '../player/resources'

/** Cooldown reduction can't push a spell below this. */
export const MIN_SPELL_COOLDOWN_IN_SECONDS = 1

type Nodes = Partial<Record<SkillNodeID, number>>

/** Levels of the spell's perk node (`SpellProps.perk`); 0 without one. */
const perkLevel = (spell: SpellProps, nodes: Nodes): number => spell.perk ? nodes[spell.perk.nodeId] ?? 0 : 0

/** `baseManaCost` minus the perk's mana per level, never below 1. */
export const manaCost = (spell: SpellProps, nodes: Nodes): number =>
  Math.max(1, spell.baseManaCost - (spell.perk?.manaPerLevel ?? 0) * perkLevel(spell, nodes))

/** Seconds, after `spellCooldownReduction` and the spell's perk, never below `MIN_SPELL_COOLDOWN_IN_SECONDS`. */
export const spellCooldown = (spell: SpellProps, nodes: Nodes, spellCooldownReduction: number): number => {
  const perkReduction = (spell.perk?.cooldownPerLevel ?? 0) * perkLevel(spell, nodes)
  return Math.max(MIN_SPELL_COOLDOWN_IN_SECONDS, spell.baseCooldown - spellCooldownReduction - perkReduction)
}

/** What `canCast` reads from the game. */
export interface CastContext {
  /** The spell bar slot holding the spell, if any. */
  slot: EquippedSpell | undefined
  mana: number
  /** The spell's `manaCost` for this player. */
  cost: number
  isKnown: boolean
  hasRequiredWeapon: boolean
  isInCombat: boolean
  /** The spells of the running buffs and damage-over-time effects, and of the empower effect with hits left. */
  activeBuffs: SpellID[]
  activeDamageOverTime: SpellID[]
  empowered: SpellID | null
}

/**
 * Equipped, off cooldown, known (a gear spell: its gear is on) and affordable. Damage spells need a living enemy; buffs and
 * empower spells (Ambush) can be cast between fights but not while already active.
 */
export function canCast(spell: SpellProps, ctx: CastContext): boolean {
  if (!ctx.slot || ctx.slot.cooldownRemainingMs > 0 || ctx.mana < ctx.cost) return false
  // A gear spell waiting out its cooldown after the gear came off.
  if (!ctx.isKnown || !ctx.hasRequiredWeapon) return false

  switch (spell.effect.type) {
    case SpellType.buff:
      return !ctx.activeBuffs.includes(spell.id)
    case SpellType.damageOverTime:
      return !ctx.activeDamageOverTime.includes(spell.id) && ctx.isInCombat
    // Like a buff: castable between fights, not again while its crits are left.
    case SpellType.empower:
      return ctx.empowered !== spell.id
    default:
      return ctx.isInCombat
  }
}

/** What using a consumable does: the mana it gives, how long the effect runs and how long its slot stays locked (seconds). */
export interface ConsumablePlan {
  manaGained: number
  effectRemaining: number
  lockRemaining: number
}

/**
 * Null (nothing happens) while the slot is locked, with none owned, or for a pure mana potion at full mana. The effect
 * can never outlast the slot lock.
 */
export function planConsumable(
  effect: ConsumableEffect, slotLockRemaining: number, owned: number, mana: number, maxMana: number,
): ConsumablePlan | null {
  const { cooldown, duration = 0, stats = [], manaRestore = 0 } = effect
  if (slotLockRemaining > 0 || owned < 1) return null

  const manaGained = manaGain(mana, maxMana, manaRestore)
  if (manaRestore > 0 && !stats.length && manaGained <= 0) return null
  return { manaGained, effectRemaining: Math.min(duration, cooldown), lockRemaining: cooldown }
}
