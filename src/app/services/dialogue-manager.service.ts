import { DialogueNode } from '../../interfaces/dialogues/dialogue-node.interface'
import { computed, inject, Injectable, signal } from '@angular/core'
import { PlayerStore } from '../store/player/player.store'
import { DialogueEffect } from '../../types/dialogues/dialogue-effect.type'
import { QuestsStore } from '../store/quests/quests.store'
import { DialogueOption, DialogueResult } from '../../interfaces/dialogues/dialogue-option.type'
import { DialogueCondition } from '../../types/dialogues/dialogue-condition.type'
import { NpcID } from '../../enums/map/npc-id.enum'
import npcData, { NPCProps } from '../../data/npc-data'
import { QuestState } from '../../enums/quest-state.enum'
import QUEST_DATA, {
  QUEST_STEP_AFTER_COMPLETED,
  QUEST_STEP_AFTER_FAILED,
  RequirementProps,
} from '../../data/quests-data'
import ITEM_DATA from '../../data/items-data'
import { InventoryItem } from '../../interfaces/item.interface'
import { ExplorationGuildService } from './exploration-guild.service'

@Injectable({ providedIn: 'root' })
export class DialogueManagerService {
  private playerStore = inject(PlayerStore)
  private questStore = inject(QuestsStore)
  private guildService = inject(ExplorationGuildService)

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
      case 'quest': {
        const questData = QUEST_DATA[c.questId]
        const currentProgress = this.questStore.getQuestStep(c.questId)

        switch (c.questState) {
          case QuestState.active:
            if (!currentProgress || currentProgress === QUEST_STEP_AFTER_COMPLETED) return false

            if (c.step !== undefined && currentProgress !== c.step) return false

            const currentStep = this.questStore.getQuestStepData(c.questId, currentProgress)

            if (!currentStep.requirements) return true

            return currentStep.requirements.every(req => this.checkRequirement(req))
          case QuestState.available:
            if (currentProgress) return false

            return questData.startRequirements.every(req => this.checkRequirement(req))

          case QuestState.completed:
            return currentProgress === QUEST_STEP_AFTER_COMPLETED
          case QuestState.failed:
            return currentProgress === QUEST_STEP_AFTER_FAILED
          default:
            return false
        }
      }
      case 'item': {
        const item = this.playerStore.inventory().find(i => i.id === c.itemId)
        return !!item && item.amount >= c.amount
      }
      case 'manyItems':
        return c.itemIds.every(itemId => {
          const required = c.amounts[itemId] ?? 1
          const item = this.playerStore.inventory().find(i => i.id === itemId)
          return !!item && item.amount >= required
        })
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
        return c.questsRequired.every(req => {
          const progress = this.questStore.getQuestStep(req.questId)
          switch (req.questState) {
            case QuestState.active:
              if (!progress || progress === QUEST_STEP_AFTER_COMPLETED) return false
              return req.step === undefined || progress === req.step
            case QuestState.available:
              if (progress) return false
              return QUEST_DATA[req.questId].startRequirements.every(r => this.checkRequirement(r))
            case QuestState.completed:
              return progress === QUEST_STEP_AFTER_COMPLETED
            case QuestState.failed:
              return progress === QUEST_STEP_AFTER_FAILED
            default:
              return false
          }
        })
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
        const item = this.playerStore.inventory().find(i => i.id === req.itemId)

        return item && item.amount >= req.amount
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
            case 'fail':
              this.questStore.failQuest(effect.questId)
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
            this.playerStore.removeItemsFromInventory(effect.items.map(i => ({ id: i.itemId, amount: i.amount })))
          } else if (effect.action === 'give') {
            const itemsToUpdate: InventoryItem[] = effect.items.map(i => {
              const itemData = ITEM_DATA[i.itemId]
              return { id: i.itemId, amount: i.amount, type: itemData.type, tier: itemData.tier }
            })
            this.playerStore.updatePlayerInventory(itemsToUpdate)
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
    // Logic to trigger your Shop Component/Store
    console.log('Opening shop:', shopId)
  }
}
