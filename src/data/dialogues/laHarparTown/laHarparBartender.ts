import { QuestID } from '../../../enums/ids/quest-id.enum'
import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'
import { NpcID } from '../../../enums/map/npc-id.enum'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { QuestState } from '../../../enums/quest-state.enum'

export enum BartenderDialogue {
  default = 0, // Explicitly set to 0 for returning players
  introduction1,
  introduction2,
  whatIsThisPlace1,
  anyWorkForMe1,
  anyoneWhoCanTrainMe1,
  anyoneWhoCanTrainMe2,
  anyWorkForMe2,
}

export type LaHarparBartenderDialogueType = Record<BartenderDialogue, DialogueNode<BartenderDialogue>>

const NS = 'dialogues/laHarparBartender'

const LA_HARPAR_BARTENDER: LaHarparBartenderDialogueType = {
  [BartenderDialogue.introduction1]: {
    id: BartenderDialogue.introduction1,
    messageKey: `${NS}:introduction1.message`,
    options: [
      {
        responseKey: `${NS}:introduction1.opt1`,
        results: [{ next: BartenderDialogue.introduction2 }],
      },
      {
        responseKey: `${NS}:introduction1.opt2`,
        results: [
          {
            next: BartenderDialogue.default,
            effects: [{ type: 'flag', name: `met_${NpcID.laHarparBartender}` }],
          },
        ],
      },
    ],
  },

  [BartenderDialogue.default]: {
    id: BartenderDialogue.default,
    messageKey: `${NS}:default.message`,
    options: [
      {
        responseKey: `${NS}:default.meatShortage`,
        results: [
          {
            visibilityConditions: [
              {
                type: 'quest',
                questId: QuestID.meatShortage,
                step: 1,
                questState: QuestState.readyToAdvance,
              },
            ],
            next: BartenderDialogue.default,
            requirementsNeeded: [{ type: 'item', itemId: ItemID.crabMeat, amount: 50 }],
            effects: [
              { type: 'quest', action: 'advance', questId: QuestID.meatShortage },
              { type: 'item', action: 'take', items: [{ itemId: ItemID.crabMeat, amount: 50 }] },
            ],
          },
        ],
      },
      {
        responseKey: `${NS}:default.whatIsThisPlace`,
        results: [
          {
            next: BartenderDialogue.whatIsThisPlace1,
            effects: [{ type: 'stat', action: 'deduct', stats: [{ stat: 'goldCoins', amount: 20 }] }],
          },
        ],
      },
      {
        responseKey: `${NS}:default.anyWork`,
        results: [
          {
            visibilityConditions: [
              {
                type: 'quest',
                questId: QuestID.meatShortage,
                questState: QuestState.readyToAdvance,
                step: 1,
              },
            ],
            next: BartenderDialogue.anyWorkForMe2,
          },
          {
            next: BartenderDialogue.anyWorkForMe1,
            effects: [{ type: 'stat', action: 'deduct', stats: [{ stat: 'goldCoins', amount: 40 }] }],
          },
        ],
      },
      {
        responseKey: `${NS}:default.anyTrainer`,
        results: [
          {
            next: BartenderDialogue.anyoneWhoCanTrainMe1,
            effects: [{ type: 'stat', action: 'deduct', stats: [{ stat: 'goldCoins', amount: 60 }] }],
          },
        ],
      },
      {
        responseKey: `${NS}:default.goodbye`,
        results: [
          {
            next: BartenderDialogue.default,
            closeDialogue: true,
          },
        ],
      },
    ],
  },
  [BartenderDialogue.anyWorkForMe1]: {
    id: BartenderDialogue.anyWorkForMe1,
    messageKey: `${NS}:anyWorkForMe1.message`,
    options: [
      {
        responseKey: `${NS}:anyWorkForMe1.accept`,
        results: [
          {
            next: BartenderDialogue.default,
            effects: [{ type: 'quest', action: 'start', questId: QuestID.meatShortage }],
          },
        ],
      },
      {
        responseKey: `${NS}:anyWorkForMe1.decline`,
        results: [{ next: BartenderDialogue.default }],
      },
    ],
  },

  [BartenderDialogue.introduction2]: {
    id: BartenderDialogue.introduction2,
    messageKey: `${NS}:introduction2.message`,
    options: [
      {
        responseKey: `${NS}:introduction2.opt1`,
        results: [
          {
            next: BartenderDialogue.default,
            effects: [{ type: 'flag', name: `met_${NpcID.laHarparBartender}` }],
          },
        ],
      },
    ],
  },
  [BartenderDialogue.whatIsThisPlace1]: {
    id: BartenderDialogue.whatIsThisPlace1,
    messageKey: `${NS}:whatIsThisPlace1.message`,
    options: [
      {
        responseKey: `${NS}:whatIsThisPlace1.opt1`,
        results: [{ next: BartenderDialogue.default }],
      },
    ],
  },
  [BartenderDialogue.anyoneWhoCanTrainMe1]: {
    id: BartenderDialogue.anyoneWhoCanTrainMe1,
    messageKey: `${NS}:anyoneWhoCanTrainMe1.message`,
    options: [
      {
        responseKey: `${NS}:anyoneWhoCanTrainMe1.opt1`,
        results: [{ next: BartenderDialogue.default }],
      },
      {
        responseKey: `${NS}:anyoneWhoCanTrainMe1.opt2`,
        results: [{ next: BartenderDialogue.anyoneWhoCanTrainMe2 }],
      },
    ],
  },
  [BartenderDialogue.anyoneWhoCanTrainMe2]: {
    id: BartenderDialogue.anyoneWhoCanTrainMe2,
    messageKey: `${NS}:anyoneWhoCanTrainMe2.message`,
    options: [
      {
        responseKey: `${NS}:anyoneWhoCanTrainMe2.opt1`,
        results: [{ next: BartenderDialogue.default, closeDialogue: true }],
      },
    ],
  },
  [BartenderDialogue.anyWorkForMe2]: {
    id: BartenderDialogue.anyWorkForMe2,
    messageKey: `${NS}:anyWorkForMe2.message`,
    options: [
      {
        responseKey: `${NS}:anyWorkForMe2.opt1`,
        results: [{ next: BartenderDialogue.default, closeDialogue: true }],
      },
    ],
  },
}

export default LA_HARPAR_BARTENDER
