import { TownID } from 'enums/map/town-id.enum'
import { ZoneID } from 'enums/ids/zone-id.enum'

// All positions are image pixel coords: x=right, y=down from top-left.
// Convert to Leaflet CRS.Simple: latLng(-y, x).

interface BaseMarker {
  position: { x: number; y: number }
  label: string
  minZoom?: number
}

export interface TownMarker extends BaseMarker {
  type: 'town'
  townId: TownID
}

export interface ZoneMarker extends BaseMarker {
  type: 'zone'
  zoneId: ZoneID
}

export interface PoiMarker extends BaseMarker {
  type: 'poi'
  i18nKey: string
}

export type WorldMapMarker = TownMarker | ZoneMarker | PoiMarker

export interface WorldMapManifest {
  width: number
  height: number
  tileSize: number
  minZoom: number
  maxZoom: number
}

export interface WorldMap {
  tilesPath: string
  manifest: WorldMapManifest
  defaultView: { center: { x: number; y: number }; zoom: number }
  markers: WorldMapMarker[]
}

const portStocksmarMarkers: WorldMapMarker[] = [
  {
    type: 'town',
    townId: TownID.laHarpar,
    label: 'La Harpar',
    position: { x: 410, y: 180 },
  },
  // {
  //   type: 'town',
  //   townId: TownID.northLirold,
  //   label: 'North Lirold',
  //   position: { x: 730, y: 110 },
  // },
  {
    type: 'zone',
    zoneId: ZoneID.horseshoeBeach,
    label: 'Horseshoe Beach',
    position: { x: 200, y: 430 },
    minZoom: 2,
  },
  {
    type: 'zone',
    zoneId: ZoneID.plains,
    label: 'Plains',
    position: { x: 750, y: 80 },
    minZoom: 2,
  },
  {
    type: 'zone',
    zoneId: ZoneID.theLongPath,
    label: 'The Long Path',
    position: { x: 670, y: 260 },
    minZoom: 2,
  },
]

export const WORLD_MAP_DATA: WorldMap = {
  tilesPath: 'assets/maps/world/tiles',
  manifest: {
    width: 1397,
    height: 752,
    tileSize: 256,
    minZoom: 1,
    maxZoom: 3,
  },
  defaultView: {
    center: { x: 698, y: 376 },
    zoom: 2,
  },
  markers: [
    ...portStocksmarMarkers,
  ],
}
