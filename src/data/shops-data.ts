import { ShopID } from '../enums/ids/shop-id.enum'
import { ItemID } from '../enums/ids/item-id.enum'
import { ItemTier } from '../enums/items/item-tier.enum'
import { Shop } from '../types/shop/shop.type'

const SHOPS_DATA: Record<ShopID, Shop> = {
  [ShopID.laHarparShop]: {
    id: ShopID.laHarparShop,
    nameKey: 'shop:names.laHarparShop',
    items: [
      { itemId: ItemID.skillPointBook, tier: ItemTier.legendary, price: 5000, maxStock: 1,  refreshable: false },
      { itemId: ItemID.fishMeat,       tier: ItemTier.normal,    price: 10,   maxStock: 99, refreshable: true  },
      { itemId: ItemID.apple,          tier: ItemTier.normal,    price: 25,   maxStock: 99, refreshable: true  },
      { itemId: ItemID.woodenBow,      tier: ItemTier.uncommon,  price: 2500, maxStock: 1,  refreshable: true  },
    ],
  },
}

export default SHOPS_DATA
