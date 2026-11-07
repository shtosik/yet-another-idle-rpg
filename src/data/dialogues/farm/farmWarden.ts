import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'
import { DialogueResult } from '../../../interfaces/dialogues/dialogue-option.type'
import { DialogueEffect } from '../../../types/dialogues/dialogue-effect.type'
import { DialogueCondition } from '../../../types/dialogues/dialogue-condition.type'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { QuestState } from '../../../enums/quest-state.enum'
import { ShopID } from '../../../enums/ids/shop-id.enum'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { NpcID } from '../../../enums/map/npc-id.enum'
import { ReputationID } from '../../../enums/reputation-id.enum'
import { ReputationTier } from '../../../enums/reputation-tier.enum'
import { orderKey } from '../../../app/store/quests/turn-in-cooldown'
import { dialogueNodes } from '../dialogue-nodes'

// Character and voice: docs/character/farm/marta-tillbrook.md. Text: dialogues/farmWarden.json.
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
  aboutWho,
  aboutWhoWheat,
  aboutWhoKeys,
  aboutSpring,
  aboutSeed,
  aboutHerd,
  aboutHerdAll,
  questFurrowWhy,
  questFurrowAfter,
  questFurrowNoCook,
  questWheatAsk,
  orderOfferFirst,
  workNextSylvie,
  workNextHands,
  fourthTerrace,
  topTerrace,
  topSilverleaf,
  topTurnip,
  topNothing,
  topOrchard,
  questOrchardWhy,
  questTablePie,
  questTableAfter,
  shopFirst,
  idleTerraces,
  idleNet,
  idleHeart,
  askKitchen,
  askKitchenGate,
  askKitchenDoor,
}

export type FarmWardenDialogueType = Record<WardenDialogue, DialogueNode<WardenDialogue>>

const W = WardenDialogue
const say = dialogueNodes<WardenDialogue>('dialogues/farmWarden', WardenDialogue)

const MET_FLAG = `met_${NpcID.farmWarden}`
const GAVE_PET_FLAG = 'warden_gave_pet'
const ORDER_EXPLAINED_FLAG = 'marta_order_explained'
const SHOP_EXPLAINED_FLAG = 'marta_shop_explained'
const SAW_CLEAN_FLAG = 'marta_saw_clean'
const ASKED_DOOR_FLAG = 'marta_asked_door'
const ORDER_KEY = orderKey(QuestID.marthasOrder)

const quest = (questId: QuestID, questState: QuestState, step?: number): DialogueCondition =>
  ({ type: 'quest', questId, questState, step })
const completed = (questId: QuestID) => quest(questId, QuestState.completed)
const notCompleted = (questId: QuestID): DialogueCondition => ({ ...completed(questId), not: true })
/** Started but not ready to hand in: the reminder, never beside the turn-in option. */
const inProgress = (questId: QuestID): DialogueCondition[] => [quest(questId, QuestState.active), { ...quest(questId, QuestState.readyToAdvance), not: true }]
const flag = (name: string, isSet = true): DialogueCondition => ({ type: 'flag', name, isSet })
const setFlag = (name: string): DialogueEffect => ({ type: 'flag', name })
const talkStepReady = quest(QuestID.seedsFromTheTerrace, QuestState.readyToAdvance, 1)
const furrowStarted: DialogueCondition = { ...quest(QuestID.theFirstFurrow, QuestState.notStarted), not: true }
const handOver: DialogueEffect[] = [
  { type: 'quest', action: 'end', questId: QuestID.seedsFromTheTerrace },
  { type: 'item', action: 'take', items: [{ itemId: ItemID.guildLetter, amount: 1 }] },
]
const hasSeeds: DialogueCondition = { type: 'farmSeeds', atLeast: 1 }
const guildTier = (tier: ReputationTier): DialogueCondition => ({ type: 'reputation', reputationId: ReputationID.farmingGuild, tier })
const openShop: DialogueEffect = { type: 'shop', shopId: ShopID.farmWardenShop }
const orderReady: DialogueCondition = { type: 'turnInCooldown', key: ORDER_KEY, state: 'ready' }

type Result = DialogueResult<WardenDialogue>
const toHub: Result = { next: W.default }
const close: Result = { closeDialogue: true }
const start = (questId: QuestID, ...effects: DialogueEffect[]): Result =>
  ({ closeDialogue: true, effects: [{ type: 'quest', action: 'start', questId }, ...effects] })
const end = (questId: QuestID, next: WardenDialogue = W.default): Result =>
  ({ next, effects: [{ type: 'quest', action: 'end', questId }] })
/** A hub option that opens `next` while `condition` holds. */
const hub = (key: string, condition: DialogueCondition | DialogueCondition[], next: WardenDialogue): [string, Result] =>
  [key, { visibilityConditions: [condition].flat(), next }]

// Carrying Sylvie's letter, the first words with Marta already hand it over: no second visit needed.
const firstWordsResults = (...effects: DialogueEffect[]): Result[] => [
  { visibilityConditions: [hasSeeds, talkStepReady], next: W.introSeeds, effects: [...handOver, ...effects] },
  { visibilityConditions: [talkStepReady], next: W.introNoSeeds, effects: [...handOver, ...effects] },
  { visibilityConditions: [hasSeeds], next: W.introSeeds, effects },
  { next: W.introNoSeeds, effects },
]

const FARM_WARDEN: FarmWardenDialogueType = {
  [W.intro1]: say(W.intro1,
    ['teach', ...firstWordsResults(setFlag(MET_FLAG))],
    ['letter', { visibilityConditions: [{ type: 'item', itemId: ItemID.guildLetter, amount: 1 }], next: W.introLetter, effects: [setFlag(MET_FLAG)] }],
  ),
  [W.introLetter]: say(W.introLetter, ['opt1', ...firstWordsResults()], ['boast', ...firstWordsResults()]),
  [W.introSeeds]: say(W.introSeeds, ['why', { next: W.introSeedsWhy }], ['show', { next: W.introGate }], ['guild', { next: W.aboutGuild }]),
  [W.introSeedsWhy]: say(W.introSeedsWhy, ['opt1', { next: W.introGate }]),
  [W.introNoSeeds]: say(W.introNoSeeds,
    ['shop', { next: W.default, effects: [openShop] }],
    ['later', { next: W.default, closeDialogue: true }],
  ),
  [W.introGate]: say(W.introGate, [
    'opt1',
    // Delivers the letter: the talk step of Seeds from the Terrace ends here.
    { visibilityConditions: [talkStepReady, { type: 'item', itemId: ItemID.guildLetter, amount: 1 }], closeDialogue: true, effects: handOver },
    { visibilityConditions: [talkStepReady], closeDialogue: true, effects: [{ type: 'quest', action: 'end', questId: QuestID.seedsFromTheTerrace }] },
    close,
  ]),

  [W.default]: say(W.default,
    // Turn-ins
    hub('letter', talkStepReady, W.introGate),
    hub('furrowTurnIn', quest(QuestID.theFirstFurrow, QuestState.readyToAdvance, 1), W.questFurrowComplete),
    hub('wheatTurnIn', quest(QuestID.wheatForTheGuild, QuestState.readyToAdvance, 1), W.questWheatComplete),
    hub('orchardTurnIn', quest(QuestID.anOrchardAgain, QuestState.readyToAdvance, 1), W.questOrchardComplete),
    hub('tableTurnIn', quest(QuestID.theGrowersTable, QuestState.readyToAdvance, 1), W.questTableComplete),
    hub('orderTurnIn', quest(QuestID.marthasOrder, QuestState.readyToAdvance, 1), W.orderComplete),
    // In progress
    hub('furrowProgress', inProgress(QuestID.theFirstFurrow), W.questFurrowProgress),
    hub('wheatProgress', inProgress(QuestID.wheatForTheGuild), W.questWheatProgress),
    hub('orchardProgress', inProgress(QuestID.anOrchardAgain), W.questOrchardProgress),
    hub('tableProgress', inProgress(QuestID.theGrowersTable), W.questTableProgress),
    hub('orderProgress', inProgress(QuestID.marthasOrder), W.orderProgress),
    // Offers
    hub('furrowOffer', quest(QuestID.theFirstFurrow, QuestState.available), W.questFurrow),
    hub('wheatOffer', quest(QuestID.wheatForTheGuild, QuestState.available), W.questWheat),
    hub('orchardOffer', quest(QuestID.anOrchardAgain, QuestState.available), W.questOrchard),
    [
      'tableOffer',
      { visibilityConditions: [quest(QuestID.theGrowersTable, QuestState.available)], next: W.questTable },
      // Orchard done but the Guild is not Honored yet: shown disabled with the reputation lock text.
      {
        visibilityConditions: [completed(QuestID.anOrchardAgain), quest(QuestID.theGrowersTable, QuestState.notStarted)],
        requirementsNeeded: [guildTier(ReputationTier.honored)],
        next: W.default,
      },
    ],
    // While the order cools down the option stays, disabled, with the "Ready in ..." tag.
    ['orderOfferFirst', { visibilityConditions: [quest(QuestID.marthasOrder, QuestState.available), flag(ORDER_EXPLAINED_FLAG, false)], requirementsNeeded: [orderReady], next: W.orderOfferFirst }],
    ['orderOffer', { visibilityConditions: [quest(QuestID.marthasOrder, QuestState.available), flag(ORDER_EXPLAINED_FLAG)], requirementsNeeded: [orderReady], next: W.orderOffer }],
    [
      'workNext',
      {
        visibilityConditions: [completed(QuestID.wheatForTheGuild), quest(QuestID.anOrchardAgain, QuestState.notStarted), { ...quest(QuestID.anOrchardAgain, QuestState.available), not: true }, notCompleted(QuestID.silverleafForSylvie)],
        next: W.workNextSylvie,
      },
      {
        visibilityConditions: [completed(QuestID.wheatForTheGuild), quest(QuestID.anOrchardAgain, QuestState.notStarted), { ...quest(QuestID.anOrchardAgain, QuestState.available), not: true }],
        next: W.workNextHands,
      },
    ],
    // Business
    [
      'shop',
      { visibilityConditions: [furrowStarted, flag(SHOP_EXPLAINED_FLAG, false)], next: W.shopFirst },
      { visibilityConditions: [furrowStarted], next: W.default, effects: [openShop] },
    ],
    hub('petGift', [guildTier(ReputationTier.exalted), flag(GAVE_PET_FLAG, false)], W.petGift),
    // Lore
    hub('aboutClean', [completed(QuestID.wheatForTheGuild), flag(SAW_CLEAN_FLAG, false)], W.fourthTerrace),
    hub('aboutKitchen', [flag('wick_mentioned_kitchen'), flag(ASKED_DOOR_FLAG, false), notCompleted(QuestID.theGrowersTable)], W.askKitchen),
    hub('aboutSeed', furrowStarted, W.aboutSeed),
    hub('aboutHerd', completed(QuestID.theFirstFurrow), W.aboutHerd),
    ['aboutGuild', { next: W.aboutGuild }],
    ['aboutGate', { next: W.aboutGate }],
    // Idle
    hub('idleTerraces', completed(QuestID.theFirstFurrow), W.idleTerraces),
    hub('idleHeart', [completed(QuestID.theBlightedHeart), completed(QuestID.theFirstFurrow)], W.idleHeart),
    ['bye', close],
  ),

  // Lore
  [W.aboutGuild]: say(W.aboutGuild, ['hands', toHub], ['blight', { next: W.aboutGate }], ['who', { next: W.aboutWho }], ['spring', { next: W.aboutSpring }]),
  [W.aboutWho]: say(W.aboutWho, ['opt1', { next: W.aboutWhoWheat }], ['opt2', toHub]),
  [W.aboutWhoWheat]: say(W.aboutWhoWheat, ['opt1', { next: W.aboutWhoKeys }], ['opt2', toHub]),
  [W.aboutWhoKeys]: say(W.aboutWhoKeys, ['opt1', toHub], ['opt2', toHub]),
  [W.aboutSpring]: say(W.aboutSpring, ['opt1', { next: W.aboutGate }], ['opt2', toHub]),
  [W.aboutGate]: say(W.aboutGate, ['now', toHub], ['bye', close]),
  [W.aboutSeed]: say(W.aboutSeed, ['opt1', toHub]),
  [W.aboutHerd]: say(W.aboutHerd, ['opt1', { next: W.aboutHerdAll }], ['opt2', { next: W.aboutHerdAll }]),
  [W.aboutHerdAll]: say(W.aboutHerdAll, ['opt1', toHub]),

  // The First Furrow
  [W.questFurrow]: say(W.questFurrow, ['accept', start(QuestID.theFirstFurrow)], ['why', { next: W.questFurrowWhy }], ['decline', toHub]),
  [W.questFurrowWhy]: say(W.questFurrowWhy, ['opt1', start(QuestID.theFirstFurrow)], ['opt2', toHub]),
  [W.questFurrowProgress]: say(W.questFurrowProgress, ['opt1', close]),
  [W.questFurrowComplete]: say(W.questFurrowComplete, ['opt1', end(QuestID.theFirstFurrow, W.questFurrowAfter)]),
  [W.questFurrowAfter]: say(W.questFurrowAfter, ['opt1', toHub], ['opt2', { next: W.questFurrowNoCook }]),
  [W.questFurrowNoCook]: say(W.questFurrowNoCook, ['opt1', toHub]),

  // Wheat for the Guild
  [W.questWheat]: say(W.questWheat, ['accept', start(QuestID.wheatForTheGuild)], ['ask', { next: W.questWheatAsk }], ['decline', toHub]),
  [W.questWheatAsk]: say(W.questWheatAsk, ['opt1', start(QuestID.wheatForTheGuild)], ['opt2', toHub]),
  [W.questWheatProgress]: say(W.questWheatProgress, ['opt1', close]),
  [W.questWheatComplete]: say(W.questWheatComplete, ['opt1', end(QuestID.wheatForTheGuild)]),

  // The larder: the pick is rolled when the order starts, so the offer cannot name it; the quest panel does.
  [W.orderOfferFirst]: say(W.orderOfferFirst, ['accept', start(QuestID.marthasOrder, setFlag(ORDER_EXPLAINED_FLAG))], ['decline', toHub]),
  [W.orderOffer]: say(W.orderOffer, ['accept', start(QuestID.marthasOrder)], ['decline', toHub]),
  [W.orderProgress]: say(W.orderProgress, ['opt1', close]),
  [W.orderComplete]: say(W.orderComplete, ['opt1', end(QuestID.marthasOrder)]),

  // What comes after wheat
  [W.workNextSylvie]: say(W.workNextSylvie, ['opt1', toHub]),
  [W.workNextHands]: say(W.workNextHands, ['opt1', toHub]),

  // The fourth terrace
  [W.fourthTerrace]: say(W.fourthTerrace,
    ['opt1', { next: W.topTerrace, effects: [setFlag(SAW_CLEAN_FLAG)] }],
    ['opt2', { next: W.topTerrace, effects: [setFlag(SAW_CLEAN_FLAG)] }],
  ),
  [W.topTerrace]: say(W.topTerrace, ['opt1', { next: W.topSilverleaf }], ['opt2', { next: W.topTurnip }], ['opt3', { next: W.topNothing }], ['opt4', toHub]),
  [W.topSilverleaf]: say(W.topSilverleaf, ['opt1', { next: W.topOrchard }], ['opt2', toHub]),
  [W.topTurnip]: say(W.topTurnip, ['opt1', { next: W.topOrchard }], ['opt2', toHub]),
  [W.topNothing]: say(W.topNothing, ['opt1', { next: W.topOrchard }], ['opt2', toHub]),
  [W.topOrchard]: say(W.topOrchard, ['opt1', toHub]),

  // An Orchard Again
  [W.questOrchard]: say(W.questOrchard, ['accept', start(QuestID.anOrchardAgain)], ['why', { next: W.questOrchardWhy }], ['decline', toHub]),
  [W.questOrchardWhy]: say(W.questOrchardWhy, ['opt1', start(QuestID.anOrchardAgain)], ['opt2', toHub]),
  [W.questOrchardProgress]: say(W.questOrchardProgress, ['opt1', close]),
  [W.questOrchardComplete]: say(W.questOrchardComplete, ['opt1', end(QuestID.anOrchardAgain)]),

  // The Growers' Table
  [W.questTable]: say(W.questTable, ['accept', start(QuestID.theGrowersTable)], ['pie', { next: W.questTablePie }], ['decline', toHub]),
  [W.questTablePie]: say(W.questTablePie, ['opt1', start(QuestID.theGrowersTable)], ['opt2', toHub]),
  [W.questTableProgress]: say(W.questTableProgress, ['opt1', close]),
  [W.questTableComplete]: say(W.questTableComplete, ['opt1', end(QuestID.theGrowersTable, W.questTableAfter)]),
  [W.questTableAfter]: say(W.questTableAfter, ['opt1', toHub], ['opt2', toHub]),

  [W.shopFirst]: say(W.shopFirst, ['opt1', { next: W.default, effects: [openShop, setFlag(SHOP_EXPLAINED_FLAG)] }]),

  // The hare
  [W.petGift]: say(W.petGift,
    ['accept', { next: W.petGiftDone, effects: [{ type: 'item', action: 'give', items: [{ itemId: ItemID.petFarmingGuildHare, amount: 1 }] }, setFlag(GAVE_PET_FLAG)] }],
    ['decline', toHub],
  ),
  [W.petGiftDone]: say(W.petGiftDone, ['opt1', toHub]),

  // Idle
  [W.idleTerraces]: say(W.idleTerraces, ['opt1', { next: W.idleNet }], ['opt2', toHub]),
  [W.idleNet]: say(W.idleNet, ['opt1', toHub], ['opt2', toHub]),
  [W.idleHeart]: say(W.idleHeart, ['opt1', toHub], ['opt2', toHub]),

  // The kitchen
  [W.askKitchen]: say(W.askKitchen, ['opt1', { next: W.askKitchenGate }], ['opt2', toHub]),
  [W.askKitchenGate]: say(W.askKitchenGate, ['opt1', { next: W.askKitchenDoor }], ['opt2', toHub]),
  [W.askKitchenDoor]: say(W.askKitchenDoor,
    ['opt1', { next: W.default, effects: [setFlag(ASKED_DOOR_FLAG)] }],
    ['opt2', { next: W.default, effects: [setFlag(ASKED_DOOR_FLAG)] }],
  ),
}

export default FARM_WARDEN
