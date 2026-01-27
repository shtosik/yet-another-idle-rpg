import { ChangeDetectionStrategy, Component, computed, inject, Signal, signal } from '@angular/core'
import { QuestsStore } from '../../../store/quests/quests.store'
import QUEST_DATA, { QUEST_STEP_AFTER_COMPLETED } from '../../../../data/quests-data'
import { QuestID } from '../../../../enums/ids/quest-id.enum'
import { TranslatePipe } from '../../../pipes/i18next.pipe'

type QuestFilters = 'all' | 'completed' | 'started'

@Component({
  selector: 'app-quests',
  templateUrl: 'quests.component.html',
  styleUrls: ['./quests.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslatePipe,

  ],
})

export class QuestsComponent {
  protected readonly QuestID = QuestID
  protected readonly QUEST_STEP_AFTER_COMPLETED = QUEST_STEP_AFTER_COMPLETED

  questsStore = inject(QuestsStore)
  questProgression = this.questsStore.questStepProgression
  clickedQuest = signal<QuestID>(null)
  questFilters = signal<QuestFilters>('all')

  questsArray: Signal<[QuestID, number]> = computed(() => {
    return Object.entries(this.questProgression()) as any as [QuestID, number]
  })

  questDescription = computed(() => {
    const quest = this.clickedQuest()

    if (quest === null) return ''

    const questProgress = this.questProgression()[quest]

    return QUEST_DATA[quest].steps[questProgress - 1].description
  })

  setActiveDescription(questId: QuestID, step: number) {
    if (step === QUEST_STEP_AFTER_COMPLETED) return

    if (this.clickedQuest() === questId) {
      this.clickedQuest.set(null)
    } else {
      this.clickedQuest.set(questId)
    }
  }
}
