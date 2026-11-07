import { NgOptimizedImage } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core'
import ITEM_DATA from '../../../../../data/items-data'
import { ItemID } from '../../../../../enums/ids/item-id.enum'
import { I18nextPipe } from '../../../../pipes/i18next.pipe'
import { FarmService } from '../../../../services/farm.service'
import { GameNavigationService } from '../../../../services/game-navigation.service'
import { readyPlotCount } from '../../../../store/player/farm'
import { PlayerStore } from '../../../../store/player/player.store'

interface ClaimNotification {
  /** Picks the colour (`.notification--<kind>`) and the text (`hud.notifications.<kind>`). */
  kind: 'harvest'
  count: number
  icon: string
  open: () => void
}

/** Everything the player can claim right now, under the HUD. Its height is reserved, so the game never shifts. */
@Component({
  selector: 'app-notification-bar',
  templateUrl: './notification-bar.component.html',
  styleUrl: './notification-bar.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, I18nextPipe],
})
export class NotificationBarComponent {
  private playerStore = inject(PlayerStore)
  private farmService = inject(FarmService)
  private navigation = inject(GameNavigationService)

  /** Plots ripen on the clock with no store change to react to. */
  private now = signal(Date.now())

  private readyPlots = computed(() => readyPlotCount(
    this.playerStore.farm().plots.slice(0, this.farmService.plotLimit()),
    this.now(),
    this.playerStore.stats().seedGrowthTimeReduction,
  ))

  protected notifications = computed<ClaimNotification[]>(() => {
    const count = this.readyPlots()
    if (count === 0) return []
    return [{ kind: 'harvest', count, icon: ITEM_DATA[ItemID.turnip].url, open: () => this.navigation.openFarmPlots() }]
  })

  constructor() {
    const timer = setInterval(() => this.now.set(Date.now()), 1000)
    inject(DestroyRef).onDestroy(() => clearInterval(timer))
  }
}
