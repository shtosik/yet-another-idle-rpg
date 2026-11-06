import { TitleID } from '../enums/ids/title-id.enum'
import { ReputationID } from '../enums/reputation-id.enum'
import { ReputationTier } from '../enums/reputation-tier.enum'

/** How a title is earned. Reputation is the first source; achievements can add their own later. */
export type TitleSource = { type: 'reputation', reputationId: ReputationID, tier: ReputationTier }

/** Display-only names the player picks in the stats panel; they give no stats. Names: `app:titles.<TitleID key>`. */
const TITLES_DATA: Record<TitleID, TitleSource> = {
  [TitleID.laHarparFriendly]: { type: 'reputation', reputationId: ReputationID.laHarpar, tier: ReputationTier.friendly },
  [TitleID.laHarparExalted]: { type: 'reputation', reputationId: ReputationID.laHarpar, tier: ReputationTier.exalted },
  [TitleID.mawoodFriendly]: { type: 'reputation', reputationId: ReputationID.mawood, tier: ReputationTier.friendly },
  [TitleID.mawoodExalted]: { type: 'reputation', reputationId: ReputationID.mawood, tier: ReputationTier.exalted },
}

export default TITLES_DATA
