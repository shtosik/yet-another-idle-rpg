import { DamageElement } from '../enums/damage-element.enum'
import { SpellID } from '../enums/ids/spell-id.enum'
import { SpellType } from '../enums/spell-type.enum'
import { SpellProps } from '../interfaces/spell.interface'
import { SkillNodeID } from '../enums/ids/skill-node-id.enum'

const SPELLS_DATA: Record<SpellID, SpellProps> = {
  [SpellID.fireStrike]: {
    id: SpellID.fireStrike,
    baseManaCost: 2,
    baseCooldown: 60,
    url: './assets/img/skills/fireStrike.png',
    effect: {
      type: SpellType.magic,
      baseDamage: 15,
      damageType: DamageElement.fire,
    },
    perk: { nodeId: SkillNodeID.fireStrikeCooldown, cooldownPerLevel: 5 },
  },
  [SpellID.tidalLash]: {
    id: SpellID.tidalLash,
    baseManaCost: 1,
    baseCooldown: 60,
    url: './assets/img/skills/tidalLash.png',
    effect: {
      type: SpellType.magic,
      baseDamage: 14,
      damageType: DamageElement.water,
    },
    perk: { nodeId: SkillNodeID.tidalLashCooldown, cooldownPerLevel: 5 },
  },
  [SpellID.galeCut]: {
    id: SpellID.galeCut,
    baseManaCost: 2,
    baseCooldown: 35,
    url: './assets/img/skills/galeCut.png',
    effect: {
      type: SpellType.magic,
      baseDamage: 9,
      damageType: DamageElement.air,
    },
    perk: { nodeId: SkillNodeID.galeCutCooldown, cooldownPerLevel: 3 },
  },
  [SpellID.stoneSpike]: {
    id: SpellID.stoneSpike,
    baseManaCost: 3,
    baseCooldown: 90,
    url: './assets/img/skills/stoneSpike.png',
    effect: {
      type: SpellType.magic,
      baseDamage: 26,
      damageType: DamageElement.earth,
    },
    perk: { nodeId: SkillNodeID.stoneSpikeMana, manaPerLevel: 1 },
  },
  [SpellID.thunderstorm]: {
    id: SpellID.thunderstorm,
    baseManaCost: 4,
    baseCooldown: 45,
    url: './assets/img/skills/thunderstorm.png',
    effect: {
      type: SpellType.damageOverTime,
      damagePerHit: 8,
      damageType: DamageElement.air,
      duration: 10,
      interval: 2,
    },
  },
  [SpellID.haste]: {
    id: SpellID.haste,
    baseManaCost: 5,
    baseCooldown: 300,
    url: './assets/img/skills/haste.png',
    effect: {
      type: SpellType.buff,
      duration: 60,
      stat: 'attackSpeed',
      amount: 0.2,
      percent: true,
    },
  },
  [SpellID.doubleAttack]: {
    id: SpellID.doubleAttack,
    baseManaCost: 2,
    baseCooldown: 60,
    url: './assets/img/skills/doubleAttack.png',
    effect: {
      type: SpellType.melee,
    },
  },
}

export default SPELLS_DATA
