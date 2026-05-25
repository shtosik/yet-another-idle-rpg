import { ItemID } from 'enums/ids/item-id.enum'
import { QuestID } from 'enums/ids/quest-id.enum'

export type EnemyDrop = {
    id: ItemID
    minAmount: number
    maxAmount: number
    chance: number
    requiredActiveQuestId?: QuestID
}
