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
  action: 'start' | 'advance' | 'end' | 'fail'
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
}

export interface DialogueFlagEffect {
  type: 'flag'
  name: string
}

export interface GuildEffect {
  type: 'guild'
  action: 'acceptTask' | 'abandonTask' | 'claimTask'
  taskLength?: TaskLength
}
