import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { TownID } from '../../../enums/map/town-id.enum'
import { TownBuilding } from '../../../data/towns-data'
import { withDevtools, withStorageSync } from '@angular-architects/ngrx-toolkit'
import { withGameStateSync } from '../helpers/with-game-state-sync.hook'

export interface TownsState {
    selectedTownId: TownID | null;
    selectedTownBuilding: TownBuilding | null;
}

const initialState: TownsState = {
    selectedTownId: null,
    selectedTownBuilding: null,
}

const STORE_KEY = 'townsStore'

export const TownsStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withGameStateSync(STORE_KEY, initialState),
    withDevtools(STORE_KEY),
    withStorageSync({
        key: STORE_KEY,
        autoSync: true,
    }),
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
    })),
)
