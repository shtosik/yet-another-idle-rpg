import { Component, ElementRef, effect, inject, viewChild } from '@angular/core'
import { DialogueManagerService } from '../../../services/dialogue-manager.service'
import { DialogueOption } from '../../../../interfaces/dialogues/dialogue-option.type'
import i18next from 'i18next'
import { NgOptimizedImage } from '@angular/common'
import { I18nextPipe } from '../../../pipes/i18next.pipe'
import { NpcID } from '../../../../enums/map/npc-id.enum'
import { ItemID } from '../../../../enums/ids/item-id.enum'
import { EnemyID } from '../../../../enums/ids/enemy-id.enum'
import { CloseButtonComponent } from '../../shared/close-button/close-button.component'
import { PlayerStore } from '../../../store/player/player.store'
import { missingSlotsText } from '../inventory/tab-text'
import { DialogueLabel, shownBundles } from '../../../services/dialogue-effect-handlers'

@Component({
  selector: 'app-dialogue',
  imports: [
    NgOptimizedImage,
    I18nextPipe,
    CloseButtonComponent,
  ],
  templateUrl: './dialogue.component.html',
  styleUrl: './dialogue.component.sass',
})
export class DialogueComponent {
  protected dialogueService = inject(DialogueManagerService)
  private playerStore = inject(PlayerStore)
  protected readonly NpcID = NpcID

  protected activeNpc = this.dialogueService.activeNpc
  protected activeNode = this.dialogueService.activeNode
  private scroller = viewChild<ElementRef<HTMLElement>>('scroller')

  constructor() {
    // Each new message starts at its first line, wherever the last one was scrolled to.
    effect(() => {
      this.activeNode()
      this.scroller()?.nativeElement.scrollTo({ top: 0 })
    })
  }

  handleOptionClicked(option: DialogueOption<any>): void {
    this.dialogueService.selectOption(option)
  }

  /**
   * Interpolation values for a response: a task-cancel option names its monster and the kills left;
   * a turn-in names what it hands over and how many the player holds.
   */
  getResponseParams(option: DialogueOption<any>): Record<string, string | number> | undefined {
    const effects = this.dialogueService.getActiveResult(option)?.effects
    const turnInEffect = effects?.find(e => e.type === 'reputationTurnIn')
    if (turnInEffect?.type === 'reputationTurnIn') {
      const { turnIn, held, kept, bundles } = this.dialogueService.turnIn(turnInEffect)
      return {
        amount: shownBundles(bundles) * turnIn.bundleSize,
        item: i18next.t(`items:names.${ItemID[turnIn.itemId]}`),
        held,
        kept,
        // i18next picks the `_kept` key when quests hold some back.
        context: kept > 0 ? 'kept' : '',
      }
    }

    const effect = effects?.find(e => e.type === 'guild' && e.action === 'abandonTask')
    if (effect?.type !== 'guild') return undefined

    const task = this.playerStore.activeTasks()[effect.taskIndex ?? 0]
    if (!task) return undefined
    return {
      monster: i18next.t(`enemies:names.${EnemyID[task.monsterId]}`),
      left: task.targetCount - task.currentCount,
    }
  }

  /** The tag text from a condition or effect handler's label parts; empty for no tag. */
  tag(labels: DialogueLabel[]): string {
    return labels.map(label => i18next.t(label.key, label.params)).join(', ')
  }

  isOptionVisible(option: DialogueOption<any>): boolean {
    return this.dialogueService.getActiveResult(option) !== undefined
  }

  isOptionDisabled(option: DialogueOption<any>): boolean {
    const result = this.dialogueService.getActiveResult(option)
    if (!result) return false
    if (!this.dialogueService.canApplyResult(result)) return true
    if (!result.requirementsNeeded) return false
    return !result.requirementsNeeded.every(req => this.dialogueService.checkCondition(req))
  }

  /** "1 Materials slot" etc.; empty when the rewards fit. */
  missingSlots(option: DialogueOption<any>): string {
    return missingSlotsText(this.dialogueService.missingSlots(this.dialogueService.getActiveResult(option)))
  }

  missingGold(option: DialogueOption<any>): number {
    return this.dialogueService.missingGold(this.dialogueService.getActiveResult(option))
  }
}
