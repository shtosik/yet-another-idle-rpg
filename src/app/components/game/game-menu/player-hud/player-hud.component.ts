import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { DecimalPipe } from '@angular/common'
import { PlayerStore } from '../../../../store/player/player.store'
import { calculateXp } from '../../../../store/player/experience'
import { Currency, CurrencyChange, CurrencyFeedService } from '../../../../services/currency-feed.service'
import { AbbreviatePipe } from '../../../../pipes/abbreviate.pipe'
import { I18nextPipe } from '../../../../pipes/i18next.pipe'

interface CurrencyEntry {
  currency: Currency
  amount: number
  labelKey: string
  changes: CurrencyChange[]
}

/** Level, XP bar and currencies, shown in a strip under the navbar tabs on every tab. */
@Component({
  selector: 'app-player-hud',
  templateUrl: './player-hud.component.html',
  styleUrls: ['./player-hud.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AbbreviatePipe, DecimalPipe, I18nextPipe],
})
export class PlayerHudComponent {
  private playerStore = inject(PlayerStore)
  private feed = inject(CurrencyFeedService).changes

  protected level = this.playerStore.resources.level
  protected experience = this.playerStore.resources.experience

  protected xpForNextLevel = computed(() => calculateXp(this.level() + 1))
  protected xpPercent = computed(() => Math.min(100, (this.experience() / this.xpForNextLevel()) * 100))

  /** Explorer Tokens join once the player has earned any. */
  private showTokens = computed(() => this.playerStore.totalTasksCompleted() > 0 || this.playerStore.explorerTokens() > 0)

  protected currencies = computed<CurrencyEntry[]>(() => {
    const changes = this.feed()
    const entry = (currency: Currency, amount: number, labelKey: string): CurrencyEntry =>
      ({ currency, amount, labelKey, changes: changes.filter(c => c.currency === currency) })

    return [
      entry('gold', this.playerStore.resources.goldCoins(), 'playerStats.goldCoins'),
      ...(this.showTokens() ? [entry('explorerTokens', this.playerStore.explorerTokens(), 'hud.explorerTokens')] : []),
    ]
  })
}
