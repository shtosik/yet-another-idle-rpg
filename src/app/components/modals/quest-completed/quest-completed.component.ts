import { Component, inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { QuestID } from '../../../../enums/ids/quest-id.enum'
import { ReputationID } from '../../../../enums/reputation-id.enum'
import { ProfessionID } from '../../../../enums/ids/profession-id.enum'
import { I18nextPipe } from '../../../pipes/i18next.pipe'
import { InventoryItemComponent } from '../../game/inventory/inventory-slot/inventory-slot.component'
import ITEM_DATA from '../../../../data/items-data'
import { SlotComponent } from '../../shared/slot/slot.component'
import { CloseButtonComponent } from '../../shared/close-button/close-button.component'
import { QuestCompleted } from '../../../store/quests/quest-transition'

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
  data = inject<QuestCompleted>(MAT_DIALOG_DATA)

  protected readonly ProfessionID = ProfessionID
  protected readonly QuestID = QuestID
  protected readonly ReputationID = ReputationID
  protected readonly ITEM_DATA = ITEM_DATA

  close() {
    this.modalRef.close()
  }
}
