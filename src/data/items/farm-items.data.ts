import { ItemID } from '../../enums/ids/item-id.enum'
import { Item } from '../../interfaces/item.interface'
import { ItemTier } from '../../enums/items/item-tier.enum'
import { ItemType } from '../../enums/items/item-type.enum'

const seed = (id: ItemID, tier: ItemTier): Item => ({ id, tier, url: `./assets/img/items/${ItemID[id]}.png`, value: -1, type: ItemType.seed })
const crop = (id: ItemID, tier: ItemTier, value: number): Item => ({ id, tier, url: `./assets/img/items/${ItemID[id]}.png`, value, type: ItemType.resource })

export const FarmItemsData: Partial<Record<ItemID, Item>> = {
  [ItemID.turnipSeeds]: seed(ItemID.turnipSeeds, ItemTier.normal),
  [ItemID.wheatSeeds]: seed(ItemID.wheatSeeds, ItemTier.normal),
  [ItemID.silverleafSeeds]: seed(ItemID.silverleafSeeds, ItemTier.uncommon),
  [ItemID.appleSeeds]: seed(ItemID.appleSeeds, ItemTier.uncommon),
  [ItemID.glowcapSpores]: seed(ItemID.glowcapSpores, ItemTier.rare),
  [ItemID.heartrootSeeds]: seed(ItemID.heartrootSeeds, ItemTier.rare),
  [ItemID.canopyBlossomSeeds]: seed(ItemID.canopyBlossomSeeds, ItemTier.epic),
  [ItemID.turnip]: crop(ItemID.turnip, ItemTier.normal, 4),
  [ItemID.wheat]: crop(ItemID.wheat, ItemTier.normal, 8),
  [ItemID.silverleaf]: crop(ItemID.silverleaf, ItemTier.uncommon, 20),
  [ItemID.glowcap]: crop(ItemID.glowcap, ItemTier.rare, 50),
  [ItemID.heartroot]: crop(ItemID.heartroot, ItemTier.rare, 120),
  [ItemID.canopyBlossom]: crop(ItemID.canopyBlossom, ItemTier.epic, 300),
}
