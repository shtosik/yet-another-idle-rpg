import { ZoneID } from 'enums/ids/zone-id.enum'
import { TownID } from 'enums/map/town-id.enum'

export type UnlockedContent = {
  zones: ZoneID[]
  towns: TownID[]
}
