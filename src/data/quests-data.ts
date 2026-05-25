import { QuestID } from '../enums/ids/quest-id.enum'
import { PlayerStat } from '../types/player/player-stat.type'
import { ItemID } from '../enums/ids/item-id.enum'
import { ZoneID } from '../enums/ids/zone-id.enum'
import { EnemyID } from '../enums/ids/enemy-id.enum'

export const QUEST_STEP_AFTER_COMPLETED = 9999
export const QUEST_STEP_AFTER_FAILED = 8888

export interface QuestProps {
  questId: QuestID
  rewards: Array<StatReward | ItemReward>
  startRequirements: RequirementProps[]
  steps: QuestStepProps[]
}

export type QuestStepProps = {
  description: string;
  requirements: RequirementProps[];
};

export type RequirementProps =
  ItemRequirement
  | WaveKillCountRequirement
  | EnemyKillCountRequirement
  | QuestRequirement
  | StatRequirement;

export interface StatRequirement {
  type: 'stat'
  key: PlayerStat
  amount: number
}

export interface QuestRequirement {
  type: 'quest'
  questId: QuestID
  step?: number
}

export interface ItemRequirement {
  type: 'item'
  itemId: ItemID
  amount: number
}

export interface WaveKillCountRequirement {
  type: 'wave'
  zoneId: ZoneID
  wave: number
  amount: number
}

export interface EnemyKillCountRequirement {
  type: 'enemy'
  enemyId: EnemyID
  amount: number
}

interface StatReward {
  type: 'stat'
  key: PlayerStat
  amount: number
}

interface ItemReward {
  type: 'item'
  itemId: ItemID
  amount: number
}

// interface SkillReward {
//     type: 'skill'
//     name: SkillNames
// }

// {description: "", requirement: {type: "stat", key: "level", amount:1 }}, first step if no requirements needed to start the quest

const QUEST_DATA: Record<QuestID, QuestProps> = {
  [QuestID.meatShortage]: {
    questId: QuestID.meatShortage,
    startRequirements: [{ type: 'stat', key: 'level', amount: 1 }],
    steps: [
      {
        description: 'Bartender in La Harpar tavern asked me to bring her 30 crab meat.',
        requirements: [{ type: 'item', itemId: ItemID.crabMeat, amount: 30 }],
      },
    ],
    rewards: [
      { type: 'stat', key: 'unspentSkillPoints', amount: 1 },
      { type: 'stat', key: 'experience', amount: 1000 },
      { type: 'stat', key: 'goldCoins', amount: 200 },
    ],
  },
  [QuestID.clearingOutTheBeach]: {
    questId: QuestID.clearingOutTheBeach,
    startRequirements: [{ type: 'stat', key: 'level', amount: 1 }],
    steps: [
      {
        description: 'I\'m supposed to kill 50 enemies on wave 7 on Horseshoe Beach.',
        requirements: [{ type: 'wave', zoneId: 1, wave: 7, amount: 50 }],
      },
    ],
    rewards: [
      { type: 'stat', key: 'experience', amount: 1500 },
      { type: 'stat', key: 'goldCoins', amount: 250 },
      { type: 'item', itemId: ItemID.joshsHeirloom, amount: 1 },
    ],
  },
  [QuestID.ratsWereRats]: {
    questId: QuestID.ratsWereRats,
    startRequirements: [{ type: 'stat', key: 'level', amount: 1 }],
    steps: [
      {
        description: 'La Harpar\'s trader asked me to get rid of pests in his basement. 50 should be enough.',
        requirements: [{ type: 'enemy', enemyId: EnemyID.rat, amount: 50 }],
      },
    ],
    rewards: [
      { type: 'stat', key: 'unspentSkillPoints', amount: 1 },
      { type: 'stat', key: 'experience', amount: 1500 },
      { type: 'stat', key: 'goldCoins', amount: 300 },
    ],
  },
  [QuestID.aTaleOfACaptain]: {
    questId: QuestID.aTaleOfACaptain,
    startRequirements: [{ type: 'stat', key: 'level', amount: 1 }],
    steps: [
      {
        description: 'Elara is looking for her father, Captain Theron Tidecaller. I need to find some clues',
        requirements: [{ type: 'item', itemId: ItemID.captainsLetter, amount: 1 }],
      },
    ],
    rewards: [],
  },
  // ── Mawood — Corruption questline (Roots of Rot) ──────────────────────────
  [QuestID.signsOfRot]: {
    questId: QuestID.signsOfRot,
    startRequirements: [{ type: 'stat', key: 'level', amount: 1 }],
    steps: [
      {
        description: 'Elder Corwin asked me to kill 20 corrupted saplings and bring back 3 resin samples.',
        requirements: [
          { type: 'enemy', enemyId: EnemyID.corruptedSapling, amount: 20 },
          { type: 'item', itemId: ItemID.corruptedResin, amount: 3 },
        ],
      },
    ],
    rewards: [
      { type: 'stat', key: 'experience', amount: 1000 },
      { type: 'stat', key: 'goldCoins', amount: 200 },
    ],
  },
  [QuestID.fetchesAndFangs]: {
    questId: QuestID.fetchesAndFangs,
    startRequirements: [{ type: 'quest', questId: QuestID.signsOfRot, step: QUEST_STEP_AFTER_COMPLETED }],
    steps: [
      {
        description: 'Finn wants me to find the Gnoll Warchief — Corwin needs his fetish to trace the blight.',
        requirements: [
          { type: 'item', itemId: ItemID.blightedFetish, amount: 1 },
        ],
      },
    ],
    rewards: [
      { type: 'stat', key: 'experience', amount: 2500 },
      { type: 'stat', key: 'goldCoins', amount: 500 },
    ],
  },
  [QuestID.theSapThatBurns]: {
    questId: QuestID.theSapThatBurns,
    startRequirements: [{ type: 'quest', questId: QuestID.fetchesAndFangs, step: QUEST_STEP_AFTER_COMPLETED }],
    steps: [
      {
        description: 'Corwin needs cursed sap from 15 treant sprouts to brew a purifying flame.',
        requirements: [
          { type: 'enemy', enemyId: EnemyID.treantSprout, amount: 15 },
          { type: 'item', itemId: ItemID.cursedSap, amount: 5 },
        ],
      },
    ],
    rewards: [
      { type: 'stat', key: 'experience', amount: 3000 },
      { type: 'stat', key: 'goldCoins', amount: 600 },
    ],
  },
  [QuestID.theBlightedHeart]: {
    questId: QuestID.theBlightedHeart,
    startRequirements: [{ type: 'quest', questId: QuestID.theSapThatBurns, step: QUEST_STEP_AFTER_COMPLETED }],
    steps: [
      {
        description: 'The Gnarled Treant must fall. Corwin wants its heartwood.',
        requirements: [
          { type: 'item', itemId: ItemID.blightedHeartwood, amount: 1 },
        ],
      },
    ],
    rewards: [
      { type: 'stat', key: 'experience', amount: 5000 },
      { type: 'stat', key: 'goldCoins', amount: 1000 },
      { type: 'stat', key: 'unspentSkillPoints', amount: 1 },
      { type: 'item', itemId: ItemID.skillPointBook, amount: 1 },
    ],
  },
  // ── Mawood — Sylvie ───────────────────────────────────────────────────────
  [QuestID.silkAndWater]: {
    questId: QuestID.silkAndWater,
    startRequirements: [{ type: 'quest', questId: QuestID.theSapThatBurns, step: QUEST_STEP_AFTER_COMPLETED }],
    steps: [
      {
        description: 'Sylvie needs 15 spider silk and 10 vials of water for her apothecary.',
        requirements: [
          { type: 'item', itemId: ItemID.spiderSilk, amount: 15 },
          { type: 'item', itemId: ItemID.vialOfWater, amount: 10 },
        ],
      },
    ],
    rewards: [
      { type: 'stat', key: 'experience', amount: 800 },
      { type: 'stat', key: 'goldCoins', amount: 150 },
      { type: 'item', itemId: ItemID.skillPointBook, amount: 1 },
    ],
  },
  [QuestID.theInfestation]: {
    questId: QuestID.theInfestation,
    startRequirements: [{ type: 'quest', questId: QuestID.silkAndWater, step: QUEST_STEP_AFTER_COMPLETED }],
    steps: [
      {
        description: 'Push back the spider infestation: kill 40 forest spiders and clear 60 on wave 10 of Elderwood Wilds.',
        requirements: [
          { type: 'enemy', enemyId: EnemyID.forestSpider, amount: 40 },
          { type: 'wave', zoneId: ZoneID.elderwoodWilds, wave: 10, amount: 60 },
        ],
      },
    ],
    rewards: [
      { type: 'stat', key: 'experience', amount: 2000 },
      { type: 'stat', key: 'goldCoins', amount: 400 },
    ],
  },
  // ── Mawood — Finn ─────────────────────────────────────────────────────────
  [QuestID.proveYourAim]: {
    questId: QuestID.proveYourAim,
    startRequirements: [{ type: 'stat', key: 'level', amount: 1 }],
    steps: [
      {
        description: 'Finn wants me to prove my aim — kill 10 gnoll scouts.',
        requirements: [
          { type: 'enemy', enemyId: EnemyID.gnollScout, amount: 10 },
        ],
      },
    ],
    rewards: [
      { type: 'stat', key: 'experience', amount: 1200 },
      { type: 'stat', key: 'goldCoins', amount: 300 },
    ],
  },
  [QuestID.bigGame]: {
    questId: QuestID.bigGame,
    startRequirements: [{ type: 'quest', questId: QuestID.proveYourAim, step: QUEST_STEP_AFTER_COMPLETED }],
    steps: [
      {
        description: 'Finn wants closure: kill 5 forest bears in the Deepwood and bring back 3 pelts.',
        requirements: [
          { type: 'enemy', enemyId: EnemyID.forestBear, amount: 5 },
          { type: 'item', itemId: ItemID.bearPelt, amount: 3 },
        ],
      },
    ],
    rewards: [
      { type: 'stat', key: 'experience', amount: 3500 },
      { type: 'stat', key: 'goldCoins', amount: 700 },
      { type: 'stat', key: 'unspentSkillPoints', amount: 1 },
      { type: 'item', itemId: ItemID.ashwoodBow, amount: 1 },
    ],
  },
  // ── Mawood — Brenna ───────────────────────────────────────────────────────
  [QuestID.rawMaterials]: {
    questId: QuestID.rawMaterials,
    startRequirements: [{ type: 'quest', questId: QuestID.theSapThatBurns, step: QUEST_STEP_AFTER_COMPLETED }],
    steps: [
      {
        description: 'Brenna needs 20 ancient wood and 5 bear pelts for a custom chestplate.',
        requirements: [
          { type: 'item', itemId: ItemID.ancientWood, amount: 20 },
          { type: 'item', itemId: ItemID.bearPelt, amount: 5 },
        ],
      },
    ],
    rewards: [
      { type: 'stat', key: 'experience', amount: 2500 },
      { type: 'stat', key: 'goldCoins', amount: 500 },
      { type: 'item', itemId: ItemID.silverwoodChestplate, amount: 1 },
    ],
  },
  [QuestID.warTrophies]: {
    questId: QuestID.warTrophies,
    startRequirements: [{ type: 'quest', questId: QuestID.rawMaterials, step: QUEST_STEP_AFTER_COMPLETED }],
    steps: [
      {
        description: 'Brenna wants the gnoll war-bands broken — kill the Warchief three times.',
        requirements: [
          { type: 'enemy', enemyId: EnemyID.gnollWarchief, amount: 3 },
        ],
      },
    ],
    rewards: [
      { type: 'stat', key: 'experience', amount: 4000 },
      { type: 'stat', key: 'goldCoins', amount: 800 },
      { type: 'item', itemId: ItemID.skillPointBook, amount: 1 },
    ],
  },
  // ── Mawood — Milo ─────────────────────────────────────────────────────────
  [QuestID.feathersForAKite]: {
    questId: QuestID.feathersForAKite,
    startRequirements: [{ type: 'quest', questId: QuestID.theBlightedHeart, step: QUEST_STEP_AFTER_COMPLETED }],
    steps: [
      {
        description: 'Milo wants 5 harpy feathers for his kite.',
        requirements: [
          { type: 'item', itemId: ItemID.harpyFeather, amount: 5 },
        ],
      },
    ],
    rewards: [
      { type: 'stat', key: 'experience', amount: 1000 },
      { type: 'stat', key: 'goldCoins', amount: 200 },
      { type: 'item', itemId: ItemID.eagleTalon, amount: 1 },
    ],
  },
  [QuestID.whatLurksAtTheTop]: {
    questId: QuestID.whatLurksAtTheTop,
    startRequirements: [{ type: 'quest', questId: QuestID.feathersForAKite, step: QUEST_STEP_AFTER_COMPLETED }],
    steps: [
      {
        description: 'Milo heard something bigger than the harpies — clear 50 on wave 8 of the Upper Canopy and kill the Matriarch.',
        requirements: [
          { type: 'wave', zoneId: ZoneID.upperCanopy, wave: 8, amount: 50 },
          { type: 'enemy', enemyId: EnemyID.harpyMatriarch, amount: 1 },
        ],
      },
    ],
    rewards: [
      { type: 'stat', key: 'experience', amount: 5000 },
      { type: 'stat', key: 'goldCoins', amount: 1000 },
      { type: 'stat', key: 'unspentSkillPoints', amount: 1 },
      { type: 'item', itemId: ItemID.skillPointBook, amount: 1 },
      { type: 'item', itemId: ItemID.harpyCrown, amount: 1 },
    ],
  },
}

export default QUEST_DATA
