import { ItemID } from '../../enums/ids/item-id.enum'
import { Item } from '../../interfaces/item.interface'
import { ItemTier } from '../../enums/items/item-tier.enum'
import { ItemType } from '../../enums/items/item-type.enum'
import { StationID } from '../../enums/ids/station-id.enum'

export const StationItemsData: Partial<Record<ItemID, Item>> = {
  [ItemID.firePit]: {
    id: ItemID.firePit,
    tier: ItemTier.normal,
    url: './assets/img/items/firePit.png',
    value: 0,
    type: ItemType.stationUpgrade,
    stationId: StationID.cooking,
    level: 1,
  },
  [ItemID.cookingPot]: {
    id: ItemID.cookingPot,
    tier: ItemTier.uncommon,
    url: './assets/img/items/cookingPot.png',
    value: 0,
    type: ItemType.stationUpgrade,
    stationId: StationID.cooking,
    level: 2,
  },
  [ItemID.mortarAndPestle]: {
    id: ItemID.mortarAndPestle,
    tier: ItemTier.uncommon,
    url: './assets/img/items/mortarAndPestle.png',
    value: 0,
    type: ItemType.stationUpgrade,
    stationId: StationID.alchemy,
    level: 1,
  },
  [ItemID.runeAltar]: {
    id: ItemID.runeAltar,
    tier: ItemTier.rare,
    url: './assets/img/items/runeAltar.png',
    value: 0,
    type: ItemType.stationUpgrade,
    stationId: StationID.runeAltar,
    level: 1,
  },
}
