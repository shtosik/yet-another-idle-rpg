import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core'
import { NgOptimizedImage } from '@angular/common'
import i18next from 'i18next'
import { PlayerStore } from '../../../../store/player/player.store'
import { CampStore } from '../../../../store/camp/camp.store'
import { TranslatePipe } from '../../../../pipes/i18next.pipe'
import { StatToPercentagePipe } from '../../../../pipes/stat-to-percentage.pipe'
import { DurationPipe } from '../../../../pipes/duration.pipe'
import { ConsumableEffectComponent } from '../../../shared/consumable-effect/consumable-effect.component'
import { countItem } from '../../../../store/player/inventory'
import { stationUpgradeOf } from '../../../../store/player/camp'
import { isConsumableItem } from '../../../../../interfaces/item.interface'
import ITEM_DATA from '../../../../../data/items-data'
import { ItemID } from '../../../../../enums/ids/item-id.enum'
import { ItemTier } from '../../../../../enums/items/item-tier.enum'
import { ItemType } from '../../../../../enums/items/item-type.enum'
import { StationID } from '../../../../../enums/ids/station-id.enum'
import { EquipmentSlot, EquipmentSlotKey } from '../../../../../enums/equipment-slot.enum'
import { RecipeView } from '../recipe-view'

const BATCH_SIZES: (number | 'max')[] = [1, 5, 10, 'max']

const stationName = (id: StationID) => i18next.t(`camp:stations.${StationID[id]}.name`)
const gearName = (id: StationID, level: number) => i18next.t(`camp:stations.${StationID[id]}.levels.${level}`)
const itemName = (id: ItemID) => i18next.t(`items:names.${ItemID[id]}`)

@Component({
  selector: 'app-recipe-detail',
  templateUrl: './recipe-detail.component.html',
  styleUrls: ['./recipe-detail.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgOptimizedImage,
    TranslatePipe,
    StatToPercentagePipe,
    DurationPipe,
    ConsumableEffectComponent,
  ],
})
export class RecipeDetailComponent {
  private playerStore = inject(PlayerStore)
  private campStore = inject(CampStore)

  view = input.required<RecipeView>()
  stationLevel = input.required<number>()
  craft = output<number>()

  stationUpgrade = computed(() => stationUpgradeOf(this.view().recipe.itemId))
  consumable = computed(() => {
    const item = this.view().item
    return isConsumableItem(item) ? item : null
  })
  equipment = computed(() => {
    const item = this.view().item
    return item.type === ItemType.equipment ? item : null
  })

  batchSizes = computed(() => (this.stationUpgrade() ? [1] : BATCH_SIZES))
  batchSize = computed(() => (this.stationUpgrade() ? 1 : this.campStore.batchSize()))

  /** How many the Craft button makes right now. */
  craftCount = computed(() => {
    const max = this.view().evaluation.maxCraftable
    const size = this.batchSize()
    return typeof size === 'number' ? Math.min(size, max) : max
  })

  ownedCount = computed(() => countItem(this.playerStore.inventory(), this.view().recipe.itemId))

  equippedName = computed(() => {
    const equipment = this.equipment()
    if (!equipment) return null
    const equipped = this.playerStore.equipment()[EquipmentSlot[equipment.slot] as EquipmentSlotKey]
    return equipped ? itemName(equipped.id) : null
  })

  /** Needed amounts follow the chosen batch, so the player sees the full cost before crafting. */
  ingredients = computed(() => {
    const inventory = this.playerStore.inventory()
    const times = Math.max(this.craftCount(), 1)
    return this.view().recipe.itemsNeeded.map(({ id, amount }) => {
      const owned = countItem(inventory, id)
      const needed = amount * times
      return { id, url: ITEM_DATA[id]!.url, owned, needed, enough: owned >= needed }
    })
  })

  reason = computed(() => {
    const { recipe, evaluation } = this.view()
    const upgrade = this.stationUpgrade()
    const inventory = this.playerStore.inventory()

    switch (evaluation.blockReason) {
      case 'stationLevel':
        return {
          blocked: true,
          text: i18next.t('camp:reasons.stationLevel', {
            station: stationName(recipe.stationId),
            level: recipe.stationLevel,
            gear: gearName(recipe.stationId, recipe.stationLevel),
          }),
        }
      case 'stationOrder':
        return {
          blocked: true,
          text: i18next.t('camp:reasons.stationOrder', { station: stationName(upgrade!.stationId), level: upgrade!.level - 1 }),
        }
      case 'missingItems': {
        const items = recipe.itemsNeeded
          .map(({ id, amount }) => ({ id, missing: amount - countItem(inventory, id) }))
          .filter(({ missing }) => missing > 0)
          .map(({ id, missing }) => `${missing} ${itemName(id)}`)
          .join(', ')
        return { blocked: true, text: i18next.t('camp:reasons.missingItems', { items }) }
      }
      case 'inventoryFull':
        return { blocked: true, text: i18next.t('camp:reasons.inventoryFull') }
    }

    const size = this.batchSize()
    if (size !== 'max' && Number(size) > evaluation.maxCraftable) {
      return { blocked: false, text: i18next.t('camp:reasons.onlyPossible', { count: evaluation.maxCraftable }) }
    }
    if (upgrade) return { blocked: false, text: i18next.t('camp:appliesOnCraft') }
    return null
  })

  protected readonly ItemID = ItemID
  protected readonly ItemTier = ItemTier
  protected readonly ItemType = ItemType
  protected readonly StationID = StationID

  selectBatchSize(size: number | 'max'): void {
    this.campStore.setBatchSize(size)
  }

  stationName = stationName
}
