import { inject } from '@angular/core'
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { withDevtools, withStorageSync } from '@angular-architects/ngrx-toolkit'
import { withGameStateSync } from '../helpers/with-game-state-sync.hook'
import { ShopID } from '../../../enums/ids/shop-id.enum'
import { ShopInstanceState, ShopRuntimeItem } from '../../../types/shop/shop-state.type'
import SHOPS_DATA from '../../../data/shops-data'
import { PlayerStore } from '../player/player.store'

export interface ShopState {
  shops: Partial<Record<ShopID, ShopInstanceState>>
}

const initialState: ShopState = {
  shops: {},
}

const STORE_KEY = 'shopStore'

export const ShopStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withGameStateSync(STORE_KEY, initialState),
  withDevtools(STORE_KEY),
  withStorageSync({
    key: STORE_KEY,
    autoSync: true,
  }),
  withMethods((store, playerStore = inject(PlayerStore)) => ({
    ensureShop(shopId: ShopID): void {
      if (store.shops()[shopId]) return

      const staticShop = SHOPS_DATA[shopId]
      const cooldownRemainingMs = playerStore.stats().shopRefreshCooldown

      const items: ShopRuntimeItem[] = staticShop.items.map(item => ({
        itemId: item.itemId,
        tier: item.tier,
        currentStock: item.maxStock,
      }))

      patchState(store, (state) => ({
        shops: {
          ...state.shops,
          [shopId]: { cooldownRemainingMs, items },
        },
      }))
    },

    tickCooldowns(deltaMs: number): void {
      const shops = store.shops()
      const shopIds = Object.keys(shops).map(Number) as ShopID[]
      if (shopIds.length === 0) return

      const updated: Partial<Record<ShopID, ShopInstanceState>> = {}
      let changed = false

      shopIds.forEach(shopId => {
        const instance = shops[shopId]!
        const newCooldown = instance.cooldownRemainingMs - deltaMs

        if (newCooldown <= 0) {
          const staticShop = SHOPS_DATA[shopId]
          const refreshedItems = instance.items.map((runtimeItem, index) => {
            const staticItem = staticShop.items[index]
            return staticItem?.refreshable
              ? { ...runtimeItem, currentStock: staticItem.maxStock }
              : runtimeItem
          })

          updated[shopId] = {
            cooldownRemainingMs: playerStore.stats().shopRefreshCooldown + newCooldown,
            items: refreshedItems,
          }
        } else {
          updated[shopId] = { ...instance, cooldownRemainingMs: newCooldown }
        }

        changed = true
      })

      if (changed) {
        patchState(store, (state) => ({
          shops: { ...state.shops, ...updated },
        }))
      }
    },

    buyItem(shopId: ShopID, itemIndex: number): void {
      const instance = store.shops()[shopId]
      if (!instance) return

      const updatedItems = instance.items.map((item, i) =>
        i === itemIndex ? { ...item, currentStock: item.currentStock - 1 } : item,
      )

      patchState(store, (state) => ({
        shops: {
          ...state.shops,
          [shopId]: { ...instance, items: updatedItems },
        },
      }))
    },

    resetState(): void {
      patchState(store, initialState)
    },
  })),
)
