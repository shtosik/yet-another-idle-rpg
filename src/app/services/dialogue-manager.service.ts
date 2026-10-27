import { BattleStore } from '../store/battle/battle.store'
import { ArenaService } from './arena.service'
import { DialogueNode } from '../../interfaces/dialogues/dialogue-node.interface'
import { computed, inject, Injectable, signal } from '@angular/core'
import { isTaskDone, PlayerStore } from '../store/player/player.store'
import { DialogueEffect, QuestEffect } from '../../types/dialogues/dialogue-effect.type'
import { QuestsStore } from '../store/quests/quests.store'
import { DialogueOption, DialogueResult } from '../../interfaces/dialogues/dialogue-option.type'
import { DialogueCondition } from '../../types/dialogues/dialogue-condition.type'
import { NpcID } from '../../enums/map/npc-id.enum'
import npcData, { NPCProps } from '../../data/npc-data'
import QUEST_DATA, { RequirementProps } from '../../data/quests-data'
import { getQuestStatus, getStepItems, matchesQuestState } from './quest-status'
import { QuestID } from '../../enums/ids/quest-id.enum'
import { QuestState } from '../../enums/quest-state.enum'
import { QuestStep } from '../../types/quests/quest-progression.type'
import { ItemStack } from '../store/player/inventory'
import { ExplorationGuildService } from './exploration-guild.service'
import { TownsStore } from '../store/towns/towns.store'
import { CurrencyFeedService } from './currency-feed.service'

@Injectable({ providedIn: 'root' })
export class DialogueManagerService {
  private playerStore = inject(PlayerStore)
  private questStore = inject(QuestsStore)
  private guildService = inject(ExplorationGuildService)
  private townsStore = inject(TownsStore)
  private currencyFeed = inject(CurrencyFeedService)
  private battleStore = inject(BattleStore)
  private arenaService = inject(ArenaService)

  private currentConversation = signal<Record<any, DialogueNode<any>> | null>(null)
  private currentNodeId = signal<any>(null)

  activeNode = computed(() => {
    const conversation = this.currentConversation()
    const id = this.currentNodeId()
    return conversation && id !== null ? conversation[id] : null
  })

  activeNpc = signal<NPCProps | null>(null)

  /** The shown and executed branch: the first result whose conditions pass, skipping quest starts that aren't available. */
  getActiveResult<T>(option: DialogueOption<T>): DialogueResult<T> | undefined {
    if (!option.results || option.results.length === 0) return undefined

    return option.results.find(result => {
      const questStart = result.effects?.find(
        (e): e is QuestEffect => e.type === 'quest' && e.action === 'start',
      )
      if (questStart && !this.isQuestAvailable(questStart.questId)) return false

      return this.checkConditions(result.visibilityConditions)
    })
  }

  private isQuestAvailable(questId: QuestID): boolean {
    return matchesQuestState(
      this.questStore.questStepProgression(),
      questId,
      QuestState.available,
      req => this.checkRequirement(req, questId),
    )
  }

  /** False when the result's rewards would not fit in the inventory, or its gold fee can't be paid. */
  canApplyResult(result: DialogueResult<any> | undefined): boolean {
    return this.missingSlots(result) === 0 && this.missingGold(result) === 0
  }

  /** Gold still needed to pay the result's `deduct` effects (owner decision: gold never goes negative). */
  missingGold(result: DialogueResult<any> | undefined): number {
    const fee = (result?.effects ?? []).reduce((sum, effect) =>
      effect.type === 'stat' && effect.action === 'deduct'
        ? sum + effect.stats.filter(s => s.stat === 'goldCoins').reduce((s, g) => s + g.amount, 0)
        : sum, 0)
    return Math.max(0, fee - this.playerStore.stats().goldCoins)
  }

  /** Slots the player must free before the result's item or quest-completion rewards fit. */
  missingSlots(result: DialogueResult<any> | undefined): number {
    if (!result?.effects) return 0

    const adding: ItemStack[] = []
    const removing: ItemStack[] = []

    for (const effect of result.effects) {
      if (effect.type === 'item') {
        const stacks = effect.items.map(i => ({ id: i.itemId, amount: i.amount }))
        if (effect.action === 'give') adding.push(...stacks)
        else removing.push(...stacks)
      } else if (effect.type === 'arena' && effect.action === 'claim') {
        adding.push(...this.battleStore.arenaRewards())
      } else if (effect.type === 'quest' && effect.action !== 'start') {
        const status = getQuestStatus(this.questStore.questStepProgression(), effect.questId)
        if (status.state !== QuestState.active) continue

        removing.push(...getStepItems(effect.questId, status.step))
        adding.push(...this.questCompletionRewards(effect, status.step))
      }
    }

    return adding.length === 0 ? 0 : this.playerStore.missingSlotsFor(adding, removing)
  }

  private questCompletionRewards(effect: QuestEffect, step: QuestStep): ItemStack[] {
    const questData = QUEST_DATA[effect.questId]
    const completes = effect.action === 'end' || step >= questData.steps.length
    if (!completes) return []

    return questData.rewards.flatMap(r => r.type === 'item' ? [{ id: r.itemId, amount: r.amount }] : [])
  }

  selectOption(option: DialogueOption<any>) {
    const validResult = this.getActiveResult(option)

    if (!validResult) {
      console.error('No valid branch found for option:', option.responseKey)
      return
    }

    if (!this.checkConditions(validResult.requirementsNeeded) || !this.canApplyResult(validResult)) {
      return
    }

    if (validResult.effects) {
      this.applyEffects(validResult.effects)
    }

    if (validResult.closeDialogue) {
      this.closeDialogue()
    } else if (validResult.next !== undefined) {
      this.currentNodeId.set(validResult.next)
    }
  }

  checkConditions(conditions?: DialogueCondition[]): boolean {
    if (!conditions || conditions.length === 0) return true

    return conditions.every(c => this.checkCondition(c))
  }

  startDialogue(npcId: NpcID) {
    const data = npcData[npcId]

    if (!data) return

    this.activeNpc.set(data)
    this.currentConversation.set(data.dialogue)

    const hasMet = !!this.questStore.dialogueFlags()[`met_${npcId}`]
    const useFirstMeet = !hasMet && data.firstMeetNodeId !== undefined
    const startId = useFirstMeet ? data.firstMeetNodeId : (data.startNodeId ?? 0)

    this.currentNodeId.set(startId)
  }

  closeDialogue() {
    this.currentConversation.set(null)
    this.currentNodeId.set(null)
    this.activeNpc.set(null)
  }

  checkCondition(c: DialogueCondition): boolean {
    switch (c.type) {
      case 'flag':
        return !!this.questStore.dialogueFlags()[c.name] === c.isSet
      case 'stat':
        return c.comparison === 'gte'
          ? (this.playerStore.stats()[c.stat] as number) >= c.amount
          : (this.playerStore.stats()[c.stat] as number) <= c.amount
      case 'manyStat':
        return c.statsRequired.every(req =>
          req.comparison === 'gte'
            ? (this.playerStore.stats()[req.stat] as number) >= req.amount
            : (this.playerStore.stats()[req.stat] as number) <= req.amount,
        )
      case 'quest':
        return matchesQuestState(
          this.questStore.questStepProgression(),
          c.questId,
          c.questState,
          req => this.checkRequirement(req, c.questId),
          c.step,
        )
      case 'item':
        return this.playerStore.itemCount(c.itemId) >= c.amount
      case 'manyItems':
        return c.itemIds.every(itemId => this.playerStore.itemCount(itemId) >= (c.amounts[itemId] ?? 1))
      case 'killCount':
        return (this.playerStore.enemyKillCounts()[c.enemyId] ?? 0) >= c.amount
      case 'manyKillCount':
        return c.enemiesRequired.every(
          req => (this.playerStore.enemyKillCounts()[req.enemyId] ?? 0) >= req.amount,
        )
      case 'waveKillCount':
        return this.playerStore.getKillCountByZoneAndWave(c.zoneId, c.waveNumber) >= c.amount
      case 'manyWaveKillCount':
        return c.wavesRequired.every(
          req => this.playerStore.getKillCountByZoneAndWave(req.zoneId, req.waveNumber) >= req.amount,
        )
      case 'manyQuestCompleted':
        return c.questsRequired.every(req =>
          matchesQuestState(
            this.questStore.questStepProgression(),
            req.questId,
            req.questState,
            r => this.checkRequirement(r, req.questId),
            req.step,
          ),
        )
      case 'guild':
        switch (c.condition) {
          case 'hasActiveTask':   return this.playerStore.hasTaskInProgress()
          case 'taskComplete':    return this.playerStore.hasCompletedTask()
          case 'noActiveTask':    return this.playerStore.activeTasks().length === 0
          case 'hasFreeTaskSlot': return this.playerStore.hasAvailableTaskSlot()
          case 'taskInProgressAt': {
            const task = this.playerStore.activeTasks()[c.taskIndex ?? 0]
            return !!task && !isTaskDone(task)
          }
        }
        return false
      case 'arena':
        return c.state === 'idle' ? !this.battleStore.arenaRun() : this.battleStore.arenaRewards().length > 0
      default:
        return false
    }
  }

  /** Kill requirements of `questId` count kills since its current step started. */
  private checkRequirement(req: RequirementProps, questId: QuestID): boolean {
    const { current, target } = this.questStore.requirementProgress(questId, req)
    return current >= target
  }

  private applyEffects(effects: DialogueEffect[]) {
    effects.forEach(effect => {
      switch (effect.type) {
        case 'stat':
          const signedStats = effect.stats.map(s => ({
            stat: s.stat,
            amount: effect.action === 'deduct' ? -s.amount : s.amount,
          }))
          this.playerStore.updatePlayerStats(signedStats)
          break
        case 'quest':
          switch (effect.action) {
            case 'start':
              this.questStore.startQuest(effect.questId)
              break
            case 'advance':
              this.questStore.advanceQuest(effect.questId)
              break
            case 'end':
              this.questStore.endQuest(effect.questId)
              break
          }
          break
        case 'shop':
          this.openShop(effect.shopId)
          break
        case 'flag':
          this.questStore.setDialogueFlag(effect.name)
          break
        case 'item':
          if (effect.action === 'take') {
            this.playerStore.removeItems(effect.items.map(i => ({ id: i.itemId, amount: i.amount })))
          } else if (effect.action === 'give') {
            this.playerStore.addItems(effect.items.map(i => ({ id: i.itemId, amount: i.amount })))
          }
          break
        case 'guild':
          switch (effect.action) {
            case 'acceptTask':
              this.guildService.acceptTask(effect.taskLength)
              break
            case 'abandonTask':
              this.playerStore.abandonTask(effect.taskIndex ?? 0)
              break
            case 'claimTask': {
              const tokensBefore = this.playerStore.explorerTokens()
              this.playerStore.claimCompletedTasks()
              this.currencyFeed.show('explorerTokens', this.playerStore.explorerTokens() - tokensBefore)
              break
            }
          }
          break
        case 'arena':
          if (effect.action === 'enter') this.arenaService.enter()
          else this.arenaService.claimRewards()
          break
      }
    })
  }

  private openShop(shopId: number) {
    const npc = this.activeNpc()
    if (npc) this.townsStore.rememberNpcShop(npc.id, shopId)
    this.townsStore.openShop(shopId)
  }
}
