import { NgOptimizedImage } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core'
import ITEM_DATA from '../../../../../data/items-data'
import { ItemID } from '../../../../../enums/ids/item-id.enum'
import { I18nextPipe } from '../../../../pipes/i18next.pipe'
import { FarmService } from '../../../../services/farm.service'
import { GameNavigationService } from '../../../../services/game-navigation.service'
import { VersionCheckService } from '../../../../services/version-check.service'
import { APP_VERSION } from '../../../../version'

interface BarNotification {
  /** Picks the colour (`.notification--<kind>`). */
  kind: 'harvest' | 'update' | 'updateSaveFailed'
  text: string
  params?: Record<string, unknown>
  icon: string
  /** What a click does, shown after the text when `open` isn't obvious from it. */
  action?: string
  open: () => void
}

/** Everything the player can claim or act on right now, under the HUD. Its height is reserved, so the game never shifts. */
@Component({
  selector: 'app-notification-bar',
  templateUrl: './notification-bar.component.html',
  styleUrl: './notification-bar.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, I18nextPipe],
})
export class NotificationBarComponent {
  private farmService = inject(FarmService)
  private navigation = inject(GameNavigationService)
  private versionCheck = inject(VersionCheckService)

  /** The last reload stopped because its save failed; the game keeps running and the save keeps retrying. */
  private saveFailed = signal(false)

  /** Plots ripen on the clock with no store change to react to. */
  private now = signal(Date.now())

  private readyPlots = computed(() => this.farmService.readyPlotCount(this.now()))

  protected notifications = computed<BarNotification[]>(() => {
    const harvest = this.harvestNotification()
    const update = this.updateNotification()
    return [...(harvest ? [harvest] : []), ...(update ? [update] : [])]
  })

  constructor() {
    const timer = setInterval(() => this.now.set(Date.now()), 1000)
    inject(DestroyRef).onDestroy(() => clearInterval(timer))
  }

  private harvestNotification(): BarNotification | null {
    const count = this.readyPlots()
    if (count === 0) return null
    return { kind: 'harvest', text: 'hud.notifications.harvest', params: { count }, icon: ITEM_DATA[ItemID.turnip].url, open: () => this.navigation.openFarmPlots() }
  }

  private updateNotification(): BarNotification | null {
    const update = this.versionCheck.available()
    if (!update) return null
    const reload = { icon: './assets/img/icons/reload.svg', action: 'app:update.reload', open: () => this.saveFailed.set(!this.versionCheck.reload()) }
    if (this.saveFailed()) return { kind: 'updateSaveFailed', text: 'app:update.saveFailed', ...reload }
    if (update.version === APP_VERSION) return { kind: 'update', text: 'app:update.newBuild', ...reload }
    return { kind: 'update', text: 'app:update.newVersion', params: { version: update.version }, ...reload }
  }
}
