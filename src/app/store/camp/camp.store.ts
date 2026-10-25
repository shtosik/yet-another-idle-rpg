import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { withDevtools } from '../helpers/devtools'
import { withGameStateSync } from '../helpers/with-game-state-sync.hook'
import { StationID } from '../../../enums/ids/station-id.enum'
import { RecipeID } from '../../../enums/ids/recipe-id.enum'

/** Camp tab UI selection, kept across tab switches and reloads. */
export interface CampState {
  selectedStationId: StationID
  selectedRecipes: Partial<Record<StationID, RecipeID>>
  batchSize: number | 'max'
  /** Recipe grid filter: hide recipes that can't be crafted right now. */
  craftableOnly: boolean
}

const initialState: CampState = {
  selectedStationId: StationID.workbench,
  selectedRecipes: {},
  batchSize: 1,
  craftableOnly: false,
}

const STORE_KEY = 'campStore'

export const CampStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withGameStateSync(STORE_KEY, initialState),
  withDevtools(STORE_KEY),
  withMethods((store) => ({
    resetState(): void {
      patchState(store, initialState)
    },
    selectStation(stationId: StationID): void {
      patchState(store, { selectedStationId: stationId })
    },
    selectRecipe(stationId: StationID, recipeId: RecipeID): void {
      patchState(store, (state) => ({ selectedRecipes: { ...state.selectedRecipes, [stationId]: recipeId } }))
    },
    setBatchSize(batchSize: number | 'max'): void {
      patchState(store, { batchSize })
    },
    toggleCraftableOnly(): void {
      patchState(store, (state) => ({ craftableOnly: !state.craftableOnly }))
    },
  })),
)
