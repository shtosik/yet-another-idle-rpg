import { SkillPointID } from 'enums/ids/skill-tree-node-id.enum'
import { SkillRegion } from 'enums/ids/skill-region.enum'
import { SpellID } from 'enums/ids/spell-id.enum'
import { SkillPointType } from 'enums/skill-point-type.enum'
import { PlayerStat } from 'types/player/player-stat.type'

export interface SkillPointPosition {
    x: number
    y: number
}

export type UnlockRequirement =
    | { kind: 'node'; id: SkillPointID; minLevel: number }
    | { kind: 'all'; of: UnlockRequirement[] }
    | { kind: 'any'; of: UnlockRequirement[] }

export interface SkillPoint {
    id: SkillPointID
    region: SkillRegion
    // Layout strategy (resolved at module load by skill-tree-graph):
    //   - explicit `position` wins (origin, or unconnected special nodes)
    //   - else if single node prereq: chain-inherit direction from prereq + (turn ?? 0), step by STEP_DISTANCE
    //   - else if multiple prereqs: auto-midpoint of all prereqs' positions
    //   - else: authoring error
    position?: SkillPointPosition
    turn?: number
    skillPointCost: number
    maxLevel: number
    unlockRequirements: UnlockRequirement | null
    url: string
    type: SkillPointType
    stat?: PlayerStat
    statAmount?: number
    special?: boolean
    spellId?: SpellID
}
