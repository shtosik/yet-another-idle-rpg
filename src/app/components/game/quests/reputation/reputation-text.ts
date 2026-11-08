import i18next from 'i18next'
import { ReputationID } from '../../../../../enums/reputation-id.enum'
import { ReputationTier } from '../../../../../enums/reputation-tier.enum'
import { REPUTATION_THRESHOLDS } from '../../../../store/player/reputation'
import { reputationName } from '../../../../i18n/names'

export const tierName = (tier: ReputationTier): string => i18next.t(`quests:reputation.tiers.${ReputationTier[tier]}`)

/** "Mawood Honored". Never "Rank": that is the Guild's word. */
export const reputationTierLabel = (reputationId: ReputationID, tier: ReputationTier): string =>
  i18next.t('quests:reputation.townTier', { town: reputationName(reputationId), tier: tierName(tier) })

/** "Requires Mawood Honored — 140/200", for anything locked behind a tier. */
export const reputationLockText = (reputationId: ReputationID, tier: ReputationTier, points: number): string =>
  i18next.t('quests:reputation.requires', {
    what: reputationTierLabel(reputationId, tier),
    current: points,
    target: REPUTATION_THRESHOLDS[tier],
  })
