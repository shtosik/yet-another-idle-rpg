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
    position: { x: 550, y: 280 },
  },
  {
    type: 'town',
    townId: TownID.lirold,
    label: 'Lirold',
    position: { x: 600, y: 1180 },
  },
  {
    type: 'zone',
    zoneId: ZoneID.horseshoeBeach,
    label: 'Horseshoe Beach',
    position: { x: 370, y: 650 },
    minZoom: 2,
  },
  {
    type: 'zone',
    zoneId: ZoneID.tradersBasement,
    label: "Trader's Basement",
    position: { x: 550, y: 190 },
    minZoom: 2,
  },
  {
    type: 'zone',
    zoneId: ZoneID.plains,
    label: 'Plains',
    position: { x: 960, y: 120 },
    minZoom: 2,
  },
  {
    type: 'zone',
    zoneId: ZoneID.theLongPath,
    label: 'The Long Path',
    position: { x: 940, y: 480 },
    minZoom: 2,
  },
  {
    type: 'zone',
    zoneId: ZoneID.mountainPass,
    label: 'Mountain Pass',
    position: { x: 1400, y: 600 },
    minZoom: 2,
  },
]

const elderreachMarkers: WorldMapMarker[] = [
  {
    type: 'zone',
    zoneId: ZoneID.elderwoodWilds,
    label: 'Elderwood Wilds',
    position: { x: 2080, y: 620 },
    minZoom: 2,
  },
  {
    type: 'zone',
    zoneId: ZoneID.deepwood,
    label: 'Deepwood',
    position: { x: 2000, y: 430 },
    minZoom: 2,
  },
  {
    type: 'zone',
    zoneId: ZoneID.upperCanopy,
    label: 'Upper Canopy',
    position: { x: 2690, y: 100 },
    minZoom: 2,
  },
  {
    type: 'town',
    townId: TownID.mawood,
    label: 'Mawood',
    position: { x: 2580, y: 280 },
  },
]

export const WORLD_MAP_DATA: WorldMap = {
  tilesPath: 'assets/maps/world/tiles',
  manifest: {
    width: 3072,
    height: 2048,
    tileSize: 256,
    minZoom: 1,
    maxZoom: 4,
  },
  defaultView: {
    center: { x: 1000, y: 600 },
    zoom: 2,
  },
  markers: [
    ...portStocksmarMarkers,
    ...elderreachMarkers,
  ],
}
