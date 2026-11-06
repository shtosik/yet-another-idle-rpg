import { SiteID } from 'enums/ids/site-id.enum'
import { TownBuildingNpc } from 'interfaces/town.interface'

/** A non-combat place outside the towns (docs/ideas/farm-and-husbandry.md §2). */
export interface Site {
  id: SiteID
  /** English map label, like the other marker labels. */
  label: string
  /** Home screen background; absent until the art lands (the view shows a plain colour). */
  url?: string
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
    npcs: [], // The Farming Guild's NPCs arrive with their dialogue (plan commit C10).
    gate: { position: { x: 50, y: 78 } },
    marker: { position: { x: 1400, y: 400 }, minZoom: 2 },
  },
}
