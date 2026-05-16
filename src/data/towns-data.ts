import { TownID } from '../enums/map/town-id.enum'
import { RegionID } from '../enums/map/region-id.enum'
import { TownBuildingID } from '../enums/map/town-tab-id.enum'
import { NpcID } from '../enums/map/npc-id.enum'
import { ZoneID } from '../enums/ids/zone-id.enum'
import { QuestID } from '../enums/ids/quest-id.enum'

export interface Town {
  id: TownID
  regionId: RegionID
  url: string
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
  url: string
  position?: {
    x: number
    y: number
  }
  zoneId?: ZoneID
  questRequirement?: QuestID
}


export const TOWNS_DATA: Record<TownID, Town> = {
  [TownID.laHarpar]: {
    id: TownID.laHarpar,
    regionId: RegionID.portStocksmar,
    url: './assets/img/backgrounds/laHarpar.png',
    buildings: [
      {
        tabId: TownBuildingID.tavern,
        position: {
          x: 20,
          y: 80,
        },
        npcIds: [
          {
            id: NpcID.laHarparBartender,
            position: {
              x: 85,
              y: 50,
            },
          },
          {
            id: NpcID.laHarparJosh,
            position: {
              x: 15,
              y: 60,
            },
          },
        ],
        url: './assets/img/backgrounds/laHarparTavern.png',
      },
      {
        tabId: TownBuildingID.market,
        position: {
          x: 50,
          y: 70,
        },
        npcIds: [
          {
            id: NpcID.laHarparTrader,
            position: {
              x: 33,
              y: 50,
            },
          },
          {
            id: NpcID.laHarparElara,
            position: {
              x: 66,
              y: 66,
            },
          },
        ],
        url: './assets/img/backgrounds/laHarparMarket.png',
      },
      {
        tabId: TownBuildingID.tradersBasement,
        position: {
          x: 52,
          y: 35,
        },
        zoneId: ZoneID.tradersBasement,
        questRequirement: QuestID.ratsWereRats,
        npcIds: [],
        url: '',
      },
      {
        tabId: TownBuildingID.shop,
        position: {
          x: 70,
          y: 35,
        },
        npcIds: [
          {
            id: 2,
            position: {
              x: 40,
              y: 40,
            },
          },
        ],
        url: './assets/img/backgrounds/laHarparShop.png',
      },
      {
        tabId: TownBuildingID.explorationGuild,
        position: {
          x: 85,
          y: 80,
        },
        npcIds: [
          {
            id: NpcID.laHarparMarvin,
            position: {
              x: 50,
              y: 50,
            },
          },
        ], url: './assets/img/backgrounds/laHarparExplorationGuild.png',
      },
    ],
  },
  [TownID.northLirold]: {
    id: TownID.northLirold,
    regionId: RegionID.portStocksmar,
    url: '',
    buildings: [],
  },
}

export default TOWNS_DATA
