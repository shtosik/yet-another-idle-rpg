import { SiteID } from 'enums/ids/site-id.enum'
import { NpcID } from 'enums/map/npc-id.enum'
import { TownBuildingNpc } from 'interfaces/town.interface'

/** A non-combat place outside the towns (docs/ideas/farm-and-husbandry.md §2). */
export interface Site {
  id: SiteID
  /** English map label, like the other marker labels. */
  label: string
  /** Home screen background. */
  url: string
  /** NPCs on the home screen, positioned in % like a town building's. */
  npcs: TownBuildingNpc[]
  /** The one button on the home screen; it opens the Site's panel. */
  gate: { position: { x: number; y: number } }
  marker: { position: { x: number; y: number }; minZoom: number }
}

export const SITES_DATA: Record<SiteID, Site> = {
  [SiteID.farm]: {
    id: SiteID.farm,
    label: 'Farm',
    url: './assets/img/backgrounds/farm.png',
    npcs: [
      { id: NpcID.farmWarden, position: { x: 28, y: 48 } },
      { id: NpcID.farmDrover, position: { x: 72, y: 50 } },
    ],
    gate: { position: { x: 50, y: 78 } },
    marker: { position: { x: 1400, y: 400 }, minZoom: 2 },
  },
}
