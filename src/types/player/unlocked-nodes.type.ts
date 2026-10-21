import { SkillNodeID } from '../../enums/ids/skill-node-id.enum';

type UnlockedAmount = number

export type UnlockedNodes = Partial<Record<SkillNodeID, UnlockedAmount>>
