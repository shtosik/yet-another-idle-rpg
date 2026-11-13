import { QuestID } from '../../../enums/ids/quest-id.enum'
import { QuestState } from '../../../enums/quest-state.enum'
import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'
import { NpcID } from '../../../enums/map/npc-id.enum'
import { ShopID } from '../../../enums/ids/shop-id.enum'
import { ItemID } from '../../../enums/ids/item-id.enum'

export enum MarvinDialogue {
  default = 0,
  introduction1 = 1,
  introduction2,
  whatIsThisPlace1,
  taskIntro,
  taskClaimed,      // kept at id 5 — used as task-complete node
  taskInProgress,   // id 6
  coldForgeRecord,
  coldForgeSalvage,
  sealRegistered,
  sealReminder,
  quietRoadOffer,
  quietRoadOffer2,
  quietRoadWhy,
  quietRoadProgress,
  quietRoadDaybook,
  quietRoadHobbMaybe,
  quietRoadProgress2,
  quietRoadSatchel,
  quietRoadWho,
  sameWinterEnd,
  sameWinterVarrow,
  aboutPosting,
  aboutPostingNow,
}

export type LaHarparMarvinDialogueType = Record<MarvinDialogue, DialogueNode<MarvinDialogue>>

const NS = 'dialogues/laHarparMarvin'

/** Task slots that get a cancel option: base 1 plus the Second Contract. Raise it if more slots are added. */
const MAX_CANCELLABLE_TASKS = 2

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
        responseKey: `${NS}:default.coldForge`,
        results: [{
          visibilityConditions: [{ type: 'quest', questId: QuestID.theColdForge, questState: QuestState.readyToAdvance, step: 3 }],
          next: MarvinDialogue.coldForgeRecord,
          effects: [{ type: 'quest', questId: QuestID.theColdForge, action: 'advance' }],
        }],
      },
      {
        responseKey: `${NS}:default.quietRoadSatchel`,
        results: [{
          visibilityConditions: [{ type: 'quest', questId: QuestID.theQuietRoad, questState: QuestState.readyToAdvance, step: 2 }],
          next: MarvinDialogue.quietRoadSatchel,
          effects: [
            { type: 'quest', questId: QuestID.theQuietRoad, action: 'advance' },
            { type: 'item', action: 'give', items: [{ itemId: ItemID.corwinsLetter, amount: 1 }] },
          ],
        }],
      },
      {
        responseKey: `${NS}:default.quietRoadDaybook`,
        results: [{
          visibilityConditions: [{ type: 'quest', questId: QuestID.theQuietRoad, questState: QuestState.readyToAdvance, step: 1 }],
          next: MarvinDialogue.quietRoadDaybook,
          effects: [{ type: 'quest', questId: QuestID.theQuietRoad, action: 'advance' }],
        }],
      },
      {
        responseKey: `${NS}:default.sameWinterEnd`,
        results: [{
          visibilityConditions: [{ type: 'quest', questId: QuestID.theSameWinter, questState: QuestState.readyToAdvance, step: 5 }],
          next: MarvinDialogue.sameWinterEnd,
          effects: [{ type: 'quest', questId: QuestID.theSameWinter, action: 'advance' }],
        }],
      },
      {
        responseKey: `${NS}:default.quietRoadProgress`,
        results: [
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theQuietRoad, questState: QuestState.active, step: 1 }, { type: 'quest', questId: QuestID.theQuietRoad, questState: QuestState.readyToAdvance, step: 1, not: true }],
            next: MarvinDialogue.quietRoadProgress,
          },
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theQuietRoad, questState: QuestState.active, step: 2 }, { type: 'quest', questId: QuestID.theQuietRoad, questState: QuestState.readyToAdvance, step: 2, not: true }],
            next: MarvinDialogue.quietRoadProgress2,
          },
        ],
      },
      {
        responseKey: `${NS}:default.quietRoadOffer`,
        results: [{
          visibilityConditions: [{ type: 'quest', questId: QuestID.theQuietRoad, questState: QuestState.available }],
          next: MarvinDialogue.quietRoadOffer,
        }],
      },
      {
        responseKey: `${NS}:default.aboutPosting`,
        results: [{
          visibilityConditions: [{ type: 'quest', questId: QuestID.theSameWinter, questState: QuestState.completed }],
          next: MarvinDialogue.aboutPosting,
        }],
      },
      {
        responseKey: `${NS}:default.registerSeal`,
        results: [{
          visibilityConditions: [
            { type: 'item', itemId: ItemID.pathfindersSeal, amount: 1 },
            { type: 'stat', stat: 'upgradedDropChance', comparison: 'lte', amount: 0, hidden: true },
          ],
          requirementsNeeded: [{ type: 'item', itemId: ItemID.pathfindersSeal, amount: 1 }],
          effects: [{ type: 'registerPathfindersSeal' }],
          next: MarvinDialogue.sealRegistered,
        }],
      },
      {
        responseKey: `${NS}:default.sealReminder`,
        results: [{
          visibilityConditions: [{ type: 'stat', stat: 'upgradedDropChance', comparison: 'gte', amount: 1, hidden: true }],
          next: MarvinDialogue.sealReminder,
        }],
      },
      {
        responseKey: `${NS}:default.whatIsThisPlace`,
        results: [{ next: MarvinDialogue.whatIsThisPlace1 }],
      },
      {
        responseKey: `${NS}:default.claimTasks`,
        results: [
          {
            visibilityConditions: [{ type: 'guild', condition: 'taskComplete' }],
            next: MarvinDialogue.taskClaimed,
          },
        ],
      },
      {
        responseKey: `${NS}:default.taskIntro`,
        results: [
          {
            visibilityConditions: [{ type: 'guild', condition: 'hasFreeTaskSlot' }],
            next: MarvinDialogue.taskIntro,
          },
        ],
      },
      {
        responseKey: `${NS}:default.taskStatus`,
        results: [
          {
            visibilityConditions: [{ type: 'guild', condition: 'hasActiveTask' }],
            next: MarvinDialogue.taskInProgress,
          },
        ],
      },
      {
        responseKey: `${NS}:default.store`,
        results: [
          {
            next: MarvinDialogue.default,
            effects: [{ type: 'shop', shopId: ShopID.explorersGuildStore }],
            closeDialogue: true,
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
      // One cancel option per task; the dialogue fills in which monster and how many kills are left.
      ...Array.from({ length: MAX_CANCELLABLE_TASKS }, (_, taskIndex) => ({
        responseKey: `${NS}:taskInProgress.cancel`,
        results: [
          {
            visibilityConditions: [{ type: 'guild' as const, condition: 'taskInProgressAt' as const, taskIndex }],
            next: MarvinDialogue.default,
            effects: [{ type: 'guild' as const, action: 'abandonTask' as const, taskIndex }],
          },
        ],
      })),
      {
        responseKey: `${NS}:taskInProgress.back`,
        results: [{ next: MarvinDialogue.default }],
      },
    ],
  },
  [MarvinDialogue.coldForgeRecord]: {
    id: MarvinDialogue.coldForgeRecord,
    messageKey: `${NS}:coldForgeRecord.message`,
    options: [
      { responseKey: `${NS}:coldForgeRecord.opt1`, results: [{ next: MarvinDialogue.coldForgeSalvage }] },
      { responseKey: `${NS}:coldForgeRecord.opt2`, results: [{ next: MarvinDialogue.default }] },
    ],
  },
  [MarvinDialogue.coldForgeSalvage]: {
    id: MarvinDialogue.coldForgeSalvage,
    messageKey: `${NS}:coldForgeSalvage.message`,
    options: [
      { responseKey: `${NS}:coldForgeSalvage.opt1`, results: [{ next: MarvinDialogue.default }] },
    ],
  },
  [MarvinDialogue.sealRegistered]: {
    id: MarvinDialogue.sealRegistered,
    messageKey: `${NS}:sealRegistered.message`,
    options: [
      { responseKey: `${NS}:sealRegistered.opt1`, results: [{ next: MarvinDialogue.default }] },
    ],
  },
  [MarvinDialogue.sealReminder]: {
    id: MarvinDialogue.sealReminder,
    messageKey: `${NS}:sealReminder.message`,
    options: [
      { responseKey: `${NS}:sealReminder.opt1`, results: [{ next: MarvinDialogue.default }] },
    ],
  },
  [MarvinDialogue.quietRoadOffer]: {
    id: MarvinDialogue.quietRoadOffer,
    messageKey: `${NS}:quietRoadOffer.message`,
    options: [
      { responseKey: `${NS}:quietRoadOffer.opt1`, results: [{ next: MarvinDialogue.quietRoadOffer2 }] },
      { responseKey: `${NS}:quietRoadOffer.opt2`, results: [{ next: MarvinDialogue.quietRoadOffer2 }] },
      { responseKey: `${NS}:quietRoadOffer.opt3`, results: [{ next: MarvinDialogue.default }] },
    ],
  },
  [MarvinDialogue.quietRoadOffer2]: {
    id: MarvinDialogue.quietRoadOffer2,
    messageKey: `${NS}:quietRoadOffer2.message`,
    options: [
      { responseKey: `${NS}:quietRoadOffer2.opt1`, results: [{ next: MarvinDialogue.default, effects: [{ type: 'quest', questId: QuestID.theQuietRoad, action: 'start' }] }] },
      { responseKey: `${NS}:quietRoadOffer2.opt2`, results: [{ next: MarvinDialogue.quietRoadWhy }] },
    ],
  },
  [MarvinDialogue.quietRoadWhy]: {
    id: MarvinDialogue.quietRoadWhy,
    messageKey: `${NS}:quietRoadWhy.message`,
    options: [
      { responseKey: `${NS}:quietRoadWhy.opt1`, results: [{ next: MarvinDialogue.default, effects: [{ type: 'quest', questId: QuestID.theQuietRoad, action: 'start' }] }] },
      { responseKey: `${NS}:quietRoadWhy.opt2`, results: [{ next: MarvinDialogue.default }] },
    ],
  },
  [MarvinDialogue.quietRoadProgress]: {
    id: MarvinDialogue.quietRoadProgress,
    messageKey: `${NS}:quietRoadProgress.message`,
    options: [
      { responseKey: `${NS}:quietRoadProgress.opt1`, results: [{ next: MarvinDialogue.default }] },
    ],
  },
  [MarvinDialogue.quietRoadDaybook]: {
    id: MarvinDialogue.quietRoadDaybook,
    messageKey: `${NS}:quietRoadDaybook.message`,
    options: [
      { responseKey: `${NS}:quietRoadDaybook.opt1`, results: [{ next: MarvinDialogue.default }] },
      { responseKey: `${NS}:quietRoadDaybook.opt2`, results: [{ next: MarvinDialogue.quietRoadHobbMaybe }] },
    ],
  },
  [MarvinDialogue.quietRoadHobbMaybe]: {
    id: MarvinDialogue.quietRoadHobbMaybe,
    messageKey: `${NS}:quietRoadHobbMaybe.message`,
    options: [
      { responseKey: `${NS}:quietRoadHobbMaybe.opt1`, results: [{ next: MarvinDialogue.default }] },
    ],
  },
  [MarvinDialogue.quietRoadProgress2]: {
    id: MarvinDialogue.quietRoadProgress2,
    messageKey: `${NS}:quietRoadProgress2.message`,
    options: [
      { responseKey: `${NS}:quietRoadProgress2.opt1`, results: [{ next: MarvinDialogue.default }] },
    ],
  },
  [MarvinDialogue.quietRoadSatchel]: {
    id: MarvinDialogue.quietRoadSatchel,
    messageKey: `${NS}:quietRoadSatchel.message`,
    options: [
      { responseKey: `${NS}:quietRoadSatchel.opt1`, results: [{ next: MarvinDialogue.default }] },
      { responseKey: `${NS}:quietRoadSatchel.opt2`, results: [{ next: MarvinDialogue.quietRoadWho }] },
    ],
  },
  [MarvinDialogue.quietRoadWho]: {
    id: MarvinDialogue.quietRoadWho,
    messageKey: `${NS}:quietRoadWho.message`,
    options: [
      { responseKey: `${NS}:quietRoadWho.opt1`, results: [{ next: MarvinDialogue.default }] },
    ],
  },
  [MarvinDialogue.sameWinterEnd]: {
    id: MarvinDialogue.sameWinterEnd,
    messageKey: `${NS}:sameWinterEnd.message`,
    options: [
      { responseKey: `${NS}:sameWinterEnd.opt1`, results: [{ next: MarvinDialogue.sameWinterVarrow }] },
      { responseKey: `${NS}:sameWinterEnd.opt2`, results: [{ next: MarvinDialogue.sameWinterVarrow }] },
    ],
  },
  [MarvinDialogue.sameWinterVarrow]: {
    id: MarvinDialogue.sameWinterVarrow,
    messageKey: `${NS}:sameWinterVarrow.message`,
    options: [
      { responseKey: `${NS}:sameWinterVarrow.opt1`, results: [{ next: MarvinDialogue.default }] },
    ],
  },
  [MarvinDialogue.aboutPosting]: {
    id: MarvinDialogue.aboutPosting,
    messageKey: `${NS}:aboutPosting.message`,
    options: [
      { responseKey: `${NS}:aboutPosting.opt1`, results: [{ next: MarvinDialogue.aboutPostingNow }] },
      { responseKey: `${NS}:aboutPosting.opt2`, results: [{ next: MarvinDialogue.aboutPostingNow }] },
    ],
  },
  [MarvinDialogue.aboutPostingNow]: {
    id: MarvinDialogue.aboutPostingNow,
    messageKey: `${NS}:aboutPostingNow.message`,
    options: [
      { responseKey: `${NS}:aboutPostingNow.opt1`, results: [{ next: MarvinDialogue.default }] },
    ],
  },
}

export default LA_HARPAR_MARVIN
