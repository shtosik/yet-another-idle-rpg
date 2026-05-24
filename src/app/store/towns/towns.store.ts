import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { TownID } from '../../../enums/map/town-id.enum'
import { TownBuilding } from '../../../interfaces/town.interface'
import { withDevtools } from '@angular-architects/ngrx-toolkit'
import { withGameStateSync } from '../helpers/with-game-state-sync.hook'
import { ShopID } from '../../../enums/ids/shop-id.enum'

export interface TownsState {
    selectedTownId: TownID | null;
    selectedTownBuilding: TownBuilding | null;
    activeShopId: ShopID | null;
}

const initialState: TownsState = {
    selectedTownId: null,
    selectedTownBuilding: null,
    activeShopId: null,
}

const STORE_KEY = 'townsStore'

export const TownsStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withGameStateSync(STORE_KEY, initialState),
    withDevtools(STORE_KEY),
    withMethods((store) => ({
        resetState(): void {
            patchState(store, initialState)
        },
        selectTown(townId: TownID): void {
            patchState(store, { selectedTownId: townId })
        },
        selectTownBuilding(townBuilding: TownBuilding): void {
            patchState(store, { selectedTownBuilding: townBuilding })
        },
        resetSelection(): void {
            patchState(store, initialState)
        },
        openShop(shopId: ShopID): void {
            patchState(store, { activeShopId: shopId })
        },
        closeShop(): void {
            patchState(store, { activeShopId: null })
        },
    })),
)
