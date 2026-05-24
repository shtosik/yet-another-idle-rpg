import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'
import { NpcID } from '../../../enums/map/npc-id.enum'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { QuestState } from '../../../enums/quest-state.enum'

export enum MiloDialogue {
  default = 0,
  intro1,
  intro1Short,
  aboutMilo,
  aboutMiloHeights,
  aboutMiloActivities,
  aboutCanopy,
  aboutCanopyCloser,
  aboutCanopyBig,
  aboutCanopyDangerous,
  questFeathers,
  questFeathersProgress,
  questFeathersComplete,
  questWhatLurks,
  questWhatLurksAccept,
  questWhatLurksProgress,
  questWhatLurksComplete,
  questWhatLurksPostQuest,
}

export type MawoodMiloDialogueType = Record<MiloDialogue, DialogueNode<MiloDialogue>>

const NS = 'dialogues/mawoodMilo'

const MAWOOD_MILO: MawoodMiloDialogueType = {
  [MiloDialogue.intro1]: {
    id: MiloDialogue.intro1,
    messageKey: `${NS}:intro1.message`,
    options: [
      {
        responseKey: `${NS}:intro1.opt1`,
        results: [
          {
            next: MiloDialogue.default,
            effects: [{ type: 'flag', name: `met_${NpcID.mawoodMilo}` }],
          },
        ],
      },
      {
        responseKey: `${NS}:intro1.opt2`,
        results: [{ next: MiloDialogue.intro1Short }],
      },
    ],
  },

  [MiloDialogue.intro1Short]: {
    id: MiloDialogue.intro1Short,
    messageKey: `${NS}:intro1Short.message`,
    options: [
      {
        responseKey: `${NS}:intro1Short.opt1`,
        results: [
          {
            next: MiloDialogue.default,
            effects: [{ type: 'flag', name: `met_${NpcID.mawoodMilo}` }],
          },
        ],
      },
    ],
  },

  [MiloDialogue.default]: {
    id: MiloDialogue.default,
    messageKey: `${NS}:default.message`,
    options: [
      {
        responseKey: `${NS}:default.aboutMilo`,
        results: [{ next: MiloDialogue.aboutMilo }],
      },
      {
        responseKey: `${NS}:default.aboutCanopy`,
        results: [{ next: MiloDialogue.aboutCanopy }],
      },
      {
        responseKey: `${NS}:default.work`,
        results: [
          // What Lurks: post-quest lore
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.whatLurksAtTheTop, questState: QuestState.completed }],
            next: MiloDialogue.questWhatLurksPostQuest,
          },
          // What Lurks: turn-in
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.whatLurksAtTheTop, questState: QuestState.active, step: 1 }],
            next: MiloDialogue.questWhatLurksComplete,
            // TODO: requirementsNeeded: [{ type: 'killCount', enemyId: EnemyID.harpyMatriarch, amount: 1 }]
          },
          // What Lurks: in progress
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.whatLurksAtTheTop, questState: QuestState.active }],
            next: MiloDialogue.questWhatLurksProgress,
          },
          // Feathers: offer (after What Lurks unlocked from feathers)
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.feathersForAKite, questState: QuestState.completed }],
            next: MiloDialogue.questWhatLurks,
          },
          // Feathers: turn-in
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.feathersForAKite, questState: QuestState.active, step: 1 }],
            next: MiloDialogue.questFeathersComplete,
            // TODO: requirementsNeeded: [{ type: 'item', itemId: ItemID.harpyFeather, amount: 5 }]
          },
          // Feathers: in progress
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.feathersForAKite, questState: QuestState.active }],
            next: MiloDialogue.questFeathersProgress,
          },
          // Default — offer Feathers first
          {
            next: MiloDialogue.questFeathers,
          },
        ],
      },
      {
        responseKey: `${NS}:default.goodbye`,
        results: [{ next: MiloDialogue.default, closeDialogue: true }],
      },
    ],
  },

  [MiloDialogue.aboutMilo]: {
    id: MiloDialogue.aboutMilo,
    messageKey: `${NS}:aboutMilo.message`,
    options: [
      {
        responseKey: `${NS}:aboutMilo.opt1`,
        results: [{ next: MiloDialogue.aboutMiloHeights }],
      },
      {
        responseKey: `${NS}:aboutMilo.opt2`,
        results: [{ next: MiloDialogue.aboutMiloActivities }],
      },
    ],
  },

  [MiloDialogue.aboutMiloHeights]: {
    id: MiloDialogue.aboutMiloHeights,
    messageKey: `${NS}:aboutMiloHeights.message`,
    options: [
      {
        responseKey: `${NS}:aboutMiloHeights.opt1`,
        results: [{ next: MiloDialogue.default }],
      },
    ],
  },

  [MiloDialogue.aboutMiloActivities]: {
    id: MiloDialogue.aboutMiloActivities,
    messageKey: `${NS}:aboutMiloActivities.message`,
    options: [
      {
        responseKey: `${NS}:aboutMiloActivities.opt1`,
        results: [{ next: MiloDialogue.aboutCanopy }],
      },
    ],
  },

  [MiloDialogue.aboutCanopy]: {
    id: MiloDialogue.aboutCanopy,
    messageKey: `${NS}:aboutCanopy.message`,
    options: [
      {
        responseKey: `${NS}:aboutCanopy.opt1`,
        results: [{ next: MiloDialogue.aboutCanopyCloser }],
      },
      {
        responseKey: `${NS}:aboutCanopy.opt2`,
        results: [{ next: MiloDialogue.aboutCanopyDangerous }],
      },
    ],
  },

  [MiloDialogue.aboutCanopyCloser]: {
    id: MiloDialogue.aboutCanopyCloser,
    messageKey: `${NS}:aboutCanopyCloser.message`,
    options: [
      {
        responseKey: `${NS}:aboutCanopyCloser.opt1`,
        results: [{ next: MiloDialogue.aboutCanopyBig }],
      },
      {
        responseKey: `${NS}:aboutCanopyCloser.opt2`,
        results: [{ next: MiloDialogue.default }],
      },
    ],
  },

  [MiloDialogue.aboutCanopyBig]: {
    id: MiloDialogue.aboutCanopyBig,
    messageKey: `${NS}:aboutCanopyBig.message`,
    options: [
      {
        responseKey: `${NS}:aboutCanopyBig.opt1`,
        results: [{ next: MiloDialogue.questFeathers }],
      },
    ],
  },

  [MiloDialogue.aboutCanopyDangerous]: {
    id: MiloDialogue.aboutCanopyDangerous,
    messageKey: `${NS}:aboutCanopyDangerous.message`,
    options: [
      {
        responseKey: `${NS}:aboutCanopyDangerous.opt1`,
        results: [{ next: MiloDialogue.default }],
      },
    ],
  },

  [MiloDialogue.questFeathers]: {
    id: MiloDialogue.questFeathers,
    messageKey: `${NS}:questFeathers.message`,
    options: [
      {
        responseKey: `${NS}:questFeathers.accept`,
        results: [
          {
            next: MiloDialogue.default,
            closeDialogue: true,
            effects: [{ type: 'quest', action: 'start', questId: QuestID.feathersForAKite }],
          },
        ],
      },
      {
        responseKey: `${NS}:questFeathers.decline`,
        results: [{ next: MiloDialogue.default }],
      },
    ],
  },

  [MiloDialogue.questFeathersProgress]: {
    id: MiloDialogue.questFeathersProgress,
    messageKey: `${NS}:questFeathersProgress.message`,
    options: [
      {
        responseKey: `${NS}:questFeathersProgress.opt1`,
        results: [{ next: MiloDialogue.default, closeDialogue: true }],
      },
    ],
  },

  [MiloDialogue.questFeathersComplete]: {
    id: MiloDialogue.questFeathersComplete,
    messageKey: `${NS}:questFeathersComplete.message`,
    options: [
      {
        responseKey: `${NS}:questFeathersComplete.opt1`,
        results: [
          {
            next: MiloDialogue.questWhatLurks,
            effects: [
              { type: 'quest', action: 'end', questId: QuestID.feathersForAKite },
              { type: 'stat', action: 'award', stats: [{ stat: 'experience', amount: 1000 }, { stat: 'goldCoins', amount: 200 }] },
              // TODO: { type: 'item', action: 'give', items: [{ itemId: ItemID.eagleTalon, amount: 1 }] }
              // TODO: { type: 'item', action: 'take', items: [{ itemId: ItemID.harpyFeather, amount: 5 }] }
            ],
          },
        ],
      },
    ],
  },

  [MiloDialogue.questWhatLurks]: {
    id: MiloDialogue.questWhatLurks,
    messageKey: `${NS}:questWhatLurks.message`,
    options: [
      {
        responseKey: `${NS}:questWhatLurks.accept`,
        results: [{ next: MiloDialogue.questWhatLurksAccept }],
      },
      {
        responseKey: `${NS}:questWhatLurks.decline`,
        results: [{ next: MiloDialogue.default }],
      },
    ],
  },

  [MiloDialogue.questWhatLurksAccept]: {
    id: MiloDialogue.questWhatLurksAccept,
    messageKey: `${NS}:questWhatLurksAccept.message`,
    options: [
      {
        responseKey: `${NS}:questWhatLurksAccept.opt1`,
        results: [
          {
            next: MiloDialogue.default,
            closeDialogue: true,
            effects: [{ type: 'quest', action: 'start', questId: QuestID.whatLurksAtTheTop }],
          },
        ],
      },
    ],
  },

  [MiloDialogue.questWhatLurksProgress]: {
    id: MiloDialogue.questWhatLurksProgress,
    messageKey: `${NS}:questWhatLurksProgress.message`,
    options: [
      {
        responseKey: `${NS}:questWhatLurksProgress.opt1`,
        results: [{ next: MiloDialogue.default, closeDialogue: true }],
      },
    ],
  },

  [MiloDialogue.questWhatLurksComplete]: {
    id: MiloDialogue.questWhatLurksComplete,
    messageKey: `${NS}:questWhatLurksComplete.message`,
    options: [
      {
        responseKey: `${NS}:questWhatLurksComplete.opt1`,
        results: [
          {
            next: MiloDialogue.questWhatLurksPostQuest,
            effects: [
              { type: 'quest', action: 'end', questId: QuestID.whatLurksAtTheTop },
              { type: 'stat', action: 'award', stats: [{ stat: 'experience', amount: 5000 }, { stat: 'goldCoins', amount: 1000 }, { stat: 'unspentSkillPoints', amount: 1 }] },
              // TODO: { type: 'item', action: 'give', items: [{ itemId: ItemID.harpyCrown, amount: 1 }] }
            ],
          },
        ],
      },
    ],
  },

  [MiloDialogue.questWhatLurksPostQuest]: {
    id: MiloDialogue.questWhatLurksPostQuest,
    messageKey: `${NS}:questWhatLurksPostQuest.message`,
    options: [
      {
        responseKey: `${NS}:questWhatLurksPostQuest.opt1`,
        results: [{ next: MiloDialogue.default, closeDialogue: true }],
      },
    ],
  },
}

export default MAWOOD_MILO
