import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'
import { NpcID } from '../../../enums/map/npc-id.enum'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { QuestState } from '../../../enums/quest-state.enum'

export enum SylvieDialogue {
  default = 0,
  intro1,
  intro2,
  aboutSylvie,
  aboutSylvieMawood,
  aboutElara,
  aboutElaraResponse1,
  aboutElaraResponse2,
  aboutCorruption,
  aboutCorruptionSpreading,
  questSilkWater,
  questSilkWaterProgress,
  questSilkWaterComplete,
  questInfestation,
  questInfestationProgress,
  questInfestationComplete,
}

export type MawoodSylvieDialogueType = Record<SylvieDialogue, DialogueNode<SylvieDialogue>>

const NS = 'dialogues/mawoodSylvie'

const MAWOOD_SYLVIE: MawoodSylvieDialogueType = {
  [SylvieDialogue.intro1]: {
    id: SylvieDialogue.intro1,
    messageKey: `${NS}:intro1.message`,
    options: [
      {
        responseKey: `${NS}:intro1.opt1`,
        results: [{ next: SylvieDialogue.intro2 }],
      },
      {
        responseKey: `${NS}:intro1.opt2`,
        results: [
          {
            next: SylvieDialogue.default,
            effects: [{ type: 'flag', name: `met_${NpcID.mawoodSylvie}` }],
          },
        ],
      },
    ],
  },

  [SylvieDialogue.intro2]: {
    id: SylvieDialogue.intro2,
    messageKey: `${NS}:intro2.message`,
    options: [
      {
        responseKey: `${NS}:intro2.opt1`,
        results: [
          {
            next: SylvieDialogue.default,
            effects: [{ type: 'flag', name: `met_${NpcID.mawoodSylvie}` }],
          },
        ],
      },
    ],
  },

  [SylvieDialogue.default]: {
    id: SylvieDialogue.default,
    messageKey: `${NS}:default.message`,
    options: [
      {
        responseKey: `${NS}:default.aboutSylvie`,
        results: [{ next: SylvieDialogue.aboutSylvie }],
      },
      {
        responseKey: `${NS}:default.aboutElara`,
        results: [{ next: SylvieDialogue.aboutElara }],
      },
      {
        responseKey: `${NS}:default.aboutCorruption`,
        results: [{ next: SylvieDialogue.aboutCorruption }],
      },
      {
        responseKey: `${NS}:default.work`,
        results: [
          // Quest 9 — The Infestation: turn-in
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theInfestation, questState: QuestState.active, step: 1 }],
            next: SylvieDialogue.questInfestationComplete,
            // TODO: requirementsNeeded: [{ type: 'waveKillCount', zoneId: ZoneID.elderwoodWilds, waveNumber: 10, amount: 60 }]
          },
          // Quest 9 — in progress
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theInfestation, questState: QuestState.active }],
            next: SylvieDialogue.questInfestationProgress,
          },
          // Quest 9 — offer (after silk quest done)
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.silkAndWater, questState: QuestState.completed }],
            next: SylvieDialogue.questInfestation,
          },
          // Quest 8 — Silk and Water: turn-in
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.silkAndWater, questState: QuestState.active, step: 1 }],
            next: SylvieDialogue.questSilkWaterComplete,
            // TODO: requirementsNeeded: [{ type: 'manyItems', itemIds: [ItemID.spiderSilk, ItemID.vialOfWater], amounts: { [ItemID.spiderSilk]: 15, [ItemID.vialOfWater]: 10 } }]
          },
          // Quest 8 — in progress
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.silkAndWater, questState: QuestState.active }],
            next: SylvieDialogue.questSilkWaterProgress,
          },
          // Default — offer Silk and Water
          {
            next: SylvieDialogue.questSilkWater,
          },
        ],
      },
      {
        responseKey: `${NS}:default.goodbye`,
        results: [{ next: SylvieDialogue.default, closeDialogue: true }],
      },
    ],
  },

  [SylvieDialogue.aboutSylvie]: {
    id: SylvieDialogue.aboutSylvie,
    messageKey: `${NS}:aboutSylvie.message`,
    options: [
      {
        responseKey: `${NS}:aboutSylvie.opt1`,
        results: [{ next: SylvieDialogue.aboutSylvieMawood }],
      },
      {
        responseKey: `${NS}:aboutSylvie.opt2`,
        results: [{ next: SylvieDialogue.aboutCorruption }],
      },
    ],
  },

  [SylvieDialogue.aboutSylvieMawood]: {
    id: SylvieDialogue.aboutSylvieMawood,
    messageKey: `${NS}:aboutSylvieMawood.message`,
    options: [
      {
        responseKey: `${NS}:aboutSylvieMawood.opt1`,
        results: [{ next: SylvieDialogue.default }],
      },
    ],
  },

  [SylvieDialogue.aboutElara]: {
    id: SylvieDialogue.aboutElara,
    messageKey: `${NS}:aboutElara.message`,
    options: [
      {
        responseKey: `${NS}:aboutElara.opt1`,
        results: [{ next: SylvieDialogue.aboutElaraResponse1 }],
      },
      {
        responseKey: `${NS}:aboutElara.opt2`,
        results: [{ next: SylvieDialogue.aboutElaraResponse2 }],
      },
    ],
  },

  [SylvieDialogue.aboutElaraResponse1]: {
    id: SylvieDialogue.aboutElaraResponse1,
    messageKey: `${NS}:aboutElaraResponse1.message`,
    options: [
      {
        responseKey: `${NS}:aboutElaraResponse1.opt1`,
        results: [{ next: SylvieDialogue.default }],
      },
    ],
  },

  [SylvieDialogue.aboutElaraResponse2]: {
    id: SylvieDialogue.aboutElaraResponse2,
    messageKey: `${NS}:aboutElaraResponse2.message`,
    options: [
      {
        responseKey: `${NS}:aboutElaraResponse2.opt1`,
        results: [{ next: SylvieDialogue.default }],
      },
    ],
  },

  [SylvieDialogue.aboutCorruption]: {
    id: SylvieDialogue.aboutCorruption,
    messageKey: `${NS}:aboutCorruption.message`,
    options: [
      {
        responseKey: `${NS}:aboutCorruption.opt1`,
        results: [{ next: SylvieDialogue.aboutCorruptionSpreading }],
      },
      {
        responseKey: `${NS}:aboutCorruption.opt2`,
        results: [{ next: SylvieDialogue.default }],
      },
    ],
  },

  [SylvieDialogue.aboutCorruptionSpreading]: {
    id: SylvieDialogue.aboutCorruptionSpreading,
    messageKey: `${NS}:aboutCorruptionSpreading.message`,
    options: [
      {
        responseKey: `${NS}:aboutCorruptionSpreading.opt1`,
        results: [{ next: SylvieDialogue.default }],
      },
    ],
  },

  [SylvieDialogue.questSilkWater]: {
    id: SylvieDialogue.questSilkWater,
    messageKey: `${NS}:questSilkWater.message`,
    options: [
      {
        responseKey: `${NS}:questSilkWater.accept`,
        results: [
          {
            next: SylvieDialogue.default,
            closeDialogue: true,
            effects: [{ type: 'quest', action: 'start', questId: QuestID.silkAndWater }],
          },
        ],
      },
      {
        responseKey: `${NS}:questSilkWater.decline`,
        results: [{ next: SylvieDialogue.default }],
      },
    ],
  },

  [SylvieDialogue.questSilkWaterProgress]: {
    id: SylvieDialogue.questSilkWaterProgress,
    messageKey: `${NS}:questSilkWaterProgress.message`,
    options: [
      {
        responseKey: `${NS}:questSilkWaterProgress.opt1`,
        results: [{ next: SylvieDialogue.default, closeDialogue: true }],
      },
    ],
  },

  [SylvieDialogue.questSilkWaterComplete]: {
    id: SylvieDialogue.questSilkWaterComplete,
    messageKey: `${NS}:questSilkWaterComplete.message`,
    options: [
      {
        responseKey: `${NS}:questSilkWaterComplete.opt1`,
        results: [
          {
            next: SylvieDialogue.questInfestation,
            effects: [
              { type: 'quest', action: 'end', questId: QuestID.silkAndWater },
              { type: 'stat', action: 'award', stats: [{ stat: 'unspentSkillPoints', amount: 1 }, { stat: 'experience', amount: 800 }, { stat: 'goldCoins', amount: 150 }] },
              // TODO: { type: 'item', action: 'take', items: [{ itemId: ItemID.spiderSilk, amount: 15 }, { itemId: ItemID.vialOfWater, amount: 10 }] }
            ],
          },
        ],
      },
    ],
  },

  [SylvieDialogue.questInfestation]: {
    id: SylvieDialogue.questInfestation,
    messageKey: `${NS}:questInfestation.message`,
    options: [
      {
        responseKey: `${NS}:questInfestation.accept`,
        results: [
          {
            next: SylvieDialogue.default,
            closeDialogue: true,
            effects: [{ type: 'quest', action: 'start', questId: QuestID.theInfestation }],
          },
        ],
      },
      {
        responseKey: `${NS}:questInfestation.decline`,
        results: [{ next: SylvieDialogue.default }],
      },
    ],
  },

  [SylvieDialogue.questInfestationProgress]: {
    id: SylvieDialogue.questInfestationProgress,
    messageKey: `${NS}:questInfestationProgress.message`,
    options: [
      {
        responseKey: `${NS}:questInfestationProgress.opt1`,
        results: [{ next: SylvieDialogue.default, closeDialogue: true }],
      },
    ],
  },

  [SylvieDialogue.questInfestationComplete]: {
    id: SylvieDialogue.questInfestationComplete,
    messageKey: `${NS}:questInfestationComplete.message`,
    options: [
      {
        responseKey: `${NS}:questInfestationComplete.opt1`,
        results: [
          {
            next: SylvieDialogue.default,
            effects: [
              { type: 'quest', action: 'end', questId: QuestID.theInfestation },
              { type: 'stat', action: 'award', stats: [{ stat: 'experience', amount: 2000 }, { stat: 'goldCoins', amount: 400 }] },
            ],
          },
        ],
      },
    ],
  },
}

export default MAWOOD_SYLVIE
