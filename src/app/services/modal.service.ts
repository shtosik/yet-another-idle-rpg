import { inject, Injectable } from '@angular/core'
import { MatDialog, MatDialogConfig } from '@angular/material/dialog'
import { QuestProps } from '../../data/quests-data'
import { QuestCompletedComponent } from '../components/modals/quest-completed/quest-completed.component'
import { ShopComponent } from '../components/modals/shop/shop.component'
import { ShopID } from '../../enums/ids/shop-id.enum'
import { RespecConfirmComponent } from '../components/modals/respec-confirm/respec-confirm.component'
import { UnlockNotificationComponent } from '../components/modals/unlock-notification/unlock-notification.component'
import { UnlockNotification } from '../../data/unlock-conditions'

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

  openShop(shopId: ShopID) {
    const config: MatDialogConfig = {
      panelClass: 'modal',
      minWidth: '520px',
      position: { top: '150px' },
      data: { shopId },
      disableClose: false,
    }

    return this.dialog.open(ShopComponent, config)
  }

  openQuestCompleted(data: QuestProps) {
    const config: MatDialogConfig = {
      enterAnimationDuration: '300ms',
      hasBackdrop: true,
      panelClass: 'modal',
      minWidth: '800px',
      position: { top: '250px' },
      data,
      disableClose: false,
    }

    return this.dialog.open(QuestCompletedComponent, config)
  }

  openUnlockNotification(notification: UnlockNotification) {
    return this.dialog.open(UnlockNotificationComponent, {
      enterAnimationDuration: '300ms',
      panelClass: 'modal',
      minWidth: '480px',
      position: { top: '200px' },
      hasBackdrop: true,
      disableClose: false,
      data: notification,
    })
  }

  openRespecConfirm() {
    const config: MatDialogConfig = {
      panelClass: 'modal',
      minWidth: '420px',
      position: { top: '180px' },
      hasBackdrop: true,
      disableClose: false,
    }

    return this.dialog.open(RespecConfirmComponent, config)
  }
}
