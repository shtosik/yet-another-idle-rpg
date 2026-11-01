import { QuestID } from '../../../enums/ids/quest-id.enum'
import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'
import { NpcID } from '../../../enums/map/npc-id.enum'
import { QuestState } from '../../../enums/quest-state.enum'
import { DialogueCondition } from '../../../types/dialogues/dialogue-condition.type'
import { TownID } from '../../../enums/map/town-id.enum'
import { ReputationTier } from '../../../enums/reputation-tier.enum'

export enum BartenderDialogue {
  default = 0, // Explicitly set to 0 for returning players
  introduction1,
  introduction2,
  whatIsThisPlace1,
  anyWorkForMe1,
  anyoneWhoCanTrainMe1,
  anyoneWhoCanTrainMe2,
  anyWorkForMe2,
  whatIsThisPlaceFree,
  onTheHouse,
  questLastOrders,
  questLastOrdersProgress,
  questLastOrdersComplete,
}

export type LaHarparBartenderDialogueType = Record<BartenderDialogue, DialogueNode<BartenderDialogue>>

const NS = 'dialogues/laHarparBartender'
const PAID_FOR_WORK_FLAG = 'bartender_paid_for_work'
const PAID_FOR_PLACE_FLAG = 'bartender_paid_for_place'
const PAID_FOR_TRAINER_FLAG = 'bartender_paid_for_trainer'
/** At La Harpar Friendly he answers for free. */
const LA_HARPAR_FRIENDLY: DialogueCondition = { type: 'reputation', townId: TownID.laHarpar, tier: ReputationTier.friendly, hidden: true }
const LA_HARPAR_REVERED: DialogueCondition = { type: 'reputation', townId: TownID.laHarpar, tier: ReputationTier.revered, hidden: true }

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
            effects: [
              { type: 'quest', action: 'advance', questId: QuestID.meatShortage },
            ],
          },
        ],
      },
      {
        responseKey: `${NS}:default.whatIsThisPlace`,
        // Each paid answer costs gold once; asking again is free.
        results: [
          { visibilityConditions: [LA_HARPAR_FRIENDLY], next: BartenderDialogue.whatIsThisPlaceFree },
          {
            visibilityConditions: [{ type: 'flag', name: PAID_FOR_PLACE_FLAG, isSet: false }],
            next: BartenderDialogue.whatIsThisPlace1,
            effects: [
              { type: 'stat', action: 'deduct', stats: [{ stat: 'goldCoins', amount: 20 }] },
              { type: 'flag', name: PAID_FOR_PLACE_FLAG },
            ],
          },
          { next: BartenderDialogue.whatIsThisPlace1 },
        ],
      },
      {
        responseKey: `${NS}:default.anyWork`,
        results: [
          // Last Orders (La Harpar Revered): above the paid tip, so it never charges
          { visibilityConditions: [{ type: 'quest', questId: QuestID.lastOrders, questState: QuestState.readyToAdvance, step: 1 }], next: BartenderDialogue.questLastOrdersComplete },
          { visibilityConditions: [{ type: 'quest', questId: QuestID.lastOrders, questState: QuestState.active }], next: BartenderDialogue.questLastOrdersProgress },
          { visibilityConditions: [{ type: 'quest', questId: QuestID.lastOrders, questState: QuestState.available }], next: BartenderDialogue.questLastOrders },
          // The 40-gold tip is paid once; after that he repeats the offer for free.
          {
            visibilityConditions: [
              { type: 'quest', questId: QuestID.meatShortage, questState: QuestState.available },
              LA_HARPAR_FRIENDLY,
            ],
            next: BartenderDialogue.anyWorkForMe1,
          },
          {
            visibilityConditions: [
              { type: 'quest', questId: QuestID.meatShortage, questState: QuestState.available },
              { type: 'flag', name: PAID_FOR_WORK_FLAG, isSet: false },
            ],
            next: BartenderDialogue.anyWorkForMe1,
            effects: [
              { type: 'stat', action: 'deduct', stats: [{ stat: 'goldCoins', amount: 40 }] },
              { type: 'flag', name: PAID_FOR_WORK_FLAG },
            ],
          },
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.meatShortage, questState: QuestState.available }],
            next: BartenderDialogue.anyWorkForMe1,
          },
          // Started or completed: nothing new
          {
            next: BartenderDialogue.anyWorkForMe2,
          },
        ],
      },
      {
        responseKey: `${NS}:default.anyTrainer`,
        results: [
          { visibilityConditions: [LA_HARPAR_FRIENDLY], next: BartenderDialogue.anyoneWhoCanTrainMe1 },
          {
            visibilityConditions: [{ type: 'flag', name: PAID_FOR_TRAINER_FLAG, isSet: false }],
            next: BartenderDialogue.anyoneWhoCanTrainMe1,
            effects: [
              { type: 'stat', action: 'deduct', stats: [{ stat: 'goldCoins', amount: 60 }] },
              { type: 'flag', name: PAID_FOR_TRAINER_FLAG },
            ],
          },
          { next: BartenderDialogue.anyoneWhoCanTrainMe1 },
        ],
      },
      {
        responseKey: `${NS}:default.onTheHouse`,
        results: [{ visibilityConditions: [LA_HARPAR_REVERED], next: BartenderDialogue.onTheHouse }],
      },
      {
        responseKey: 'quests:reputation.turnInOne',
        results: [{ next: BartenderDialogue.default, effects: [{ type: 'reputationTurnIn', npcId: NpcID.laHarparBartender, bundles: 'one' }] }],
      },
      {
        responseKey: 'quests:reputation.turnInAll',
        results: [{ next: BartenderDialogue.default, effects: [{ type: 'reputationTurnIn', npcId: NpcID.laHarparBartender, bundles: 'all' }] }],
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
  [BartenderDialogue.whatIsThisPlaceFree]: {
    id: BartenderDialogue.whatIsThisPlaceFree,
    messageKey: `${NS}:whatIsThisPlaceFree.message`,
    options: [
      {
        responseKey: `${NS}:whatIsThisPlace1.opt1`,
        results: [{ next: BartenderDialogue.default }],
      },
    ],
  },
  [BartenderDialogue.onTheHouse]: {
    id: BartenderDialogue.onTheHouse,
    messageKey: `${NS}:onTheHouse.message`,
    options: [
      {
        responseKey: `${NS}:onTheHouse.opt1`,
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
  [BartenderDialogue.questLastOrders]: {
    id: BartenderDialogue.questLastOrders,
    messageKey: `${NS}:questLastOrders.message`,
    options: [
      { responseKey: `${NS}:questLastOrders.opt1`, results: [{ next: BartenderDialogue.default, effects: [{ type: 'quest', action: 'start', questId: QuestID.lastOrders }] }] },
      { responseKey: `${NS}:questLastOrders.opt2`, results: [{ next: BartenderDialogue.default }] },
    ],
  },
  [BartenderDialogue.questLastOrdersProgress]: {
    id: BartenderDialogue.questLastOrdersProgress,
    messageKey: `${NS}:questLastOrdersProgress.message`,
    options: [
      { responseKey: `${NS}:questLastOrdersProgress.opt1`, results: [{ next: BartenderDialogue.default }] },
    ],
  },
  [BartenderDialogue.questLastOrdersComplete]: {
    id: BartenderDialogue.questLastOrdersComplete,
    messageKey: `${NS}:questLastOrdersComplete.message`,
    options: [
      { responseKey: `${NS}:questLastOrdersComplete.opt1`, results: [{ next: BartenderDialogue.default, effects: [{ type: 'quest', action: 'advance', questId: QuestID.lastOrders }] }] },
    ],
  },
}

export default LA_HARPAR_BARTENDER
