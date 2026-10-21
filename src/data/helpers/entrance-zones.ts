import { QuestID } from 'enums/ids/quest-id.enum'
import { ZoneID } from 'enums/ids/zone-id.enum'
import TOWNS_DATA from 'data/towns-data'

// Zones entered from a town building open when the building's quest starts.
// Built once at module load from TOWNS_DATA.
export const ENTRANCE_ZONES_BY_QUEST: Partial<Record<QuestID, ZoneID[]>> = (() => {
    const result: Partial<Record<QuestID, ZoneID[]>> = {}
    for (const town of Object.values(TOWNS_DATA)) {
        for (const building of town.buildings) {
            if (building.zoneId === undefined || building.questRequirement === undefined) continue
            (result[building.questRequirement] ??= []).push(building.zoneId)
        }
    }
    return result
})()
