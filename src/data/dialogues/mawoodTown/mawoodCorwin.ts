import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'
import { NpcID } from '../../../enums/map/npc-id.enum'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { QuestState } from '../../../enums/quest-state.enum'

export enum CorwinDialogue {
  default = 0,
  intro1,
  intro2,
  aboutMawood,
  aboutForest,
  corruptionLore,
  corruptionDetails,
  questSignsOfRot,
  questSignsOfRotProgress,
  questSignsOfRotComplete,
  questTheSap,
  questTheSapProgress,
  questTheSapComplete,
  questBlightedHeart,
  questBlightedHeartComplete,
  postQuestLore,
}

export type MawoodCorwinDialogueType = Record<CorwinDialogue, DialogueNode<CorwinDialogue>>

const NS = 'dialogues/mawoodCorwin'

const MAWOOD_CORWIN: MawoodCorwinDialogueType = {
  [CorwinDialogue.intro1]: {
    id: CorwinDialogue.intro1,
    messageKey: `${NS}:intro1.message`,
    options: [
      {
        responseKey: `${NS}:intro1.opt1`,
        results: [{ next: CorwinDialogue.intro2 }],
      },
      {
        responseKey: `${NS}:intro1.opt2`,
        results: [
          {
            next: CorwinDialogue.default,
            effects: [{ type: 'flag', name: `met_${NpcID.mawoodCorwin}` }],
          },
        ],
      },
    ],
  },

  [CorwinDialogue.intro2]: {
    id: CorwinDialogue.intro2,
    messageKey: `${NS}:intro2.message`,
    options: [
      {
        responseKey: `${NS}:intro2.opt1`,
        results: [
          {
            next: CorwinDialogue.default,
            effects: [{ type: 'flag', name: `met_${NpcID.mawoodCorwin}` }],
          },
        ],
      },
    ],
  },

  [CorwinDialogue.default]: {
    id: CorwinDialogue.default,
    messageKey: `${NS}:default.message`,
    options: [
      {
        responseKey: `${NS}:default.aboutForest`,
        results: [{ next: CorwinDialogue.aboutForest }],
      },
      {
        responseKey: `${NS}:default.corruption`,
        results: [{ next: CorwinDialogue.corruptionLore }],
      },
      {
        responseKey: `${NS}:default.work`,
        results: [
          // Quest 7 — The Blighted Heart: turn-in
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theBlightedHeart, questState: QuestState.active, step: 1 }],
            next: CorwinDialogue.questBlightedHeartComplete,
            // TODO: requirementsNeeded: [{ type: 'item', itemId: ItemID.blightedHeartwood, amount: 1 }]
          },
          // Quest 7 — in progress
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theBlightedHeart, questState: QuestState.active }],
            next: CorwinDialogue.questBlightedHeart,
          },
          // Quest 6 — The Sap That Burns: turn-in
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theSapThatBurns, questState: QuestState.active, step: 1 }],
            next: CorwinDialogue.questTheSapComplete,
            // TODO: requirementsNeeded: [{ type: 'item', itemId: ItemID.cursedSap, amount: 5 }]
          },
          // Quest 6 — in progress
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theSapThatBurns, questState: QuestState.active }],
            next: CorwinDialogue.questTheSapProgress,
          },
          // Quest 6 — offer (unlocked after Finn's fetishes quest completes)
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.fetchesAndFangs, questState: QuestState.completed }],
            next: CorwinDialogue.questTheSap,
          },
          // Quest 4 — Signs of Rot: turn-in
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.signsOfRot, questState: QuestState.active, step: 1 }],
            next: CorwinDialogue.questSignsOfRotComplete,
            // TODO: requirementsNeeded: [{ type: 'item', itemId: ItemID.corruptedResin, amount: 3 }]
          },
          // Quest 4 — in progress
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.signsOfRot, questState: QuestState.active }],
            next: CorwinDialogue.questSignsOfRotProgress,
          },
          // Default — offer Signs of Rot
          {
            next: CorwinDialogue.questSignsOfRot,
          },
        ],
      },
      {
        responseKey: `${NS}:default.goodbye`,
        results: [{ next: CorwinDialogue.default, closeDialogue: true }],
      },
    ],
  },

  [CorwinDialogue.aboutMawood]: {
    id: CorwinDialogue.aboutMawood,
    messageKey: `${NS}:aboutMawood.message`,
    options: [
      {
        responseKey: `${NS}:aboutMawood.opt1`,
        results: [{ next: CorwinDialogue.corruptionLore }],
      },
      {
        responseKey: `${NS}:aboutMawood.opt2`,
        results: [{ next: CorwinDialogue.default }],
      },
    ],
  },

  [CorwinDialogue.aboutForest]: {
    id: CorwinDialogue.aboutForest,
    messageKey: `${NS}:aboutForest.message`,
    options: [
      {
        responseKey: `${NS}:aboutForest.opt1`,
        results: [{ next: CorwinDialogue.corruptionLore }],
      },
      {
        responseKey: `${NS}:aboutForest.opt2`,
        results: [{ next: CorwinDialogue.default }],
      },
    ],
  },

  [CorwinDialogue.corruptionLore]: {
    id: CorwinDialogue.corruptionLore,
    messageKey: `${NS}:corruptionLore.message`,
    options: [
      {
        responseKey: `${NS}:corruptionLore.opt1`,
        results: [{ next: CorwinDialogue.corruptionDetails }],
      },
      {
        responseKey: `${NS}:corruptionLore.opt2`,
        results: [{ next: CorwinDialogue.default }],
      },
    ],
  },

  [CorwinDialogue.corruptionDetails]: {
    id: CorwinDialogue.corruptionDetails,
    messageKey: `${NS}:corruptionDetails.message`,
    options: [
      {
        responseKey: `${NS}:corruptionDetails.opt1`,
        results: [{ next: CorwinDialogue.questSignsOfRot }],
      },
    ],
  },

  [CorwinDialogue.questSignsOfRot]: {
    id: CorwinDialogue.questSignsOfRot,
    messageKey: `${NS}:questSignsOfRot.message`,
    options: [
      {
        responseKey: `${NS}:questSignsOfRot.accept`,
        results: [
          {
            next: CorwinDialogue.default,
            closeDialogue: true,
            effects: [{ type: 'quest', action: 'start', questId: QuestID.signsOfRot }],
          },
        ],
      },
      {
        responseKey: `${NS}:questSignsOfRot.decline`,
        results: [{ next: CorwinDialogue.default }],
      },
    ],
  },

  [CorwinDialogue.questSignsOfRotProgress]: {
    id: CorwinDialogue.questSignsOfRotProgress,
    messageKey: `${NS}:questSignsOfRotProgress.message`,
    options: [
      {
        responseKey: `${NS}:questSignsOfRotProgress.opt1`,
        results: [{ next: CorwinDialogue.default, closeDialogue: true }],
      },
    ],
  },

  [CorwinDialogue.questSignsOfRotComplete]: {
    id: CorwinDialogue.questSignsOfRotComplete,
    messageKey: `${NS}:questSignsOfRotComplete.message`,
    options: [
      {
        responseKey: `${NS}:questSignsOfRotComplete.opt1`,
        results: [
          {
            next: CorwinDialogue.default,
            effects: [
              { type: 'quest', action: 'end', questId: QuestID.signsOfRot },
              // TODO: { type: 'item', action: 'take', items: [{ itemId: ItemID.corruptedResin, amount: 3 }] }
            ],
          },
        ],
      },
    ],
  },

  [CorwinDialogue.questTheSap]: {
    id: CorwinDialogue.questTheSap,
    messageKey: `${NS}:questTheSap.message`,
    options: [
      {
        responseKey: `${NS}:questTheSap.accept`,
        results: [
          {
            next: CorwinDialogue.default,
            closeDialogue: true,
            effects: [{ type: 'quest', action: 'start', questId: QuestID.theSapThatBurns }],
          },
        ],
      },
      {
        responseKey: `${NS}:questTheSap.decline`,
        results: [{ next: CorwinDialogue.default }],
      },
    ],
  },

  [CorwinDialogue.questTheSapProgress]: {
    id: CorwinDialogue.questTheSapProgress,
    messageKey: `${NS}:questTheSapProgress.message`,
    options: [
      {
        responseKey: `${NS}:questTheSapProgress.opt1`,
        results: [{ next: CorwinDialogue.default, closeDialogue: true }],
      },
    ],
  },

  [CorwinDialogue.questTheSapComplete]: {
    id: CorwinDialogue.questTheSapComplete,
    messageKey: `${NS}:questTheSapComplete.message`,
    options: [
      {
        responseKey: `${NS}:questTheSapComplete.opt1`,
        results: [
          {
            next: CorwinDialogue.questBlightedHeart,
            effects: [
              { type: 'quest', action: 'end', questId: QuestID.theSapThatBurns },
              { type: 'quest', action: 'start', questId: QuestID.theBlightedHeart },
              // TODO: { type: 'item', action: 'take', items: [{ itemId: ItemID.cursedSap, amount: 5 }] }
            ],
          },
        ],
      },
    ],
  },

  [CorwinDialogue.questBlightedHeart]: {
    id: CorwinDialogue.questBlightedHeart,
    messageKey: `${NS}:questBlightedHeart.message`,
    options: [
      {
        responseKey: `${NS}:questBlightedHeart.opt1`,
        results: [{ next: CorwinDialogue.default, closeDialogue: true }],
      },
    ],
  },

  [CorwinDialogue.questBlightedHeartComplete]: {
    id: CorwinDialogue.questBlightedHeartComplete,
    messageKey: `${NS}:questBlightedHeartComplete.message`,
    options: [
      {
        responseKey: `${NS}:questBlightedHeartComplete.opt1`,
        results: [
          {
            next: CorwinDialogue.postQuestLore,
            effects: [
              { type: 'quest', action: 'end', questId: QuestID.theBlightedHeart },
              { type: 'stat', action: 'award', stats: [{ stat: 'unspentSkillPoints', amount: 1 }] },
              // TODO: { type: 'item', action: 'take', items: [{ itemId: ItemID.blightedHeartwood, amount: 1 }] }
            ],
          },
        ],
      },
    ],
  },

  [CorwinDialogue.postQuestLore]: {
    id: CorwinDialogue.postQuestLore,
    messageKey: `${NS}:postQuestLore.message`,
    options: [
      {
        responseKey: `${NS}:postQuestLore.opt1`,
        results: [{ next: CorwinDialogue.default, closeDialogue: true }],
      },
    ],
  },
}

export default MAWOOD_CORWIN
