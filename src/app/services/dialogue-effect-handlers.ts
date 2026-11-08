import i18next from 'i18next'
import { DialogueEffect, ReputationTurnInEffect } from '../../types/dialogues/dialogue-effect.type'
import { PlayerStore } from '../store/player/player.store'
import { QuestsStore, questPayout } from '../store/quests/quests.store'
import { TownsStore } from '../store/towns/towns.store'
import { BattleStore } from '../store/battle/battle.store'
import { ArenaService } from './arena.service'
import { ExplorationGuildService } from './exploration-guild.service'
import { CurrencyFeedService } from './currency-feed.service'
import { ReputationService } from './reputation.service'
import { TurnInCooldownService } from './turn-in-cooldown.service'
import { UnlockService } from './unlock.service'
import { NPCProps } from '../../data/npc-data'
import { ItemStack } from '../store/player/inventory'
import { ReputationTurnIn, turnInBundles, turnInFor } from '../../data/reputation-turn-ins'
import { bundleKey } from '../store/quests/turn-in-cooldown'
import { getActiveQuestIds, getQuestStatus, getStepItems } from './quest-status'
import { QuestStep } from '../../types/quests/quest-progression.type'
import { QuestState } from '../../enums/quest-state.enum'
import QUEST_DATA from '../../data/quests-data'
import { QuestID } from '../../enums/ids/quest-id.enum'
import { ItemID } from '../../enums/ids/item-id.enum'
import { ReputationID } from '../../enums/reputation-id.enum'

/** The stores and services dialogue handlers read and write, passed in by `DialogueManagerService`. */
export interface DialogueContext {
  player: InstanceType<typeof PlayerStore>
  quests: InstanceType<typeof QuestsStore>
  towns: InstanceType<typeof TownsStore>
  battle: InstanceType<typeof BattleStore>
  arena: ArenaService
  guild: ExplorationGuildService
  currencyFeed: CurrencyFeedService
  reputation: ReputationService
  cooldowns: TurnInCooldownService
  unlocks: UnlockService
  activeNpc: () => NPCProps | null
}

/** One tag part: the component translates `key` with `params` and joins the parts with ", ". No parts, no tag. */
export interface DialogueLabel {
  key: string
  params?: Record<string, string | number>
}

/** What an effect needs before it may run: gold it spends, and the items it adds and removes (checked against free slots). */
export interface EffectCost {
  gold?: number
  adds?: ItemStack[]
  removes?: ItemStack[]
}

export interface EffectHandler<E extends DialogueEffect> {
  apply(effect: E, ctx: DialogueContext): void
  cost?(effect: E, ctx: DialogueContext): EffectCost
  /** A one-time or stock check beyond the cost; the option is disabled while it fails. */
  canApply?(effect: E, ctx: DialogueContext): boolean
  label(effect: E, ctx: DialogueContext): DialogueLabel[]
}

type EffectHandlers = { [T in DialogueEffect['type']]: EffectHandler<Extract<DialogueEffect, { type: T }>> }

const stacks = (items: { itemId: ItemID, amount: number }[]): ItemStack[] => items.map(i => ({ id: i.itemId, amount: i.amount }))
const questName = (questId: QuestID) => i18next.t(`quests:names.${QuestID[questId]}`)

/**
 * What a turn-in hands over right now: the NPC's turn-in, how many of its item the player holds, how many the
 * current steps of active quests keep back, and the bundle taken from the rest (0 or 1; 0 while it cools down).
 */
export function turnInState(effect: ReputationTurnInEffect, ctx: DialogueContext): { turnIn: ReputationTurnIn, held: number, kept: number, bundles: number } {
  const turnIn = turnInFor(effect.npcId)
  if (!turnIn) throw new Error(`No reputation turn-in for NPC ${effect.npcId}`)
  const progression = ctx.quests.questStepProgression()
  const kept = [...getActiveQuestIds(progression)]
    .flatMap(questId => getStepItems(questId, progression[questId] as QuestStep, ctx.quests.orders()))
    .filter(stack => stack.id === turnIn.itemId)
    .reduce((sum, stack) => sum + stack.amount, 0)
  const held = ctx.player.itemCount(turnIn.itemId)
  const cooling = ctx.cooldowns.remainingMs(bundleKey(turnIn.npcId, turnIn.itemId)) > 0
  return { turnIn, held, kept: Math.min(held, kept), bundles: cooling ? 0 : turnInBundles(turnIn, Math.max(0, held - kept)) }
}

/** A disabled turn-in (no full bundle yet) still shows one bundle's worth, so the player sees the rate. */
export const shownBundles = (bundles: number): number => Math.max(bundles, 1)

export const EFFECT_HANDLERS: EffectHandlers = {
  stat: {
    apply: (effect, ctx) => {
      const deduct = effect.action === 'deduct'
      // A gold deduct goes through `spend` so gold can't go negative; `missingGold` gates the option first, so a
      // refusal here means the state changed in between, and nothing of the effect is applied.
      if (deduct) {
        const fee = effect.stats.filter(s => s.stat === 'goldCoins').reduce((sum, s) => sum + s.amount, 0)
        if (fee > 0 && !ctx.player.spend('gold', fee)) return
      }
      const stats = effect.stats.filter(s => !deduct || s.stat !== 'goldCoins')
      ctx.player.updatePlayerStats(stats.map(s => ({ stat: s.stat, amount: deduct ? -s.amount : s.amount })))
    },
    // Owner decision: gold never goes negative, so a gold deduct is a cost the player must cover.
    cost: effect => ({
      gold: effect.action === 'deduct'
        ? effect.stats.filter(s => s.stat === 'goldCoins').reduce((sum, s) => sum + s.amount, 0)
        : 0,
    }),
    label: effect => effect.stats.map(s => ({
      key: 'app:dialogueTags.change',
      params: { sign: effect.action === 'deduct' ? '-' : '+', amount: s.amount, name: i18next.t(`app:playerStats.${s.stat}`) },
    })),
  },
  quest: {
    apply: (effect, ctx) => {
      switch (effect.action) {
        case 'start':
          ctx.quests.startQuest(effect.questId)
          break
        case 'advance':
          ctx.quests.advanceQuest(effect.questId)
          break
        case 'end':
          // Dialogue ends are turn-ins, so recheck like `advanceQuest`; `dev.completeQuest` calls `endQuest` directly.
          if (ctx.quests.isStepReady(effect.questId)) ctx.quests.endQuest(effect.questId)
          break
      }
    },
    // A turn-in takes the step's items; the step that completes the quest also pays its item rewards.
    cost: (effect, ctx) => {
      if (effect.action === 'start') return {}
      const status = getQuestStatus(ctx.quests.questStepProgression(), effect.questId)
      if (status.state !== QuestState.active) return {}
      const data = QUEST_DATA[effect.questId]
      const completes = effect.action === 'end' || status.step >= data.steps.length
      return {
        removes: getStepItems(effect.questId, status.step, ctx.quests.orders()),
        adds: completes ? questPayout(data).items : [],
      }
    },
    label: effect => [{ key: `app:dialogueTags.quest.${effect.action}`, params: { quest: questName(effect.questId) } }],
  },
  item: {
    apply: (effect, ctx) => {
      if (effect.action === 'take') ctx.player.removeItems(stacks(effect.items))
      else ctx.player.addItems(stacks(effect.items))
    },
    cost: effect => effect.action === 'give' ? { adds: stacks(effect.items) } : { removes: stacks(effect.items) },
    label: effect => effect.silent ? [] : effect.items.map(i => ({
      key: 'app:dialogueTags.change',
      params: { sign: effect.action === 'give' ? '+' : '-', amount: i.amount, name: i18next.t(`items:names.${ItemID[i.itemId]}`) },
    })),
  },
  shop: {
    apply: (effect, ctx) => {
      const npc = ctx.activeNpc()
      if (npc) ctx.towns.rememberNpcShop(npc.id, effect.shopId, effect.stage ?? 0)
      ctx.towns.openShop(effect.shopId, effect.stage ?? 0)
    },
    label: () => [{ key: 'app:dialogueTags.shop' }],
  },
  forge: {
    apply: (_, ctx) => ctx.towns.openForge(),
    label: () => [{ key: 'forge:open' }],
  },
  registerPathfindersSeal: {
    apply: (_, ctx) => ctx.player.registerPathfindersSeal(),
    canApply: (_, ctx) => ctx.player.canRegisterPathfindersSeal(),
    label: () => [{ key: 'dialogues/laHarparMarvin:sealEffect' }],
  },
  flag: {
    apply: (effect, ctx) => ctx.quests.setDialogueFlag(effect.name),
    label: () => [],
  },
  guild: {
    apply: (effect, ctx) => {
      switch (effect.action) {
        case 'acceptTask':
          ctx.guild.acceptTask(effect.taskLength)
          break
        case 'abandonTask':
          ctx.player.abandonTask(effect.taskIndex ?? 0)
          break
        case 'claimTask': {
          const tokensBefore = ctx.player.explorerTokens()
          ctx.player.claimCompletedTasks()
          ctx.currencyFeed.show('explorerTokens', ctx.player.explorerTokens() - tokensBefore)
          break
        }
      }
    },
    label: effect => [{ key: `app:dialogueTags.guild.${effect.action}`, params: { length: effect.taskLength ?? '' } }],
  },
  arena: {
    apply: (effect, ctx) => {
      if (effect.action === 'enter') ctx.arena.enter()
      else ctx.arena.claimRewards()
    },
    cost: (effect, ctx) => effect.action === 'claim' ? { adds: ctx.battle.arenaRewards() } : {},
    label: effect => [{ key: `app:arena.effects.${effect.action}` }],
  },
  unlockProfession: {
    apply: (effect, ctx) => ctx.player.unlockProfession(effect.professionId),
    label: () => [],
  },
  unlockSite: {
    apply: (effect, ctx) => ctx.unlocks.grant({ type: 'site', siteId: effect.siteId }),
    label: () => [],
  },
  reputationTurnIn: {
    apply: (effect, ctx) => {
      const { turnIn, bundles } = turnInState(effect, ctx)
      if (bundles === 0) return
      ctx.player.removeItems([{ id: turnIn.itemId, amount: bundles * turnIn.bundleSize }])
      ctx.reputation.gain([{ reputationId: turnIn.reputationId, amount: bundles * turnIn.reputation }])
      ctx.quests.recordTurnIn(bundleKey(turnIn.npcId, turnIn.itemId), Date.now())
    },
    canApply: (effect, ctx) => turnInState(effect, ctx).bundles > 0,
    label: (effect, ctx) => {
      const { turnIn, bundles } = turnInState(effect, ctx)
      return [{
        key: 'quests:reputation.reward',
        params: {
          amount: shownBundles(bundles) * turnIn.reputation,
          town: i18next.t(`map:reputations.${ReputationID[turnIn.reputationId]}`),
        },
      }]
    },
  },
}

/** The handler for one effect; the cast is safe because `EFFECT_HANDLERS` is keyed by the effect's own `type`. */
export const effectHandler = <E extends DialogueEffect>(effect: E): EffectHandler<E> =>
  EFFECT_HANDLERS[effect.type] as unknown as EffectHandler<E>
