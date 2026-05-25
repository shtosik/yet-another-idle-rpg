import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'
import { NpcID } from '../../../enums/map/npc-id.enum'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { QuestState } from '../../../enums/quest-state.enum'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { EnemyID } from '../../../enums/ids/enemy-id.enum'

export enum FinnDialogue {
  default = 0,
  intro1,
  aboutFinn,
  aboutFinnTown,
  aboutLeg,
  aboutLegLuck,
  aboutLegDeepwood,
  aboutCorruption,
  aboutCorruptionGnolls,
  questFetishes,
  questFetchesProgress,
  questFetchesComplete,
  questProveYourAim,
  questProveYourAimProgress,
  questProveYourAimComplete,
  questBigGame,
  questBigGameProgress,
  questBigGameComplete,
}

export type MawoodFinnDialogueType = Record<FinnDialogue, DialogueNode<FinnDialogue>>

const NS = 'dialogues/mawoodFinn'

const MAWOOD_FINN: MawoodFinnDialogueType = {
  [FinnDialogue.intro1]: {
    id: FinnDialogue.intro1,
    messageKey: `${NS}:intro1.message`,
    options: [
      {
        responseKey: `${NS}:intro1.opt1`,
        results: [
          {
            next: FinnDialogue.default,
            effects: [{ type: 'flag', name: `met_${NpcID.mawoodFinn}` }],
          },
        ],
      },
      {
        responseKey: `${NS}:intro1.opt2`,
        results: [
          {
            next: FinnDialogue.default,
            effects: [{ type: 'flag', name: `met_${NpcID.mawoodFinn}` }],
          },
        ],
      },
    ],
  },

  [FinnDialogue.default]: {
    id: FinnDialogue.default,
    messageKey: `${NS}:default.message`,
    options: [
      {
        responseKey: `${NS}:default.aboutFinn`,
        results: [{ next: FinnDialogue.aboutFinn }],
      },
      {
        responseKey: `${NS}:default.aboutLeg`,
        results: [{ next: FinnDialogue.aboutLeg }],
      },
      {
        responseKey: `${NS}:default.corruption`,
        results: [{ next: FinnDialogue.aboutCorruption }],
      },
      {
        responseKey: `${NS}:default.work`,
        results: [
          // Big Game: turn-in
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.bigGame, questState: QuestState.active, step: 1 }],
            next: FinnDialogue.questBigGameComplete,
            requirementsNeeded: [{ type: 'item', itemId: ItemID.bearPelt, amount: 3 }],
          },
          // Big Game: in progress
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.bigGame, questState: QuestState.active }],
            next: FinnDialogue.questBigGameProgress,
          },
          // Big Game: offer (after Prove Your Aim done)
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.proveYourAim, questState: QuestState.completed }],
            next: FinnDialogue.questBigGame,
          },
          // Fetches and Fangs (corruption quest): turn-in
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.fetchesAndFangs, questState: QuestState.active, step: 1 }],
            next: FinnDialogue.questFetchesComplete,
            requirementsNeeded: [{ type: 'item', itemId: ItemID.blightedFetish, amount: 1 }],
          },
          // Fetches and Fangs: in progress
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.fetchesAndFangs, questState: QuestState.active }],
            next: FinnDialogue.questFetchesProgress,
          },
          // Prove Your Aim: turn-in
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.proveYourAim, questState: QuestState.active, step: 1 }],
            next: FinnDialogue.questProveYourAimComplete,
            requirementsNeeded: [{ type: 'killCount', enemyId: EnemyID.gnollScout, amount: 10 }],
          },
          // Prove Your Aim: in progress
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.proveYourAim, questState: QuestState.active }],
            next: FinnDialogue.questProveYourAimProgress,
          },
          // Default — offer Prove Your Aim first
          {
            next: FinnDialogue.questProveYourAim,
          },
        ],
      },
      {
        responseKey: `${NS}:default.goodbye`,
        results: [{ next: FinnDialogue.default, closeDialogue: true }],
      },
    ],
  },

  [FinnDialogue.aboutFinn]: {
    id: FinnDialogue.aboutFinn,
    messageKey: `${NS}:aboutFinn.message`,
    options: [
      {
        responseKey: `${NS}:aboutFinn.opt1`,
        results: [{ next: FinnDialogue.aboutCorruption }],
      },
      {
        responseKey: `${NS}:aboutFinn.opt2`,
        results: [{ next: FinnDialogue.aboutFinnTown }],
      },
    ],
  },

  [FinnDialogue.aboutFinnTown]: {
    id: FinnDialogue.aboutFinnTown,
    messageKey: `${NS}:aboutFinnTown.message`,
    options: [
      {
        responseKey: `${NS}:aboutFinnTown.opt1`,
        results: [{ next: FinnDialogue.default }],
      },
    ],
  },

  [FinnDialogue.aboutLeg]: {
    id: FinnDialogue.aboutLeg,
    messageKey: `${NS}:aboutLeg.message`,
    options: [
      {
        responseKey: `${NS}:aboutLeg.opt1`,
        results: [{ next: FinnDialogue.aboutLegLuck }],
      },
      {
        responseKey: `${NS}:aboutLeg.opt2`,
        results: [{ next: FinnDialogue.aboutLegDeepwood }],
      },
    ],
  },

  [FinnDialogue.aboutLegLuck]: {
    id: FinnDialogue.aboutLegLuck,
    messageKey: `${NS}:aboutLegLuck.message`,
    options: [
      {
        responseKey: `${NS}:aboutLegLuck.opt1`,
        results: [{ next: FinnDialogue.default }],
      },
    ],
  },

  [FinnDialogue.aboutLegDeepwood]: {
    id: FinnDialogue.aboutLegDeepwood,
    messageKey: `${NS}:aboutLegDeepwood.message`,
    options: [
      {
        responseKey: `${NS}:aboutLegDeepwood.opt1`,
        results: [{ next: FinnDialogue.default }],
      },
    ],
  },

  [FinnDialogue.aboutCorruption]: {
    id: FinnDialogue.aboutCorruption,
    messageKey: `${NS}:aboutCorruption.message`,
    options: [
      {
        responseKey: `${NS}:aboutCorruption.opt1`,
        results: [{ next: FinnDialogue.aboutCorruptionGnolls }],
      },
      {
        responseKey: `${NS}:aboutCorruption.opt2`,
        results: [{ next: FinnDialogue.aboutCorruptionGnolls }],
      },
    ],
  },

  [FinnDialogue.aboutCorruptionGnolls]: {
    id: FinnDialogue.aboutCorruptionGnolls,
    messageKey: `${NS}:aboutCorruptionGnolls.message`,
    options: [
      {
        responseKey: `${NS}:aboutCorruptionGnolls.opt1`,
        results: [{ next: FinnDialogue.questProveYourAim }],
      },
      {
        responseKey: `${NS}:aboutCorruptionGnolls.opt2`,
        results: [{ next: FinnDialogue.questFetishes }],
      },
    ],
  },

  [FinnDialogue.questFetishes]: {
    id: FinnDialogue.questFetishes,
    messageKey: `${NS}:questFetishes.message`,
    options: [
      {
        responseKey: `${NS}:questFetishes.accept`,
        results: [
          {
            next: FinnDialogue.default,
            closeDialogue: true,
            effects: [{ type: 'quest', action: 'start', questId: QuestID.fetchesAndFangs }],
          },
        ],
      },
      {
        responseKey: `${NS}:questFetishes.decline`,
        results: [{ next: FinnDialogue.default }],
      },
    ],
  },

  [FinnDialogue.questFetchesProgress]: {
    id: FinnDialogue.questFetchesProgress,
    messageKey: `${NS}:questFetchesProgress.message`,
    options: [
      {
        responseKey: `${NS}:questFetchesProgress.opt1`,
        results: [{ next: FinnDialogue.default, closeDialogue: true }],
      },
    ],
  },

  [FinnDialogue.questFetchesComplete]: {
    id: FinnDialogue.questFetchesComplete,
    messageKey: `${NS}:questFetchesComplete.message`,
    options: [
      {
        responseKey: `${NS}:questFetchesComplete.opt1`,
        results: [
          {
            next: FinnDialogue.default,
            effects: [
              { type: 'quest', action: 'end', questId: QuestID.fetchesAndFangs },
              { type: 'item', action: 'take', items: [{ itemId: ItemID.blightedFetish, amount: 1 }] },
            ],
          },
        ],
      },
    ],
  },

  [FinnDialogue.questProveYourAim]: {
    id: FinnDialogue.questProveYourAim,
    messageKey: `${NS}:questProveYourAim.message`,
    options: [
      {
        responseKey: `${NS}:questProveYourAim.accept`,
        results: [
          {
            next: FinnDialogue.default,
            closeDialogue: true,
            effects: [{ type: 'quest', action: 'start', questId: QuestID.proveYourAim }],
          },
        ],
      },
      {
        responseKey: `${NS}:questProveYourAim.decline`,
        results: [{ next: FinnDialogue.default }],
      },
    ],
  },

  [FinnDialogue.questProveYourAimProgress]: {
    id: FinnDialogue.questProveYourAimProgress,
    messageKey: `${NS}:questProveYourAimProgress.message`,
    options: [
      {
        responseKey: `${NS}:questProveYourAimProgress.opt1`,
        results: [{ next: FinnDialogue.default, closeDialogue: true }],
      },
    ],
  },

  [FinnDialogue.questProveYourAimComplete]: {
    id: FinnDialogue.questProveYourAimComplete,
    messageKey: `${NS}:questProveYourAimComplete.message`,
    options: [
      {
        responseKey: `${NS}:questProveYourAimComplete.opt1`,
        results: [
          {
            next: FinnDialogue.questBigGame,
            effects: [
              { type: 'quest', action: 'end', questId: QuestID.proveYourAim },
            ],
          },
        ],
      },
    ],
  },

  [FinnDialogue.questBigGame]: {
    id: FinnDialogue.questBigGame,
    messageKey: `${NS}:questBigGame.message`,
    options: [
      {
        responseKey: `${NS}:questBigGame.accept`,
        results: [
          {
            next: FinnDialogue.default,
            closeDialogue: true,
            effects: [{ type: 'quest', action: 'start', questId: QuestID.bigGame }],
          },
        ],
      },
      {
        responseKey: `${NS}:questBigGame.decline`,
        results: [{ next: FinnDialogue.default }],
      },
    ],
  },

  [FinnDialogue.questBigGameProgress]: {
    id: FinnDialogue.questBigGameProgress,
    messageKey: `${NS}:questBigGameProgress.message`,
    options: [
      {
        responseKey: `${NS}:questBigGameProgress.opt1`,
        results: [{ next: FinnDialogue.default, closeDialogue: true }],
      },
    ],
  },

  [FinnDialogue.questBigGameComplete]: {
    id: FinnDialogue.questBigGameComplete,
    messageKey: `${NS}:questBigGameComplete.message`,
    options: [
      {
        responseKey: `${NS}:questBigGameComplete.opt1`,
        results: [
          {
            next: FinnDialogue.default,
            effects: [
              { type: 'quest', action: 'end', questId: QuestID.bigGame },
              { type: 'item', action: 'take', items: [{ itemId: ItemID.bearPelt, amount: 3 }] },
            ],
          },
        ],
      },
    ],
  },
}

export default MAWOOD_FINN
