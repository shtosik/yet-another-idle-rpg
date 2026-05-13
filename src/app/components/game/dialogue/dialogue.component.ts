import { Component, inject } from '@angular/core'
import { DialogueManagerService } from '../../../services/dialogue-manager.service'
import { DialogueOption } from '../../../../interfaces/dialogues/dialogue-option.type'
import i18next from 'i18next'
import { NgOptimizedImage } from '@angular/common'
import { TranslatePipe } from '../../../pipes/i18next.pipe'
import { QuestID } from '../../../../enums/ids/quest-id.enum'
import { NpcID } from '../../../../enums/map/npc-id.enum'
import { ItemID } from '../../../../enums/ids/item-id.enum'
import { EnemyID } from '../../../../enums/ids/enemy-id.enum'
import { DialogueEffect } from '../../../../types/dialogues/dialogue-effect.type'
import { DialogueCondition } from '../../../../types/dialogues/dialogue-condition.type'
import { ZoneID } from '../../../../enums/ids/zone-id.enum'
import { CloseButtonComponent } from '../../shared/close-button/close-button.component'

@Component({
  selector: 'app-dialogue',
  imports: [
    NgOptimizedImage,
    TranslatePipe,
    CloseButtonComponent,
  ],
  templateUrl: './dialogue.component.html',
  styleUrl: './dialogue.component.sass',
})
export class DialogueComponent {
  protected dialogueService = inject(DialogueManagerService)
  protected readonly NpcID = NpcID
  protected readonly QuestID = QuestID

  protected activeNpc = this.dialogueService.activeNpc
  protected activeNode = this.dialogueService.activeNode

  handleOptionClicked(option: DialogueOption<any>): void {
    this.dialogueService.selectOption(option)
  }

  getConditionLabel(condition: DialogueCondition): string {
    switch (condition.type) {
      case 'stat': {
        const statName = i18next.t(`app:playerStats.${condition.stat}`)
        return `${statName}: ${condition.amount}`
      }
      case 'quest': {
        const questName = i18next.t(`quests:names.${QuestID[condition.questId]}`)
        return `${questName} required`
      }
      case 'item': {
        const itemName = i18next.t(`items:names.${ItemID[condition.itemId]}`)
        return `${itemName}: ${condition.amount}`
      }
      case 'killCount': {
        const enemyName = i18next.t(`enemies:names.${EnemyID[condition.enemyId]}`)
        return `Kill ${condition.amount}x ${enemyName}`
      }
      case 'waveKillCount': {
        const zone = i18next.t(`zones:names.${ZoneID[condition.zoneId]}`)
        return i18next.t('quests:requirements.waveKillCount', {
          amount: condition.amount,
          wave: condition.waveNumber,
          zone,
        })
      }
      case 'guild':
        switch (condition.condition) {
          case 'hasActiveTask': return 'Active task in progress'
          case 'taskComplete':  return 'Task complete'
          case 'noActiveTask':  return 'No active task'
        }
      default:
        return ''
    }
  }

  getEffectLabel(effect: DialogueEffect): string {
    switch (effect.type) {
      case 'quest': {
        const questName = i18next.t(`quests:names.${QuestID[effect.questId]}`)
        switch (effect.action) {
          case 'start':   return `New Quest: ${questName}`
          case 'advance': return `Progress: ${questName}`
          case 'end':     return `Complete: ${questName}`
          case 'fail':    return `Fail: ${questName}`
        }
      }
      case 'stat':
        return effect.stats.map(s => {
          const name = i18next.t(`app:playerStats.${s.stat}`)
          const sign = effect.action === 'deduct' ? '-' : '+'
          return `${sign}${s.amount} ${name}`
        }).join(', ')
      case 'item':
        return effect.items.map(i => {
          const name = i18next.t(`items:names.${ItemID[i.itemId]}`)
          const sign = effect.action === 'give' ? '+' : '-'
          return `${sign}${i.amount} ${name}`
        }).join(', ')
      case 'shop':
        return 'Open Shop'
      case 'guild':
        switch (effect.action) {
          case 'acceptTask': return `Take task: ${effect.taskLength}`
          case 'claimTask':  return 'Claim reward'
          case 'abandonTask': return 'Cancel task'
        }
      default:
        return ''
    }
  }

  isOptionVisible(option: DialogueOption<any>): boolean {
    const result = this.dialogueService.getActiveResult(option)
    if (!result) return false
    if (!result.visibilityConditions) return true
    return result.visibilityConditions.every(cond => this.dialogueService.checkCondition(cond))
  }

  isOptionDisabled(option: DialogueOption<any>): boolean {
    const result = this.dialogueService.getActiveResult(option)
    if (!result || !result.requirementsNeeded) return false
    return !result.requirementsNeeded.every(req => this.dialogueService.checkCondition(req))
  }
}
