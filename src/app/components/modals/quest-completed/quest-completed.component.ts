import { Component, computed, inject, signal } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { QuestProps } from '../../../../data/quests-data'
import { QuestID } from '../../../../enums/ids/quest-id.enum'
import { ReputationID } from '../../../../enums/reputation-id.enum'
import { ProfessionID } from '../../../../enums/ids/profession-id.enum'
import { I18nextPipe } from '../../../pipes/i18next.pipe'
import { InventoryItemComponent } from '../../game/inventory/inventory-slot/inventory-slot.component'
import ITEM_DATA from '../../../../data/items-data'
import { SlotComponent } from '../../shared/slot/slot.component'
import { CloseButtonComponent } from '../../shared/close-button/close-button.component'
import { TurnInCooldownService } from '../../../services/turn-in-cooldown.service'
import { orderKey } from '../../../store/quests/quests.store'
import { formatCooldown } from '../../../store/quests/turn-in-cooldown'

@Component({
  selector: 'app-quest-complete-component',
  imports: [
    I18nextPipe,
    InventoryItemComponent,
    SlotComponent,
    CloseButtonComponent,
  ],
  templateUrl: './quest-completed.component.html',
  styleUrl: './quest-completed.component.sass',
})
export class QuestCompletedComponent {
  modalRef = inject(MatDialogRef)
  data = inject<QuestProps>(MAT_DIALOG_DATA)
  questData = signal(this.data)

  private cooldowns = inject(TurnInCooldownService)

  /** "2 h 0 m" until a repeatable order can be asked for again; null for one-time quests. Read once, as the modal opens. */
  nextOrderIn = this.data.repeat ? formatCooldown(this.cooldowns.remainingMs(orderKey(this.data.questId))) : null

  itemsToDisplay = computed(() => {
    return this.questData().rewards.filter(i => i.type === 'item')
  })

  statsToDisplay = computed(() => {
    return this.questData().rewards.filter(i => i.type === 'stat')
  })

  reputationToDisplay = computed(() => {
    return this.questData().rewards.filter(i => i.type === 'reputation')
  })

  professionXpToDisplay = computed(() => {
    return this.questData().rewards.filter(i => i.type === 'professionXp')
  })

  protected readonly ProfessionID = ProfessionID
  protected readonly QuestID = QuestID
  protected readonly ReputationID = ReputationID
  protected readonly ITEM_DATA = ITEM_DATA

  close() {
    this.modalRef.close()
  }
}
