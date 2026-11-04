import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { QuestState } from '../../../enums/quest-state.enum'
import { NpcID } from '../../../enums/map/npc-id.enum'

export enum PhurgoDialogue {
  default = 0,
  intro1,
  aboutForge,
  aboutForgeRestored,
  aboutPie,
  aboutHome,
  aboutHomeLife,
  aboutLeaving,
  coldForgeOffer,
  coldForgeProgressOne,
  coldForgeProgressTwo,
  coldForgeTongs,
  coldForgeProgressThree,
  coldForgeProgressFour,
  coldForgePie,
  coldForgeProgressFive,
  coldForgeComplete,
  forgeWork,
  forgeCost,
  forgeLimits,
}

export type LiroldPhurgoDialogueType = Record<PhurgoDialogue, DialogueNode<PhurgoDialogue>>

const NS = 'dialogues/liroldPhurgo'

const LIROLD_PHURGO: LiroldPhurgoDialogueType = {
  [PhurgoDialogue.intro1]: {
    id: PhurgoDialogue.intro1,
    messageKey: `${NS}:intro1.message`,
    options: [
      {
        responseKey: `${NS}:intro1.opt1`,
        results: [
          { next: PhurgoDialogue.aboutForge, effects: [{ type: 'flag', name: `met_${NpcID.liroldPhurgo}` }] },
        ],
      },
      {
        responseKey: `${NS}:intro1.opt2`,
        results: [
          { closeDialogue: true, effects: [{ type: 'flag', name: `met_${NpcID.liroldPhurgo}` }] },
        ],
      },
    ],
  },
  [PhurgoDialogue.default]: {
    id: PhurgoDialogue.default,
    messageKey: `${NS}:default.message`,
    options: [
      {
        responseKey: `${NS}:default.opt1`,
        results: [
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theColdForge, questState: QuestState.readyToAdvance, step: 5 }],
            next: PhurgoDialogue.coldForgeComplete,
            effects: [{ type: 'quest', questId: QuestID.theColdForge, action: 'advance' }],
          },
        ],
      },
      {
        responseKey: `${NS}:default.opt2`,
        results: [
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theColdForge, questState: QuestState.readyToAdvance, step: 4 }],
            next: PhurgoDialogue.coldForgePie,
            effects: [{ type: 'quest', questId: QuestID.theColdForge, action: 'advance' }],
          },
        ],
      },
      {
        responseKey: `${NS}:default.opt3`,
        results: [
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theColdForge, questState: QuestState.readyToAdvance, step: 2 }],
            next: PhurgoDialogue.coldForgeTongs,
            effects: [{ type: 'quest', questId: QuestID.theColdForge, action: 'advance' }],
          },
        ],
      },
      {
        responseKey: `${NS}:default.opt4`,
        results: [
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theColdForge, questState: QuestState.active, step: 5 }],
            next: PhurgoDialogue.coldForgeProgressFive,
          },
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theColdForge, questState: QuestState.active, step: 4 }],
            next: PhurgoDialogue.coldForgeProgressFour,
          },
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theColdForge, questState: QuestState.active, step: 3 }],
            next: PhurgoDialogue.coldForgeProgressThree,
          },
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theColdForge, questState: QuestState.active, step: 2 }],
            next: PhurgoDialogue.coldForgeProgressTwo,
          },
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theColdForge, questState: QuestState.active, step: 1 }],
            next: PhurgoDialogue.coldForgeProgressOne,
          },
        ],
      },
      {
        responseKey: `${NS}:default.opt5`,
        results: [
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theColdForge, questState: QuestState.available }],
            next: PhurgoDialogue.coldForgeOffer,
          },
        ],
      },
      {
        responseKey: `${NS}:default.opt6`,
        results: [
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theColdForge, questState: QuestState.completed }],
            closeDialogue: true,
            effects: [{ type: 'forge' }],
          },
        ],
      },
      {
        responseKey: `${NS}:default.opt11`,
        results: [
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theColdForge, questState: QuestState.completed }],
            next: PhurgoDialogue.forgeWork,
          },
        ],
      },
      {
        responseKey: `${NS}:default.opt7`,
        results: [
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theColdForge, questState: QuestState.completed }],
            next: PhurgoDialogue.aboutForgeRestored,
          },
          { next: PhurgoDialogue.aboutForge },
        ],
      },
      {
        responseKey: `${NS}:default.opt8`,
        results: [
          { next: PhurgoDialogue.aboutPie },
        ],
      },
      {
        responseKey: `${NS}:default.opt9`,
        results: [
          { next: PhurgoDialogue.aboutHome },
        ],
      },
      {
        responseKey: `${NS}:default.opt10`,
        results: [
          { closeDialogue: true },
        ],
      },
    ],
  },
  [PhurgoDialogue.aboutForge]: {
    id: PhurgoDialogue.aboutForge,
    messageKey: `${NS}:aboutForge.message`,
    options: [
      {
        responseKey: `${NS}:aboutForge.opt1`,
        results: [
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theColdForge, questState: QuestState.available }],
            next: PhurgoDialogue.coldForgeOffer,
          },
          { next: PhurgoDialogue.default },
        ],
      },
      {
        responseKey: `${NS}:aboutForge.opt2`,
        results: [
          { closeDialogue: true },
        ],
      },
    ],
  },
  [PhurgoDialogue.aboutForgeRestored]: {
    id: PhurgoDialogue.aboutForgeRestored,
    messageKey: `${NS}:aboutForgeRestored.message`,
    options: [
      {
        responseKey: `${NS}:aboutForgeRestored.opt1`,
        results: [
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theColdForge, questState: QuestState.completed }],
            closeDialogue: true,
            effects: [{ type: 'forge' }],
          },
        ],
      },
      {
        responseKey: `${NS}:aboutForgeRestored.opt2`,
        results: [
          { next: PhurgoDialogue.default },
        ],
      },
    ],
  },
  [PhurgoDialogue.forgeWork]: {
    id: PhurgoDialogue.forgeWork,
    messageKey: `${NS}:forgeWork.message`,
    options: [
      {
        responseKey: `${NS}:forgeWork.opt1`,
        results: [{ next: PhurgoDialogue.forgeCost }],
      },
      {
        responseKey: `${NS}:forgeWork.opt2`,
        results: [{ next: PhurgoDialogue.default }],
      },
    ],
  },
  [PhurgoDialogue.forgeCost]: {
    id: PhurgoDialogue.forgeCost,
    messageKey: `${NS}:forgeCost.message`,
    options: [
      {
        responseKey: `${NS}:forgeCost.opt1`,
        results: [{ next: PhurgoDialogue.forgeLimits }],
      },
      {
        responseKey: `${NS}:forgeCost.opt2`,
        results: [{ next: PhurgoDialogue.default }],
      },
    ],
  },
  [PhurgoDialogue.forgeLimits]: {
    id: PhurgoDialogue.forgeLimits,
    messageKey: `${NS}:forgeLimits.message`,
    options: [
      {
        responseKey: `${NS}:forgeLimits.opt1`,
        results: [{ next: PhurgoDialogue.default }],
      },
    ],
  },
  [PhurgoDialogue.aboutPie]: {
    id: PhurgoDialogue.aboutPie,
    messageKey: `${NS}:aboutPie.message`,
    options: [
      {
        responseKey: `${NS}:aboutPie.opt1`,
        results: [
          { next: PhurgoDialogue.default },
        ],
      },
    ],
  },
  [PhurgoDialogue.aboutHome]: {
    id: PhurgoDialogue.aboutHome,
    messageKey: `${NS}:aboutHome.message`,
    options: [
      {
        responseKey: `${NS}:aboutHome.opt1`,
        results: [
          { next: PhurgoDialogue.aboutHomeLife },
        ],
      },
      {
        responseKey: `${NS}:aboutHome.opt2`,
        results: [
          { next: PhurgoDialogue.aboutLeaving },
        ],
      },
      {
        responseKey: `${NS}:aboutHome.opt3`,
        results: [
          { next: PhurgoDialogue.default },
        ],
      },
    ],
  },
  [PhurgoDialogue.aboutHomeLife]: {
    id: PhurgoDialogue.aboutHomeLife,
    messageKey: `${NS}:aboutHomeLife.message`,
    options: [
      {
        responseKey: `${NS}:aboutHomeLife.opt1`,
        results: [
          { next: PhurgoDialogue.aboutLeaving },
        ],
      },
      {
        responseKey: `${NS}:aboutHomeLife.opt2`,
        results: [
          { next: PhurgoDialogue.default },
        ],
      },
    ],
  },
  [PhurgoDialogue.aboutLeaving]: {
    id: PhurgoDialogue.aboutLeaving,
    messageKey: `${NS}:aboutLeaving.message`,
    options: [
      {
        responseKey: `${NS}:aboutLeaving.opt1`,
        results: [
          { next: PhurgoDialogue.default },
        ],
      },
    ],
  },
  [PhurgoDialogue.coldForgeOffer]: {
    id: PhurgoDialogue.coldForgeOffer,
    messageKey: `${NS}:coldForgeOffer.message`,
    options: [
      {
        responseKey: `${NS}:coldForgeOffer.opt1`,
        results: [
          { next: PhurgoDialogue.default, effects: [{ type: 'quest', questId: QuestID.theColdForge, action: 'start' }] },
        ],
      },
      {
        responseKey: `${NS}:coldForgeOffer.opt2`,
        results: [
          { next: PhurgoDialogue.default },
        ],
      },
    ],
  },
  [PhurgoDialogue.coldForgeProgressOne]: {
    id: PhurgoDialogue.coldForgeProgressOne,
    messageKey: `${NS}:coldForgeProgressOne.message`,
    options: [
      {
        responseKey: `${NS}:coldForgeProgressOne.opt1`,
        results: [
          { closeDialogue: true },
        ],
      },
      {
        responseKey: `${NS}:coldForgeProgressOne.opt2`,
        results: [
          { next: PhurgoDialogue.default },
        ],
      },
    ],
  },
  [PhurgoDialogue.coldForgeProgressTwo]: {
    id: PhurgoDialogue.coldForgeProgressTwo,
    messageKey: `${NS}:coldForgeProgressTwo.message`,
    options: [
      {
        responseKey: `${NS}:coldForgeProgressTwo.opt1`,
        results: [
          { closeDialogue: true },
        ],
      },
      {
        responseKey: `${NS}:coldForgeProgressTwo.opt2`,
        results: [
          { next: PhurgoDialogue.default },
        ],
      },
    ],
  },
  [PhurgoDialogue.coldForgeTongs]: {
    id: PhurgoDialogue.coldForgeTongs,
    messageKey: `${NS}:coldForgeTongs.message`,
    options: [
      {
        responseKey: `${NS}:coldForgeTongs.opt1`,
        results: [
          { next: PhurgoDialogue.default },
        ],
      },
    ],
  },
  [PhurgoDialogue.coldForgeProgressThree]: {
    id: PhurgoDialogue.coldForgeProgressThree,
    messageKey: `${NS}:coldForgeProgressThree.message`,
    options: [
      {
        responseKey: `${NS}:coldForgeProgressThree.opt1`,
        results: [
          { closeDialogue: true },
        ],
      },
      {
        responseKey: `${NS}:coldForgeProgressThree.opt2`,
        results: [
          { next: PhurgoDialogue.default },
        ],
      },
    ],
  },
  [PhurgoDialogue.coldForgeProgressFour]: {
    id: PhurgoDialogue.coldForgeProgressFour,
    messageKey: `${NS}:coldForgeProgressFour.message`,
    options: [
      {
        responseKey: `${NS}:coldForgeProgressFour.opt1`,
        results: [
          { closeDialogue: true },
        ],
      },
      {
        responseKey: `${NS}:coldForgeProgressFour.opt2`,
        results: [
          { next: PhurgoDialogue.default },
        ],
      },
    ],
  },
  [PhurgoDialogue.coldForgePie]: {
    id: PhurgoDialogue.coldForgePie,
    messageKey: `${NS}:coldForgePie.message`,
    options: [
      {
        responseKey: `${NS}:coldForgePie.opt1`,
        results: [
          { next: PhurgoDialogue.default },
        ],
      },
    ],
  },
  [PhurgoDialogue.coldForgeProgressFive]: {
    id: PhurgoDialogue.coldForgeProgressFive,
    messageKey: `${NS}:coldForgeProgressFive.message`,
    options: [
      {
        responseKey: `${NS}:coldForgeProgressFive.opt1`,
        results: [
          { closeDialogue: true },
        ],
      },
      {
        responseKey: `${NS}:coldForgeProgressFive.opt2`,
        results: [
          { next: PhurgoDialogue.default },
        ],
      },
    ],
  },
  [PhurgoDialogue.coldForgeComplete]: {
    id: PhurgoDialogue.coldForgeComplete,
    messageKey: `${NS}:coldForgeComplete.message`,
    options: [
      {
        responseKey: `${NS}:coldForgeComplete.opt1`,
        results: [
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theColdForge, questState: QuestState.completed }],
            closeDialogue: true,
            effects: [{ type: 'forge' }],
          },
        ],
      },
      {
        responseKey: `${NS}:coldForgeComplete.opt2`,
        results: [
          { next: PhurgoDialogue.default },
        ],
      },
    ],
  },
}

export default LIROLD_PHURGO
