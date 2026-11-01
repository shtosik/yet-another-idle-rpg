import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { NpcID } from '../../../enums/map/npc-id.enum'
import { QuestState } from '../../../enums/quest-state.enum'

export enum TraderDialogue {
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
  questSafePassage,
  questSafePassageProgress,
  questSafePassageStep1Complete,
  questSafePassageStep2,
}

export type LaHarparTraderDialogueType = Record<TraderDialogue, DialogueNode<TraderDialogue>>

const NS = 'dialogues/laHarparTrader'

const LA_HARPAR_TRADER: LaHarparTraderDialogueType = {
  [TraderDialogue.intro1]: {
    id: TraderDialogue.intro1,
    messageKey: `${NS}:intro1.message`,
    options: [
      {
        responseKey: `${NS}:intro1.opt1`,
        results: [{ next: TraderDialogue.intro2 }],
      },
    ],
  },
  [TraderDialogue.intro2]: {
    id: TraderDialogue.intro2,
    messageKey: `${NS}:intro2.message`,
    options: [
      {
        responseKey: `${NS}:intro2.opt1`,
        results: [{ next: TraderDialogue.intro3 }],
      },
    ],
  },
  [TraderDialogue.intro3]: {
    id: TraderDialogue.intro3,
    messageKey: `${NS}:intro3.message`,
    options: [
      {
        responseKey: `${NS}:intro3.opt1`,
        results: [
          {
            next: TraderDialogue.default,
            effects: [{ type: 'flag', name: `met_${NpcID.laHarparTrader}` }],
          },
        ],
      },
    ],
  },
  [TraderDialogue.default]: {
    id: TraderDialogue.default,
    messageKey: `${NS}:default.message`,
    options: [
      {
        responseKey: `${NS}:default.opt1`,
        results: [
          {
            visibilityConditions: [
              {
                type: 'quest',
                questId: QuestID.ratsWereRats,
                questState: QuestState.readyToAdvance,
                step: 1,
              },
            ],
            next: TraderDialogue.default,
            effects: [{ type: 'quest', action: 'end', questId: QuestID.ratsWereRats }],
          },
        ],
      },
      {
        responseKey: `${NS}:default.opt2`,
        results: [
          {
            next: TraderDialogue.default,
            effects: [{ type: 'shop', shopId: 0 }],
            closeDialogue: true,
          },
        ],
      },
      { responseKey: `${NS}:default.opt3`, results: [{ next: TraderDialogue.aboutMe }] },
      { responseKey: `${NS}:default.opt4`, results: [{ next: TraderDialogue.aboutVillage }] },
      { responseKey: `${NS}:default.opt5`, results: [{ next: TraderDialogue.aboutPeople }] },
      {
        // Hidden while Rats Were Rats is in progress; opt1 is the turn-in
        responseKey: `${NS}:default.opt6`,
        results: [
          // Safe Passage (La Harpar Revered): step 1 turn-in, on step 2, in progress, offer
          { visibilityConditions: [{ type: 'quest', questId: QuestID.safePassage, questState: QuestState.readyToAdvance, step: 1 }], next: TraderDialogue.questSafePassageStep1Complete },
          { visibilityConditions: [{ type: 'quest', questId: QuestID.safePassage, questState: QuestState.active, step: 2 }], next: TraderDialogue.questSafePassageStep2 },
          { visibilityConditions: [{ type: 'quest', questId: QuestID.safePassage, questState: QuestState.active }], next: TraderDialogue.questSafePassageProgress },
          { visibilityConditions: [{ type: 'quest', questId: QuestID.safePassage, questState: QuestState.available }], next: TraderDialogue.questSafePassage },
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.ratsWereRats, questState: QuestState.completed }],
            next: TraderDialogue.questCompleted,
          },
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.ratsWereRats, questState: QuestState.available }],
            next: TraderDialogue.questOffer,
          },
        ],
      },
    ],
  },
  [TraderDialogue.aboutMe]: {
    id: TraderDialogue.aboutMe,
    messageKey: `${NS}:aboutMe.message`,
    options: [
      { responseKey: `${NS}:aboutMe.opt1`, results: [{ next: TraderDialogue.aboutLiving }] },
      { responseKey: `${NS}:aboutMe.opt2`, results: [{ next: TraderDialogue.aboutPeople }] },
    ],
  },
  [TraderDialogue.aboutLiving]: {
    id: TraderDialogue.aboutLiving,
    messageKey: `${NS}:aboutLiving.message`,
    options: [
      {
        responseKey: `${NS}:aboutLiving.opt1`,
        results: [{ next: TraderDialogue.default }],
      },
    ],
  },
  [TraderDialogue.aboutVillage]: {
    id: TraderDialogue.aboutVillage,
    messageKey: `${NS}:aboutVillage.message`,
    options: [
      { responseKey: `${NS}:aboutVillage.opt1`, results: [{ next: TraderDialogue.aboutFishermen }] },
      { responseKey: `${NS}:aboutVillage.opt2`, results: [{ next: TraderDialogue.default }] },
    ],
  },
  [TraderDialogue.aboutFishermen]: {
    id: TraderDialogue.aboutFishermen,
    messageKey: `${NS}:aboutFishermen.message`,
    options: [
      {
        responseKey: `${NS}:aboutFishermen.opt1`,
        results: [{ next: TraderDialogue.aboutFishQuality }],
      },
    ],
  },
  [TraderDialogue.aboutFishQuality]: {
    id: TraderDialogue.aboutFishQuality,
    messageKey: `${NS}:aboutFishQuality.message`,
    options: [
      {
        responseKey: `${NS}:aboutFishQuality.opt1`,
        results: [{ next: TraderDialogue.default }],
      },
    ],
  },
  [TraderDialogue.aboutPeople]: {
    id: TraderDialogue.aboutPeople,
    messageKey: `${NS}:aboutPeople.message`,
    options: [
      {
        responseKey: `${NS}:aboutPeople.opt1`,
        results: [{ next: TraderDialogue.aboutGuild }],
      },
    ],
  },
  [TraderDialogue.aboutGuild]: {
    id: TraderDialogue.aboutGuild,
    messageKey: `${NS}:aboutGuild.message`,
    options: [
      { responseKey: `${NS}:aboutGuild.opt1`, results: [{ next: TraderDialogue.default }] },
      { responseKey: `${NS}:aboutGuild.opt2`, results: [{ next: TraderDialogue.aboutDanger }] },
    ],
  },
  [TraderDialogue.aboutDanger]: {
    id: TraderDialogue.aboutDanger,
    messageKey: `${NS}:aboutDanger.message`,
    options: [
      {
        responseKey: `${NS}:aboutDanger.opt1`,
        results: [{ next: TraderDialogue.default }],
      },
    ],
  },
  [TraderDialogue.questOffer]: {
    id: TraderDialogue.questOffer,
    messageKey: `${NS}:questOffer.message`,
    options: [
      {
        responseKey: `${NS}:questOffer.opt1`,
        results: [
          {
            next: TraderDialogue.default,
            closeDialogue: true,
            effects: [{ type: 'quest', action: 'start', questId: QuestID.ratsWereRats }],
          },
        ],
      },
      { responseKey: `${NS}:questOffer.opt2`, results: [{ next: TraderDialogue.default }] },
    ],
  },
  [TraderDialogue.questCompleted]: {
    id: TraderDialogue.questCompleted,
    messageKey: `${NS}:questCompleted.message`,
    options: [
      {
        responseKey: `${NS}:questCompleted.opt1`,
        results: [{ next: TraderDialogue.default }],
      },
    ],
  },
  [TraderDialogue.questSafePassage]: {
    id: TraderDialogue.questSafePassage,
    messageKey: `${NS}:questSafePassage.message`,
    options: [
      { responseKey: `${NS}:questSafePassage.opt1`, results: [{ next: TraderDialogue.default, effects: [{ type: 'quest', action: 'start', questId: QuestID.safePassage }] }] },
      { responseKey: `${NS}:questSafePassage.opt2`, results: [{ next: TraderDialogue.default }] },
    ],
  },
  [TraderDialogue.questSafePassageProgress]: {
    id: TraderDialogue.questSafePassageProgress,
    messageKey: `${NS}:questSafePassageProgress.message`,
    options: [
      { responseKey: `${NS}:questSafePassageProgress.opt1`, results: [{ next: TraderDialogue.default }] },
    ],
  },
  [TraderDialogue.questSafePassageStep1Complete]: {
    id: TraderDialogue.questSafePassageStep1Complete,
    messageKey: `${NS}:questSafePassageStep1Complete.message`,
    options: [
      { responseKey: `${NS}:questSafePassageStep1Complete.opt1`, results: [{ next: TraderDialogue.default, effects: [{ type: 'quest', action: 'advance', questId: QuestID.safePassage }] }] },
    ],
  },
  [TraderDialogue.questSafePassageStep2]: {
    id: TraderDialogue.questSafePassageStep2,
    messageKey: `${NS}:questSafePassageStep2.message`,
    options: [
      { responseKey: `${NS}:questSafePassageStep2.opt1`, results: [{ next: TraderDialogue.default }] },
    ],
  },
}

export default LA_HARPAR_TRADER
