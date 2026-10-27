import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { TooltipTemplateDirective } from 'ngx-tooltip-directives'
import { I18nextPipe } from 'app/pipes/i18next.pipe'
import { BattleStore } from 'app/store/battle/battle.store'
import { PlayerStore } from 'app/store/player/player.store'
import { ZoneStar, ZoneStarProgress } from 'app/store/player/zone-mastery'
import { ItemID } from 'enums/ids/item-id.enum'
import ZONES_DATA from 'data/zones-data'

/** The current zone's three mastery stars; a finished star is clicked to claim its chest. */
@Component({
  selector: 'app-zone-mastery',
  templateUrl: './zone-mastery.component.html',
  styleUrls: ['./zone-mastery.component.sass'],
  imports: [I18nextPipe, TooltipTemplateDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneMasteryComponent {
  private battleStore = inject(BattleStore)
  private playerStore = inject(PlayerStore)

  readonly ItemID = ItemID

  stars = computed<ZoneStarProgress[]>(() => this.playerStore.zoneMastery()[this.battleStore.currentZoneId()])
  reward = computed(() => ZONES_DATA[this.battleStore.currentZoneId()].masteryReward)
  /** Shinies only spawn once something raises `shinyChance` (the Shiny Hunter skill), as in the bestiary. */
  shiniesUnlocked = computed(() => this.playerStore.stats().shinyChance > 0)

  canClaim(star: ZoneStar): boolean {
    return this.playerStore.canClaimZoneStar(this.battleStore.currentZoneId(), star)
  }

  /** Finished and unclaimed but refused: the chest's items don't fit. */
  isBlocked(progress: ZoneStarProgress): boolean {
    return progress.done && !progress.claimed && !this.canClaim(progress.star)
  }

  /** The shiny star can't progress until shinies spawn. */
  isLocked(progress: ZoneStarProgress): boolean {
    return progress.star === 'shiny' && !progress.done && !this.shiniesUnlocked()
  }

  claim(star: ZoneStar): void {
    this.playerStore.claimZoneStar(this.battleStore.currentZoneId(), star)
  }
}
