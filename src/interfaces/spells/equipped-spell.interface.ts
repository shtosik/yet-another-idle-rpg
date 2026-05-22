import { SpellID } from '../../enums/ids/spell-id.enum'

export interface EquippedSpell {
  spellId: SpellID
  cooldownRemaining: number
}

export interface ActiveBuff {
  spellId: SpellID
  ticksRemaining: number
}
