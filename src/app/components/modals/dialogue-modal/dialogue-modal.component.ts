import { ChangeDetectionStrategy, Component, EventEmitter, Input, input, Output } from '@angular/core'
import { NPCProps } from '../../../../data/npc-data'
import { DialogueType } from '../../../../data/dialogues/types'
import { CloseButtonComponent } from '../../shared/close-button/close-button.component'
import { NpcID } from '../../../../enums/map/npc-id.enum'
import { NgOptimizedImage } from '@angular/common'
import { TranslatePipe } from '../../../pipes/i18next.pipe'
import { QuestID } from '../../../../enums/ids/quest-id.enum'
import { QuestProgression } from '../../../../types/quests/quest-progression.type'
import { DialogueOption } from '../../../../interfaces/dialogues/dialogue-option.type'
import { DialogueCondition } from '../../../../types/dialogues/dialogue-condition.type'

@Component({
    selector: 'app-dialogue-modal',
    templateUrl: './dialogue-modal.component.html',
    styleUrls: ['./dialogue-modal.component.sass'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CloseButtonComponent,
        NgOptimizedImage,
        TranslatePipe,
    ],
})
export class DialogueModalComponent {
    questProgressions = input<QuestProgression>(null)

    @Input() npc: NPCProps
    @Input() dialogue: DialogueType

    @Output() close = new EventEmitter<void>()
    @Output() startQuest = new EventEmitter<QuestID>()

    currentDialogueId = 0

    protected readonly NpcID = NpcID
    protected readonly QuestID = QuestID

    handleOptionClicked(option: DialogueOption<any>): void {
        const questProgressionValue = this.questProgressions()

        if (option.alternativeDialogueNext) {
            if (option.alternativeDialogueNext.type === 'questStep') {
                if (questProgressionValue[option.alternativeDialogueNext.questId] >= option.alternativeDialogueNext.step) {
                    this.currentDialogueId = option.alternativeDialogueNext.next
                } else {
                    this.currentDialogueId = option.next
                }
            }
        } else {
            this.currentDialogueId = option.next
        }

        const effect = option.effects

        if (effect && effect.type === 'quest' && effect.action === 'start' && !questProgressionValue[effect.questId]) {
            this.startQuest.emit(effect.questId)
        }
    }

    checkIfMeetsRequirements(conditions: DialogueCondition[] = []): boolean {
        const questProgressionValue = this.questProgressions()
        let meetsRequirements = true

        conditions.forEach((condition: DialogueCondition) => {
            switch (condition.type) {
                case 'questStep':
                    if (questProgressionValue[condition.questId] < condition.step) {
                        meetsRequirements = false
                    }
                    break
                default:
                // do nothing

            }
        })

        console.log(meetsRequirements)

        return meetsRequirements
    }
}
