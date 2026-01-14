import { QuestID } from '../enums/ids/quest-id.enum'
import { PlayerStat } from '../types/player/player-stat.type'
import { ItemID } from '../enums/ids/item-id.enum'
import { ZoneID } from '../enums/ids/zone-id.enum'
import { EnemyID } from '../enums/ids/enemy-id.enum'

export interface QuestProps {
    questId: QuestID
    rewards: Array<StatReward | ItemReward>
    steps: QuestStepProps[]
}

export type QuestStepProps = {
    description: string;
    requirement: RequirementProps;
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
        steps: [
            { description: '', requirement: { type: 'stat', key: 'level', amount: 1 } },
            {
                description: 'Bartender in La Harpar tavern asked me to bring her 30 crab meat.',
                requirement: { type: 'item', itemId: ItemID.crabMeat, amount: 30 },
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
        steps: [
            { description: '', requirement: { type: 'stat', key: 'level', amount: 1 } },
            {
                description: 'I\'m supposed to kill 50 enemies on wave 7 on Horseshoe Beach.',
                requirement: { type: 'wave', zoneId: 1, wave: 7, amount: 50 },
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
        steps: [
            { description: '', requirement: { type: 'stat', key: 'level', amount: 1 } },
            {
                description: 'La Harpar\'s trader asked me to get rid of pests in his basement. 50 should be enough.',
                requirement: { type: 'enemy', enemyId: EnemyID.rat, amount: 50 },
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
        steps: [
            { description: '', requirement: { type: 'stat', key: 'level', amount: 1 } },
            {
                description: 'Elara is looking for her father, Captain Theron Tidecaller. I need to find some clues',
                requirement: { type: 'item', itemId: ItemID.captainsLetter, amount: 1 },
            },
        ],
        rewards: [],
    },
}

export default QUEST_DATA
