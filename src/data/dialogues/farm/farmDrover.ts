import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'
import { DialogueResult } from '../../../interfaces/dialogues/dialogue-option.type'
import { DialogueCondition } from '../../../types/dialogues/dialogue-condition.type'
import { DialogueEffect } from '../../../types/dialogues/dialogue-effect.type'
import { NpcID } from '../../../enums/map/npc-id.enum'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { QuestState } from '../../../enums/quest-state.enum'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { ReputationID } from '../../../enums/reputation-id.enum'
import { ReputationTier } from '../../../enums/reputation-tier.enum'
import { orderKey } from '../../../app/store/quests/turn-in-cooldown'
import { dialogueNodes } from '../dialogue-nodes'

// Character and voice: docs/character/farm/wick.md. Text: dialogues/farmDrover.json. His order opens with the `wicksOrder` start requirement.
export enum DroverDialogue {
  default = 0,
  intro1,
  introHerd,
  aboutWick,
  aboutWickCharms,
  orderOffer,
  orderProgress,
  orderComplete,
  aboutWickNotes,
  aboutWickBramble,
  aboutStalls,
  aboutStallsGone,
  aboutStallsLabels,
  aboutLowPasture,
  aboutWarden,
  aboutWardenWhy,
  aboutWinter,
  aboutWinterHare,
  orderFirst,
  orderHide,
  orderPay,
  orderOfferTrusted,
  orderCompleteFirst,
  aboutUses,
  askOutThere,
  askGood,
  askSick,
  askSickAfter,
  bearPelt,
  aboutNames,
  namesTurnip,
  namesMarta,
  namesYours,
  aboutTable,
  idleSwallows,
  idleSwallowsHawk,
  idleHare,
}

export type FarmDroverDialogueType = Record<DroverDialogue, DialogueNode<DroverDialogue>>

const D = DroverDialogue
const say = dialogueNodes<DroverDialogue>('dialogues/farmDrover', DroverDialogue)

const MET_FLAG = `met_${NpcID.farmDrover}`
const ORDER_EXPLAINED_FLAG = 'wick_order_explained'
const FIRST_LOAD_FLAG = 'wick_first_load'
const MENTIONED_KITCHEN_FLAG = 'wick_mentioned_kitchen'
const SHOWED_PELT_FLAG = 'wick_showed_pelt'
const SHOWED_NAMES_FLAG = 'wick_showed_names'

const order = (questState: QuestState, step?: number): DialogueCondition => ({ type: 'quest', questId: QuestID.wicksOrder, questState, step })
const quest = (questId: QuestID, questState: QuestState): DialogueCondition => ({ type: 'quest', questId, questState })
const flag = (name: string, isSet = true): DialogueCondition => ({ type: 'flag', name, isSet })
const setFlag = (name: string): DialogueEffect => ({ type: 'flag', name })
const guildTier = (tier: ReputationTier): DialogueCondition => ({ type: 'reputation', reputationId: ReputationID.farmingGuild, tier })
const orderReady: DialogueCondition = { type: 'turnInCooldown', key: orderKey(QuestID.wicksOrder), state: 'ready' }

type Result = DialogueResult<DroverDialogue>
const toHub: Result = { next: D.default }
const close: Result = { closeDialogue: true }
const startOrder = (...effects: DialogueEffect[]): Result => ({ closeDialogue: true, effects: [{ type: 'quest', action: 'start', questId: QuestID.wicksOrder }, ...effects] })
const endOrder = (...effects: DialogueEffect[]): Result => ({ next: D.default, effects: [{ type: 'quest', action: 'end', questId: QuestID.wicksOrder }, ...effects] })
const firstOrder = startOrder(setFlag(ORDER_EXPLAINED_FLAG))

const FARM_DROVER: FarmDroverDialogueType = {
  [D.intro1]: say(D.intro1,
    ['herd', { next: D.introHerd, effects: [setFlag(MET_FLAG)] }],
    ['hello', { closeDialogue: true, effects: [setFlag(MET_FLAG)] }],
  ),
  [D.introHerd]: say(D.introHerd, ['opt1', toHub], ['where', { next: D.aboutStalls }]),

  [D.default]: say(D.default,
    [
      'orderTurnIn',
      { visibilityConditions: [order(QuestState.readyToAdvance, 1), flag(FIRST_LOAD_FLAG, false)], next: D.orderCompleteFirst },
      { visibilityConditions: [order(QuestState.readyToAdvance, 1)], next: D.orderComplete },
    ],
    ['orderProgress', { visibilityConditions: [order(QuestState.active), { ...order(QuestState.readyToAdvance), not: true }], next: D.orderProgress }],
    // While the order cools down the option stays, disabled, with the "Ready in ..." tag.
    ['orderOfferFirst', { visibilityConditions: [order(QuestState.available), flag(ORDER_EXPLAINED_FLAG, false)], requirementsNeeded: [orderReady], next: D.orderFirst }],
    [
      'orderOffer',
      { visibilityConditions: [order(QuestState.available), flag(ORDER_EXPLAINED_FLAG), guildTier(ReputationTier.honored)], requirementsNeeded: [orderReady], next: D.orderOfferTrusted },
      { visibilityConditions: [order(QuestState.available), flag(ORDER_EXPLAINED_FLAG)], requirementsNeeded: [orderReady], next: D.orderOffer },
    ],
    // Lore
    ['bearShow', { visibilityConditions: [{ type: 'item', itemId: ItemID.bearPelt, amount: 1 }, flag(ORDER_EXPLAINED_FLAG), flag(SHOWED_PELT_FLAG, false)], next: D.bearPelt }],
    ['names', { visibilityConditions: [guildTier(ReputationTier.revered), flag(SHOWED_NAMES_FLAG, false)], next: D.aboutNames }],
    ['table', { visibilityConditions: [quest(QuestID.theGrowersTable, QuestState.completed)], next: D.aboutTable }],
    ['aboutWick', { next: D.aboutWick }],
    ['stalls', { next: D.aboutStalls }],
    ['warden', { visibilityConditions: [{ ...quest(QuestID.theGrowersTable, QuestState.completed), not: true }], next: D.aboutWarden }],
    ['uses', { visibilityConditions: [flag(ORDER_EXPLAINED_FLAG)], next: D.aboutUses }],
    ['outThere', { next: D.askOutThere }],
    ['winter', { visibilityConditions: [guildTier(ReputationTier.honored)], next: D.aboutWinter }],
    // Idle
    ['idleSwallows', { next: D.idleSwallows }],
    ['idleHare', { visibilityConditions: [quest(QuestID.anOrchardAgain, QuestState.completed), flag('warden_gave_pet', false)], next: D.idleHare }],
    ['bye', close],
  ),

  // About him
  [D.aboutWick]: say(D.aboutWick, ['hard', { next: D.aboutWickNotes }], ['charms', { next: D.aboutWickCharms }], ['thanks', toHub]),
  [D.aboutWickNotes]: say(D.aboutWickNotes, ['opt1', { next: D.aboutWickBramble }], ['opt2', toHub]),
  [D.aboutWickBramble]: say(D.aboutWickBramble, ['opt1', { next: D.aboutStalls }], ['opt2', toHub]),
  [D.aboutWickCharms]: say(D.aboutWickCharms, ['opt1', toHub]),

  // The stalls
  [D.aboutStalls]: say(D.aboutStalls, ['opt1', { next: D.aboutStallsGone }], ['opt2', toHub]),
  [D.aboutStallsGone]: say(D.aboutStallsGone, ['opt1', { next: D.aboutStallsLabels }], ['opt2', toHub]),
  [D.aboutStallsLabels]: say(D.aboutStallsLabels, ['opt1', { next: D.aboutLowPasture }], ['opt2', toHub]),
  [D.aboutLowPasture]: say(D.aboutLowPasture, ['opt1', toHub]),

  // The Warden
  [D.aboutWarden]: say(D.aboutWarden,
    ['opt1', { next: D.aboutWardenWhy, effects: [setFlag(MENTIONED_KITCHEN_FLAG)] }],
    ['opt2', { next: D.default, effects: [setFlag(MENTIONED_KITCHEN_FLAG)] }],
  ),
  [D.aboutWardenWhy]: say(D.aboutWardenWhy, ['opt1', toHub]),
  [D.aboutWinter]: say(D.aboutWinter, ['opt1', { next: D.aboutWinterHare }], ['opt2', toHub]),
  [D.aboutWinterHare]: say(D.aboutWinterHare, ['opt1', toHub]),

  // Labels: the pick is rolled when the order starts, so the offer cannot name it; the quest panel does.
  [D.orderFirst]: say(D.orderFirst, ['opt1', { next: D.orderHide }], ['opt2', { next: D.orderPay }], ['opt3', firstOrder], ['opt4', toHub]),
  [D.orderHide]: say(D.orderHide, ['opt1', { next: D.orderPay }], ['opt2', firstOrder], ['opt3', toHub]),
  [D.orderPay]: say(D.orderPay, ['opt1', firstOrder], ['opt2', toHub]),
  [D.orderOffer]: say(D.orderOffer, ['accept', startOrder()], ['decline', toHub]),
  [D.orderOfferTrusted]: say(D.orderOfferTrusted, ['opt1', startOrder()], ['opt2', toHub]),
  [D.orderProgress]: say(D.orderProgress, ['opt1', close]),
  [D.orderCompleteFirst]: say(D.orderCompleteFirst, ['opt1', endOrder(setFlag(FIRST_LOAD_FLAG))]),
  [D.orderComplete]: say(D.orderComplete, ['opt1', endOrder()]),
  [D.aboutUses]: say(D.aboutUses, ['opt1', toHub]),

  // Out there
  [D.askOutThere]: say(D.askOutThere, ['opt1', { next: D.askGood }], ['opt2', { next: D.askSick }], ['opt3', toHub]),
  [D.askGood]: say(D.askGood, ['opt1', { next: D.aboutStalls }], ['opt2', toHub]),
  [D.askSick]: say(D.askSick, ['opt1', { next: D.askSickAfter }]),
  [D.askSickAfter]: say(D.askSickAfter, ['opt1', toHub]),

  // Trust
  [D.bearPelt]: say(D.bearPelt,
    ['opt1', { next: D.aboutNames, effects: [setFlag(SHOWED_PELT_FLAG)] }],
    ['opt2', { next: D.default, effects: [setFlag(SHOWED_PELT_FLAG)] }],
  ),
  [D.aboutNames]: say(D.aboutNames,
    ['opt1', { next: D.namesTurnip, effects: [setFlag(SHOWED_NAMES_FLAG)] }],
    ['opt2', { next: D.namesMarta, effects: [setFlag(SHOWED_NAMES_FLAG)] }],
    ['opt3', { next: D.namesYours, effects: [setFlag(SHOWED_NAMES_FLAG)] }],
  ),
  [D.namesTurnip]: say(D.namesTurnip, ['opt1', toHub]),
  [D.namesMarta]: say(D.namesMarta, ['opt1', toHub]),
  [D.namesYours]: say(D.namesYours, ['opt1', toHub]),
  [D.aboutTable]: say(D.aboutTable, ['opt1', toHub], ['opt2', toHub]),

  // Idle
  [D.idleSwallows]: say(D.idleSwallows, ['opt1', { next: D.idleSwallowsHawk }], ['opt2', toHub]),
  [D.idleSwallowsHawk]: say(D.idleSwallowsHawk, ['opt1', toHub]),
  [D.idleHare]: say(D.idleHare, ['opt1', toHub], ['opt2', toHub]),
}

export default FARM_DROVER
