import i18next from 'i18next'
import { TownID } from '../../../../../enums/map/town-id.enum'
import { ReputationTier } from '../../../../../enums/reputation-tier.enum'
import { REPUTATION_THRESHOLDS } from '../../../../store/player/reputation'

export const tierName = (tier: ReputationTier): string => i18next.t(`quests:reputation.tiers.${ReputationTier[tier]}`)

/** "Mawood Honored". Never "Rank": that is the Guild's word. */
export const reputationTierLabel = (townId: TownID, tier: ReputationTier): string =>
  i18next.t('quests:reputation.townTier', { town: i18next.t(`map:towns.${TownID[townId]}`), tier: tierName(tier) })

/** "Requires Mawood Honored — 140/200", for anything locked behind a tier. */
export const reputationLockText = (townId: TownID, tier: ReputationTier, points: number): string =>
  i18next.t('quests:reputation.requires', {
    what: reputationTierLabel(townId, tier),
    current: points,
    target: REPUTATION_THRESHOLDS[tier],
  })
