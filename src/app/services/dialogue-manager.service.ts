import { DialogueNode } from '../../interfaces/dialogues/dialogue-node.interface'
import { computed, inject, Injectable, signal } from '@angular/core'
import { PlayerStore } from '../store/player/player.store'
import { DialogueEffect, QuestEffect } from '../../types/dialogues/dialogue-effect.type'
import { QuestsStore } from '../store/quests/quests.store'
import { DialogueOption, DialogueResult } from '../../interfaces/dialogues/dialogue-option.type'
import { DialogueCondition } from '../../types/dialogues/dialogue-condition.type'
import { NpcID } from '../../enums/map/npc-id.enum'
import npcData, { NPCProps } from '../../data/npc-data'
import { RequirementProps } from '../../data/quests-data'
import { matchesQuestState } from './quest-status'
import { ExplorationGuildService } from './exploration-guild.service'
import { TownsStore } from '../store/towns/towns.store'

@Injectable({ providedIn: 'root' })
export class DialogueManagerService {
  private playerStore = inject(PlayerStore)
  private questStore = inject(QuestsStore)
  private guildService = inject(ExplorationGuildService)
  private townsStore = inject(TownsStore)

  private currentConversation = signal<Record<any, DialogueNode<any>> | null>(null)
  private currentNodeId = signal<any>(null)

  activeNode = computed(() => {
    const conversation = this.currentConversation()
    const id = this.currentNodeId()
    return conversation && id !== null ? conversation[id] : null
  })

  activeNpc = signal<NPCProps | null>(null)

  getActiveResult<T>(option: DialogueOption<T>): DialogueResult<T> | undefined {
    if (!option.results || option.results.length === 0) return undefined

    return option.results.find(result => {
      const questStart = result.effects?.find(
        (e): e is QuestEffect => e.type === 'quest' && e.action === 'start',
      )
      if (questStart && this.questStore.getQuestStep(questStart.questId) !== undefined) {
        return false
      }

      if (!result.visibilityConditions || result.visibilityConditions.length === 0) return true

      return result.visibilityConditions.every(condition => this.checkCondition(condition))
    })
  }

  selectOption(option: DialogueOption<any>) {
    const validResult = option.results.find(res =>
      this.checkConditions(res.visibilityConditions),
    )

    if (!validResult) {
      console.error('No valid branch found for option:', option.responseKey)
      return
    }

    if (!this.checkConditions(validResult.requirementsNeeded)) {
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
          req => this.checkRequirement(req),
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
            r => this.checkRequirement(r),
            req.step,
          ),
        )
      case 'guild': {
        const task = this.playerStore.activeTask()
        switch (c.condition) {
          case 'hasActiveTask':  return !!task && task.currentCount < task.targetCount
          case 'taskComplete':   return !!task && task.currentCount >= task.targetCount
          case 'noActiveTask':   return !task
        }
      }
      default:
        return false
    }
  }

  private checkRequirement(req: RequirementProps): boolean {
    switch (req.type) {
      case 'stat':
        const stats = this.playerStore.stats()

        return (stats[req.key] as number) >= req.amount
      case 'item':
        return this.playerStore.itemCount(req.itemId) >= req.amount
      case 'enemy':
        return this.playerStore.enemyKillCounts()[req.enemyId] >= req.amount
      case 'quest':
        const currentProgress = this.questStore.getQuestStep(req.questId)

        if (!currentProgress) return false

        return req.step !== undefined ? currentProgress === req.step : true
      case 'wave':
        return this.playerStore.getKillCountByZoneAndWave(req.zoneId, req.wave) >= req.amount
      default:
        return false
    }
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
            case 'abandonTask': {
              const task = this.playerStore.activeTask()
              if (task) this.playerStore.abandonTask(task.id)
              break
            }
            case 'claimTask': {
              const task = this.playerStore.activeTask()
              if (task) this.playerStore.claimTaskReward(task.id)
              break
            }
          }
          break
      }
    })
  }

  private openShop(shopId: number) {
    this.townsStore.openShop(shopId)
  }
}
