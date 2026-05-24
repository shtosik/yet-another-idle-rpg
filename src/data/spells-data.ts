import { DamageElement } from '../enums/damage-element.enum'
import { SpellID } from '../enums/ids/spell-id.enum'
import { SpellType } from '../enums/spell-type.enum'
import { SpellProps } from '../interfaces/spell.interface'

const SPELLS_DATA: Record<SpellID, SpellProps> = {
  [SpellID.fireStrike]: {
    id: 0,
    baseManaCost: 2,
    baseCooldown: 60,
    url: './assets/img/skills/fireStrike.png',
    effect: {
      type: SpellType.magic,
      baseDamage: 15,
      damageType: DamageElement.fire,
    },
  },
  [SpellID.haste]: {
    id: 1,
    baseManaCost: 5,
    baseCooldown: 300,
    url: './assets/img/skills/haste.png',
    effect: {
      type: SpellType.buff,
      duration: 60,
      stat: 'attackSpeed',
      amount: 0.3,
    },
  },
  [SpellID.doubleAttack]: {
    id: 2,
    baseManaCost: 2,
    baseCooldown: 60,
    url: './assets/img/skills/doubleAttack.png',
    effect: {
      type: SpellType.melee,
    },
  },
}

export default SPELLS_DATA
