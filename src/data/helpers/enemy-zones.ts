import { EnemyID } from 'enums/ids/enemy-id.enum'
import { ZoneID } from 'enums/ids/zone-id.enum'
import ZONES_DATA from 'data/zones-data'

// Reverse lookup built once at module load from ZONES_DATA.
// Includes regular enemies and boss enemies.
export const ZONES_BY_ENEMY: Partial<Record<EnemyID, ZoneID[]>> = (() => {
    const result: Partial<Record<EnemyID, ZoneID[]>> = {}
    for (const zone of Object.values(ZONES_DATA)) {
        for (const enemyId of zone.enemies) {
            (result[enemyId] ??= []).push(zone.id)
        }
        if (zone.bossEnemyId !== undefined) {
            (result[zone.bossEnemyId] ??= []).push(zone.id)
        }
    }
    return result
})()
