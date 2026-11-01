import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { I18nextPipe } from '../../../../pipes/i18next.pipe'
import { PlayerStore } from '../../../../store/player/player.store'
import { REPUTATION_TOWNS, reputationProgress } from '../../../../store/player/reputation'
import { TownID } from '../../../../../enums/map/town-id.enum'
import { ReputationTier } from '../../../../../enums/reputation-tier.enum'

/** Reputation tab of the quest panel: tier and progress per discovered town, no reward lists (docs/ideas/quest-panel.md). */
@Component({
  selector: 'app-reputation',
  templateUrl: './reputation.component.html',
  styleUrl: './reputation.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [I18nextPipe],
})
export class ReputationComponent {
  private playerStore = inject(PlayerStore)

  protected readonly TownID = TownID
  protected readonly ReputationTier = ReputationTier

  rows = computed(() => REPUTATION_TOWNS
    .filter(townId => this.playerStore.isTownUnlocked(townId))
    .map(townId => {
      const points = this.playerStore.reputation()[townId] ?? 0
      return { townId, points, ...reputationProgress(points) }
    }))
}
