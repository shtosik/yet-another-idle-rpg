import { PlayerStat } from '../../types/player/player-stat.type'
import { ItemID } from '../../enums/ids/item-id.enum'
import { QuestID } from '../../enums/ids/quest-id.enum'
import { LaHarparBartenderDialogueType } from './laHarparTown/laHarparBartender'
import { LaHarparElaraDialogueType } from './laHarparTown/laHarparElara'
import { LaHarparJoshDialogueType } from './laHarparTown/laHarparJosh'
import { LaHarparTraderDialogueType } from './laHarparTown/laHarparTrader'
import { LaHarparMarvinDialogueType } from './laHarparTown/laHarparMarvin'

export interface DialogueProps {
  message: string
  options: OptionsProps[]
}

export interface OptionsProps {
  response: string
  next: number
  nextIfQuestStarted?: number
  requiredQuestProgress?: RequiredQuestProgressProps
  specialResponse?: SpecialResponseProps
  closeDialogue?: true
  opensShop?: true
}

export type SpecialResponseProps = SpecialStatResponseProps | SpecialItemResponseProps | SpecialQuestResponseProps;

export interface RequiredQuestProgressProps {
  questId: QuestID
  step: number
}

export interface SpecialStatResponseProps {
  type: 'stat'
  key: PlayerStat
  amount: number
}

export interface SpecialItemResponseProps {
  type: 'item'
  itemId: ItemID
  amount: number
}

export interface SpecialQuestResponseProps {
  type: 'quest'
  questId: QuestID;
  doesStartQuest?: boolean
  doesEndQuest?: boolean
}

export type DialogueType =
  | LaHarparBartenderDialogueType
  | LaHarparElaraDialogueType
  | LaHarparJoshDialogueType
  | LaHarparTraderDialogueType
  | LaHarparMarvinDialogueType
