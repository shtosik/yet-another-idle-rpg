import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { DecimalPipe } from '@angular/common'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { I18nextPipe } from '../../../pipes/i18next.pipe'
import { CloseButtonComponent } from '../../shared/close-button/close-button.component'
import { SlotComponent } from '../../shared/slot/slot.component'
import { InventoryItemComponent } from '../../game/inventory/inventory-slot/inventory-slot.component'
import type { ChestContents } from '../../../store/player/chest'
import ITEM_DATA from '../../../../data/items-data'

@Component({
  selector: 'app-chest-opened',
  templateUrl: './chest-opened.component.html',
  styleUrl: './chest-opened.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [I18nextPipe, CloseButtonComponent, SlotComponent, InventoryItemComponent, DecimalPipe],
})
export class ChestOpenedComponent {
  private modalRef = inject(MatDialogRef)
  /** null: the chest didn't open (no room). */
  readonly contents = inject<ChestContents | null>(MAT_DIALOG_DATA)

  protected readonly ITEM_DATA = ITEM_DATA

  close(): void {
    this.modalRef.close()
  }
}
