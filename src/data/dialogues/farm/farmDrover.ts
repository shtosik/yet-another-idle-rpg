import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'

// Stub: the real tree (Wick's order hub) comes with C10.
export enum DroverDialogue {
  default = 0,
}

export type FarmDroverDialogueType = Record<DroverDialogue, DialogueNode<DroverDialogue>>

const NS = 'dialogues/farmDrover'

const FARM_DROVER: FarmDroverDialogueType = {
  [DroverDialogue.default]: {
    id: DroverDialogue.default,
    messageKey: `${NS}:default.message`,
    options: [{ responseKey: `${NS}:default.bye`, results: [{ closeDialogue: true }] }],
  },
}

export default FARM_DROVER
