import { QuestID } from '../../enums/ids/quest-id.enum'
import { PlayerStat } from '../player/player-stat.type'
import { EnemyID } from '../../enums/ids/enemy-id.enum'
import { ItemID } from '../../enums/ids/item-id.enum'
import { QuestState } from '../../enums/quest-state.enum'
import { ZoneID } from '../../enums/ids/zone-id.enum'

export type DialogueCondition = { hidden?: boolean } & (
  | QuestCondition
  | StatCondition
  | EnemyKillCountCondition
  | ManyEnemiesKillCountCondition
  | ItemCondition
  | ManyItemsCondition
  | ManyStatsCondition
  | ManyQuestsCondition
  | WaveKillCountCondition
  | ManyWavesKillCountCondition
  )

interface QuestCondition {
  type: 'quest'
  questId: QuestID
  questState: QuestState
  step?: number // only QuestState.active
}

interface ManyQuestsCondition {
  type: 'manyQuestCompleted'
  questsRequired: {
    questId: QuestID
    questState: QuestState
    step?: number  // only QuestState.active
  }[]
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

interface EnemyKillCountCondition {
  type: 'killCount'
  enemyId: EnemyID
  amount: number
}

interface ManyEnemiesKillCountCondition {
  type: 'manyKillCount'
  enemiesRequired: {
    enemyId: EnemyID
    amount: number
  }[]
}

interface WaveKillCountCondition {
  type: 'waveKillCount'
  zoneId: ZoneID
  waveNumber: number
  amount: number
}

interface ManyWavesKillCountCondition {
  type: 'manyWaveKillCount'
  wavesRequired: {
    zoneId: ZoneID
    waveNumber: number
    amount: number
  }
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
