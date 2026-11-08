import { inject, Injector, Type } from '@angular/core'
import { BattleStore } from './battle/battle.store'
import { CampStore } from './camp/camp.store'
import { OfflineStore } from './offline/offline.store'
import { PlayerStore } from './player/player.store'
import { QuestsStore } from './quests/quests.store'
import { SettingsStore } from './settings/settings.store'
import { ShopStore } from './shop/shop.store'
import { TownsStore } from './towns/towns.store'

/**
 * Every store saved with `withGameStateSync`. `GameComponent` creates them all, so each registers its save
 * version for export and import, and reset covers them. `npm run validate` fails when a store using the hook is missing here.
 */
export const SAVED_STORES: Type<{ resetState(): void }>[] = [
  PlayerStore, BattleStore, QuestsStore, TownsStore, ShopStore, CampStore, OfflineStore, SettingsStore,
]

/** Creates every saved store (call in an injection context). */
export const injectSavedStores = () => SAVED_STORES.map(store => inject(store))

/** Patches every saved store back to its initial state. */
export const resetAllStores = (injector: Injector) => SAVED_STORES.forEach(store => injector.get(store).resetState())
