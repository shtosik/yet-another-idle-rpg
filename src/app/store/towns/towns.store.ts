import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { TownID } from '../../../enums/map/town-id.enum'
import { TownBuildingID } from '../../../enums/map/town-building-id.enum'
import { TownBuilding } from '../../../interfaces/town.interface'
import { withDevtools } from '../helpers/devtools'
import { withGameStateSync } from '../helpers/with-game-state-sync.hook'
import { ShopID } from '../../../enums/ids/shop-id.enum'
import { NpcID } from '../../../enums/map/npc-id.enum'
import TOWNS_DATA from '../../../data/towns-data'

export interface TownsState {
    selectedTownId: TownID | null;
    /** A building of `selectedTownId`; its data comes from `TOWNS_DATA` (computed `selectedTownBuilding`). */
    selectedTownBuildingId: TownBuildingID | null;
    /** Not saved: a reload never reopens a shop. */
    activeShopId: ShopID | null;
    /** Shops the player has opened through an NPC's dialogue; that NPC's frame then offers a direct Shop button. */
    npcShops: Partial<Record<NpcID, ShopID>>;
}

const initialState: TownsState = {
    selectedTownId: null,
    selectedTownBuildingId: null,
    activeShopId: null,
    npcShops: {},
}

const STORE_KEY = 'townsStore'
/** 2: the building is saved as `selectedTownBuildingId`, not as a copy of its data. */
const SAVE_VERSION = 2

export const TownsStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withGameStateSync(STORE_KEY, initialState, { version: SAVE_VERSION, transientKeys: ['activeShopId'] }),
    withDevtools(STORE_KEY),
    withComputed((store) => ({
        selectedTownBuilding: (): TownBuilding | null => {
            const townId = store.selectedTownId()
            const buildingId = store.selectedTownBuildingId()
            if (townId === null || buildingId === null) return null
            return TOWNS_DATA[townId]?.buildings.find(b => b.buildingId === buildingId) ?? null
        },
    })),
    withMethods((store) => ({
        resetState(): void {
            patchState(store, initialState)
        },
        // Moving to another town or building closes any open shop; another town also leaves the building.
        selectTown(townId: TownID): void {
            patchState(store, { selectedTownId: townId, selectedTownBuildingId: null, activeShopId: null })
        },
        selectTownBuilding(townBuilding: TownBuilding | null): void {
            patchState(store, { selectedTownBuildingId: townBuilding?.buildingId ?? null, activeShopId: null })
        },
        openShop(shopId: ShopID): void {
            patchState(store, { activeShopId: shopId })
        },
        rememberNpcShop(npcId: NpcID, shopId: ShopID): void {
            if (store.npcShops()[npcId] === shopId) return
            patchState(store, { npcShops: { ...store.npcShops(), [npcId]: shopId } })
        },
        closeShop(): void {
            patchState(store, { activeShopId: null })
        },
    })),
)
