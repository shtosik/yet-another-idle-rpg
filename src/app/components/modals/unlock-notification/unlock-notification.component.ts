import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { TranslatePipe } from '../../../pipes/i18next.pipe'
import { CloseButtonComponent } from '../../shared/close-button/close-button.component'
import { UnlockNotification } from '../../../../data/unlock-conditions'

@Component({
  selector: 'app-unlock-notification',
  templateUrl: './unlock-notification.component.html',
  styleUrl: './unlock-notification.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, CloseButtonComponent],
})
export class UnlockNotificationComponent {
  modalRef = inject(MatDialogRef)
  data = inject<UnlockNotification>(MAT_DIALOG_DATA)

  close(): void {
    this.modalRef.close()
  }
}
