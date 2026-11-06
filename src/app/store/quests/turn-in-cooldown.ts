import { ItemID } from '../../../enums/ids/item-id.enum'
import { NpcID } from '../../../enums/map/npc-id.enum'

/**
 * One cooldown per turn-in (docs/ideas/farm-and-husbandry.md §4a): `order:<QuestID>` or `bundle:<NpcID>:<ItemID>`.
 * Typed with `number` placeholders: the enum products would be a huge literal union.
 */
export type TurnInKey = `order:${number}` | `bundle:${number}:${number}`

export const TURN_IN_COOLDOWN_MS = 2 * 60 * 60 * 1000

/** The stat can't shorten a cooldown by more than this, so it never reaches zero. */
export const MAX_TURN_IN_COOLDOWN_REDUCTION = 0.75

export const bundleKey = (npcId: NpcID, itemId: ItemID): TurnInKey => `bundle:${npcId}:${itemId}`

/**
 * Milliseconds until the turn-in is ready again; 0 when it never ran or is ready. Computed from the saved
 * start time, so a stat gained later shortens a running cooldown. A clock set back counts as no time passed.
 */
export const turnInRemainingMs = (lastTurnInAt: number | undefined, reduction: number, now: number): number => {
  if (lastTurnInAt === undefined) return 0
  const cooldown = TURN_IN_COOLDOWN_MS * (1 - Math.min(Math.max(reduction, 0), MAX_TURN_IN_COOLDOWN_REDUCTION))
  return Math.max(0, cooldown - Math.max(0, now - lastTurnInAt))
}

/** "1 h 12 m" from an hour on, "12 m 05 s" below. */
export const formatCooldown = (ms: number): string => {
  const totalSeconds = Math.ceil(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor(totalSeconds / 60) % 60
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours} h ${minutes} m`
  if (minutes > 0) return `${minutes} m ${seconds.toString().padStart(2, '0')} s`
  return `${seconds} s`
}
