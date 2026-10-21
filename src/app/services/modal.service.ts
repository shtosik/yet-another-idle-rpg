import { inject, Injectable } from '@angular/core'
import { MatDialog, MatDialogConfig } from '@angular/material/dialog'
import { QuestProps } from '../../data/quests-data'
import { QuestCompletedComponent } from '../components/modals/quest-completed/quest-completed.component'
import { RespecConfirmComponent } from '../components/modals/respec-confirm/respec-confirm.component'
import { UnlockNotificationComponent } from '../components/modals/unlock-notification/unlock-notification.component'
import { UnlockNotification } from '../../data/unlock-conditions'
import { ItemID } from '../../enums/ids/item-id.enum'

@Injectable({ providedIn: 'root' })
export class ModalService {
  private dialog = inject(MatDialog)

  openQuestCompleted(data: QuestProps) {
    const config: MatDialogConfig = {
      enterAnimationDuration: '300ms',
      hasBackdrop: true,
      panelClass: 'modal',
      minWidth: '800px',
      position: { top: '200px' },
      data,
      disableClose: false,
    }

    return this.dialog.open(QuestCompletedComponent, config)
  }

  openUnlockNotification(notification: UnlockNotification) {
    return this.dialog.open(UnlockNotificationComponent, {
      enterAnimationDuration: '300ms',
      panelClass: 'modal',
      minWidth: '800px',
      position: { top: '200px' },
      hasBackdrop: true,
      disableClose: false,
      data: notification,
    })
  }

  openStationInstalled(itemId: ItemID) {
    const key = `unlocks:stations.${ItemID[itemId]}`
    return this.openUnlockNotification({ titleKey: `${key}.title`, bodyKey: `${key}.body` })
  }

  openRespecConfirm() {
    const config: MatDialogConfig = {
      panelClass: 'modal',
      minWidth: '800px',
      position: { top: '200px' },
      hasBackdrop: true,
      disableClose: false,
    }

    return this.dialog.open(RespecConfirmComponent, config)
  }
}
