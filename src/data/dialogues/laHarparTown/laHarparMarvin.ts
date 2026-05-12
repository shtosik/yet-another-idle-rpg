import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'
import { NpcID } from '../../../enums/map/npc-id.enum'

export enum LaHarparMarvinConversationID {
  default = 0,
  introduction1,
  introduction2,
  whatIsThisPlace1,
  taskIntro,
  taskClaimed,
}

export type LaHarparMarvinDialogueType = Record<LaHarparMarvinConversationID, DialogueNode<LaHarparMarvinConversationID>>

const NS = 'dialogues/laHarparMarvin'

const LA_HARPAR_MARVIN: LaHarparMarvinDialogueType = {
  [LaHarparMarvinConversationID.introduction1]: {
    id: LaHarparMarvinConversationID.introduction1,
    messageKey: `${NS}:introduction1.message`,
    options: [
      {
        responseKey: `${NS}:introduction1.opt1`,
        results: [{ next: LaHarparMarvinConversationID.introduction2 }],
      },
      {
        responseKey: `${NS}:introduction1.opt2`,
        results: [
          {
            next: LaHarparMarvinConversationID.default,
            effects: [{ type: 'flag', name: `met_${NpcID.laHarparMarvin}` }],
          },
        ],
      },
    ],
  },

  [LaHarparMarvinConversationID.introduction2]: {
    id: LaHarparMarvinConversationID.introduction2,
    messageKey: `${NS}:introduction2.message`,
    options: [
      {
        responseKey: `${NS}:introduction2.opt1`,
        results: [
          {
            next: LaHarparMarvinConversationID.default,
            effects: [{ type: 'flag', name: `met_${NpcID.laHarparMarvin}` }],
          },
        ],
      },
    ],
  },

  [LaHarparMarvinConversationID.default]: {
    id: LaHarparMarvinConversationID.default,
    messageKey: `${NS}:default.message`,
    options: [
      {
        responseKey: `${NS}:default.whatIsThisPlace`,
        results: [
          { next: LaHarparMarvinConversationID.whatIsThisPlace1 },
        ],
      },
      {
        responseKey: `${NS}:default.taskIntro`,
        results: [
          { next: LaHarparMarvinConversationID.taskIntro },
        ],
      },
      {
        responseKey: `${NS}:default.goodbye`,
        results: [
          { next: LaHarparMarvinConversationID.default, closeDialogue: true },
        ],
      },
    ],
  },

  [LaHarparMarvinConversationID.whatIsThisPlace1]: {
    id: LaHarparMarvinConversationID.whatIsThisPlace1,
    messageKey: `${NS}:whatIsThisPlace1.message`,
    options: [
      {
        responseKey: `${NS}:whatIsThisPlace1.opt1`,
        results: [{ next: LaHarparMarvinConversationID.default }],
      },
    ],
  },

  [LaHarparMarvinConversationID.taskIntro]: {
    id: LaHarparMarvinConversationID.taskIntro,
    messageKey: `${NS}:taskIntro.message`,
    options: [
      {
        responseKey: `${NS}:taskIntro.opt1`,
        results: [{ next: LaHarparMarvinConversationID.default, closeDialogue: true }],
      },
    ],
  },

  [LaHarparMarvinConversationID.taskClaimed]: {
    id: LaHarparMarvinConversationID.taskClaimed,
    messageKey: `${NS}:taskClaimed.message`,
    options: [
      {
        responseKey: `${NS}:taskClaimed.opt1`,
        results: [{ next: LaHarparMarvinConversationID.default, closeDialogue: true }],
      },
    ],
  },
}

export default LA_HARPAR_MARVIN
