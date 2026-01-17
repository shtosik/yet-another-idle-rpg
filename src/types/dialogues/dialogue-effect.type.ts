import { QuestID } from '../../enums/ids/quest-id.enum'
import { PlayerStat } from '../player/player-stat.type'

export type DialogueEffect =
  | QuestEffect
  | StatEffect
  | ShopEffect
  | DialogueFlagEffect

export interface QuestEffect {
  type: 'quest'
  questId: QuestID
  action: 'start' | 'advance' | 'end'
}

export interface StatEffect {
  type: 'stat'
  stats: { stat: PlayerStat, amount: number }[]
}

export interface ShopEffect {
  type: 'shop'
  shopId: number
}

export interface DialogueFlagEffect {
  type: 'flag'
  name: string
}
