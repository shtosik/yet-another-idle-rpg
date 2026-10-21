import { TownID } from 'enums/map/town-id.enum'
import { RegionID } from 'enums/map/region-id.enum'
import { TownBuildingID } from 'enums/map/town-tab-id.enum'
import { NpcID } from 'enums/map/npc-id.enum'
import { ZoneID } from 'enums/ids/zone-id.enum'
import { QuestID } from 'enums/ids/quest-id.enum'

export interface Town {
    id: TownID
    regionId: RegionID
    /** Absent for towns that are still placeholders. */
    url?: string
    buildings: TownBuilding[]
}

export interface TownBuildingNpcProps {
    id: NpcID
    position: {
        x: number
        y: number
    }
}

export interface TownBuilding {
    tabId: TownBuildingID
    npcIds: TownBuildingNpcProps[]
    /** Absent for zone entrances, which travel to `zoneId` instead of opening a view. */
    url?: string
    position?: {
        x: number
        y: number
    }
    zoneId?: ZoneID
    questRequirement?: QuestID
}
