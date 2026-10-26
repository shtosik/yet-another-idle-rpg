import { SpellID } from '../../enums/ids/spell-id.enum'

/** Cooldowns belong to the slot: a spell can't leave its slot while `cooldownRemainingMs` > 0. */
export interface EquippedSpell {
  spellId: SpellID
  cooldownRemainingMs: number
}

/** A damage-over-time spell running; `msElapsed` counts combat time only. */
export interface ActiveDamageOverTime {
  spellId: SpellID
  msElapsed: number
  hits: number
}

export interface ActiveBuff {
  spellId: SpellID
  msRemaining: number
}
