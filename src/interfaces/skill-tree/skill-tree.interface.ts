import { SkillNodeID } from 'enums/ids/skill-node-id.enum'

export interface RespecConfig {
    goldCostPerLevel: number
    fullResetGoldCost: (state: { allocatedLevels: number }) => number
}

export interface SkillTree {
    rootNodeId: SkillNodeID
    nodes: ReadonlyArray<SkillNodeID>
    respec: RespecConfig
}
