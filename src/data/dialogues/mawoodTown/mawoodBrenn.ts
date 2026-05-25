import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'
import { NpcID } from '../../../enums/map/npc-id.enum'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { QuestState } from '../../../enums/quest-state.enum'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { EnemyID } from '../../../enums/ids/enemy-id.enum'

export enum BrennDialogue {
  default = 0,
  intro1,
  aboutBrenn,
  aboutBrennOrigin,
  aboutBrennCorruption,
  aboutCorruption,
  questRawMaterials,
  questRawMaterialsProgress,
  questRawMaterialsComplete,
  questWarTrophies,
  questWarTrophiesProgress,
  questWarTrophiesComplete,
}

export type MawoodBrennDialogueType = Record<BrennDialogue, DialogueNode<BrennDialogue>>

const NS = 'dialogues/mawoodBrenn'

const MAWOOD_BRENN: MawoodBrennDialogueType = {
  [BrennDialogue.intro1]: {
    id: BrennDialogue.intro1,
    messageKey: `${NS}:intro1.message`,
    options: [
      {
        responseKey: `${NS}:intro1.opt1`,
        results: [
          {
            next: BrennDialogue.default,
            effects: [{ type: 'flag', name: `met_${NpcID.mawoodBrenn}` }],
          },
        ],
      },
      {
        responseKey: `${NS}:intro1.opt2`,
        results: [
          {
            next: BrennDialogue.default,
            effects: [{ type: 'flag', name: `met_${NpcID.mawoodBrenn}` }],
          },
        ],
      },
    ],
  },

  [BrennDialogue.default]: {
    id: BrennDialogue.default,
    messageKey: `${NS}:default.message`,
    options: [
      {
        responseKey: `${NS}:default.aboutBrenn`,
        results: [{ next: BrennDialogue.aboutBrenn }],
      },
      {
        responseKey: `${NS}:default.aboutCorruption`,
        results: [{ next: BrennDialogue.aboutCorruption }],
      },
      {
        responseKey: `${NS}:default.work`,
        results: [
          // War Trophies: turn-in
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.warTrophies, questState: QuestState.active, step: 1 }],
            next: BrennDialogue.questWarTrophiesComplete,
            requirementsNeeded: [{ type: 'killCount', enemyId: EnemyID.gnollWarchief, amount: 3 }],
          },
          // War Trophies: in progress
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.warTrophies, questState: QuestState.active }],
            next: BrennDialogue.questWarTrophiesProgress,
          },
          // War Trophies: offer (after Raw Materials done)
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.rawMaterials, questState: QuestState.completed }],
            next: BrennDialogue.questWarTrophies,
          },
          // Raw Materials: turn-in
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.rawMaterials, questState: QuestState.active, step: 1 }],
            next: BrennDialogue.questRawMaterialsComplete,
            requirementsNeeded: [{ type: 'manyItems', itemIds: [ItemID.ancientWood, ItemID.bearPelt], amounts: { [ItemID.ancientWood]: 20, [ItemID.bearPelt]: 5 } }],
          },
          // Raw Materials: in progress
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.rawMaterials, questState: QuestState.active }],
            next: BrennDialogue.questRawMaterialsProgress,
          },
          // Raw Materials: offer (only once available — after The Sap That Burns)
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.rawMaterials, questState: QuestState.available }],
            next: BrennDialogue.questRawMaterials,
          },
          // Nothing for the player yet — keep the conversation on the default node
          {
            next: BrennDialogue.default,
          },
        ],
      },
      {
        responseKey: `${NS}:default.goodbye`,
        results: [{ next: BrennDialogue.default, closeDialogue: true }],
      },
    ],
  },

  [BrennDialogue.aboutBrenn]: {
    id: BrennDialogue.aboutBrenn,
    messageKey: `${NS}:aboutBrenn.message`,
    options: [
      {
        responseKey: `${NS}:aboutBrenn.opt1`,
        results: [{ next: BrennDialogue.aboutBrennOrigin }],
      },
      {
        responseKey: `${NS}:aboutBrenn.opt2`,
        results: [{ next: BrennDialogue.aboutBrennCorruption }],
      },
    ],
  },

  [BrennDialogue.aboutBrennOrigin]: {
    id: BrennDialogue.aboutBrennOrigin,
    messageKey: `${NS}:aboutBrennOrigin.message`,
    options: [
      {
        responseKey: `${NS}:aboutBrennOrigin.opt1`,
        results: [{ next: BrennDialogue.default }],
      },
    ],
  },

  [BrennDialogue.aboutBrennCorruption]: {
    id: BrennDialogue.aboutBrennCorruption,
    messageKey: `${NS}:aboutBrennCorruption.message`,
    options: [
      {
        responseKey: `${NS}:aboutBrennCorruption.opt1`,
        results: [{ next: BrennDialogue.default }],
      },
    ],
  },

  [BrennDialogue.aboutCorruption]: {
    id: BrennDialogue.aboutCorruption,
    messageKey: `${NS}:aboutCorruption.message`,
    options: [
      {
        responseKey: `${NS}:aboutCorruption.opt1`,
        results: [{ next: BrennDialogue.default }],
      },
      {
        responseKey: `${NS}:aboutCorruption.opt2`,
        results: [{ next: BrennDialogue.default }],
      },
    ],
  },

  [BrennDialogue.questRawMaterials]: {
    id: BrennDialogue.questRawMaterials,
    messageKey: `${NS}:questRawMaterials.message`,
    options: [
      {
        responseKey: `${NS}:questRawMaterials.accept`,
        results: [
          {
            next: BrennDialogue.default,
            closeDialogue: true,
            effects: [{ type: 'quest', action: 'start', questId: QuestID.rawMaterials }],
          },
        ],
      },
      {
        responseKey: `${NS}:questRawMaterials.decline`,
        results: [{ next: BrennDialogue.default }],
      },
    ],
  },

  [BrennDialogue.questRawMaterialsProgress]: {
    id: BrennDialogue.questRawMaterialsProgress,
    messageKey: `${NS}:questRawMaterialsProgress.message`,
    options: [
      {
        responseKey: `${NS}:questRawMaterialsProgress.opt1`,
        results: [{ next: BrennDialogue.default, closeDialogue: true }],
      },
    ],
  },

  [BrennDialogue.questRawMaterialsComplete]: {
    id: BrennDialogue.questRawMaterialsComplete,
    messageKey: `${NS}:questRawMaterialsComplete.message`,
    options: [
      {
        responseKey: `${NS}:questRawMaterialsComplete.opt1`,
        results: [
          {
            next: BrennDialogue.default,
            effects: [
              { type: 'quest', action: 'end', questId: QuestID.rawMaterials },
              { type: 'item', action: 'take', items: [{ itemId: ItemID.ancientWood, amount: 20 }, { itemId: ItemID.bearPelt, amount: 5 }] },
            ],
          },
        ],
      },
    ],
  },

  [BrennDialogue.questWarTrophies]: {
    id: BrennDialogue.questWarTrophies,
    messageKey: `${NS}:questWarTrophies.message`,
    options: [
      {
        responseKey: `${NS}:questWarTrophies.accept`,
        results: [
          {
            next: BrennDialogue.default,
            closeDialogue: true,
            effects: [{ type: 'quest', action: 'start', questId: QuestID.warTrophies }],
          },
        ],
      },
      {
        responseKey: `${NS}:questWarTrophies.decline`,
        results: [{ next: BrennDialogue.default }],
      },
    ],
  },

  [BrennDialogue.questWarTrophiesProgress]: {
    id: BrennDialogue.questWarTrophiesProgress,
    messageKey: `${NS}:questWarTrophiesProgress.message`,
    options: [
      {
        responseKey: `${NS}:questWarTrophiesProgress.opt1`,
        results: [{ next: BrennDialogue.default, closeDialogue: true }],
      },
    ],
  },

  [BrennDialogue.questWarTrophiesComplete]: {
    id: BrennDialogue.questWarTrophiesComplete,
    messageKey: `${NS}:questWarTrophiesComplete.message`,
    options: [
      {
        responseKey: `${NS}:questWarTrophiesComplete.opt1`,
        results: [
          {
            next: BrennDialogue.default,
            effects: [
              { type: 'quest', action: 'end', questId: QuestID.warTrophies },
            ],
          },
        ],
      },
    ],
  },
}

export default MAWOOD_BRENN
