import { DialogueCondition } from '../../types/dialogues/dialogue-condition.type'
import { DialogueEffect } from '../../types/dialogues/dialogue-effect.type'

export interface DialogueOption<T> {
  responseKey: string // i18n key
  next?: T
  results: DialogueResult<T>[]
}

export interface DialogueResult<T> {
  next?: T
  closeDialogue?: boolean
  visibilityConditions?: DialogueCondition[]
  requirementsNeeded?: DialogueCondition[]
  effects?: DialogueEffect[]
}
