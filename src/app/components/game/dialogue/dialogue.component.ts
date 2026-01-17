import { Component, inject } from '@angular/core'
import { DialogueManagerService } from '../../../services/dialogue-manager.service'
import { DialogueOption } from '../../../../interfaces/dialogues/dialogue-option.type'
import i18next from 'i18next'
import { NgOptimizedImage } from '@angular/common'
import { TranslatePipe } from '../../../pipes/i18next.pipe'
import { QuestID } from '../../../../enums/ids/quest-id.enum'
import { NpcID } from '../../../../enums/map/npc-id.enum'

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

  getConditionLabel(condition: any): string {
    if (condition.type === 'stat') {
      const statName = i18next.t(`app:playerStats.${condition.stat}`)
      return `${statName}: ${condition.amount}`
    }

    if (condition.type === 'questStep') {
      const questName = i18next.t(`quests:names.${QuestID[condition.questId]}`)
      return `${questName} required`
    }
    return ''
  }

  getEffectLabel(effect: any): string {
    if (effect.type === 'quest') {
      const questName = i18next.t(`quests:names.${QuestID[effect.questId]}`)
      return effect.action === 'start' ? `New Quest: ${questName}` : `Complete: ${questName}`
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

    if (!result || !result.visibilityConditions) return true

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
