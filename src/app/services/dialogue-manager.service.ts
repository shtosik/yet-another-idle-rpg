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
import QUEST_DATA, { QUEST_STEP_AFTER_COMPLETED, RequirementProps } from '../../data/quests-data'

@Injectable({ providedIn: 'root' })
export class DialogueManagerService {
  private playerStore = inject(PlayerStore)
  private questStore = inject(QuestsStore)

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

    const hasMet = this.questStore.dialogueFlags()[`met_${npcId}`]
    const startId = hasMet ? 0 : 1

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
        const stats = this.playerStore.stats()
        const val = stats[c.key as keyof typeof stats]

        return c.comparison === 'gte' ? (val as number) >= c.amount : (val as number) <= c.amount
      case 'quest':
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
          default:
            return true
        }
      default:
        return true
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
          this.playerStore.updatePlayerStats(effect.stats)
          break
        case 'quest':
          switch (effect.action) {
            case 'start':
              this.questStore.startQuest(effect.questId)
              break
            case 'advance':
              this.questStore.advanceQuest(effect.questId)
              break
          }
          break
        case 'shop':
          this.openShop(effect.shopId)
          break
        case 'flag':
          console.log('test')
          this.questStore.setDialogueFlag(effect.name)
          break
      }
    })
  }

  private openShop(shopId: number) {
    // Logic to trigger your Shop Component/Store
    console.log('Opening shop:', shopId)
  }
}
