import { SkillPointID } from 'enums/ids/skill-tree-node-id.enum'

export interface RespecConfig {
    perPointGoldCost: number
    fullResetGoldCost: (state: { allocatedPointCount: number }) => number
}

export interface SkillTree {
    rootNodeId: SkillPointID
    nodes: ReadonlyArray<SkillPointID>
    respec: RespecConfig
}
