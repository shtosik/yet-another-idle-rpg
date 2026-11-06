import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'
import { DialogueCondition } from '../../../types/dialogues/dialogue-condition.type'
import { NpcID } from '../../../enums/map/npc-id.enum'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { QuestState } from '../../../enums/quest-state.enum'
import { orderKey } from '../../../app/store/quests/turn-in-cooldown'

// Script: docs/ideas/farm-dialogue-scripts.md section 3. His order opens with the `wicksOrder` start requirement.
export enum DroverDialogue {
  default = 0,
  intro1,
  introHerd,
  aboutWick,
  aboutWickCharms,
  orderOffer,
  orderProgress,
  orderComplete,
}

export type FarmDroverDialogueType = Record<DroverDialogue, DialogueNode<DroverDialogue>>

const NS = 'dialogues/farmDrover'
const MET_FLAG = `met_${NpcID.farmDrover}`

const order = (questState: QuestState, step?: number): DialogueCondition => ({ type: 'quest', questId: QuestID.wicksOrder, questState, step })

const FARM_DROVER: FarmDroverDialogueType = {
  [DroverDialogue.intro1]: {
    id: DroverDialogue.intro1,
    messageKey: `${NS}:intro1.message`,
    options: [
      { responseKey: `${NS}:intro1.herd`, results: [{ next: DroverDialogue.introHerd, effects: [{ type: 'flag', name: MET_FLAG }] }] },
      { responseKey: `${NS}:intro1.hello`, results: [{ closeDialogue: true, effects: [{ type: 'flag', name: MET_FLAG }] }] },
    ],
  },

  [DroverDialogue.introHerd]: {
    id: DroverDialogue.introHerd,
    messageKey: `${NS}:introHerd.message`,
    options: [{ responseKey: `${NS}:introHerd.opt1`, results: [{ next: DroverDialogue.default }] }],
  },

  [DroverDialogue.default]: {
    id: DroverDialogue.default,
    messageKey: `${NS}:default.message`,
    options: [
      { responseKey: `${NS}:default.orderTurnIn`, results: [{ visibilityConditions: [order(QuestState.readyToAdvance, 1)], next: DroverDialogue.orderComplete }] },
      { responseKey: `${NS}:default.orderProgress`, results: [{ visibilityConditions: [order(QuestState.active), { ...order(QuestState.readyToAdvance), not: true }], next: DroverDialogue.orderProgress }] },
      {
        // While the order cools down the option stays, disabled, with the "Ready in ..." tag.
        responseKey: `${NS}:default.orderOffer`,
        results: [{
          visibilityConditions: [order(QuestState.available)],
          requirementsNeeded: [{ type: 'turnInCooldown', key: orderKey(QuestID.wicksOrder), state: 'ready' }],
          next: DroverDialogue.orderOffer,
        }],
      },
      { responseKey: `${NS}:default.aboutWick`, results: [{ next: DroverDialogue.aboutWick }] },
      { responseKey: `${NS}:default.bye`, results: [{ closeDialogue: true }] },
    ],
  },

  [DroverDialogue.aboutWick]: {
    id: DroverDialogue.aboutWick,
    messageKey: `${NS}:aboutWick.message`,
    options: [
      { responseKey: `${NS}:aboutWick.charms`, results: [{ next: DroverDialogue.aboutWickCharms }] },
      { responseKey: `${NS}:aboutWick.thanks`, results: [{ next: DroverDialogue.default }] },
    ],
  },

  [DroverDialogue.aboutWickCharms]: {
    id: DroverDialogue.aboutWickCharms,
    messageKey: `${NS}:aboutWickCharms.message`,
    options: [{ responseKey: `${NS}:aboutWickCharms.opt1`, results: [{ next: DroverDialogue.default }] }],
  },

  // The pick is rolled when the order starts, so the offer cannot name it; the quest panel does.
  [DroverDialogue.orderOffer]: {
    id: DroverDialogue.orderOffer,
    messageKey: `${NS}:orderOffer.message`,
    options: [
      { responseKey: `${NS}:orderOffer.accept`, results: [{ closeDialogue: true, effects: [{ type: 'quest', action: 'start', questId: QuestID.wicksOrder }] }] },
      { responseKey: `${NS}:orderOffer.decline`, results: [{ next: DroverDialogue.default }] },
    ],
  },

  [DroverDialogue.orderProgress]: {
    id: DroverDialogue.orderProgress,
    messageKey: `${NS}:orderProgress.message`,
    options: [{ responseKey: `${NS}:orderProgress.opt1`, results: [{ closeDialogue: true }] }],
  },

  [DroverDialogue.orderComplete]: {
    id: DroverDialogue.orderComplete,
    messageKey: `${NS}:orderComplete.message`,
    options: [
      { responseKey: `${NS}:orderComplete.opt1`, results: [{ next: DroverDialogue.default, effects: [{ type: 'quest', action: 'end', questId: QuestID.wicksOrder }] }] },
    ],
  },
}

export default FARM_DROVER
