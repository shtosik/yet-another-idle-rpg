import { Component, inject } from '@angular/core'
import { DialogueManagerService } from '../../../services/dialogue-manager.service'
import { DialogueOption } from '../../../../interfaces/dialogues/dialogue-option.type'
import i18next from 'i18next'
import { NgOptimizedImage } from '@angular/common'
import { TranslatePipe } from '../../../pipes/i18next.pipe'
import { QuestID } from '../../../../enums/ids/quest-id.enum'
import { NpcID } from '../../../../enums/map/npc-id.enum'
import { ItemID } from '../../../../enums/ids/item-id.enum'
import { DialogueEffect } from '../../../../types/dialogues/dialogue-effect.type'
import { DialogueCondition } from '../../../../types/dialogues/dialogue-condition.type'
import { ZoneID } from '../../../../enums/ids/zone-id.enum'

@Component({
  selector: 'app-dialogue',
  imports: [
    NgOptimizedImage,
    TranslatePipe,
  ],
  templateUrl: './dialogue.component.html',
  styleUrl: './dialogue.component.sass',
})
export class DialogueComponent {
  private dialogueService = inject(DialogueManagerService)
  protected readonly NpcID = NpcID
  protected readonly QuestID = QuestID

  protected activeNpc = this.dialogueService.activeNpc
  protected activeNode = this.dialogueService.activeNode

  handleOptionClicked(option: DialogueOption<any>): void {
    this.dialogueService.selectOption(option)
  }

  getActiveResult(option: DialogueOption<any>) {
    return option.results.find(res =>
      this.dialogueService.checkConditions(res.visibilityConditions),
    )
  }

  getConditionLabel(condition: DialogueCondition): string {
    if (condition.type === 'stat') {
      const statName = i18next.t(`app:playerStats.${condition.key}`)
      return `${statName}: ${condition.amount}`
    }

    if (condition.type === 'quest') {
      const questName = i18next.t(`quests:names.${QuestID[condition.questId]}`)
      const required = i18next.t('required')
      return `${questName} ${required}`
    }

    if (condition.type === 'item') {
      const itemName = i18next.t(`items:names.${ItemID[condition.itemId]}`)

      return `${itemName}: ${condition.amount}`
    }

    if (condition.type === 'waveKillCount') {
      const zone = i18next.t(`zones:names.${ZoneID[condition.zoneId]}`)

      return i18next.t('quests:requirements.waveKillCount', {
        amount: condition.amount,
        wave: condition.waveNumber,
        zone,
      })
    }

    return ''
  }

  getEffectLabel(effect: DialogueEffect): string {
    if (effect.type === 'quest' && effect.action === 'start') {
      const questName = i18next.t(`quests:names.${QuestID[effect.questId]}`)
      return `New Quest: ${questName}`
    }

    if (effect.type === 'stat' && effect.stats) {
      return effect.stats.map((s: any) => {
        const name = i18next.t(`app:playerStats.${s.stat}`)
        return `${s.amount > 0 ? '+' : ''}${s.amount} ${name}`
      }).join(', ')
    }

    return ''
  }

  isOptionVisible(option: DialogueOption<any>): boolean {
    const result = this.dialogueService.getActiveResult(option)

    if (!result) return false

    if (!result.visibilityConditions) return true

    return result.visibilityConditions.every(cond =>
      this.dialogueService.checkCondition(cond),
    )
  }

  isOptionDisabled(option: DialogueOption<any>): boolean {
    const result = this.dialogueService.getActiveResult(option)
    if (!result || !result.requirementsNeeded) return false

    // Returns true (disabled) if ANY requirement is not met
    return !result.requirementsNeeded.every(req =>
      this.dialogueService.checkCondition(req),
    )
  }
}
