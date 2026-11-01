import { TitleID } from '../enums/ids/title-id.enum'
import { TownID } from '../enums/map/town-id.enum'
import { ReputationTier } from '../enums/reputation-tier.enum'

/** How a title is earned. Reputation is the first source; achievements can add their own later. */
export type TitleSource = { type: 'reputation', townId: TownID, tier: ReputationTier }

/** Display-only names the player picks in the stats panel; they give no stats. Names: `app:titles.<TitleID key>`. */
const TITLES_DATA: Record<TitleID, TitleSource> = {
  [TitleID.laHarparFriendly]: { type: 'reputation', townId: TownID.laHarpar, tier: ReputationTier.friendly },
  [TitleID.laHarparExalted]: { type: 'reputation', townId: TownID.laHarpar, tier: ReputationTier.exalted },
  [TitleID.mawoodFriendly]: { type: 'reputation', townId: TownID.mawood, tier: ReputationTier.friendly },
  [TitleID.mawoodExalted]: { type: 'reputation', townId: TownID.mawood, tier: ReputationTier.exalted },
}

export default TITLES_DATA
