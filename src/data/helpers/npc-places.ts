import { NpcID } from 'enums/map/npc-id.enum'
import { TownID } from 'enums/map/town-id.enum'
import { TownBuildingID } from 'enums/map/town-building-id.enum'
import TOWNS_DATA from 'data/towns-data'

export interface NpcPlace {
    npcId: NpcID
    townId: TownID
    buildingId: TownBuildingID
}

/** The town building `npcId` stands in. An NPC in several buildings (the Trader: market and shop) gets the first one in TOWNS_DATA. */
export function npcPlace(npcId: NpcID): NpcPlace | null {
    for (const town of Object.values(TOWNS_DATA)) {
        const building = town.buildings.find(b => b.npcs.some(n => n.id === npcId))
        if (building) return { npcId, townId: town.id, buildingId: building.buildingId }
    }
    return null
}
