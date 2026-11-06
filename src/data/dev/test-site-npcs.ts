import { SiteID } from 'enums/ids/site-id.enum'
import { NpcID } from 'enums/map/npc-id.enum'
import { TownBuildingNpc } from 'interfaces/town.interface'

/** Existing NPCs standing on a Site's home screen, only in builds with cheats on (SiteComponent). Delete when the Site gets its own NPCs. */
export const TEST_SITE_NPCS: Partial<Record<SiteID, TownBuildingNpc[]>> = {
  [SiteID.farm]: [
    { id: NpcID.laHarparElara, position: { x: 25, y: 45 } },
    { id: NpcID.mawoodSylvie, position: { x: 75, y: 45 } },
  ],
}
