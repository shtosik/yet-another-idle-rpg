import { QuestID } from '../../../enums/ids/quest-id.enum'
import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'
import { NpcID } from '../../../enums/map/npc-id.enum'
import { ItemID } from '../../../enums/ids/item-id.enum'

export enum laHarparBartenderConversationID {
  default = 0, // Explicitly set to 0 for returning players
  introduction1,
  introduction2,
  whatIsThisPlace1,
  anyWorkForMe1,
  anyoneWhoCanTrainMe1,
  anyoneWhoCanTrainMe2,
  anyWorkForMe2,
}

export type LaHarparBartenderDialogueType = Record<laHarparBartenderConversationID, DialogueNode<laHarparBartenderConversationID>>

const NS = 'dialogues/laHarparBartender'

const LA_HARPAR_BARTENDER: LaHarparBartenderDialogueType = {
  [laHarparBartenderConversationID.introduction1]: {
    id: laHarparBartenderConversationID.introduction1,
    messageKey: `${NS}:introduction1.message`,
    options: [
      {
        responseKey: `${NS}:introduction1.opt1`,
        results: [{ next: laHarparBartenderConversationID.introduction2 }],
      },
      {
        responseKey: `${NS}:introduction1.opt2`,
        results: [
          {
            next: laHarparBartenderConversationID.default,
            effects: [{ type: 'flag', name: `met_${NpcID.laHarparBartender}` }],
          },
        ],
      },
    ],
  },

  [laHarparBartenderConversationID.default]: {
    id: laHarparBartenderConversationID.default,
    messageKey: `${NS}:default.message`,
    options: [
      {
        responseKey: `${NS}:default.meatShortage`,
        results: [
          {
            visibilityConditions: [{ type: 'questStep', questId: QuestID.meatShortage, step: 1, hidden: true }],
            next: laHarparBartenderConversationID.default,
            requirementsNeeded: [{ type: 'item', itemId: ItemID.crabMeat, amount: 50 }],
            effects: [{ type: 'quest', action: 'end', questId: QuestID.meatShortage }],
          },
        ],
      },
      {
        responseKey: `${NS}:default.whatIsThisPlace`,
        results: [
          {
            next: laHarparBartenderConversationID.whatIsThisPlace1,
            effects: [{ type: 'stat', stats: [{ stat: 'goldCoins', amount: -20 }] }],
          },
        ],
      },
      {
        responseKey: `${NS}:default.anyWork`,
        results: [
          {
            visibilityConditions: [{ type: 'questStep', questId: QuestID.meatShortage, step: 1 }],
            next: laHarparBartenderConversationID.anyWorkForMe2,
          },
          {
            next: laHarparBartenderConversationID.anyWorkForMe1,
            effects: [{ type: 'stat', stats: [{ stat: 'goldCoins', amount: -40 }] }],
          },
        ],
      },
      {
        responseKey: `${NS}:default.anyTrainer`,
        results: [
          {
            next: laHarparBartenderConversationID.anyoneWhoCanTrainMe1,
            effects: [{ type: 'stat', stats: [{ stat: 'goldCoins', amount: -60 }] }],
          },
        ],
      },
      {
        responseKey: `${NS}:default.goodbye`,
        results: [
          {
            next: laHarparBartenderConversationID.default,
            closeDialogue: true,
          },
        ],
      },
    ],
  },
  [laHarparBartenderConversationID.anyWorkForMe1]: {
    id: laHarparBartenderConversationID.anyWorkForMe1,
    messageKey: `${NS}:anyWorkForMe1.message`,
    options: [
      {
        responseKey: `${NS}:anyWorkForMe1.accept`,
        results: [
          {
            next: laHarparBartenderConversationID.default,
            effects: [{ type: 'quest', action: 'start', questId: QuestID.meatShortage }],
          },
        ],
      },
      {
        responseKey: `${NS}:anyWorkForMe1.decline`,
        results: [{ next: laHarparBartenderConversationID.default }],
      },
    ],
  },

  [laHarparBartenderConversationID.introduction2]: {
    id: laHarparBartenderConversationID.introduction2,
    messageKey: `${NS}:introduction2.message`,
    options: [
      {
        responseKey: `${NS}:introduction2.opt1`,
        results: [
          {
            next: laHarparBartenderConversationID.default,
            effects: [{ type: 'flag', name: `met_${NpcID.laHarparBartender}` }],
          },
        ],
      },
    ],
  },
  [laHarparBartenderConversationID.whatIsThisPlace1]: {
    id: laHarparBartenderConversationID.whatIsThisPlace1,
    messageKey: `${NS}:whatIsThisPlace1.message`,
    options: [
      {
        responseKey: `${NS}:whatIsThisPlace1.opt1`,
        results: [{ next: laHarparBartenderConversationID.default }],
      },
    ],
  },
  [laHarparBartenderConversationID.anyoneWhoCanTrainMe1]: {
    id: laHarparBartenderConversationID.anyoneWhoCanTrainMe1,
    messageKey: `${NS}:anyoneWhoCanTrainMe1.message`,
    options: [
      {
        responseKey: `${NS}:anyoneWhoCanTrainMe1.opt1`,
        results: [{ next: laHarparBartenderConversationID.default }],
      },
      {
        responseKey: `${NS}:anyoneWhoCanTrainMe1.opt2`,
        results: [{ next: laHarparBartenderConversationID.anyoneWhoCanTrainMe2 }],
      },
    ],
  },
  [laHarparBartenderConversationID.anyoneWhoCanTrainMe2]: {
    id: laHarparBartenderConversationID.anyoneWhoCanTrainMe2,
    messageKey: `${NS}:anyoneWhoCanTrainMe2.message`,
    options: [
      {
        responseKey: `${NS}:anyoneWhoCanTrainMe2.opt1`,
        results: [{ next: laHarparBartenderConversationID.default, closeDialogue: true }],
      },
    ],
  },
  [laHarparBartenderConversationID.anyWorkForMe2]: {
    id: laHarparBartenderConversationID.anyWorkForMe2,
    messageKey: `${NS}:anyWorkForMe2.message`,
    options: [
      {
        responseKey: `${NS}:anyWorkForMe2.opt1`,
        results: [{ next: laHarparBartenderConversationID.default, closeDialogue: true }],
      },
    ],
  },
}

export default LA_HARPAR_BARTENDER
