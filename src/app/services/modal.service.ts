import { inject, Injectable } from '@angular/core'
import { MatDialog, MatDialogConfig } from '@angular/material/dialog'
import { QuestProps } from '../../data/quests-data'
import { QuestCompletedComponent } from '../components/modals/quest-completed/quest-completed.component'

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

  openQuestCompleted(data: QuestProps) {
    const config: MatDialogConfig = {
      minWidth: '800px',
      position: { top: '250px' },
      data,
      disableClose: false,
    }

    return this.dialog.open(QuestCompletedComponent, config)
  }
}
