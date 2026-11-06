import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'
import { NpcID } from '../../../enums/map/npc-id.enum'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { QuestState } from '../../../enums/quest-state.enum'
import { ShopID } from '../../../enums/ids/shop-id.enum'
import { ReputationID } from '../../../enums/reputation-id.enum'
import { ReputationTier } from '../../../enums/reputation-tier.enum'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { bundleKey } from '../../../app/store/quests/turn-in-cooldown'
import { ProfessionID } from '../../../enums/ids/profession-id.enum'
import { SiteID } from '../../../enums/ids/site-id.enum'

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
  safePassageComplete,
  questCleanCure,
  questCleanCureProgress1,
  questCleanCureProgress2,
  questCleanCureStep1Complete,
  questCleanCureComplete,
  questTerrace,
  questTerraceAsk,
  questTerraceProgress,
  questSilverleaf,
  questSilverleafProgress,
  questSilverleafComplete,
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
        responseKey: `${NS}:default.safePassage`,
        results: [{ visibilityConditions: [{ type: 'quest', questId: QuestID.safePassage, questState: QuestState.readyToAdvance, step: 2 }], next: SylvieDialogue.safePassageComplete }],
      },
      {
        responseKey: `${NS}:default.work`,
        results: [
          // A Clean Cure (Mawood Revered): turn-ins, in progress, offer
          { visibilityConditions: [{ type: 'quest', questId: QuestID.aCleanCure, questState: QuestState.readyToAdvance, step: 2 }], next: SylvieDialogue.questCleanCureComplete },
          { visibilityConditions: [{ type: 'quest', questId: QuestID.aCleanCure, questState: QuestState.readyToAdvance, step: 1 }], next: SylvieDialogue.questCleanCureStep1Complete },
          { visibilityConditions: [{ type: 'quest', questId: QuestID.aCleanCure, questState: QuestState.active, step: 2 }], next: SylvieDialogue.questCleanCureProgress2 },
          { visibilityConditions: [{ type: 'quest', questId: QuestID.aCleanCure, questState: QuestState.active }], next: SylvieDialogue.questCleanCureProgress1 },
          { visibilityConditions: [{ type: 'quest', questId: QuestID.aCleanCure, questState: QuestState.available }], next: SylvieDialogue.questCleanCure },
          // Quest 9 — The Infestation: turn-in
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theInfestation, questState: QuestState.readyToAdvance, step: 1 }],
            next: SylvieDialogue.questInfestationComplete,
          },
          // Quest 9 — in progress
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theInfestation, questState: QuestState.active }],
            next: SylvieDialogue.questInfestationProgress,
          },
          // Quest 9 — offer (after silk quest done)
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.theInfestation, questState: QuestState.available }],
            next: SylvieDialogue.questInfestation,
          },
          // Quest 8 — Silk and Water: turn-in
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.silkAndWater, questState: QuestState.readyToAdvance, step: 1 }],
            next: SylvieDialogue.questSilkWaterComplete,
          },
          // Quest 8 — in progress
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.silkAndWater, questState: QuestState.active }],
            next: SylvieDialogue.questSilkWaterProgress,
          },
          // Silk and Water: offer (only once available — after The Sap That Burns)
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.silkAndWater, questState: QuestState.available }],
            next: SylvieDialogue.questSilkWater,
          },
          // Nothing for the player yet — keep the conversation on the default node
          {
            next: SylvieDialogue.default,
          },
        ],
      },
      // Farming Guild chain: turn-in, in progress, offers (docs/ideas/farm-dialogue-scripts.md)
      {
        responseKey: `${NS}:default.silverleafTurnIn`,
        results: [{ visibilityConditions: [{ type: 'quest', questId: QuestID.silverleafForSylvie, questState: QuestState.readyToAdvance, step: 1 }], next: SylvieDialogue.questSilverleafComplete }],
      },
      {
        responseKey: `${NS}:default.silverleafProgress`,
        results: [{ visibilityConditions: [{ type: 'quest', questId: QuestID.silverleafForSylvie, questState: QuestState.active }], next: SylvieDialogue.questSilverleafProgress }],
      },
      {
        responseKey: `${NS}:default.terraceProgress`,
        results: [{ visibilityConditions: [{ type: 'quest', questId: QuestID.seedsFromTheTerrace, questState: QuestState.active }], next: SylvieDialogue.questTerraceProgress }],
      },
      {
        responseKey: `${NS}:default.silverleafOffer`,
        results: [{ visibilityConditions: [{ type: 'quest', questId: QuestID.silverleafForSylvie, questState: QuestState.available }], next: SylvieDialogue.questSilverleaf }],
      },
      {
        responseKey: `${NS}:default.terraceOffer`,
        results: [{ visibilityConditions: [{ type: 'quest', questId: QuestID.seedsFromTheTerrace, questState: QuestState.available }], next: SylvieDialogue.questTerrace }],
      },
      {
        responseKey: `${NS}:default.browseWares`,
        results: [
          {
            // She only trusts her tools to someone who has helped her once.
            visibilityConditions: [{ type: 'quest', questId: QuestID.silkAndWater, questState: QuestState.completed }],
            next: SylvieDialogue.default,
            effects: [{ type: 'shop', shopId: ShopID.mawoodApothecary }],
          },
          // ...or to anyone Mawood already calls a friend.
          {
            visibilityConditions: [{ type: 'reputation', reputationId: ReputationID.mawood, tier: ReputationTier.friendly, hidden: true }],
            next: SylvieDialogue.default,
            effects: [{ type: 'shop', shopId: ShopID.mawoodApothecary }],
          },
        ],
      },
      {
        responseKey: 'quests:reputation.turnIn',
        results: [{
          requirementsNeeded: [{ type: 'turnInCooldown', key: bundleKey(NpcID.mawoodSylvie, ItemID.spiderSilk), state: 'ready' }],
          next: SylvieDialogue.default,
          effects: [{ type: 'reputationTurnIn', npcId: NpcID.mawoodSylvie }],
        }],
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
            ],
          },
        ],
      },
    ],
  },
  [SylvieDialogue.safePassageComplete]: {
    id: SylvieDialogue.safePassageComplete,
    messageKey: `${NS}:safePassageComplete.message`,
    options: [
      { responseKey: `${NS}:safePassageComplete.opt1`, results: [{ next: SylvieDialogue.default, effects: [{ type: 'quest', action: 'advance', questId: QuestID.safePassage }] }] },
    ],
  },
  [SylvieDialogue.questCleanCure]: {
    id: SylvieDialogue.questCleanCure,
    messageKey: `${NS}:questCleanCure.message`,
    options: [
      { responseKey: `${NS}:questCleanCure.opt1`, results: [{ next: SylvieDialogue.default, effects: [{ type: 'quest', action: 'start', questId: QuestID.aCleanCure }] }] },
      { responseKey: `${NS}:questCleanCure.opt2`, results: [{ next: SylvieDialogue.default }] },
    ],
  },
  [SylvieDialogue.questCleanCureProgress1]: {
    id: SylvieDialogue.questCleanCureProgress1,
    messageKey: `${NS}:questCleanCureProgress1.message`,
    options: [
      { responseKey: `${NS}:questCleanCureProgress1.opt1`, results: [{ next: SylvieDialogue.default }] },
    ],
  },
  [SylvieDialogue.questCleanCureProgress2]: {
    id: SylvieDialogue.questCleanCureProgress2,
    messageKey: `${NS}:questCleanCureProgress2.message`,
    options: [
      { responseKey: `${NS}:questCleanCureProgress2.opt1`, results: [{ next: SylvieDialogue.default }] },
    ],
  },
  [SylvieDialogue.questCleanCureStep1Complete]: {
    id: SylvieDialogue.questCleanCureStep1Complete,
    messageKey: `${NS}:questCleanCureStep1Complete.message`,
    options: [
      { responseKey: `${NS}:questCleanCureStep1Complete.opt1`, results: [{ next: SylvieDialogue.default, effects: [{ type: 'quest', action: 'advance', questId: QuestID.aCleanCure }] }] },
    ],
  },
  [SylvieDialogue.questCleanCureComplete]: {
    id: SylvieDialogue.questCleanCureComplete,
    messageKey: `${NS}:questCleanCureComplete.message`,
    options: [
      { responseKey: `${NS}:questCleanCureComplete.opt1`, results: [{ next: SylvieDialogue.default, effects: [{ type: 'quest', action: 'advance', questId: QuestID.aCleanCure }] }] },
    ],
  },

  [SylvieDialogue.questTerrace]: {
    id: SylvieDialogue.questTerrace,
    messageKey: `${NS}:questTerrace.message`,
    options: [
      { responseKey: `${NS}:questTerrace.opt1`, results: [{ next: SylvieDialogue.questTerraceAsk }] },
    ],
  },
  [SylvieDialogue.questTerraceAsk]: {
    id: SylvieDialogue.questTerraceAsk,
    messageKey: `${NS}:questTerraceAsk.message`,
    options: [
      {
        responseKey: `${NS}:questTerraceAsk.accept`,
        results: [
          {
            next: SylvieDialogue.default,
            closeDialogue: true,
            // The first reachable path to the farm: the Site and the profession open when the quest starts.
            effects: [
              { type: 'quest', action: 'start', questId: QuestID.seedsFromTheTerrace },
              { type: 'item', action: 'give', items: [{ itemId: ItemID.guildLetter, amount: 1 }] },
              { type: 'unlockSite', siteId: SiteID.farm },
              { type: 'unlockProfession', professionId: ProfessionID.farming },
            ],
          },
        ],
      },
      { responseKey: `${NS}:questTerraceAsk.decline`, results: [{ next: SylvieDialogue.default }] },
    ],
  },
  [SylvieDialogue.questTerraceProgress]: {
    id: SylvieDialogue.questTerraceProgress,
    messageKey: `${NS}:questTerraceProgress.message`,
    options: [
      { responseKey: `${NS}:questTerraceProgress.opt1`, results: [{ next: SylvieDialogue.default, closeDialogue: true }] },
    ],
  },
  [SylvieDialogue.questSilverleaf]: {
    id: SylvieDialogue.questSilverleaf,
    messageKey: `${NS}:questSilverleaf.message`,
    options: [
      {
        responseKey: `${NS}:questSilverleaf.accept`,
        results: [{ next: SylvieDialogue.default, closeDialogue: true, effects: [{ type: 'quest', action: 'start', questId: QuestID.silverleafForSylvie }] }],
      },
      { responseKey: `${NS}:questSilverleaf.decline`, results: [{ next: SylvieDialogue.default }] },
    ],
  },
  [SylvieDialogue.questSilverleafProgress]: {
    id: SylvieDialogue.questSilverleafProgress,
    messageKey: `${NS}:questSilverleafProgress.message`,
    options: [
      { responseKey: `${NS}:questSilverleafProgress.opt1`, results: [{ next: SylvieDialogue.default, closeDialogue: true }] },
    ],
  },
  [SylvieDialogue.questSilverleafComplete]: {
    id: SylvieDialogue.questSilverleafComplete,
    messageKey: `${NS}:questSilverleafComplete.message`,
    options: [
      {
        responseKey: `${NS}:questSilverleafComplete.opt1`,
        results: [{ next: SylvieDialogue.default, effects: [{ type: 'quest', action: 'end', questId: QuestID.silverleafForSylvie }] }],
      },
    ],
  },
}

export default MAWOOD_SYLVIE
