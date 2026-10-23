import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { DecimalPipe } from '@angular/common'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { I18nextPipe } from '../../../pipes/i18next.pipe'
import { CloseButtonComponent } from '../../shared/close-button/close-button.component'
import { SlotComponent } from '../../shared/slot/slot.component'
import { InventoryItemComponent } from '../../game/inventory/inventory-slot/inventory-slot.component'
import type { OfflineSummary } from '../../../services/offline-progress.service'
import ITEM_DATA from '../../../../data/items-data'

const MS_PER_MINUTE = 60 * 1000

@Component({
  selector: 'app-welcome-back',
  templateUrl: './welcome-back.component.html',
  styleUrl: './welcome-back.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [I18nextPipe, CloseButtonComponent, SlotComponent, InventoryItemComponent, DecimalPipe],
})
export class WelcomeBackComponent {
  private modalRef = inject(MatDialogRef)
  readonly summary = inject<OfflineSummary>(MAT_DIALOG_DATA)

  readonly hours = Math.floor(this.summary.elapsedMs / (60 * MS_PER_MINUTE))
  readonly minutes = Math.floor(this.summary.elapsedMs / MS_PER_MINUTE) % 60

  protected readonly ITEM_DATA = ITEM_DATA

  close(): void {
    this.modalRef.close()
  }
}
