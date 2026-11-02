import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { QuestState } from '../../../enums/quest-state.enum'
import { NpcID } from '../../../enums/map/npc-id.enum'

export enum ToricDialogue {
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
}

export type LiroldToricDialogueType = Record<ToricDialogue, DialogueNode<ToricDialogue>>

const NS = 'dialogues/liroldToric'

const LIROLD_TORIC: LiroldToricDialogueType = {
  [ToricDialogue.intro1]: {
    id: ToricDialogue.intro1,
    messageKey: `${NS}:intro1.message`,
    options: [
      {
        responseKey: `${NS}:intro1.opt1`,
        results: [
          { next: ToricDialogue.aboutForge, effects: [{ type: 'flag', name: `met_${NpcID.liroldToric}` }] },
        ],
      },
      {
        responseKey: `${NS}:intro1.opt2`,
        results: [
          { closeDialogue: true, effects: [{ type: 'flag', name: `met_${NpcID.liroldToric}` }] },
        ],
      },
    ],
  },
  [ToricDialogue.default]: {
    id: ToricDialogue.default,
    messageKey: `${NS}:default.message`,
    options: [
      {
        responseKey: `${NS}:default.opt1`,
        results: [
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theColdForge, questState: QuestState.readyToAdvance, step: 5 }],
            next: ToricDialogue.coldForgeComplete,
            effects: [{ type: 'quest', questId: QuestID.theColdForge, action: 'advance' }],
          },
        ],
      },
      {
        responseKey: `${NS}:default.opt2`,
        results: [
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theColdForge, questState: QuestState.readyToAdvance, step: 4 }],
            next: ToricDialogue.coldForgePie,
            effects: [{ type: 'quest', questId: QuestID.theColdForge, action: 'advance' }],
          },
        ],
      },
      {
        responseKey: `${NS}:default.opt3`,
        results: [
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theColdForge, questState: QuestState.readyToAdvance, step: 2 }],
            next: ToricDialogue.coldForgeTongs,
            effects: [{ type: 'quest', questId: QuestID.theColdForge, action: 'advance' }],
          },
        ],
      },
      {
        responseKey: `${NS}:default.opt4`,
        results: [
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theColdForge, questState: QuestState.active, step: 5 }],
            next: ToricDialogue.coldForgeProgressFive,
          },
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theColdForge, questState: QuestState.active, step: 4 }],
            next: ToricDialogue.coldForgeProgressFour,
          },
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theColdForge, questState: QuestState.active, step: 3 }],
            next: ToricDialogue.coldForgeProgressThree,
          },
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theColdForge, questState: QuestState.active, step: 2 }],
            next: ToricDialogue.coldForgeProgressTwo,
          },
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theColdForge, questState: QuestState.active, step: 1 }],
            next: ToricDialogue.coldForgeProgressOne,
          },
        ],
      },
      {
        responseKey: `${NS}:default.opt5`,
        results: [
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theColdForge, questState: QuestState.available }],
            next: ToricDialogue.coldForgeOffer,
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
        responseKey: `${NS}:default.opt7`,
        results: [
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theColdForge, questState: QuestState.completed }],
            next: ToricDialogue.aboutForgeRestored,
          },
          { next: ToricDialogue.aboutForge },
        ],
      },
      {
        responseKey: `${NS}:default.opt8`,
        results: [
          { next: ToricDialogue.aboutPie },
        ],
      },
      {
        responseKey: `${NS}:default.opt9`,
        results: [
          { next: ToricDialogue.aboutHome },
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
  [ToricDialogue.aboutForge]: {
    id: ToricDialogue.aboutForge,
    messageKey: `${NS}:aboutForge.message`,
    options: [
      {
        responseKey: `${NS}:aboutForge.opt1`,
        results: [
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theColdForge, questState: QuestState.available }],
            next: ToricDialogue.coldForgeOffer,
          },
          { next: ToricDialogue.default },
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
  [ToricDialogue.aboutForgeRestored]: {
    id: ToricDialogue.aboutForgeRestored,
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
          { next: ToricDialogue.default },
        ],
      },
    ],
  },
  [ToricDialogue.aboutPie]: {
    id: ToricDialogue.aboutPie,
    messageKey: `${NS}:aboutPie.message`,
    options: [
      {
        responseKey: `${NS}:aboutPie.opt1`,
        results: [
          { next: ToricDialogue.default },
        ],
      },
    ],
  },
  [ToricDialogue.aboutHome]: {
    id: ToricDialogue.aboutHome,
    messageKey: `${NS}:aboutHome.message`,
    options: [
      {
        responseKey: `${NS}:aboutHome.opt1`,
        results: [
          { next: ToricDialogue.aboutHomeLife },
        ],
      },
      {
        responseKey: `${NS}:aboutHome.opt2`,
        results: [
          { next: ToricDialogue.aboutLeaving },
        ],
      },
      {
        responseKey: `${NS}:aboutHome.opt3`,
        results: [
          { next: ToricDialogue.default },
        ],
      },
    ],
  },
  [ToricDialogue.aboutHomeLife]: {
    id: ToricDialogue.aboutHomeLife,
    messageKey: `${NS}:aboutHomeLife.message`,
    options: [
      {
        responseKey: `${NS}:aboutHomeLife.opt1`,
        results: [
          { next: ToricDialogue.aboutLeaving },
        ],
      },
      {
        responseKey: `${NS}:aboutHomeLife.opt2`,
        results: [
          { next: ToricDialogue.default },
        ],
      },
    ],
  },
  [ToricDialogue.aboutLeaving]: {
    id: ToricDialogue.aboutLeaving,
    messageKey: `${NS}:aboutLeaving.message`,
    options: [
      {
        responseKey: `${NS}:aboutLeaving.opt1`,
        results: [
          { next: ToricDialogue.default },
        ],
      },
    ],
  },
  [ToricDialogue.coldForgeOffer]: {
    id: ToricDialogue.coldForgeOffer,
    messageKey: `${NS}:coldForgeOffer.message`,
    options: [
      {
        responseKey: `${NS}:coldForgeOffer.opt1`,
        results: [
          { next: ToricDialogue.default, effects: [{ type: 'quest', questId: QuestID.theColdForge, action: 'start' }] },
        ],
      },
      {
        responseKey: `${NS}:coldForgeOffer.opt2`,
        results: [
          { next: ToricDialogue.default },
        ],
      },
    ],
  },
  [ToricDialogue.coldForgeProgressOne]: {
    id: ToricDialogue.coldForgeProgressOne,
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
          { next: ToricDialogue.default },
        ],
      },
    ],
  },
  [ToricDialogue.coldForgeProgressTwo]: {
    id: ToricDialogue.coldForgeProgressTwo,
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
          { next: ToricDialogue.default },
        ],
      },
    ],
  },
  [ToricDialogue.coldForgeTongs]: {
    id: ToricDialogue.coldForgeTongs,
    messageKey: `${NS}:coldForgeTongs.message`,
    options: [
      {
        responseKey: `${NS}:coldForgeTongs.opt1`,
        results: [
          { next: ToricDialogue.default },
        ],
      },
    ],
  },
  [ToricDialogue.coldForgeProgressThree]: {
    id: ToricDialogue.coldForgeProgressThree,
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
          { next: ToricDialogue.default },
        ],
      },
    ],
  },
  [ToricDialogue.coldForgeProgressFour]: {
    id: ToricDialogue.coldForgeProgressFour,
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
          { next: ToricDialogue.default },
        ],
      },
    ],
  },
  [ToricDialogue.coldForgePie]: {
    id: ToricDialogue.coldForgePie,
    messageKey: `${NS}:coldForgePie.message`,
    options: [
      {
        responseKey: `${NS}:coldForgePie.opt1`,
        results: [
          { next: ToricDialogue.default },
        ],
      },
    ],
  },
  [ToricDialogue.coldForgeProgressFive]: {
    id: ToricDialogue.coldForgeProgressFive,
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
          { next: ToricDialogue.default },
        ],
      },
    ],
  },
  [ToricDialogue.coldForgeComplete]: {
    id: ToricDialogue.coldForgeComplete,
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
          { next: ToricDialogue.default },
        ],
      },
    ],
  },
}

export default LIROLD_TORIC
