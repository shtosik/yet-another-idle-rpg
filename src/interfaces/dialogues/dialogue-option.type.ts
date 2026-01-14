import { DialogueCondition } from '../../types/dialogues/dialogue-condition.type'
import { DialogueEffect } from '../../types/dialogues/dialogue-effect.type'

export interface DialogueOption<T> {
    responseKey: string // i18n key
    next?: T
    conditions?: DialogueCondition[]
    effects?: DialogueEffect
    closeDialogue?: boolean
    alternativeDialogueNext?: DialogueCondition & { next: number }
}
