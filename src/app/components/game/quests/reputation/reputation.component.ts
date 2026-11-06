import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { I18nextPipe } from '../../../../pipes/i18next.pipe'
import { PlayerStore } from '../../../../store/player/player.store'
import { REPUTATION_IDS, REPUTATION_TOWN, reputationProgress } from '../../../../store/player/reputation'
import { ReputationID } from '../../../../../enums/reputation-id.enum'
import { ReputationTier } from '../../../../../enums/reputation-tier.enum'

/** Reputation tab of the quest panel: tier and progress per discovered reputation, no reward lists (docs/ideas/quest-panel.md). */
@Component({
  selector: 'app-reputation',
  templateUrl: './reputation.component.html',
  styleUrl: './reputation.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [I18nextPipe],
})
export class ReputationComponent {
  private playerStore = inject(PlayerStore)

  protected readonly ReputationID = ReputationID
  protected readonly ReputationTier = ReputationTier

  /** A town reputation shows once its town is unlocked; one with no town (the Farming Guild) shows once it is in `REPUTATION_IDS` and gets its own rule when its Site exists. */
  private isDiscovered(id: ReputationID): boolean {
    const townId = REPUTATION_TOWN[id]
    return townId === undefined || this.playerStore.isTownUnlocked(townId)
  }

  rows = computed(() => REPUTATION_IDS
    .filter(id => this.isDiscovered(id))
    .map(reputationId => {
      const points = this.playerStore.reputation()[reputationId] ?? 0
      return { reputationId, points, ...reputationProgress(points) }
    }))
}
