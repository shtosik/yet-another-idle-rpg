import { QuestID } from '../../enums/ids/quest-id.enum'
import { PlayerStat } from '../player/player-stat.type'
import { EnemyID } from '../../enums/ids/enemy-id.enum'
import { ItemID } from '../../enums/ids/item-id.enum'

export type DialogueCondition = { hidden?: boolean } & (
  | QuestCompletedCondition
  | QuestStepCondition
  | StatCondition
  | KillCountCondition
  | ManyKillCountCondition
  | ItemCondition
  | ManyItemsCondition
  | ManyStatsCondition
  | ManyQuestsCompletedCondition
  )

interface QuestCompletedCondition {
  type: 'questCompleted'
  questId: QuestID
}

interface ManyQuestsCompletedCondition {
  type: 'manyQuestCompleted'
  questIds: QuestID[]
}

interface QuestStepCondition {
  type: 'questStep'
  questId: QuestID
  step: number
}

interface StatCondition {
  type: 'stat'
  key: PlayerStat
  comparison: 'gte' | 'lte'
  amount: number
}

interface ManyStatsCondition {
  type: 'manyStat'
  key: PlayerStat[]
  comparisons: Partial<Record<PlayerStat, 'gte' | 'lte'>>
  amounts: number
}

interface KillCountCondition {
  type: 'killCount'
  enemyId: EnemyID
  amount: number
}

interface ManyKillCountCondition {
  type: 'manyKillCount',
  enemyIds: EnemyID[]
  amounts: Partial<Record<EnemyID, number>>
}

interface ItemCondition {
  type: 'item'
  itemId: ItemID
  amount: number
}

interface ManyItemsCondition {
  type: 'manyItems',
  itemIds: ItemID[]
  amounts: Partial<Record<ItemID, number>>
}
