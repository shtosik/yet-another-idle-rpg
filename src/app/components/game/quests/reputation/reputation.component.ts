import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { I18nextPipe } from '../../../../pipes/i18next.pipe'
import { PlayerStore } from '../../../../store/player/player.store'
import { REPUTATION_IDS, REPUTATION_TOWN, reputationProgress } from '../../../../store/player/reputation'
import { ReputationID } from '../../../../../enums/reputation-id.enum'
import { SiteID } from '../../../../../enums/ids/site-id.enum'
import { ReputationTier } from '../../../../../enums/reputation-tier.enum'
import { DisplayNamePipe } from '../../../../pipes/display-name.pipe'

/** Reputation tab of the quest panel: tier and progress per discovered reputation, no reward lists (docs/ideas/quest-panel.md). */
@Component({
  selector: 'app-reputation',
  templateUrl: './reputation.component.html',
  styleUrl: './reputation.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DisplayNamePipe, I18nextPipe],
})
export class ReputationComponent {
  private playerStore = inject(PlayerStore)

  protected readonly ReputationID = ReputationID
  protected readonly ReputationTier = ReputationTier

  /** A town reputation shows once its town is unlocked; the Farming Guild (no town) shows once the farm is unlocked. */
  private isDiscovered(id: ReputationID): boolean {
    if (id === ReputationID.farmingGuild) return this.playerStore.isSiteUnlocked(SiteID.farm)
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
