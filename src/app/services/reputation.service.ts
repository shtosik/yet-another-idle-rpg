import { inject, Injectable, signal } from '@angular/core'
import i18next from 'i18next'
import { PlayerStore } from '../store/player/player.store'
import { ReputationGain } from '../store/player/reputation'
import { TownID } from '../../enums/map/town-id.enum'
import { ReputationTier } from '../../enums/reputation-tier.enum'

const TIER_UP_TOAST_MS = 4000

/** Every reputation gain goes through `gain`, so each one shows its tier-ups. */
@Injectable({ providedIn: 'root' })
export class ReputationService {
  private playerStore = inject(PlayerStore)
  private tierUpTimer?: ReturnType<typeof setTimeout>

  /** One line per town whose tier went up in the last gain, however many tiers it crossed; clears itself. */
  tierUpToast = signal<string | null>(null)

  gain(gains: ReputationGain[]): void {
    const tierUps = this.playerStore.addReputation(gains)
    if (tierUps.length === 0) return

    const lines = tierUps.map(({ townId, tier }) => i18next.t('quests:reputation.tierUp', {
      town: i18next.t(`map:towns.${TownID[townId]}`),
      tier: i18next.t(`quests:reputation.tiers.${ReputationTier[tier]}`),
    }))
    clearTimeout(this.tierUpTimer)
    this.tierUpToast.set(lines.join('\n'))
    this.tierUpTimer = setTimeout(() => this.tierUpToast.set(null), TIER_UP_TOAST_MS)
  }
}
