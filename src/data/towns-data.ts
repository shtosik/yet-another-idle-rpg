import { TownID } from '../enums/map/town-id.enum'
import { RegionID } from '../enums/map/region-id.enum'
import { TownBuildingID } from '../enums/map/town-tab-id.enum'
import { NpcID } from '../enums/map/npc-id.enum'
import { ZoneID } from '../enums/ids/zone-id.enum'
import { QuestID } from '../enums/ids/quest-id.enum'
import { Town } from '../interfaces/town.interface'

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
  [TownID.mawood]: {
    id: TownID.mawood,
    regionId: RegionID.portStocksmar,
    url: './assets/img/backgrounds/mawood.png',
    buildings: [
      {
        tabId: TownBuildingID.main,
        position: { x: 50, y: 55 },
        npcIds: [
          { id: NpcID.mawoodCorwin, position: { x: 50, y: 50 } },
        ],
        url: './assets/img/backgrounds/mawoodElderTree.png',
      },
      {
        tabId: TownBuildingID.mawoodApothecary,
        position: { x: 20, y: 70 },
        npcIds: [
          { id: NpcID.mawoodSylvie, position: { x: 50, y: 50 } },
        ],
        url: './assets/img/backgrounds/mawoodApothecary.png',
      },
      {
        tabId: TownBuildingID.mawoodHunterLodge,
        position: { x: 80, y: 70 },
        npcIds: [
          { id: NpcID.mawoodFinn, position: { x: 50, y: 50 } },
        ],
        url: './assets/img/backgrounds/mawoodHunterLodge.png',
      },
      {
        tabId: TownBuildingID.mawoodCarversShop,
        position: { x: 30, y: 40 },
        npcIds: [
          { id: NpcID.mawoodBrenn, position: { x: 50, y: 50 } },
        ],
        url: './assets/img/backgrounds/mawoodCarversShop.png',
      },
      {
        tabId: TownBuildingID.mawoodHighPlatform,
        position: { x: 70, y: 20 },
        npcIds: [
          { id: NpcID.mawoodMilo, position: { x: 50, y: 50 } },
        ],
        url: './assets/img/backgrounds/mawoodHighPlatform.png',
      },
      {
        tabId: TownBuildingID.deepwoodEntrance,
        position: { x: 15, y: 90 },
        zoneId: ZoneID.deepwood,
        // Opens once Corwin sends the player into the Deepwood (Q3).
        // Corwin only offers theSapThatBurns after fetchesAndFangs is completed,
        // so this entrance can never appear before the player has earned it.
        questRequirement: QuestID.theSapThatBurns,
        npcIds: [],
        url: '',
      },
      {
        tabId: TownBuildingID.upperCanopyEntrance,
        position: { x: 85, y: 10 },
        zoneId: ZoneID.upperCanopy,
        // Opens once Milo sends the player up (Q10). His feathersForAKite offer is
        // gated on theBlightedHeart being completed (the Gnarled Treant must be dead),
        // so the rope-lift only appears after the corruption questline is finished.
        questRequirement: QuestID.feathersForAKite,
        npcIds: [],
        url: '',
      },
    ],
  },
}

export default TOWNS_DATA
