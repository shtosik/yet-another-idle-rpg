import { EnemyID } from 'enums/ids/enemy-id.enum'
import { ZoneID } from 'enums/ids/zone-id.enum'
import { ItemID } from 'enums/ids/item-id.enum'

export type Zone = {
    url: string
    enemies: EnemyID[]
    maxWave: number
    enemiesPerWave: number
    bossEnemyId: EnemyID
    nextZoneId?: ZoneID
    previousZoneId?: ZoneID
    id: ZoneID
    /** Position in progression order (Horseshoe Beach 1). A side zone takes its place in the quest line (Deepwood 6, Upper Canopy 7). */
    tier: number
    /** One-time chest paid for each claimed mastery star (`src/app/store/player/zone-mastery.ts`). */
    masteryReward: ZoneMasteryReward
}

export type ZoneMasteryReward = {
    gold: number
    explorerTokens: number
    /** Resources themed on the zone's drops. */
    items: { id: ItemID, amount: number }[]
}
