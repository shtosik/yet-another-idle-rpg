import { StationID } from '../enums/ids/station-id.enum'

export interface CraftingStation {
    id: StationID
    maxLevel: number
}

// Tab order in Camp follows this object. Gear names per level live in `camp:stations.<id>.levels.<n>`.
const STATIONS_DATA: Record<StationID, CraftingStation> = {
    [StationID.workbench]: { id: StationID.workbench, maxLevel: 3 },
    [StationID.cooking]: { id: StationID.cooking, maxLevel: 3 },
    [StationID.alchemy]: { id: StationID.alchemy, maxLevel: 2 },
    // Provisional: revisit when runes get their own design (rune socketing / rune rifts).
    [StationID.runeAltar]: { id: StationID.runeAltar, maxLevel: 1 },
}

export default STATIONS_DATA
