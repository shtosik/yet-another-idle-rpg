import { QuestID } from '../../enums/ids/quest-id.enum'
import { ItemID } from '../../enums/ids/item-id.enum'
import { PlayerStat } from '../player/player-stat.type'

export type TaskLength = 'short' | 'medium' | 'long'

export type DialogueEffect =
  | QuestEffect
  | StatEffect
  | ItemEffect
  | ShopEffect
  | DialogueFlagEffect
  | GuildEffect

export interface QuestEffect {
  type: 'quest'
  questId: QuestID
  action: 'start' | 'advance' | 'end'
}

export interface StatEffect {
  type: 'stat'
  action: 'award' | 'deduct'
  stats: { stat: PlayerStat, amount: number }[]
}

export interface ItemEffect {
  type: 'item'
  action: 'take' | 'give'
  items: { itemId: ItemID; amount: number }[]
}

export interface ShopEffect {
  type: 'shop'
  shopId: number
  /** Stock stage to open at (default 0): items with a higher `minStage` stay hidden. */
  stage?: number
}

export interface DialogueFlagEffect {
  type: 'flag'
  name: string
}

export interface GuildEffect {
  type: 'guild'
  action: 'acceptTask' | 'abandonTask' | 'claimTask'
  taskLength?: TaskLength
  /** `abandonTask`: index into `activeTasks` of the task to cancel. */
  taskIndex?: number
}
