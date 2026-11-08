import { inject } from '@angular/core'
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { withDevtools } from '../helpers/devtools'
import { withGameStateSync } from '../helpers/with-game-state-sync.hook'
import { ShopID } from '../../../enums/ids/shop-id.enum'
import { ShopInstanceState, ShopRuntimeItem } from '../../../types/shop/shop-state.type'
import SHOPS_DATA from '../../../data/shops-data'
import { PlayerStore } from '../player/player.store'
import { canInstall, stationUpgradeOf } from '../player/camp'
import { ItemID } from '../../../enums/ids/item-id.enum'

/** Why a purchase is refused, in the order the checks run. `currency`: the player has too little of the shop's currency. */
export type BuyBlockReason = 'stock' | 'rank' | 'reputation' | 'currency' | 'inventory' | 'station'

export interface PurchaseResult {
  bought: number
  /** Total paid, in the shop's currency. */
  spent: number
  /** Station gear installed by the purchase (the caller shows the modal). */
  installed: ItemID[]
}

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
  withMethods((store, playerStore = inject(PlayerStore)) => ({
    /** Creates runtime state on first visit, and re-aligns it when the static item list changed. */
    ensureShop(shopId: ShopID): void {
      const existing = store.shops()[shopId]
      const staticShop = SHOPS_DATA[shopId]
      const inSync = existing?.items.length === staticShop.items.length
        && existing.items.every((item, i) => item.itemId === staticShop.items[i].itemId)
      if (inSync) return

      const cooldownRemainingMs = existing?.cooldownRemainingMs ?? playerStore.stats().shopRefreshCooldown

      // Saved stock is matched by item id so sold-out uniques stay sold out.
      const items: ShopRuntimeItem[] = staticShop.items.map(item => ({
        itemId: item.itemId,
        tier: item.tier,
        currentStock: existing?.items.find(saved => saved.itemId === item.itemId)?.currentStock ?? item.maxStock,
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

    /** What blocks buying item `index` right now, or null. Checks stock, rank, reputation, currency, station, inventory. */
    blockReason(shopId: ShopID, index: number): BuyBlockReason | null {
      const staticItem = SHOPS_DATA[shopId].items[index]
      const runtimeItem = store.shops()[shopId]?.items[index]
      if (!staticItem || !runtimeItem || runtimeItem.currentStock <= 0) return 'stock'

      if ((staticItem.minRank ?? 0) > playerStore.guildRank()) return 'rank'

      const { minReputation } = staticItem
      if (minReputation && playerStore.reputationTierOf(minReputation.reputationId) < minReputation.tier) return 'reputation'

      if (playerStore.balanceOf(SHOPS_DATA[shopId].currency ?? 'gold') < staticItem.price) return 'currency'

      // Station gear installs on purchase and never takes a slot, but must follow the previous level.
      const upgrade = stationUpgradeOf(staticItem.itemId)
      if (upgrade) return canInstall(playerStore.stations(), upgrade) ? null : 'station'

      // The spellbook unlocks a tab and never enters the inventory.
      const { itemId, tier } = staticItem
      if (itemId !== ItemID.spellbook && !playerStore.canFitItems([{ id: itemId, tier, amount: 1 }])) return 'inventory'

      return null
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
  // Buying, built on the checks above.
  withMethods((store, playerStore = inject(PlayerStore)) => ({
    /** Buys up to `count` of item `index`, stopping at the first block. Refused outright (nothing bought) returns the reason. */
    purchase(shopId: ShopID, index: number, count = 1): PurchaseResult | BuyBlockReason {
      const shop = SHOPS_DATA[shopId]
      if (!shop.items[index]) return 'stock'
      const { itemId, tier, price } = shop.items[index]
      const result: PurchaseResult = { bought: 0, spent: 0, installed: [] }

      while (result.bought < count) {
        const reason = store.blockReason(shopId, index)
        if (reason) return result.bought ? result : reason
        if (!playerStore.spend(shop.currency ?? 'gold', price)) break
        store.buyItem(shopId, index)

        // Spellbook unlocks the tab immediately and is not added to inventory
        if (itemId === ItemID.spellbook) playerStore.unlockSpellbook()
        else result.installed.push(...playerStore.addItems([{ id: itemId, tier, amount: 1 }]))
        result.bought++
        result.spent += price
      }
      return result
    },
  })),
)
