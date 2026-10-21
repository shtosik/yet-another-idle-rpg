import { ItemID } from 'enums/ids/item-id.enum'
import { PlayerStat } from 'types/player/player-stat.type'

export type ConsumableSlot = 'food' | 'potion'

export const CONSUMABLE_SLOTS: readonly ConsumableSlot[] = ['food', 'potion']

export interface ConsumableStat {
    stat: PlayerStat
    amount: number
}

/** Durations are in seconds. Using the item locks its slot for `cooldown`; the effect can never outlast the lock. */
export interface ConsumableEffect {
    slot: ConsumableSlot
    cooldown: number
    duration?: number
    stats?: ConsumableStat[]
    manaRestore?: number
}

export interface ActiveConsumable {
    itemId: ItemID
    effectRemaining: number
    lockRemaining: number
    // Snapshot of what was applied, reverted exactly on expiry.
    stats: ConsumableStat[]
}
