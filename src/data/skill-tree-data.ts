import { SkillTreeID } from 'enums/ids/skill-tree-id.enum'
import { SkillPointID } from 'enums/ids/skill-tree-node-id.enum'
import { SpellID } from 'enums/ids/spell-id.enum'
import { SkillPointType } from 'enums/skill-point-type.enum'
import { SkillPoint } from 'interfaces/skill-tree/skill-point.interface'
import { SkillTree } from 'interfaces/skill-tree/skill-tree.inteface'

const EXPLORATION_SKILLS_DATA: Partial<Record<SkillPointID, SkillPoint>> = {
  [SkillPointID.autoWaveProgression]: {
    id: SkillPointID.autoWaveProgression,
    skillPointCost: 1,
    unlockRequirements: null,
    maxLevel: 1,
    url: './assets/img/skills/autoWaveProgression.png',
    type: SkillPointType.battle,
  },
  [SkillPointID.haste]: {
    id: SkillPointID.haste,
    skillPointCost: 2,
    special: true,
    unlockRequirements: null,
    maxLevel: 1,
    url: './assets/img/skills/haste.png',
    type: SkillPointType.spell,
    spellId: SpellID.haste,
  },
  [SkillPointID.goldGain]: {
    id: SkillPointID.goldGain,
    skillPointCost: 1,
    unlockRequirements: null,
    maxLevel: 5,
    url: './assets/img/skills/goldGain.png',
    type: SkillPointType.stat,
    stat: 'goldCoins',
    statAmount: 0.1,
  },
  [SkillPointID.knowledge]: {
    id: SkillPointID.knowledge,
    skillPointCost: 1,
    unlockRequirements: null,
    maxLevel: 5,
    url: './assets/img/skills/knowledge.png',
    type: SkillPointType.stat,
    stat: 'xpMultiplier',
    statAmount: 0.1,
  },
  [SkillPointID.weaknesses]: {
    id: SkillPointID.weaknesses,
    skillPointCost: 2,
    unlockRequirements: null,
    maxLevel: 1,
    url: './assets/img/skills/weaknesses.png',
    type: SkillPointType.battle,
  },
  [SkillPointID.shinyHunter]: {
    id: SkillPointID.shinyHunter,
    skillPointCost: 10,
    unlockRequirements: null,
    maxLevel: 1,
    special: true,
    url: './assets/img/skills/shinyHunter.png',
    type: SkillPointType.stat,
    stat: 'shinyChance',
    statAmount: 1,
  },
}

const DAMAGE_SKILLS_DATA: Partial<Record<SkillPointID, SkillPoint>> = {
  [SkillPointID.attackPower]: {
    id: SkillPointID.attackPower,
    skillPointCost: 1,
    unlockRequirements: null,
    maxLevel: 10,
    url: './assets/img/skills/attackPower.png',
    type: SkillPointType.stat,
    stat: 'attackPower',
    statAmount: 1,
  },
  [SkillPointID.attackSpeed]: {
    id: SkillPointID.attackSpeed,
    skillPointCost: 1,
    unlockRequirements: null,
    maxLevel: 5,
    url: './assets/img/skills/attackSpeed.png',
    type: SkillPointType.stat,
    stat: 'attackSpeed',
    statAmount: 0.1,
  },
  [SkillPointID.overkill]: {
    id: SkillPointID.overkill,
    skillPointCost: 1,
    unlockRequirements: null,
    maxLevel: 4,
    url: './assets/img/skills/overkill.png',
    type: SkillPointType.battle,
  },
  [SkillPointID.critChance]: {
    id: SkillPointID.critChance,
    skillPointCost: 1,
    unlockRequirements: null,
    maxLevel: 5,
    url: './assets/img/skills/critChance.png',
    type: SkillPointType.stat,
    stat: 'critChance',
    statAmount: 2,
  },
  [SkillPointID.critMulti]: {
    id: SkillPointID.critMulti,
    skillPointCost: 1,
    unlockRequirements: null,
    maxLevel: 5,
    url: './assets/img/skills/critMulti.png',
    type: SkillPointType.stat,
    stat: 'critMulti',
    statAmount: 0.1,
  },
  [SkillPointID.doubleAttack]: {
    id: SkillPointID.doubleAttack,
    skillPointCost: 2,
    unlockRequirements: null,
    maxLevel: 1,
    special: true,
    url: './assets/img/skills/doubleAttack.png',
    type: SkillPointType.spell,
    spellId: SpellID.doubleAttack,
  },
}

const MAGIC_SKILLS_DATA: Partial<Record<SkillPointID, SkillPoint>> = {
  [SkillPointID.fireStrike]: {
    id: SkillPointID.fireStrike,
    skillPointCost: 2,
    unlockRequirements: null,
    special: true,
    maxLevel: 1,
    url: './assets/img/skills/fireStrike.png',
    type: SkillPointType.spell,
    spellId: SpellID.fireStrike,
  },
  [SkillPointID.maxMana]: {
    id: SkillPointID.maxMana,
    skillPointCost: 1,
    unlockRequirements: null,
    maxLevel: 5,
    url: './assets/img/skills/maxMana.png',
    type: SkillPointType.stat,
    stat: 'maxMana',
    statAmount: 1,
  },
  [SkillPointID.manaRegen]: {
    id: SkillPointID.manaRegen,
    skillPointCost: 1,
    unlockRequirements: null,
    maxLevel: 5,
    url: './assets/img/skills/manaRegen.png',
    type: SkillPointType.stat,
    stat: 'manaRegenRate',
    statAmount: 2,
  },
  [SkillPointID.magicDamage]: {
    id: SkillPointID.magicDamage,
    skillPointCost: 1,
    unlockRequirements: null,
    maxLevel: 10,
    url: './assets/img/skills/magicDamage.png',
    type: SkillPointType.stat,
    stat: 'magicDamage',
    statAmount: 1,
  },
  [SkillPointID.spellCrit]: {
    id: SkillPointID.spellCrit,
    skillPointCost: 2,
    unlockRequirements: null,
    special: true,
    maxLevel: 1,
    url: './assets/img/skills/spellCrit.png',
    type: SkillPointType.battle,
  },
  [SkillPointID.spellCooldown]: {
    id: SkillPointID.spellCooldown,
    skillPointCost: 1,
    unlockRequirements: null,
    maxLevel: 5,
    url: './assets/img/skills/spellCooldown.png',
    type: SkillPointType.stat,
    stat: 'spellCooldownReduction',
    statAmount: 2,
  },
}

const SKILL_TREES_DATA: Record<SkillTreeID, SkillTree> = {
  [SkillTreeID.damage]: {
    id: SkillTreeID.damage,
    skills: [
      [SkillPointID.attackPower],
      [SkillPointID.attackSpeed, SkillPointID.overkill, SkillPointID.critChance],
      [SkillPointID.critMulti],
      [SkillPointID.doubleAttack],
    ],
    unlockRequirement: null,
  },
  [SkillTreeID.exploration]: {
    id: SkillTreeID.exploration,
    skills: [
      [SkillPointID.autoWaveProgression],
      [SkillPointID.haste, SkillPointID.goldGain, SkillPointID.knowledge],
      [SkillPointID.weaknesses],
      [SkillPointID.shinyHunter],
    ],
    unlockRequirement: null,
  },
  [SkillTreeID.magic]: {
    id: SkillTreeID.magic,
    skills: [
      [SkillPointID.fireStrike],
      [SkillPointID.maxMana, SkillPointID.manaRegen, SkillPointID.magicDamage],
      [SkillPointID.spellCrit],
      [SkillPointID.spellCooldown],
    ],
    unlockRequirement: null,
  },
}

export default SKILL_TREES_DATA

export const ALL_SKILLS: Partial<Record<SkillPointID, SkillPoint>> = {
  ...EXPLORATION_SKILLS_DATA,
  ...DAMAGE_SKILLS_DATA,
  ...MAGIC_SKILLS_DATA,
}
