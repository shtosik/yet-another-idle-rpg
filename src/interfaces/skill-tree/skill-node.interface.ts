import { SkillNodeID } from 'enums/ids/skill-node-id.enum'
import { SkillBranch } from 'enums/ids/skill-branch.enum'
import { SpellID } from 'enums/ids/spell-id.enum'
import { SkillNodeType } from 'enums/skill-node-type.enum'
import { PlayerStat } from 'types/player/player-stat.type'

export interface SkillNodePosition {
    x: number
    y: number
}

export type NodeRequirement =
    | { kind: 'node'; id: SkillNodeID; minLevel: number }
    | { kind: 'all'; of: NodeRequirement[] }
    | { kind: 'any'; of: NodeRequirement[] }

export interface SkillNode {
    id: SkillNodeID
    branch: SkillBranch
    // Layout strategy (resolved at module load by skill-tree-graph):
    //   - explicit `position` wins (origin, or unconnected special nodes)
    //   - else if single node prereq: chain-inherit direction from prereq + (turn ?? 0), step by STEP_DISTANCE
    //   - else if multiple prereqs: auto-midpoint of all prereqs' positions
    //   - else: authoring error
    position?: SkillNodePosition
    turn?: number
    skillPointCost: number
    maxLevel: number
    requires: NodeRequirement | null
    url: string
    type: SkillNodeType
    stat?: PlayerStat
    statAmount?: number
    /** `statAmount` per level is a fraction of the stat (0.1 = 10% better), applied after flat modifiers. */
    statPercent?: boolean
    special?: boolean
    spellId?: SpellID
}
