import { SkillNodeID } from 'enums/ids/skill-node-id.enum'

export interface RespecConfig {
    perPointGoldCost: number
    fullResetGoldCost: (state: { allocatedPointCount: number }) => number
}

export interface SkillTree {
    rootNodeId: SkillNodeID
    nodes: ReadonlyArray<SkillNodeID>
    respec: RespecConfig
}
