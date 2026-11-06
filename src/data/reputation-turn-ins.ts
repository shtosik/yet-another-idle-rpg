import { ItemID } from '../enums/ids/item-id.enum'
import { NpcID } from '../enums/map/npc-id.enum'
import { ReputationID } from '../enums/reputation-id.enum'

/** A town NPC who takes bundles of one drop for reputation, at a flat rate with no limit. */
export interface ReputationTurnIn {
  npcId: NpcID
  reputationId: ReputationID
  itemId: ItemID
  bundleSize: number
  /** Reputation per bundle. */
  reputation: number
}

/** Used by the givers' `reputationTurnIn` dialogue effects and the economy sim (docs/ideas/town-reputation.md). */
export const REPUTATION_TURN_INS: ReputationTurnIn[] = [
  { npcId: NpcID.laHarparBartender, reputationId: ReputationID.laHarpar, itemId: ItemID.crabMeat, bundleSize: 20, reputation: 10 },
  { npcId: NpcID.laHarparJosh, reputationId: ReputationID.laHarpar, itemId: ItemID.feather, bundleSize: 20, reputation: 10 },
  { npcId: NpcID.mawoodSylvie, reputationId: ReputationID.mawood, itemId: ItemID.spiderSilk, bundleSize: 15, reputation: 15 },
  { npcId: NpcID.mawoodBrenn, reputationId: ReputationID.mawood, itemId: ItemID.ancientWood, bundleSize: 10, reputation: 25 },
]

export const turnInFor = (npcId: NpcID): ReputationTurnIn | undefined =>
  REPUTATION_TURN_INS.find(turnIn => turnIn.npcId === npcId)

/** Full bundles handed over: `one` or every full bundle held; 0 when not even one is held. */
export const turnInBundles = (turnIn: ReputationTurnIn, held: number, bundles: 'one' | 'all'): number => {
  const full = Math.floor(held / turnIn.bundleSize)
  return bundles === 'one' ? Math.min(full, 1) : full
}
