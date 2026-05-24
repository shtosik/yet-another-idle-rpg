import { ItemID } from 'enums/ids/item-id.enum'
import { Item } from 'interfaces/item.interface'
import { PetItemsData } from './items/pet-items.data'
import { WeaponsItemsData } from './items/weapons-items.data'
import { RingsItemsData } from './items/rings-items.data'
import { NeckItemsData } from './items/neck-items.data'
import { BeltItemsData } from './items/belt-items.data'
import { QuestItemsData } from './items/quest-item.data'
import { GlovesItemsData } from './items/gloves-items.data'
import { HelmetItemsData } from './items/helmet-items.data'
import { ChestItemsData } from './items/chest-items.data'
import { LegsItemsData } from './items/legs-items.data'
import { BootsItemsData } from './items/boots-items.data'
import { ResourcesItemsData } from './items/resources-items.data'
import { RewardsItemsData } from './items/rewards-items.data'


const ITEM_DATA: Partial<Record<ItemID, Item>> = {
  ...ResourcesItemsData,
  ...HelmetItemsData,
  ...ChestItemsData,
  ...LegsItemsData,
  ...BootsItemsData,
  ...GlovesItemsData,
  ...QuestItemsData,
  ...BeltItemsData,
  ...NeckItemsData,
  ...RingsItemsData,
  ...WeaponsItemsData,
  ...PetItemsData,
  ...RewardsItemsData,
}

export default ITEM_DATA
