import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { NpcID } from '../../../enums/map/npc-id.enum'
import { EnemyID } from '../../../enums/ids/enemy-id.enum'

export enum TraderConversationId {
  default = 0,
  intro1,
  intro2,
  intro3,
  aboutMe,
  aboutLiving,
  aboutVillage,
  aboutFishermen,
  aboutFishQuality,
  aboutPeople,
  aboutGuild,
  aboutDanger,
  questOffer,
  questCompleted,
}

export type LaHarparTraderDialogueType = Record<TraderConversationId, DialogueNode<TraderConversationId>>

const NS = 'dialogues/laHarparTrader'

const LA_HARPAR_TRADER: LaHarparTraderDialogueType = {
  [TraderConversationId.intro1]: {
    id: TraderConversationId.intro1,
    messageKey: `${NS}:intro1.message`,
    options: [
      {
        responseKey: `${NS}:intro1.opt1`,
        results: [{ next: TraderConversationId.intro2 }],
      },
    ],
  },
  [TraderConversationId.intro2]: {
    id: TraderConversationId.intro2,
    messageKey: `${NS}:intro2.message`,
    options: [
      {
        responseKey: `${NS}:intro2.opt1`,
        results: [{ next: TraderConversationId.intro3 }],
      },
    ],
  },
  [TraderConversationId.intro3]: {
    id: TraderConversationId.intro3,
    messageKey: `${NS}:intro3.message`,
    options: [
      {
        responseKey: `${NS}:intro3.opt1`,
        results: [
          {
            next: TraderConversationId.default,
            effects: [{ type: 'flag', name: `met_${NpcID.laHarparTrader}` }],
          },
        ],
      },
    ],
  },
  [TraderConversationId.default]: {
    id: TraderConversationId.default,
    messageKey: `${NS}:default.message`,
    options: [
      {
        responseKey: `${NS}:default.opt1`,
        results: [
          {
            visibilityConditions: [{ type: 'questStep', questId: QuestID.ratsWereRats, step: 1 }],
            next: TraderConversationId.default,
            effects: [{ type: 'quest', action: 'end', questId: QuestID.ratsWereRats }],
          },
        ],
      },
      {
        responseKey: `${NS}:default.opt2`,
        results: [
          {
            next: TraderConversationId.default,
            effects: [{ type: 'shop', shopId: 0 }],
            closeDialogue: true,
          },
        ],
      },
      { responseKey: `${NS}:default.opt3`, results: [{ next: TraderConversationId.aboutMe }] },
      { responseKey: `${NS}:default.opt4`, results: [{ next: TraderConversationId.aboutVillage }] },
      { responseKey: `${NS}:default.opt5`, results: [{ next: TraderConversationId.aboutPeople }] },
      { responseKey: `${NS}:default.opt6`, results: [{ next: TraderConversationId.questOffer }] },
    ],
  },
  [TraderConversationId.aboutMe]: {
    id: TraderConversationId.aboutMe,
    messageKey: `${NS}:aboutMe.message`,
    options: [
      { responseKey: `${NS}:aboutMe.opt1`, results: [{ next: TraderConversationId.aboutLiving }] },
      { responseKey: `${NS}:aboutMe.opt2`, results: [{ next: TraderConversationId.aboutPeople }] },
    ],
  },
  [TraderConversationId.aboutLiving]: {
    id: TraderConversationId.aboutLiving,
    messageKey: `${NS}:aboutLiving.message`,
    options: [
      {
        responseKey: `${NS}:aboutLiving.opt1`,
        results: [{ next: TraderConversationId.default }],
      },
    ],
  },
  [TraderConversationId.aboutVillage]: {
    id: TraderConversationId.aboutVillage,
    messageKey: `${NS}:aboutVillage.message`,
    options: [
      { responseKey: `${NS}:aboutVillage.opt1`, results: [{ next: TraderConversationId.aboutFishermen }] },
      { responseKey: `${NS}:aboutVillage.opt2`, results: [{ next: TraderConversationId.default }] },
    ],
  },
  [TraderConversationId.aboutFishermen]: {
    id: TraderConversationId.aboutFishermen,
    messageKey: `${NS}:aboutFishermen.message`,
    options: [
      {
        responseKey: `${NS}:aboutFishermen.opt1`,
        results: [{ next: TraderConversationId.aboutFishQuality }],
      },
    ],
  },
  [TraderConversationId.aboutFishQuality]: {
    id: TraderConversationId.aboutFishQuality,
    messageKey: `${NS}:aboutFishQuality.message`,
    options: [
      {
        responseKey: `${NS}:aboutFishQuality.opt1`,
        results: [{ next: TraderConversationId.default }],
      },
    ],
  },
  [TraderConversationId.aboutPeople]: {
    id: TraderConversationId.aboutPeople,
    messageKey: `${NS}:aboutPeople.message`,
    options: [
      {
        responseKey: `${NS}:aboutPeople.opt1`,
        results: [{ next: TraderConversationId.aboutGuild }],
      },
    ],
  },
  [TraderConversationId.aboutGuild]: {
    id: TraderConversationId.aboutGuild,
    messageKey: `${NS}:aboutGuild.message`,
    options: [
      { responseKey: `${NS}:aboutGuild.opt1`, results: [{ next: TraderConversationId.default }] },
      { responseKey: `${NS}:aboutGuild.opt2`, results: [{ next: TraderConversationId.aboutDanger }] },
    ],
  },
  [TraderConversationId.aboutDanger]: {
    id: TraderConversationId.aboutDanger,
    messageKey: `${NS}:aboutDanger.message`,
    options: [
      {
        responseKey: `${NS}:aboutDanger.opt1`,
        results: [{ next: TraderConversationId.default }],
      },
    ],
  },
  [TraderConversationId.questOffer]: {
    id: TraderConversationId.questOffer,
    messageKey: `${NS}:questOffer.message`,
    options: [
      {
        responseKey: `${NS}:questOffer.opt1`,
        results: [
          {
            visibilityConditions: [{ type: 'questStep', questId: QuestID.ratsWereRats, step: 1, hidden: true }],
            next: TraderConversationId.questCompleted,
            requirementsNeeded: [{ type: 'killCount', enemyId: EnemyID.rat, amount: 50 }],
          },
          {
            next: TraderConversationId.default,
            closeDialogue: true,
            effects: [{ type: 'quest', action: 'start', questId: QuestID.ratsWereRats }],
          },
        ],
      },
      { responseKey: `${NS}:questOffer.opt2`, results: [{ next: TraderConversationId.default }] },
    ],
  },
  [TraderConversationId.questCompleted]: {
    id: TraderConversationId.questCompleted,
    messageKey: `${NS}:questCompleted.message`,
    options: [
      {
        responseKey: `${NS}:questCompleted.opt1`,
        results: [{ next: TraderConversationId.default }],
      },
    ],
  },
}

export default LA_HARPAR_TRADER
