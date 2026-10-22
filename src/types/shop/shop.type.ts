import { ShopID } from '../../enums/ids/shop-id.enum'
import { ItemID } from '../../enums/ids/item-id.enum'
import { ItemTier } from '../../enums/items/item-tier.enum'
import { ItemType } from '../../enums/items/item-type.enum'

/** What a shop's prices are paid in. */
export type ShopCurrency = 'gold' | 'explorerTokens'

export interface Shop {
  id: ShopID
  nameKey: string
  items: ShopItem[]
  /** Defaults to gold. */
  currency?: ShopCurrency
  /** Item kinds the shop buys from the player. Omitted = everything sellable; empty = buys nothing. */
  buys?: ItemType[]
  /** Sell-price multipliers on `value`; an item entry wins over its type. Missing = ×1. */
  sellMultipliers?: {
    types?: Partial<Record<ItemType, number>>
    items?: Partial<Record<ItemID, number>>
  }
}

export interface ShopItem {
  itemId: ItemID
  tier: ItemTier
  price: number
  maxStock: number
  refreshable: boolean
  /** Exploration Guild rank needed to buy it (token shop tiers). */
  minRank?: number
}
