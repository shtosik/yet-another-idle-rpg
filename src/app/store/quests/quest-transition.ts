import QUEST_DATA, { QUEST_STEP_AFTER_COMPLETED, QuestProps, RepeatProps } from '../../../data/quests-data'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { ProfessionID } from '../../../enums/ids/profession-id.enum'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { QuestState } from '../../../enums/quest-state.enum'
import { QuestProgression, QuestStep } from '../../../types/quests/quest-progression.type'
import { PlayerStat } from '../../../types/player/player-stat.type'
import { getQuestStatus, getStepItems } from '../../services/quest-status'
import { ItemStack } from '../player/inventory'
import { ReputationGain } from '../player/reputation'
import { PlayerStatsType } from '../player/stats'
import { professionXp, professionXpMultiplier } from '../player/professions'
import { OrderRewards, Orders } from './orders'
import { orderKey, TurnInKey, turnInRemainingMs } from './turn-in-cooldown'

/** What completing a quest pays, split by where it goes. The dialogue slot check reads `items` from here too. */
export interface QuestPayout {
  stats: { stat: PlayerStat, amount: number }[]
  items: ItemStack[]
  reputation: ReputationGain[]
  professionXp: { professionId: ProfessionID, amount: number }[]
}

/** A completed quest and what it paid; the quest-completed modal lists it. */
export interface QuestCompleted {
  questId: QuestID
  payout: QuestPayout
}

/** The saved quest state a transition writes. */
export interface QuestSlice {
  questStepProgression: QuestProgression
  /** Started repeatable orders: the rolled requirements and rewards, saved at start so a reload never re-rolls. */
  orders: Orders
  /** When each turn-in last ran (Game time ms, `GameClock`); its cooldown is computed from this (`turnInRemainingMs`). */
  lastTurnInAt: Partial<Record<TurnInKey, number>>
  /** How often each repeatable order was completed. */
  questCompletions: Partial<Record<QuestID, number>>
  /** Active quests pinned to the top of the quest panel, in pin order. Dropped on completion. */
  pinnedQuests: QuestID[]
}

export interface TransitionContext {
  /** Game time ms. */
  now: number
  /** False while an offline claim is pending: an Order's cooldown would start inside the absence. */
  settled: boolean
  stats: PlayerStatsType
  itemCount: (id: ItemID) => number
  /** Whether `adds` fit once `removes` are taken (`PlayerStore.canGrant`). */
  fits: (adds: ItemStack[], removes: ItemStack[]) => boolean
}

/** An accepted transition: take `take`, write `quests`, set the kill baseline to `baselineStep`, pay `payout` (null: not completed). */
export interface QuestTransition {
  quests: QuestSlice
  take: ItemStack[]
  baselineStep: QuestStep | null
  payout: QuestPayout | null
}

/** What completing a quest from data pays. */
export function questPayout(data: QuestProps): QuestPayout {
  const payout: QuestPayout = { stats: [], items: [], reputation: [], professionXp: [] }
  for (const reward of data.rewards) {
    switch (reward.type) {
      case 'stat':
        payout.stats.push({ stat: reward.key, amount: reward.amount })
        break
      case 'item':
        payout.items.push({ id: reward.itemId, amount: reward.amount })
        break
      case 'reputation':
        payout.reputation.push({ reputationId: reward.reputationId, amount: reward.amount })
        break
      case 'professionXp':
        payout.professionXp.push({ professionId: reward.professionId, amount: reward.amount })
        break
    }
  }
  return payout
}

/** What an Order pays: its saved rewards, profession XP × the profession's multiplier. Orders pay no items. */
function orderPayout(repeat: RepeatProps, rewards: OrderRewards, stats: PlayerStatsType): QuestPayout {
  const xp = professionXp(rewards.farmingXp, professionXpMultiplier(stats, repeat.professionId))
  return {
    stats: rewards.gold > 0 ? [{ stat: 'goldCoins', amount: rewards.gold }] : [],
    items: [],
    reputation: rewards.reputation > 0 ? [{ reputationId: repeat.reputationId, amount: rewards.reputation }] : [],
    professionXp: xp > 0 ? [{ professionId: repeat.professionId, amount: xp }] : [],
  }
}

/**
 * Moves `questId` forward: `advance` takes the current step's turn-in, `end` completes from any step. Null (a refusal,
 * nothing changes) unless the quest is active and, when it completes, its rewards fit once the step's items are taken.
 * An Order always completes and is also refused while the clock is unsettled, its cooldown runs or its items are missing.
 * Step readiness (`isStepReady`) is the caller's check.
 */
export function questTransition(questId: QuestID, action: 'advance' | 'end', state: QuestSlice, ctx: TransitionContext): QuestTransition | null {
  const status = getQuestStatus(state.questStepProgression, questId)
  if (status.state !== QuestState.active) return null

  const data = QUEST_DATA[questId]
  const take = getStepItems(questId, status.step, state.orders)
  const pinnedQuests = state.pinnedQuests.filter(id => id !== questId)

  if (data.repeat) {
    const order = state.orders[questId]
    if (!order || !ctx.settled) return null
    if (!take.every(s => ctx.itemCount(s.id) >= s.amount)) return null
    const key = orderKey(questId)
    if (turnInRemainingMs(state.lastTurnInAt[key], ctx.stats.turnInCooldownReduction, ctx.now) > 0) return null
    const payout = orderPayout(data.repeat, order.rewards, ctx.stats)
    if (!ctx.fits(payout.items, take)) return null

    const { [questId]: _step, ...questStepProgression } = state.questStepProgression
    const { [questId]: _order, ...orders } = state.orders
    return {
      quests: {
        questStepProgression,
        orders,
        lastTurnInAt: { ...state.lastTurnInAt, [key]: ctx.now },
        questCompletions: { ...state.questCompletions, [questId]: (state.questCompletions[questId] ?? 0) + 1 },
        pinnedQuests,
      },
      take,
      baselineStep: null,
      payout,
    }
  }

  const completes = action === 'end' || status.step >= data.steps.length
  const payout = completes ? questPayout(data) : null
  if (payout && !ctx.fits(payout.items, take)) return null
  const next = completes ? QUEST_STEP_AFTER_COMPLETED : status.step + 1
  return {
    quests: {
      ...state,
      questStepProgression: { ...state.questStepProgression, [questId]: next },
      pinnedQuests: completes ? pinnedQuests : state.pinnedQuests,
    },
    take,
    baselineStep: completes ? null : next,
    payout,
  }
}
