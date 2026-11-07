import { ZoneID } from 'enums/ids/zone-id.enum'
import { SiteID } from 'enums/ids/site-id.enum'
import { TownID } from 'enums/map/town-id.enum'

export type UnlockedContent = {
  zones: ZoneID[]
  towns: TownID[]
  /** Missing in older saves. */
  sites?: SiteID[]
}
