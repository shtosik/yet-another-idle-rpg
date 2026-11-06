import { SiteID } from 'enums/ids/site-id.enum'

/** A non-combat place outside the towns (docs/ideas/farm-and-husbandry.md §2). The home screen's NPCs and Gate arrive with the farm view. */
export interface Site {
  id: SiteID
  /** English map label, like the other marker labels. */
  label: string
  marker: { position: { x: number; y: number }; minZoom: number }
}

export const SITES_DATA: Record<SiteID, Site> = {
  [SiteID.farm]: {
    id: SiteID.farm,
    label: 'Farm',
    marker: { position: { x: 1400, y: 400 }, minZoom: 2 },
  },
}
