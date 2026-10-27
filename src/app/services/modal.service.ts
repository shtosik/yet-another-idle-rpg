import { ChestOpenedComponent } from '../components/modals/chest-opened/chest-opened.component'
import type { ChestContents } from '../store/player/chest'
import { inject, Injectable } from '@angular/core'
import { MatDialog, MatDialogConfig } from '@angular/material/dialog'
import { QuestProps } from '../../data/quests-data'
import { QuestCompletedComponent } from '../components/modals/quest-completed/quest-completed.component'
import { RespecConfirmComponent } from '../components/modals/respec-confirm/respec-confirm.component'
import { UnlockNotificationComponent } from '../components/modals/unlock-notification/unlock-notification.component'
import { UnlockNotification } from '../../data/unlock-conditions'
import { ItemID } from '../../enums/ids/item-id.enum'
import { WelcomeBackComponent } from '../components/modals/welcome-back/welcome-back.component'
import type { OfflineSummary } from './offline-progress.service'
import { ArenaResultComponent } from '../components/modals/arena-result/arena-result.component'
import type { ArenaResult } from './arena.service'

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

  openWelcomeBack(summary: OfflineSummary) {
    return this.dialog.open(WelcomeBackComponent, {
      enterAnimationDuration: '300ms',
      panelClass: 'modal',
      minWidth: '800px',
      position: { top: '200px' },
      hasBackdrop: true,
      disableClose: false,
      data: summary,
    })
  }

  openArenaResult(result: ArenaResult) {
    return this.dialog.open(ArenaResultComponent, {
      enterAnimationDuration: '300ms',
      panelClass: 'modal',
      minWidth: '800px',
      position: { top: '200px' },
      hasBackdrop: true,
      disableClose: false,
      data: result,
    })
  }

  /** The contents of an opened chest, or (null) why it didn't open. */
  openChestOpened(data: { contents: ChestContents | null, slotsNeeded: number }) {
    return this.dialog.open(ChestOpenedComponent, {
      enterAnimationDuration: '300ms',
      panelClass: 'modal',
      minWidth: '600px',
      position: { top: '200px' },
      hasBackdrop: true,
      disableClose: false,
      data,
    })
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

  /** Loaded on demand: the component carries the whole CHANGELOG.md text. */
  async openChangelog() {
    const { ChangelogComponent } = await import('../components/modals/changelog/changelog.component')
    return this.dialog.open(ChangelogComponent, {
      panelClass: 'modal',
      minWidth: '800px',
      position: { top: '120px' },
      hasBackdrop: true,
      disableClose: false,
    })
  }
}
