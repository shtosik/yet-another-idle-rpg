import { ItemID } from '../../enums/ids/item-id.enum'
import { ItemTier } from '../../enums/items/item-tier.enum'

export interface ShopRuntimeItem {
  itemId: ItemID
  tier: ItemTier
  currentStock: number
}

export interface ShopInstanceState {
  cooldownRemainingMs: number
  items: ShopRuntimeItem[]
}
