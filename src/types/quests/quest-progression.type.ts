import { QuestID } from '../../enums/ids/quest-id.enum'

export type QuestStep = number

export type QuestProgression = Partial<Record<QuestID, QuestStep>>
