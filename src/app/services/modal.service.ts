import { inject, Injectable } from '@angular/core'
import { MatDialog, MatDialogConfig } from '@angular/material/dialog'

@Injectable({ providedIn: 'root' })
export class ModalService {
  private dialog = inject(MatDialog)

  openDialogue() {
    const config: MatDialogConfig = {
      minWidth: '800px',
      position: { top: '250px' },
      disableClose: false,
    }

    // return this.dialog.open(DialogueModalComponent, config)
  }
}
