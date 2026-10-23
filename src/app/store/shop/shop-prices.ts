import ITEM_DATA from '../../../data/items-data'
import SHOPS_DATA from '../../../data/shops-data'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { ShopID } from '../../../enums/ids/shop-id.enum'

/**
 * Gold this shop pays for one `itemId`, or 0 when it won't buy it.
 * `value <= 0` is never sellable; a preferred kind pays `value × multiplier`, rounded up so cheap items
 * (value 1) still gain from a preference.
 */
export function sellPrice(shopId: ShopID, itemId: ItemID): number {
  const shop = SHOPS_DATA[shopId]
  const item = ITEM_DATA[itemId]
  if (!item || item.value <= 0) return 0
  if (shop.buys && !shop.buys.includes(item.type)) return 0

  const multiplier = shop.sellMultipliers?.items?.[itemId] ?? shop.sellMultipliers?.types?.[item.type] ?? 1
  return Math.max(1, Math.ceil(item.value * multiplier))
}

/** Whether this shop pays more than the item's base `value`. */
export const isPreferredBy = (shopId: ShopID, itemId: ItemID): boolean => {
  const value = ITEM_DATA[itemId]?.value ?? 0
  return value > 0 && sellPrice(shopId, itemId) > value
}
