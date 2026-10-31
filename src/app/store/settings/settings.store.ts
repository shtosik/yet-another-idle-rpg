import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { withDevtools } from '../helpers/devtools'
import { withGameStateSync } from '../helpers/with-game-state-sync.hook'
import { ItemTier } from '../../../enums/items/item-tier.enum'

/** Player options that aren't game progress. */
export interface SettingsState {
  /** Destroying an item of this tier or higher asks for confirmation. Trash, so every tier asks. */
  confirmDestroyFromTier: ItemTier
}

const initialState: SettingsState = {
  confirmDestroyFromTier: ItemTier.trash,
}

/** Whether destroying an item of `tier` shows the confirmation. */
export const needsDestroyConfirm = (tier: ItemTier, confirmFromTier: ItemTier): boolean => tier >= confirmFromTier

const STORE_KEY = 'settingsStore'

export const SettingsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withGameStateSync(STORE_KEY, initialState),
  withDevtools(STORE_KEY),
  withMethods((store) => ({
    resetState(): void {
      patchState(store, initialState)
    },
    setConfirmDestroyFromTier(confirmDestroyFromTier: ItemTier): void {
      patchState(store, { confirmDestroyFromTier })
    },
  })),
)
