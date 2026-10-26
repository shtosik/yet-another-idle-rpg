import { DamageElement } from 'enums/damage-element.enum'
import { EquipmentSlot } from 'enums/equipment-slot.enum'
import { ItemID } from 'enums/ids/item-id.enum'
import { ItemTier } from 'enums/items/item-tier.enum'
import { ItemType } from 'enums/items/item-type.enum'
import { UsableItemType } from 'enums/usable-item-type.enum'
import { PlayerStat } from 'types/player/player-stat.type'
import { RecipeID } from 'enums/ids/recipe-id.enum'
import { ConsumableEffect } from './consumable.interface'
import { StationID } from 'enums/ids/station-id.enum'
import { SpellID } from 'enums/ids/spell-id.enum'

export interface ItemData {
    id: ItemID
    tier: ItemTier
    value: number
    url: string
    type: ItemType
    description?: string
}

export interface EquipmentItemPossibleStat {
    id: PlayerStat
    amount: number
}

export interface EquipmentItem extends ItemData {
    type: ItemType.equipment
    stats: EquipmentItemPossibleStat[]
    slot: EquipmentSlot
    damageType?: DamageElement
    /** Known while equipped (not in the skill tree); leaves the spell bar when unequipped. */
    spell?: SpellID
}

export interface ResourceItem extends ItemData {
    type: ItemType.resource
}

export interface RewardsStatsItem extends ItemData {
    type: ItemType.rewardsStats
    stats: {
        id: PlayerStat
        amount: number
    }[]
}

export interface QuestItem extends ItemData {
    type: ItemType.quest
}

export interface FoodItem extends ItemData {
    type: ItemType.food
    effect: ConsumableEffect
}

export interface BookItem extends ItemData {
    type: ItemType.book
}

export interface PotionItem extends ItemData {
    type: ItemType.potion
    effect: ConsumableEffect
}

export type ConsumableItem = FoodItem | PotionItem

export const isConsumableItem = (item: Item): item is ConsumableItem =>
    item.type === ItemType.food || item.type === ItemType.potion

export interface RecipeItem extends ItemData {
    type: ItemType.recipe
    recipeId: RecipeID
}

/** Camp gear. Installs on acquire instead of entering the inventory; needs the station at `level - 1`. */
export interface StationUpgradeItem extends ItemData {
    type: ItemType.stationUpgrade
    stationId: StationID
    level: number
}

export const isStationUpgradeItem = (item: Item): item is StationUpgradeItem =>
    item.type === ItemType.stationUpgrade

export type Item = EquipmentItem | ResourceItem | RewardsStatsItem | QuestItem | FoodItem | BookItem | PotionItem | RecipeItem | StationUpgradeItem

export type UseItemProps = UseItemStatProps

export type UseItemStatProps = {
    type: UsableItemType
    id: PlayerStat
    amount: 1
}

export type InventoryItem = {
    id: ItemID
    type: ItemType
    tier: ItemTier
    amount: number
}

export type ResourceInventoryItem = {
    id: ItemID
    type: ItemType.resource
    amount: number
}
