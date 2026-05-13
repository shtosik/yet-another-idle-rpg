import { ShopID } from '../../enums/ids/shop-id.enum'
import { ItemID } from '../../enums/ids/item-id.enum'
import { ItemTier } from '../../enums/items/item-tier.enum'

export interface Shop {
  id: ShopID
  nameKey: string
  items: ShopItem[]
}

export interface ShopItem {
  itemId: ItemID
  tier: ItemTier
  price: number
  maxStock: number
  refreshable: boolean
}
