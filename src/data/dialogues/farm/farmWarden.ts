import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'
import { DialogueCondition } from '../../../types/dialogues/dialogue-condition.type'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { QuestState } from '../../../enums/quest-state.enum'
import { ShopID } from '../../../enums/ids/shop-id.enum'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { NpcID } from '../../../enums/map/npc-id.enum'
import { ReputationID } from '../../../enums/reputation-id.enum'
import { ReputationTier } from '../../../enums/reputation-tier.enum'
import { orderKey } from '../../../app/store/quests/turn-in-cooldown'

// Script: docs/ideas/farm-dialogue-scripts.md section 2.
export enum WardenDialogue {
  default = 0,
  intro1,
  introLetter,
  introSeeds,
  introSeedsWhy,
  introNoSeeds,
  introGate,
  aboutGuild,
  aboutGate,
  questFurrow,
  questFurrowProgress,
  questFurrowComplete,
  questWheat,
  questWheatProgress,
  questWheatComplete,
  questOrchard,
  questOrchardProgress,
  questOrchardComplete,
  questTable,
  questTableProgress,
  questTableComplete,
  orderOffer,
  orderProgress,
  orderComplete,
  petGift,
  petGiftDone,
}

export type FarmWardenDialogueType = Record<WardenDialogue, DialogueNode<WardenDialogue>>

const NS = 'dialogues/farmWarden'
const MET_FLAG = `met_${NpcID.farmWarden}`
const GAVE_PET_FLAG = 'warden_gave_pet'
const ORDER_KEY = orderKey(QuestID.marthasOrder)

const quest = (questId: QuestID, questState: QuestState, step?: number): DialogueCondition =>
  ({ type: 'quest', questId, questState, step })
const hasSeeds: DialogueCondition = { type: 'farmSeeds', atLeast: 1 }
const guildTier = (tier: ReputationTier): DialogueCondition => ({ type: 'reputation', reputationId: ReputationID.farmingGuild, tier })

/** A hub option that opens `next` while `condition` holds. */
const hubOption = (key: string, condition: DialogueCondition, next: WardenDialogue) =>
  ({ responseKey: `${NS}:default.${key}`, results: [{ visibilityConditions: [condition], next }] })

/** A quest's reminder node: one exit. */
const reminder = (id: WardenDialogue, key: string): DialogueNode<WardenDialogue> => ({
  id,
  messageKey: `${NS}:${key}.message`,
  options: [{ responseKey: `${NS}:${key}.opt1`, results: [{ closeDialogue: true }] }],
})

/** A quest's offer node: accept starts it, decline returns to the hub. */
const offer = (id: WardenDialogue, key: string, questId: QuestID): DialogueNode<WardenDialogue> => ({
  id,
  messageKey: `${NS}:${key}.message`,
  options: [
    { responseKey: `${NS}:${key}.accept`, results: [{ closeDialogue: true, effects: [{ type: 'quest', action: 'start', questId }] }] },
    { responseKey: `${NS}:${key}.decline`, results: [{ next: WardenDialogue.default }] },
  ],
})

/** A quest's turn-in node: the single option ends the quest (the store takes the items). */
const complete = (id: WardenDialogue, key: string, questId: QuestID): DialogueNode<WardenDialogue> => ({
  id,
  messageKey: `${NS}:${key}.message`,
  options: [{ responseKey: `${NS}:${key}.opt1`, results: [{ next: WardenDialogue.default, effects: [{ type: 'quest', action: 'end', questId }] }] }],
})

const FARM_WARDEN: FarmWardenDialogueType = {
  [WardenDialogue.intro1]: {
    id: WardenDialogue.intro1,
    messageKey: `${NS}:intro1.message`,
    options: [
      {
        responseKey: `${NS}:intro1.teach`,
        results: [
          { visibilityConditions: [hasSeeds], next: WardenDialogue.introSeeds, effects: [{ type: 'flag', name: MET_FLAG }] },
          { next: WardenDialogue.introNoSeeds, effects: [{ type: 'flag', name: MET_FLAG }] },
        ],
      },
      {
        responseKey: `${NS}:intro1.letter`,
        results: [{ visibilityConditions: [{ type: 'item', itemId: ItemID.guildLetter, amount: 1 }], next: WardenDialogue.introLetter, effects: [{ type: 'flag', name: MET_FLAG }] }],
      },
    ],
  },

  [WardenDialogue.introLetter]: {
    id: WardenDialogue.introLetter,
    messageKey: `${NS}:introLetter.message`,
    options: [
      {
        responseKey: `${NS}:introLetter.opt1`,
        results: [
          { visibilityConditions: [hasSeeds], next: WardenDialogue.introSeeds },
          { next: WardenDialogue.introNoSeeds },
        ],
      },
    ],
  },

  [WardenDialogue.introSeeds]: {
    id: WardenDialogue.introSeeds,
    messageKey: `${NS}:introSeeds.message`,
    options: [
      { responseKey: `${NS}:introSeeds.why`, results: [{ next: WardenDialogue.introSeedsWhy }] },
      { responseKey: `${NS}:introSeeds.show`, results: [{ next: WardenDialogue.introGate }] },
      { responseKey: `${NS}:introSeeds.guild`, results: [{ next: WardenDialogue.aboutGuild }] },
    ],
  },

  [WardenDialogue.introSeedsWhy]: {
    id: WardenDialogue.introSeedsWhy,
    messageKey: `${NS}:introSeedsWhy.message`,
    options: [{ responseKey: `${NS}:introSeedsWhy.opt1`, results: [{ next: WardenDialogue.introGate }] }],
  },

  [WardenDialogue.introNoSeeds]: {
    id: WardenDialogue.introNoSeeds,
    messageKey: `${NS}:introNoSeeds.message`,
    options: [
      { responseKey: `${NS}:introNoSeeds.shop`, results: [{ next: WardenDialogue.default, effects: [{ type: 'shop', shopId: ShopID.farmWardenShop }] }] },
      { responseKey: `${NS}:introNoSeeds.later`, results: [{ next: WardenDialogue.default, closeDialogue: true }] },
    ],
  },

  [WardenDialogue.introGate]: {
    id: WardenDialogue.introGate,
    messageKey: `${NS}:introGate.message`,
    options: [
      {
        responseKey: `${NS}:introGate.opt1`,
        results: [
          // Delivers the letter: the talk step of Seeds from the Terrace ends here.
          {
            visibilityConditions: [quest(QuestID.seedsFromTheTerrace, QuestState.readyToAdvance, 1), { type: 'item', itemId: ItemID.guildLetter, amount: 1 }],
            closeDialogue: true,
            effects: [
              { type: 'quest', action: 'end', questId: QuestID.seedsFromTheTerrace },
              { type: 'item', action: 'take', items: [{ itemId: ItemID.guildLetter, amount: 1 }] },
            ],
          },
          {
            visibilityConditions: [quest(QuestID.seedsFromTheTerrace, QuestState.readyToAdvance, 1)],
            closeDialogue: true,
            effects: [{ type: 'quest', action: 'end', questId: QuestID.seedsFromTheTerrace }],
          },
          { closeDialogue: true },
        ],
      },
    ],
  },

  [WardenDialogue.default]: {
    id: WardenDialogue.default,
    messageKey: `${NS}:default.message`,
    options: [
      // Turn-ins
      hubOption('letter', quest(QuestID.seedsFromTheTerrace, QuestState.readyToAdvance, 1), WardenDialogue.introGate),
      hubOption('furrowTurnIn', quest(QuestID.theFirstFurrow, QuestState.readyToAdvance, 1), WardenDialogue.questFurrowComplete),
      hubOption('wheatTurnIn', quest(QuestID.wheatForTheGuild, QuestState.readyToAdvance, 1), WardenDialogue.questWheatComplete),
      hubOption('orchardTurnIn', quest(QuestID.anOrchardAgain, QuestState.readyToAdvance, 1), WardenDialogue.questOrchardComplete),
      hubOption('tableTurnIn', quest(QuestID.theGrowersTable, QuestState.readyToAdvance, 1), WardenDialogue.questTableComplete),
      hubOption('orderTurnIn', quest(QuestID.marthasOrder, QuestState.readyToAdvance, 1), WardenDialogue.orderComplete),
      // In progress
      hubOption('furrowProgress', quest(QuestID.theFirstFurrow, QuestState.active), WardenDialogue.questFurrowProgress),
      hubOption('wheatProgress', quest(QuestID.wheatForTheGuild, QuestState.active), WardenDialogue.questWheatProgress),
      hubOption('orchardProgress', quest(QuestID.anOrchardAgain, QuestState.active), WardenDialogue.questOrchardProgress),
      hubOption('tableProgress', quest(QuestID.theGrowersTable, QuestState.active), WardenDialogue.questTableProgress),
      hubOption('orderProgress', quest(QuestID.marthasOrder, QuestState.active), WardenDialogue.orderProgress),
      // Offers
      hubOption('furrowOffer', quest(QuestID.theFirstFurrow, QuestState.available), WardenDialogue.questFurrow),
      hubOption('wheatOffer', quest(QuestID.wheatForTheGuild, QuestState.available), WardenDialogue.questWheat),
      hubOption('orchardOffer', quest(QuestID.anOrchardAgain, QuestState.available), WardenDialogue.questOrchard),
      {
        responseKey: `${NS}:default.tableOffer`,
        results: [
          { visibilityConditions: [quest(QuestID.theGrowersTable, QuestState.available)], next: WardenDialogue.questTable },
          // Orchard done but the Guild is not Honored yet: shown disabled with the reputation lock text.
          {
            visibilityConditions: [quest(QuestID.anOrchardAgain, QuestState.completed), quest(QuestID.theGrowersTable, QuestState.notStarted)],
            requirementsNeeded: [guildTier(ReputationTier.honored)],
            next: WardenDialogue.default,
          },
        ],
      },
      {
        // While the order cools down the option stays, disabled, with the "Ready in ..." tag.
        responseKey: `${NS}:default.orderOffer`,
        results: [{
          visibilityConditions: [quest(QuestID.marthasOrder, QuestState.available)],
          requirementsNeeded: [{ type: 'turnInCooldown', key: ORDER_KEY, state: 'ready' }],
          next: WardenDialogue.orderOffer,
        }],
      },
      // Business
      {
        responseKey: `${NS}:default.shop`,
        results: [
          { visibilityConditions: [quest(QuestID.theFirstFurrow, QuestState.active)], next: WardenDialogue.default, effects: [{ type: 'shop', shopId: ShopID.farmWardenShop }] },
          { visibilityConditions: [quest(QuestID.theFirstFurrow, QuestState.completed)], next: WardenDialogue.default, effects: [{ type: 'shop', shopId: ShopID.farmWardenShop }] },
        ],
      },
      {
        responseKey: `${NS}:default.petGift`,
        results: [{
          visibilityConditions: [guildTier(ReputationTier.exalted), { type: 'flag', name: GAVE_PET_FLAG, isSet: false }],
          next: WardenDialogue.petGift,
        }],
      },
      // Lore
      { responseKey: `${NS}:default.aboutGuild`, results: [{ next: WardenDialogue.aboutGuild }] },
      { responseKey: `${NS}:default.aboutGate`, results: [{ next: WardenDialogue.aboutGate }] },
      { responseKey: `${NS}:default.bye`, results: [{ closeDialogue: true }] },
    ],
  },

  [WardenDialogue.aboutGuild]: {
    id: WardenDialogue.aboutGuild,
    messageKey: `${NS}:aboutGuild.message`,
    options: [
      { responseKey: `${NS}:aboutGuild.hands`, results: [{ next: WardenDialogue.default }] },
      { responseKey: `${NS}:aboutGuild.blight`, results: [{ next: WardenDialogue.aboutGate }] },
    ],
  },

  [WardenDialogue.aboutGate]: {
    id: WardenDialogue.aboutGate,
    messageKey: `${NS}:aboutGate.message`,
    options: [
      { responseKey: `${NS}:aboutGate.now`, results: [{ next: WardenDialogue.default }] },
      { responseKey: `${NS}:aboutGate.bye`, results: [{ closeDialogue: true }] },
    ],
  },

  [WardenDialogue.questFurrow]: offer(WardenDialogue.questFurrow, 'questFurrow', QuestID.theFirstFurrow),
  [WardenDialogue.questFurrowProgress]: reminder(WardenDialogue.questFurrowProgress, 'questFurrowProgress'),
  [WardenDialogue.questFurrowComplete]: complete(WardenDialogue.questFurrowComplete, 'questFurrowComplete', QuestID.theFirstFurrow),
  [WardenDialogue.questWheat]: offer(WardenDialogue.questWheat, 'questWheat', QuestID.wheatForTheGuild),
  [WardenDialogue.questWheatProgress]: reminder(WardenDialogue.questWheatProgress, 'questWheatProgress'),
  [WardenDialogue.questWheatComplete]: complete(WardenDialogue.questWheatComplete, 'questWheatComplete', QuestID.wheatForTheGuild),
  [WardenDialogue.questOrchard]: offer(WardenDialogue.questOrchard, 'questOrchard', QuestID.anOrchardAgain),
  [WardenDialogue.questOrchardProgress]: reminder(WardenDialogue.questOrchardProgress, 'questOrchardProgress'),
  [WardenDialogue.questOrchardComplete]: complete(WardenDialogue.questOrchardComplete, 'questOrchardComplete', QuestID.anOrchardAgain),
  [WardenDialogue.questTable]: offer(WardenDialogue.questTable, 'questTable', QuestID.theGrowersTable),
  [WardenDialogue.questTableProgress]: reminder(WardenDialogue.questTableProgress, 'questTableProgress'),
  [WardenDialogue.questTableComplete]: complete(WardenDialogue.questTableComplete, 'questTableComplete', QuestID.theGrowersTable),

  // Guild orders: the pick is rolled when the order starts, so the offer cannot name it; the quest panel does.
  [WardenDialogue.orderOffer]: offer(WardenDialogue.orderOffer, 'orderOffer', QuestID.marthasOrder),
  [WardenDialogue.orderProgress]: reminder(WardenDialogue.orderProgress, 'orderProgress'),
  [WardenDialogue.orderComplete]: complete(WardenDialogue.orderComplete, 'orderComplete', QuestID.marthasOrder),

  [WardenDialogue.petGift]: {
    id: WardenDialogue.petGift,
    messageKey: `${NS}:petGift.message`,
    options: [
      {
        responseKey: `${NS}:petGift.accept`,
        results: [{
          next: WardenDialogue.petGiftDone,
          effects: [
            { type: 'item', action: 'give', items: [{ itemId: ItemID.petFarmingGuildHare, amount: 1 }] },
            { type: 'flag', name: GAVE_PET_FLAG },
          ],
        }],
      },
      { responseKey: `${NS}:petGift.decline`, results: [{ next: WardenDialogue.default }] },
    ],
  },

  [WardenDialogue.petGiftDone]: {
    id: WardenDialogue.petGiftDone,
    messageKey: `${NS}:petGiftDone.message`,
    options: [{ responseKey: `${NS}:petGiftDone.opt1`, results: [{ next: WardenDialogue.default }] }],
  },
}

export default FARM_WARDEN
