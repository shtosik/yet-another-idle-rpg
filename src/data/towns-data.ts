import { TownID } from '../enums/map/town-id.enum'
import { RegionID } from '../enums/map/region-id.enum'
import { TownBuildingID } from '../enums/map/town-tab-id.enum'
import { NpcID } from '../enums/map/npc-id.enum'
import { ZoneID } from '../enums/ids/zone-id.enum'
import { UnlockRequirement } from '../interfaces/unlock-requirement.interface'
import { UnlockRequirementType } from '../enums/unlock-requirement-type.enum'

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
  objectsIds?: TownBuildingObjectProps[]
  url: string
}

export type TownBuildingObjectProps = EntranceObject

interface EntranceObject {
  type: 'zone'
  zoneId: ZoneID
  requirement: UnlockRequirement
  position: string
  url: string
  name: string
}

export const TOWNS_DATA: Record<TownID, Town> = {
  [TownID.laHarpar]: {
    id: TownID.laHarpar,
    regionId: RegionID.portStocksmar,
    url: './assets/img/backgrounds/laHarpar.png',
    buildings: [
      {
        tabId: TownBuildingID.tavern,
        npcIds: [
          {
            id: NpcID.laHarparBartender,
            // position: 'top-1/2 -translate-y-1/2 right-5 ',
            position: {
              x: 85,
              y: 50,
            },
          },
          {
            id: NpcID.laHarparJosh,
            // position: 'top-1/2 -translate-y-3/4 left-5'
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
        objectsIds: [
          {
            name: 'Trader\'s Basement',
            type: 'zone',
            zoneId: ZoneID.tradersBasement,
            requirement: {
              type: UnlockRequirementType.quest,
              questId: 2,
              step: 0,
            },
            position: 'top-1/2 left-[19%] -translate-y-1/2',
            url: './objects/basementDoor.png',
          },
        ],
        npcIds: [
          {
            id: NpcID.laHarparTrader,
            // position: 'top-1/2 left-1/3 -translate-y-1/2',
            position: {
              x: 33,
              y: 50,
            },
          },
          {
            id: NpcID.laHarparElara,
            // position: 'top-2/3 left-2/3 -translate-y-1/2',
            position: {
              x: 66,
              y: 66,
            },
          },
        ],
        url: './assets/img/backgrounds/laHarparMarket.png',
      },
      {
        tabId: TownBuildingID.shop,
        npcIds: [
          {
            id: 2,
            // position: '',
            position: {
              x: 0,
              y: 0,
            },
          },
        ],
        url: './assets/img/backgrounds/laHarparShop.png',
      },
      {
        tabId: TownBuildingID.explorationGuild, npcIds: [
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
