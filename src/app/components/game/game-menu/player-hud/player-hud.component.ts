import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { DecimalPipe } from '@angular/common'
import { PlayerStore } from '../../../../store/player/player.store'
import { calculateXp } from '../../../../store/player/experience'
import { GoldFeedService } from '../../../../services/gold-feed.service'
import { AbbreviatePipe } from '../../../../pipes/abbreviate.pipe'
import { I18nextPipe } from '../../../../pipes/i18next.pipe'

/** Level, XP bar and gold, shown in the navbar on every tab. */
@Component({
  selector: 'app-player-hud',
  templateUrl: './player-hud.component.html',
  styleUrls: ['./player-hud.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AbbreviatePipe, DecimalPipe, I18nextPipe],
})
export class PlayerHudComponent {
  private playerStore = inject(PlayerStore)
  protected goldChanges = inject(GoldFeedService).changes

  protected level = this.playerStore.resources.level
  protected experience = this.playerStore.resources.experience
  protected gold = this.playerStore.resources.goldCoins

  protected xpForNextLevel = computed(() => calculateXp(this.level() + 1))
  protected xpPercent = computed(() => Math.min(100, (this.experience() / this.xpForNextLevel()) * 100))
}
