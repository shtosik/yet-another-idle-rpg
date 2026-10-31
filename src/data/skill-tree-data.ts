import { SkillBranch } from 'enums/ids/skill-branch.enum'
import { SkillNodeID } from 'enums/ids/skill-node-id.enum'
import { SpellID } from 'enums/ids/spell-id.enum'
import { SkillNodeType } from 'enums/skill-node-type.enum'
import { SkillNode } from 'interfaces/skill-tree/skill-node.interface'
import { SkillTree } from 'interfaces/skill-tree/skill-tree.interface'
import { PlayerStat } from 'types/player/player-stat.type'

// Positions are resolved at module load by skill-tree-graph.ts.
// Only the origin (and any unconnected special node) carries an explicit
// `position`; every other node grows out of its prerequisite via the
// chain-inheritance layout, with optional `turn` to fan siblings.

const HUB_SKILL: SkillNode = {
  id: SkillNodeID.origin,
  branch: SkillBranch.damage,
  position: { x: 700, y: 400 },
  skillPointCost: 0,
  requires: null,
  maxLevel: 1,
  url: './assets/img/skills/origin.png',
  type: SkillNodeType.stat,
  stat: 'attackPower',
  statAmount: 0,
}

const EXPLORATION_SKILLS_DATA: Partial<Record<SkillNodeID, SkillNode>> = {
  [SkillNodeID.autoWaveProgression]: {
    id: SkillNodeID.autoWaveProgression,
    branch: SkillBranch.exploration,
    skillPointCost: 1,
    requires: { kind: 'node', id: SkillNodeID.origin, minLevel: 1 },
    maxLevel: 1,
    url: './assets/img/skills/autoWaveProgression.png',
    type: SkillNodeType.battle,
  },
  [SkillNodeID.haste]: {
    id: SkillNodeID.haste,
    branch: SkillBranch.exploration,
    turn: -45,
    skillPointCost: 2,
    special: true,
    requires: { kind: 'node', id: SkillNodeID.autoWaveProgression, minLevel: 1 },
    maxLevel: 1,
    url: './assets/img/skills/haste.png',
    type: SkillNodeType.spell,
    spellId: SpellID.haste,
  },
  [SkillNodeID.goldGain]: {
    id: SkillNodeID.goldGain,
    branch: SkillBranch.exploration,
    skillPointCost: 1,
    requires: { kind: 'node', id: SkillNodeID.autoWaveProgression, minLevel: 1 },
    maxLevel: 5,
    url: './assets/img/skills/goldGain.png',
    type: SkillNodeType.stat,
    stat: 'goldCoinsMultiplier',
    statAmount: 0.1,
  },
  [SkillNodeID.knowledge]: {
    id: SkillNodeID.knowledge,
    branch: SkillBranch.exploration,
    turn: 45,
    skillPointCost: 1,
    requires: { kind: 'node', id: SkillNodeID.autoWaveProgression, minLevel: 1 },
    maxLevel: 5,
    url: './assets/img/skills/knowledge.png',
    type: SkillNodeType.stat,
    stat: 'xpMultiplier',
    statAmount: 0.1,
  },
  [SkillNodeID.weaknesses]: {
    id: SkillNodeID.weaknesses,
    branch: SkillBranch.exploration,
    skillPointCost: 2,
    requires: { kind: 'node', id: SkillNodeID.goldGain, minLevel: 1 },
    maxLevel: 1,
    url: './assets/img/skills/weaknesses.png',
    type: SkillNodeType.battle,
  },
  [SkillNodeID.shinyHunter]: {
    id: SkillNodeID.shinyHunter,
    branch: SkillBranch.exploration,
    skillPointCost: 10,
    requires: { kind: 'node', id: SkillNodeID.weaknesses, minLevel: 1 },
    maxLevel: 1,
    special: true,
    url: './assets/img/skills/shinyHunter.png',
    type: SkillNodeType.stat,
    stat: 'shinyChance',
    statAmount: 1,
  },
  [SkillNodeID.autoEat]: {
    id: SkillNodeID.autoEat,
    branch: SkillBranch.exploration,
    skillPointCost: 2,
    requires: { kind: 'node', id: SkillNodeID.knowledge, minLevel: 1 },
    maxLevel: 1,
    url: './assets/img/skills/autoEat.png',
    type: SkillNodeType.battle,
  },
  // Inventory slots (docs/plans/inventory-tabs.md step 5). Never lower these amounts without a save migration.
  [SkillNodeID.packRat]: {
    id: SkillNodeID.packRat,
    branch: SkillBranch.exploration,
    turn: 45,
    skillPointCost: 1,
    requires: { kind: 'node', id: SkillNodeID.knowledge, minLevel: 1 },
    maxLevel: 1,
    url: './assets/img/skills/packRat.png',
    type: SkillNodeType.stat,
    stat: 'inventorySlots',
    statAmount: 1,
  },
  [SkillNodeID.gearPouch]: {
    id: SkillNodeID.gearPouch,
    branch: SkillBranch.exploration,
    turn: -40,
    skillPointCost: 1,
    requires: { kind: 'node', id: SkillNodeID.packRat, minLevel: 1 },
    maxLevel: 3,
    url: './assets/img/skills/gearPouch.png',
    type: SkillNodeType.stat,
    stat: 'inventorySlots',
    statAmount: 2,
    tab: 'gear',
  },
  [SkillNodeID.consumablesPouch]: {
    id: SkillNodeID.consumablesPouch,
    branch: SkillBranch.exploration,
    skillPointCost: 1,
    requires: { kind: 'node', id: SkillNodeID.packRat, minLevel: 1 },
    maxLevel: 3,
    url: './assets/img/skills/consumablesPouch.png',
    type: SkillNodeType.stat,
    stat: 'inventorySlots',
    statAmount: 2,
    tab: 'consumables',
  },
  [SkillNodeID.materialsPouch]: {
    id: SkillNodeID.materialsPouch,
    branch: SkillBranch.exploration,
    turn: 40,
    skillPointCost: 1,
    requires: { kind: 'node', id: SkillNodeID.packRat, minLevel: 1 },
    maxLevel: 3,
    url: './assets/img/skills/materialsPouch.png',
    type: SkillNodeType.stat,
    stat: 'inventorySlots',
    statAmount: 2,
    tab: 'materials',
  },
  [SkillNodeID.bottomlessPack]: {
    id: SkillNodeID.bottomlessPack,
    branch: SkillBranch.exploration,
    anchor: SkillNodeID.consumablesPouch,
    skillPointCost: 3,
    special: true,
    requires: {
      kind: 'all',
      of: [
        { kind: 'node', id: SkillNodeID.gearPouch, minLevel: 1 },
        { kind: 'node', id: SkillNodeID.consumablesPouch, minLevel: 1 },
        { kind: 'node', id: SkillNodeID.materialsPouch, minLevel: 1 },
      ],
    },
    maxLevel: 1,
    url: './assets/img/skills/bottomlessPack.png',
    type: SkillNodeType.stat,
    stat: 'inventorySlots',
    statAmount: 2,
  },
}

const DAMAGE_SKILLS_DATA: Partial<Record<SkillNodeID, SkillNode>> = {
  [SkillNodeID.attackPower]: {
    id: SkillNodeID.attackPower,
    branch: SkillBranch.damage,
    skillPointCost: 1,
    requires: { kind: 'node', id: SkillNodeID.origin, minLevel: 1 },
    maxLevel: 10,
    url: './assets/img/skills/attackPower.png',
    type: SkillNodeType.stat,
    stat: 'attackPower',
    statAmount: 1,
  },
  [SkillNodeID.attackSpeed]: {
    id: SkillNodeID.attackSpeed,
    branch: SkillBranch.damage,
    turn: -45,
    skillPointCost: 1,
    requires: { kind: 'node', id: SkillNodeID.attackPower, minLevel: 1 },
    maxLevel: 5,
    url: './assets/img/skills/attackSpeed.png',
    type: SkillNodeType.stat,
    stat: 'attackSpeed',
    statAmount: 0.1,
  },
  [SkillNodeID.overkill]: {
    id: SkillNodeID.overkill,
    branch: SkillBranch.damage,
    skillPointCost: 1,
    requires: { kind: 'node', id: SkillNodeID.attackPower, minLevel: 1 },
    maxLevel: 4,
    url: './assets/img/skills/overkill.png',
    type: SkillNodeType.battle,
  },
  [SkillNodeID.critChance]: {
    id: SkillNodeID.critChance,
    branch: SkillBranch.damage,
    turn: 45,
    skillPointCost: 1,
    requires: { kind: 'node', id: SkillNodeID.attackPower, minLevel: 1 },
    maxLevel: 5,
    url: './assets/img/skills/critChance.png',
    type: SkillNodeType.stat,
    stat: 'critChance',
    statAmount: 2,
  },
  [SkillNodeID.critMulti]: {
    id: SkillNodeID.critMulti,
    branch: SkillBranch.damage,
    skillPointCost: 1,
    requires: { kind: 'node', id: SkillNodeID.overkill, minLevel: 4 },
    maxLevel: 5,
    url: './assets/img/skills/critMulti.png',
    type: SkillNodeType.stat,
    stat: 'critMulti',
    statAmount: 0.1,
  },
  [SkillNodeID.doubleAttack]: {
    id: SkillNodeID.doubleAttack,
    branch: SkillBranch.damage,
    skillPointCost: 2,
    requires: { kind: 'node', id: SkillNodeID.critMulti, minLevel: 5 },
    maxLevel: 1,
    special: true,
    url: './assets/img/skills/doubleAttack.png',
    type: SkillNodeType.spell,
    spellId: SpellID.doubleAttack,
  },
}

/** A strike spell starting its element branch. Spells sit 2.5 steps out so the four don't overlap around the origin. */
const strikeSpell = (id: SkillNodeID, branch: SkillBranch, spellId: SpellID, icon: string): SkillNode => ({
  id,
  branch,
  distance: 2.5,
  skillPointCost: 2,
  requires: { kind: 'node', id: SkillNodeID.origin, minLevel: 1 },
  special: true,
  maxLevel: 1,
  url: `./assets/img/skills/${icon}.png`,
  type: SkillNodeType.spell,
  spellId,
})

/** +0.1 to the element's weakness multiplier per level. */
const elementMastery = (id: SkillNodeID, branch: SkillBranch, spell: SkillNodeID, stat: PlayerStat, icon: string): SkillNode => ({
  id,
  branch,
  skillPointCost: 1,
  requires: { kind: 'node', id: spell, minLevel: 1 },
  maxLevel: 5,
  url: `./assets/img/skills/${icon}.png`,
  type: SkillNodeType.stat,
  stat,
  statAmount: 0.1,
})

/** Read through the spell's `perk` (`SPELLS_DATA`), so it has no stat of its own. */
const spellPerk = (id: SkillNodeID, branch: SkillBranch, mastery: SkillNodeID, maxLevel: number, icon: string): SkillNode => ({
  id,
  branch,
  skillPointCost: 1,
  requires: { kind: 'node', id: mastery, minLevel: 1 },
  maxLevel,
  url: `./assets/img/skills/${icon}.png`,
  type: SkillNodeType.battle,
})

const ELEMENT_SKILLS_DATA: Partial<Record<SkillNodeID, SkillNode>> = {
  [SkillNodeID.fireStrike]: strikeSpell(SkillNodeID.fireStrike, SkillBranch.fire, SpellID.fireStrike, 'fireStrike'),
  [SkillNodeID.fireMastery]: elementMastery(SkillNodeID.fireMastery, SkillBranch.fire, SkillNodeID.fireStrike, 'extraFireDamageMultiplier', 'fireMastery'),
  [SkillNodeID.fireStrikeCooldown]: spellPerk(SkillNodeID.fireStrikeCooldown, SkillBranch.fire, SkillNodeID.fireMastery, 3, 'spellCooldown'),

  [SkillNodeID.tidalLash]: strikeSpell(SkillNodeID.tidalLash, SkillBranch.water, SpellID.tidalLash, 'tidalLash'),
  [SkillNodeID.waterMastery]: elementMastery(SkillNodeID.waterMastery, SkillBranch.water, SkillNodeID.tidalLash, 'extraWaterDamageMultiplier', 'waterMastery'),
  [SkillNodeID.tidalLashCooldown]: spellPerk(SkillNodeID.tidalLashCooldown, SkillBranch.water, SkillNodeID.waterMastery, 3, 'spellCooldown'),

  [SkillNodeID.galeCut]: strikeSpell(SkillNodeID.galeCut, SkillBranch.air, SpellID.galeCut, 'galeCut'),
  [SkillNodeID.airMastery]: elementMastery(SkillNodeID.airMastery, SkillBranch.air, SkillNodeID.galeCut, 'extraAirDamageMultiplier', 'airMastery'),
  [SkillNodeID.galeCutCooldown]: spellPerk(SkillNodeID.galeCutCooldown, SkillBranch.air, SkillNodeID.airMastery, 3, 'spellCooldown'),

  [SkillNodeID.stoneSpike]: strikeSpell(SkillNodeID.stoneSpike, SkillBranch.earth, SpellID.stoneSpike, 'stoneSpike'),
  [SkillNodeID.earthMastery]: elementMastery(SkillNodeID.earthMastery, SkillBranch.earth, SkillNodeID.stoneSpike, 'extraEarthDamageMultiplier', 'earthMastery'),
  [SkillNodeID.stoneSpikeMana]: spellPerk(SkillNodeID.stoneSpikeMana, SkillBranch.earth, SkillNodeID.earthMastery, 2, 'maxMana'),
}

/** The spell node that starts each element branch. */
const STRIKE_SPELL_NODES = Object.values(ELEMENT_SKILLS_DATA)
  .flatMap(node => node?.type === SkillNodeType.spell ? [node.id] : [])

/**
 * The shared magic core opens with any strike spell. It is anchored to the origin, in the lane between the water and
 * air branches, so the tree draws one line to it instead of one from every spell.
 */
const MAGIC_SKILLS_DATA: Partial<Record<SkillNodeID, SkillNode>> = {
  [SkillNodeID.maxMana]: {
    id: SkillNodeID.maxMana,
    branch: SkillBranch.magic,
    anchor: SkillNodeID.origin,
    distance: 2,
    skillPointCost: 1,
    requires: { kind: 'any', of: STRIKE_SPELL_NODES.map(id => ({ kind: 'node', id, minLevel: 1 })) },
    maxLevel: 5,
    url: './assets/img/skills/maxMana.png',
    type: SkillNodeType.stat,
    stat: 'maxMana',
    statAmount: 1,
  },
  [SkillNodeID.manaRegen]: {
    id: SkillNodeID.manaRegen,
    branch: SkillBranch.magic,
    turn: -20,
    skillPointCost: 1,
    requires: { kind: 'node', id: SkillNodeID.maxMana, minLevel: 1 },
    maxLevel: 5,
    url: './assets/img/skills/manaRegen.png',
    type: SkillNodeType.stat,
    stat: 'manaRegenRate',
    statAmount: 0.1,
    statPercent: true,
  },
  [SkillNodeID.magicDamage]: {
    id: SkillNodeID.magicDamage,
    branch: SkillBranch.magic,
    turn: 20,
    skillPointCost: 1,
    requires: { kind: 'node', id: SkillNodeID.maxMana, minLevel: 1 },
    maxLevel: 10,
    url: './assets/img/skills/magicDamage.png',
    type: SkillNodeType.stat,
    stat: 'magicDamage',
    statAmount: 1,
  },
  [SkillNodeID.spellCrit]: {
    id: SkillNodeID.spellCrit,
    branch: SkillBranch.magic,
    skillPointCost: 2,
    requires: { kind: 'node', id: SkillNodeID.manaRegen, minLevel: 5 },
    special: true,
    maxLevel: 1,
    url: './assets/img/skills/spellCrit.png',
    type: SkillNodeType.battle,
  },
  [SkillNodeID.spellCooldown]: {
    id: SkillNodeID.spellCooldown,
    branch: SkillBranch.magic,
    skillPointCost: 1,
    requires: { kind: 'node', id: SkillNodeID.spellCrit, minLevel: 1 },
    maxLevel: 5,
    url: './assets/img/skills/spellCooldown.png',
    type: SkillNodeType.stat,
    stat: 'spellCooldownReduction',
    statAmount: 2,
  },
}

export const ALL_SKILLS: Partial<Record<SkillNodeID, SkillNode>> = {
  [SkillNodeID.origin]: HUB_SKILL,
  ...EXPLORATION_SKILLS_DATA,
  ...DAMAGE_SKILLS_DATA,
  ...ELEMENT_SKILLS_DATA,
  ...MAGIC_SKILLS_DATA,
}

export const SKILL_TREE_DATA: SkillTree = {
  rootNodeId: SkillNodeID.origin,
  nodes: Object.keys(ALL_SKILLS).map(k => Number(k) as SkillNodeID),
  respec: {
    goldCostPerLevel: 100,
    fullResetGoldCost: ({ allocatedLevels }) => 500 + allocatedLevels * 50,
  },
}
