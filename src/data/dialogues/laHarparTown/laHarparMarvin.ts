import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'
import { NpcID } from '../../../enums/map/npc-id.enum'

export enum MarvinDialogue {
  default = 0,
  introduction1 = 1,
  introduction2,
  whatIsThisPlace1,
  taskIntro,
  taskClaimed,      // kept at id 5 — used as task-complete node
  taskInProgress,   // id 6
}

export type LaHarparMarvinDialogueType = Record<MarvinDialogue, DialogueNode<MarvinDialogue>>

const NS = 'dialogues/laHarparMarvin'

const LA_HARPAR_MARVIN: LaHarparMarvinDialogueType = {
  [MarvinDialogue.introduction1]: {
    id: MarvinDialogue.introduction1,
    messageKey: `${NS}:introduction1.message`,
    options: [
      {
        responseKey: `${NS}:introduction1.opt1`,
        results: [{ next: MarvinDialogue.introduction2 }],
      },
      {
        responseKey: `${NS}:introduction1.opt2`,
        results: [
          {
            next: MarvinDialogue.default,
            effects: [{ type: 'flag', name: `met_${NpcID.laHarparMarvin}` }],
          },
        ],
      },
    ],
  },

  [MarvinDialogue.introduction2]: {
    id: MarvinDialogue.introduction2,
    messageKey: `${NS}:introduction2.message`,
    options: [
      {
        responseKey: `${NS}:introduction2.opt1`,
        results: [
          {
            next: MarvinDialogue.default,
            effects: [{ type: 'flag', name: `met_${NpcID.laHarparMarvin}` }],
          },
        ],
      },
    ],
  },

  [MarvinDialogue.default]: {
    id: MarvinDialogue.default,
    messageKey: `${NS}:default.message`,
    options: [
      {
        responseKey: `${NS}:default.whatIsThisPlace`,
        results: [{ next: MarvinDialogue.whatIsThisPlace1 }],
      },
      {
        responseKey: `${NS}:default.taskIntro`,
        results: [
          {
            visibilityConditions: [{ type: 'guild', condition: 'taskComplete' }],
            next: MarvinDialogue.taskClaimed,
          },
          {
            visibilityConditions: [{ type: 'guild', condition: 'hasActiveTask' }],
            next: MarvinDialogue.taskInProgress,
          },
          {
            next: MarvinDialogue.taskIntro,
          },
        ],
      },
      {
        responseKey: `${NS}:default.goodbye`,
        results: [{ next: MarvinDialogue.default, closeDialogue: true }],
      },
    ],
  },

  [MarvinDialogue.whatIsThisPlace1]: {
    id: MarvinDialogue.whatIsThisPlace1,
    messageKey: `${NS}:whatIsThisPlace1.message`,
    options: [
      {
        responseKey: `${NS}:whatIsThisPlace1.opt1`,
        results: [{ next: MarvinDialogue.default }],
      },
    ],
  },

  [MarvinDialogue.taskIntro]: {
    id: MarvinDialogue.taskIntro,
    messageKey: `${NS}:taskIntro.message`,
    options: [
      {
        responseKey: `${NS}:taskIntro.short`,
        results: [
          {
            next: MarvinDialogue.default,
            effects: [{ type: 'guild', action: 'acceptTask', taskLength: 'short' }],
          },
        ],
      },
      {
        responseKey: `${NS}:taskIntro.medium`,
        results: [
          {
            next: MarvinDialogue.default,
            effects: [{ type: 'guild', action: 'acceptTask', taskLength: 'medium' }],
          },
        ],
      },
      {
        responseKey: `${NS}:taskIntro.long`,
        results: [
          {
            next: MarvinDialogue.default,
            effects: [{ type: 'guild', action: 'acceptTask', taskLength: 'long' }],
          },
        ],
      },
      {
        responseKey: `${NS}:taskIntro.back`,
        results: [{ next: MarvinDialogue.default }],
      },
    ],
  },

  [MarvinDialogue.taskClaimed]: {
    id: MarvinDialogue.taskClaimed,
    messageKey: `${NS}:taskClaimed.message`,
    options: [
      {
        responseKey: `${NS}:taskClaimed.claim`,
        results: [
          {
            next: MarvinDialogue.default,
            effects: [{ type: 'guild', action: 'claimTask' }],
          },
        ],
      },
      {
        responseKey: `${NS}:taskClaimed.back`,
        results: [{ next: MarvinDialogue.default }],
      },
    ],
  },

  [MarvinDialogue.taskInProgress]: {
    id: MarvinDialogue.taskInProgress,
    messageKey: `${NS}:taskInProgress.message`,
    options: [
      {
        responseKey: `${NS}:taskInProgress.cancel`,
        results: [
          {
            next: MarvinDialogue.default,
            effects: [{ type: 'guild', action: 'abandonTask' }],
          },
        ],
      },
      {
        responseKey: `${NS}:taskInProgress.back`,
        results: [{ next: MarvinDialogue.default }],
      },
    ],
  },
}

export default LA_HARPAR_MARVIN
