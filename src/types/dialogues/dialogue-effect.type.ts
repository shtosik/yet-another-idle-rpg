import { QuestID } from '../../enums/ids/quest-id.enum'
import { ItemID } from '../../enums/ids/item-id.enum'
import { PlayerStat } from '../player/player-stat.type'
import { NpcID } from '../../enums/map/npc-id.enum'
import { ProfessionID } from '../../enums/ids/profession-id.enum'
import { SiteID } from '../../enums/ids/site-id.enum'

export type TaskLength = 'short' | 'medium' | 'long'

export type DialogueEffect =
  | QuestEffect
  | StatEffect
  | ItemEffect
  | ShopEffect
  | ForgeEffect
  | RegisterPathfindersSealEffect
  | DialogueFlagEffect
  | GuildEffect
  | ArenaEffect
  | ReputationTurnInEffect
  | UnlockProfessionEffect
  | UnlockSiteEffect

export interface QuestEffect {
  type: 'quest'
  questId: QuestID
  action: 'start' | 'advance' | 'end'
}

export interface StatEffect {
  type: 'stat'
  action: 'award' | 'deduct'
  stats: { stat: PlayerStat, amount: number }[]
}

export interface ItemEffect {
  type: 'item'
  action: 'take' | 'give'
  items: { itemId: ItemID; amount: number }[]
}

export interface ShopEffect {
  type: 'shop'
  shopId: number
  /** Stock stage to open at (default 0): items with a higher `minStage` stay hidden. */
  stage?: number
}

/** Opens the inline Forge panel in the current town building. */
export interface ForgeEffect {
  type: 'forge'
}

/** Consumes one held Seal and permanently grants its lesson, at most once. */
export interface RegisterPathfindersSealEffect {
  type: 'registerPathfindersSeal'
}

export interface DialogueFlagEffect {
  type: 'flag'
  name: string
}

export interface GuildEffect {
  type: 'guild'
  action: 'acceptTask' | 'abandonTask' | 'claimTask'
  taskLength?: TaskLength
  /** `abandonTask`: index into `activeTasks` of the task to cancel. */
  taskIndex?: number
}

/** Hands one full bundle of `npcId`'s turn-in item (`REPUTATION_TURN_INS`) over for reputation and starts that bundle's cooldown. */
export interface ReputationTurnInEffect {
  type: 'reputationTurnIn'
  npcId: NpcID
}

/** Teaches a profession (it starts at level 1); nothing happens when it is already known. */
export interface UnlockProfessionEffect {
  type: 'unlockProfession'
  professionId: ProfessionID
}

/** Opens a Site on the world map and in the Sites list; nothing happens when it is already open. */
export interface UnlockSiteEffect {
  type: 'unlockSite'
  siteId: SiteID
}

/** Start a Combat Arena run (pair it with the entry fee's `stat` deduct), or claim the rewards waiting from clears. */
export interface ArenaEffect {
  type: 'arena'
  action: 'enter' | 'claim'
}
