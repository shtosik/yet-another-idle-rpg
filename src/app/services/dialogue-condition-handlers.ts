import i18next from 'i18next'
import { DialogueCondition } from '../../types/dialogues/dialogue-condition.type'
import { DialogueContext, DialogueLabel } from './dialogue-effect-handlers'
import { isTaskDone } from '../store/player/tasks'
import { matchesQuestState } from './quest-status'
import { RequirementProps } from '../../data/quests-data'
import { QuestID } from '../../enums/ids/quest-id.enum'
import { QuestState } from '../../enums/quest-state.enum'
import { ItemID } from '../../enums/ids/item-id.enum'
import { EnemyID } from '../../enums/ids/enemy-id.enum'
import { ZoneID } from '../../enums/ids/zone-id.enum'
import { ProfessionID } from '../../enums/ids/profession-id.enum'
import { PlayerStat } from '../../types/player/player-stat.type'
import { reputationTierLabel } from '../components/game/quests/reputation/reputation-text'
import { REPUTATION_THRESHOLDS } from '../store/player/reputation'
import { formatCooldown } from '../store/quests/turn-in-cooldown'
import { enemyName, itemName, professionName, questName, zoneName } from '../i18n/names'

export interface ConditionHandler<C extends DialogueCondition> {
  evaluate(condition: C, ctx: DialogueContext): boolean
  /** The requirement tag shown when the condition is in `requirementsNeeded`; no parts, no tag. */
  label(condition: C, ctx: DialogueContext): DialogueLabel[]
}

type ConditionHandlers = { [T in DialogueCondition['type']]: ConditionHandler<Extract<DialogueCondition, { type: T }>> }

/** Kill requirements of `questId` count kills since its current step started. */
export function requirementMet(ctx: DialogueContext, req: RequirementProps, questId: QuestID): boolean {
  const { current, target } = ctx.quests.requirementProgress(questId, req)
  return current >= target
}

interface StatReq { stat: PlayerStat, comparison: 'gte' | 'lte', amount: number }
interface QuestReq { questId: QuestID, questState: QuestState, step?: number }
interface KillReq { enemyId: EnemyID, amount: number }
interface WaveReq { zoneId: ZoneID, waveNumber: number, amount: number }

const statMet = (ctx: DialogueContext, req: StatReq) => {
  const value = ctx.player.stats()[req.stat] as number
  return req.comparison === 'gte' ? value >= req.amount : value <= req.amount
}
const questMet = (ctx: DialogueContext, req: QuestReq) => matchesQuestState(
  ctx.quests.questStepProgression(), req.questId, req.questState, r => requirementMet(ctx, r, req.questId), req.step,
)
const killsMet = (ctx: DialogueContext, req: KillReq) => (ctx.player.enemyKillCounts()[req.enemyId] ?? 0) >= req.amount
const waveMet = (ctx: DialogueContext, req: WaveReq) => ctx.player.getKillCountByZoneAndWave(req.zoneId, req.waveNumber) >= req.amount

const statLabel = (req: StatReq): DialogueLabel =>
  ({ key: 'app:dialogueTags.amount', params: { name: i18next.t(`app:playerStats.${req.stat}`), amount: req.amount } })
const itemLabel = (itemId: ItemID, amount: number): DialogueLabel =>
  ({ key: 'app:dialogueTags.amount', params: { name: itemName(itemId), amount } })
const questLabel = (req: QuestReq): DialogueLabel =>
  ({ key: 'app:dialogueTags.questRequired', params: { quest: questName(req.questId) } })
const killLabel = (req: KillReq): DialogueLabel =>
  ({ key: 'app:dialogueTags.kill', params: { amount: req.amount, enemy: enemyName(req.enemyId) } })
const waveLabel = (req: WaveReq): DialogueLabel => ({
  key: 'quests:requirements.waveKillCount',
  params: { amount: req.amount, wave: req.waveNumber, zone: zoneName(req.zoneId) },
})

export const CONDITION_HANDLERS: ConditionHandlers = {
  flag: {
    evaluate: (c, ctx) => !!ctx.quests.dialogueFlags()[c.name] === c.isSet,
    label: () => [],
  },
  stat: {
    evaluate: (c, ctx) => statMet(ctx, c),
    label: c => [statLabel(c)],
  },
  manyStat: {
    evaluate: (c, ctx) => c.statsRequired.every(req => statMet(ctx, req)),
    label: c => c.statsRequired.map(statLabel),
  },
  quest: {
    evaluate: (c, ctx) => questMet(ctx, c),
    label: c => [questLabel(c)],
  },
  manyQuestCompleted: {
    evaluate: (c, ctx) => c.questsRequired.every(req => questMet(ctx, req)),
    label: c => c.questsRequired.map(questLabel),
  },
  item: {
    evaluate: (c, ctx) => ctx.player.itemCount(c.itemId) >= c.amount,
    label: c => [itemLabel(c.itemId, c.amount)],
  },
  manyItems: {
    evaluate: (c, ctx) => c.itemIds.every(itemId => ctx.player.itemCount(itemId) >= (c.amounts[itemId] ?? 1)),
    label: c => c.itemIds.map(itemId => itemLabel(itemId, c.amounts[itemId] ?? 1)),
  },
  killCount: {
    evaluate: (c, ctx) => killsMet(ctx, c),
    label: c => [killLabel(c)],
  },
  manyKillCount: {
    evaluate: (c, ctx) => c.enemiesRequired.every(req => killsMet(ctx, req)),
    label: c => c.enemiesRequired.map(killLabel),
  },
  waveKillCount: {
    evaluate: (c, ctx) => waveMet(ctx, c),
    label: c => [waveLabel(c)],
  },
  manyWaveKillCount: {
    evaluate: (c, ctx) => c.wavesRequired.every(req => waveMet(ctx, req)),
    label: c => c.wavesRequired.map(waveLabel),
  },
  guild: {
    evaluate: (c, ctx) => {
      switch (c.condition) {
        case 'hasActiveTask':   return ctx.player.hasTaskInProgress()
        case 'taskComplete':    return ctx.player.hasCompletedTask()
        case 'noActiveTask':    return ctx.player.activeTasks().length === 0
        case 'hasFreeTaskSlot': return ctx.player.hasAvailableTaskSlot()
        case 'taskInProgressAt': {
          const task = ctx.player.activeTasks()[c.taskIndex ?? 0]
          return !!task && !isTaskDone(task)
        }
      }
    },
    label: c => [{ key: `app:dialogueTags.guildCondition.${c.condition}` }],
  },
  reputation: {
    evaluate: (c, ctx) => ctx.player.reputationTierOf(c.reputationId) >= c.tier,
    // "Requires Mawood Honored — 140/200", as `reputationLockText`.
    label: (c, ctx) => [{
      key: 'quests:reputation.requires',
      params: {
        what: reputationTierLabel(c.reputationId, c.tier),
        current: ctx.player.reputation()[c.reputationId] ?? 0,
        target: REPUTATION_THRESHOLDS[c.tier],
      },
    }],
  },
  professionLevel: {
    evaluate: (c, ctx) => ctx.player.professionLevel(c.professionId) >= c.level,
    label: c => [{
      key: 'app:expertise.label',
      params: { profession: professionName(c.professionId), level: c.level },
    }],
  },
  farmSeeds: {
    evaluate: (c, ctx) => Object.values(ctx.player.farm().seeds).reduce((sum, n) => sum + (n ?? 0), 0) >= c.atLeast,
    label: () => [],
  },
  turnInCooldown: {
    evaluate: (c, ctx) => (ctx.cooldowns.remainingMs(c.key) === 0) === (c.state === 'ready'),
    label: (c, ctx) => {
      const remaining = ctx.cooldowns.remainingMs(c.key)
      return remaining > 0 ? [{ key: 'app:turnInReadyIn', params: { time: formatCooldown(remaining) } }] : []
    },
  },
  arena: {
    evaluate: (c, ctx) => {
      switch (c.state) {
        case 'ready': return ctx.arena.isReady()
        case 'running': return !!ctx.battle.arenaRun()
        case 'rewardsWaiting': return ctx.battle.arenaRewards().length > 0
      }
    },
    label: () => [],
  },
}

/** The handler for one condition; the cast is safe because `CONDITION_HANDLERS` is keyed by the condition's own `type`. */
export const conditionHandler = <C extends DialogueCondition>(condition: C): ConditionHandler<C> =>
  CONDITION_HANDLERS[condition.type] as unknown as ConditionHandler<C>
