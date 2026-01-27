import { Component, computed, inject, signal } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { QuestProps } from '../../../../data/quests-data'
import { QuestID } from '../../../../enums/ids/quest-id.enum'
import { TranslatePipe } from '../../../pipes/i18next.pipe'
import { InventoryItemComponent } from '../../game/inventory/inventory-slot/inventory-slot.component'
import ITEM_DATA from '../../../../data/items-data'
import { SlotComponent } from '../../shared/slot/slot.component'
import { CloseButtonComponent } from '../../shared/close-button/close-button.component'

@Component({
  selector: 'app-quest-complete-component',
  imports: [
    TranslatePipe,
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

  itemsToDisplay = computed(() => {
    return this.questData().rewards.filter(i => i.type === 'item')
  })

  statsToDisplay = computed(() => {
    return this.questData().rewards.filter(i => i.type === 'stat')
  })

  protected readonly QuestID = QuestID
  protected readonly ITEM_DATA = ITEM_DATA

  close() {
    this.modalRef.close()
  }
}
