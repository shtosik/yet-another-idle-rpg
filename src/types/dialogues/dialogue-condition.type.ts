import { QuestID } from '../../enums/ids/quest-id.enum'
import { PlayerStat } from '../player/player-stat.type'
import { EnemyID } from '../../enums/ids/enemy-id.enum'
import { ItemID } from '../../enums/ids/item-id.enum'
import { QuestState } from '../../enums/quest-state.enum'
import { ZoneID } from '../../enums/ids/zone-id.enum'
import { TurnInKey } from '../../app/store/quests/turn-in-cooldown'
import { ProfessionLevelRequirement, ReputationRequirement } from '../../data/quests-data'

/** `not` flips the result: the condition passes when it would fail. */
export type DialogueCondition = { hidden?: boolean, not?: boolean } & (
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
  | GuildCondition
  | FlagCondition
  | ArenaCondition
  | ReputationRequirement
  | ProfessionLevelRequirement
  | TurnInCooldownCondition
  | FarmSeedsCondition
  )

/** The seed tally (all seeds counted, held or not yet usable) holds at least `atLeast` seeds in total. */
interface FarmSeedsCondition {
  type: 'farmSeeds'
  atLeast: number
}

/** A turn-in (`TurnInKey`) is off cooldown (`ready`) or still cooling. Shows "Ready in …" while cooling. */
interface TurnInCooldownCondition {
  type: 'turnInCooldown'
  key: TurnInKey
  state: 'ready' | 'cooling'
}

/** Ready to enter (no run, cooldown over) / a run going on / clear rewards waiting to be claimed. */
interface ArenaCondition {
  type: 'arena'
  state: 'ready' | 'running' | 'rewardsWaiting'
}

/** A dialogue flag (set by a `flag` effect) is set, or with `isSet: false`, not set yet. */
interface FlagCondition {
  type: 'flag'
  name: string
  isSet: boolean
}

interface QuestCondition {
  type: 'quest'
  questId: QuestID
  questState: QuestState
  step?: number // only QuestState.active and QuestState.readyToAdvance
}

interface ManyQuestsCondition {
  type: 'manyQuestCompleted'
  questsRequired: {
    questId: QuestID
    questState: QuestState
    step?: number  // only QuestState.active and QuestState.readyToAdvance
  }[]
}

interface StatCondition {
  type: 'stat'
  stat: PlayerStat
  comparison: 'gte' | 'lte'
  amount: number
}

interface ManyStatsCondition {
  type: 'manyStat'
  statsRequired: {
    stat: PlayerStat
    comparison: 'gte' | 'lte'
    amount: number
  }[]
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
  }[]
}

interface ItemCondition {
  type: 'item'
  itemId: ItemID
  amount: number
}

interface GuildCondition {
  type: 'guild'
  /**
   * Any task in progress / any task finished / no tasks / room for another task (`maxTaskSlots`) /
   * the task at `taskIndex` in `activeTasks` exists and is unfinished.
   */
  condition: 'hasActiveTask' | 'taskComplete' | 'noActiveTask' | 'hasFreeTaskSlot' | 'taskInProgressAt'
  taskIndex?: number
}

interface ManyItemsCondition {
  type: 'manyItems',
  itemIds: ItemID[]
  amounts: Partial<Record<ItemID, number>>
}
