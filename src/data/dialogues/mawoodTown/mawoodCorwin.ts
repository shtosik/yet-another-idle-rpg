import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'
import { NpcID } from '../../../enums/map/npc-id.enum'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { QuestState } from '../../../enums/quest-state.enum'
import { TownID } from '../../../enums/map/town-id.enum'
import { ReputationTier } from '../../../enums/reputation-tier.enum'

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
  waitingForFinn,
  reveredFirstShoot,
  rootsAndRaftersComplete,
  rootglowMoth,
  rootglowMothGiven,
}

export type MawoodCorwinDialogueType = Record<CorwinDialogue, DialogueNode<CorwinDialogue>>

const NS = 'dialogues/mawoodCorwin'
/** Mawood's Exalted pet, given once. */
const GAVE_PET_FLAG = 'corwin_gave_pet'

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
            next: CorwinDialogue.aboutMawood,
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
        responseKey: `${NS}:default.rootsAndRafters`,
        results: [{ visibilityConditions: [{ type: 'quest', questId: QuestID.rootsAndRafters, questState: QuestState.readyToAdvance, step: 2 }], next: CorwinDialogue.rootsAndRaftersComplete }],
      },
      {
        responseKey: `${NS}:default.work`,
        results: [
          // Questline done
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theBlightedHeart, questState: QuestState.completed }],
            next: CorwinDialogue.postQuestLore,
          },
          // Quest 7 — The Blighted Heart: turn-in
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theBlightedHeart, questState: QuestState.readyToAdvance, step: 1 }],
            next: CorwinDialogue.questBlightedHeartComplete,
          },
          // Quest 7 — in progress, or offer (questBlightedHeart starts it)
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theBlightedHeart, questState: QuestState.active }],
            next: CorwinDialogue.questBlightedHeart,
          },
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theBlightedHeart, questState: QuestState.available }],
            next: CorwinDialogue.questBlightedHeart,
          },
          // Quest 6 — The Sap That Burns: turn-in
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theSapThatBurns, questState: QuestState.readyToAdvance, step: 1 }],
            next: CorwinDialogue.questTheSapComplete,
          },
          // Quest 6 — in progress
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theSapThatBurns, questState: QuestState.active }],
            next: CorwinDialogue.questTheSapProgress,
          },
          // Quest 6 — offer (unlocked after Finn's fetishes quest completes)
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theSapThatBurns, questState: QuestState.available }],
            next: CorwinDialogue.questTheSap,
          },
          // Between quests — Fetches and Fangs runs through Finn
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.signsOfRot, questState: QuestState.completed }],
            next: CorwinDialogue.waitingForFinn,
          },
          // Quest 4 — Signs of Rot: turn-in
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.signsOfRot, questState: QuestState.readyToAdvance, step: 1 }],
            next: CorwinDialogue.questSignsOfRotComplete,
          },
          // Quest 4 — in progress
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.signsOfRot, questState: QuestState.active }],
            next: CorwinDialogue.questSignsOfRotProgress,
          },
          // Quest 4 — offer
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.signsOfRot, questState: QuestState.available }],
            next: CorwinDialogue.questSignsOfRot,
          },
        ],
      },
      {
        responseKey: `${NS}:default.recovery`,
        results: [
          {
            visibilityConditions: [
              { type: 'reputation', townId: TownID.mawood, tier: ReputationTier.revered, hidden: true },
              { type: 'quest', questId: QuestID.theBlightedHeart, questState: QuestState.completed },
            ],
            next: CorwinDialogue.reveredFirstShoot,
          },
        ],
      },
      {
        responseKey: `${NS}:default.rootglowMoth`,
        results: [{
          visibilityConditions: [
            { type: 'reputation', townId: TownID.mawood, tier: ReputationTier.exalted, hidden: true },
            { type: 'flag', name: GAVE_PET_FLAG, isSet: false, hidden: true },
          ],
          next: CorwinDialogue.rootglowMoth,
        }],
      },
      {
        responseKey: `${NS}:default.goodbye`,
        results: [{ next: CorwinDialogue.default, closeDialogue: true }],
      },
    ],
  },

  [CorwinDialogue.reveredFirstShoot]: {
    id: CorwinDialogue.reveredFirstShoot,
    messageKey: `${NS}:reveredFirstShoot.message`,
    options: [
      {
        responseKey: `${NS}:reveredFirstShoot.opt1`,
        results: [{ next: CorwinDialogue.default }],
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
        results: [
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.signsOfRot, questState: QuestState.available }],
            next: CorwinDialogue.questSignsOfRot,
          },
          { next: CorwinDialogue.default },
        ],
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
        results: [
          // A start only shows once its quest is available, so it can't share a result with ending The Sap That Burns
          {
            next: CorwinDialogue.default,
            closeDialogue: true,
            effects: [{ type: 'quest', action: 'start', questId: QuestID.theBlightedHeart }],
          },
          { next: CorwinDialogue.default, closeDialogue: true },
        ],
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

  [CorwinDialogue.waitingForFinn]: {
    id: CorwinDialogue.waitingForFinn,
    messageKey: `${NS}:waitingForFinn.message`,
    options: [
      {
        responseKey: `${NS}:waitingForFinn.opt1`,
        results: [{ next: CorwinDialogue.default, closeDialogue: true }],
      },
    ],
  },
  [CorwinDialogue.rootsAndRaftersComplete]: {
    id: CorwinDialogue.rootsAndRaftersComplete,
    messageKey: `${NS}:rootsAndRaftersComplete.message`,
    options: [
      { responseKey: `${NS}:rootsAndRaftersComplete.opt1`, results: [{ next: CorwinDialogue.reveredFirstShoot, effects: [{ type: 'quest', action: 'advance', questId: QuestID.rootsAndRafters }] }] },
    ],
  },
  [CorwinDialogue.rootglowMoth]: {
    id: CorwinDialogue.rootglowMoth,
    messageKey: `${NS}:rootglowMoth.message`,
    options: [
      {
        responseKey: `${NS}:rootglowMoth.opt1`,
        results: [{
          next: CorwinDialogue.rootglowMothGiven,
          effects: [
            { type: 'item', action: 'give', items: [{ itemId: ItemID.petMawoodMoth, amount: 1 }] },
            { type: 'flag', name: GAVE_PET_FLAG },
          ],
        }],
      },
      { responseKey: `${NS}:rootglowMoth.opt2`, results: [{ next: CorwinDialogue.default }] },
    ],
  },
  [CorwinDialogue.rootglowMothGiven]: {
    id: CorwinDialogue.rootglowMothGiven,
    messageKey: `${NS}:rootglowMothGiven.message`,
    options: [
      { responseKey: `${NS}:rootglowMothGiven.opt1`, results: [{ next: CorwinDialogue.default }] },
    ],
  },
}

export default MAWOOD_CORWIN
