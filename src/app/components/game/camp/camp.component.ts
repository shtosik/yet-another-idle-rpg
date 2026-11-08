import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { NgOptimizedImage } from '@angular/common'
import { PlayerStore } from '../../../store/player/player.store'
import { NoticesService } from '../../../services/notices.service'
import { CampStore } from '../../../store/camp/camp.store'
import { I18nextPipe } from '../../../pipes/i18next.pipe'
import STATIONS_DATA from '../../../../data/stations-data'
import RECIPES_DATA from '../../../../data/recipes-data'
import ITEM_DATA from '../../../../data/items-data'
import { evaluateRecipe, stationLevel } from '../../../store/player/camp'
import { StationID } from '../../../../enums/ids/station-id.enum'
import { ItemID } from '../../../../enums/ids/item-id.enum'
import { ItemTier } from '../../../../enums/items/item-tier.enum'
import { RecipeDetailComponent } from './recipe-detail/recipe-detail.component'
import { RecipeView } from './recipe-view'


@Component({
  selector: 'app-camp',
  templateUrl: './camp.component.html',
  styleUrls: ['./camp.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgOptimizedImage,
    I18nextPipe,
    RecipeDetailComponent,
  ],
})
export class CampComponent {
  private playerStore = inject(PlayerStore)
  private campStore = inject(CampStore)

  /** Owned stations in data order. Unowned ones are hidden. */
  stations = computed(() => {
    const stations = this.playerStore.stations()
    return Object.values(STATIONS_DATA)
      .map(station => ({ station, level: stationLevel(stations, station.id) }))
      .filter(({ level }) => level > 0)
  })

  activeStation = computed(() => {
    const owned = this.stations()
    return owned.find(({ station }) => station.id === this.campStore.selectedStationId()) ?? owned[0]
  })

  /** Visible recipes of the active station, always in RecipeID order. */
  recipes = computed<RecipeView[]>(() => {
    const active = this.activeStation()
    if (!active) return []

    const inventory = this.playerStore.inventory()
    const capacity = this.playerStore.inventoryCapacity()
    const stations = this.playerStore.stations()
    const unlockedRecipes = this.playerStore.unlockedRecipes()

    return Object.values(RECIPES_DATA)
      .filter(recipe => recipe.stationId === active.station.id)
      .map(recipe => ({
        recipe,
        item: ITEM_DATA[recipe.itemId]!,
        evaluation: evaluateRecipe(recipe, inventory, capacity, stations, unlockedRecipes),
      }))
      .filter(view => view.evaluation.visible)
  })

  craftableOnly = this.campStore.craftableOnly

  filteredRecipes = computed(() =>
    this.craftableOnly() ? this.recipes().filter(view => view.evaluation.maxCraftable > 0) : this.recipes())

  /** Stays on the chosen recipe even when a filter hides it, so crafting the last batch doesn't swap the detail. */
  selectedRecipe = computed(() => {
    const recipes = this.recipes()
    const active = this.activeStation()
    const selectedId = active && this.campStore.selectedRecipes()[active.station.id]
    return recipes.find(view => view.recipe.id === selectedId) ?? this.filteredRecipes()[0] ?? recipes[0] ?? null
  })

  private notices = inject(NoticesService)
  toast = this.notices.toast('camp')

  protected readonly StationID = StationID
  protected readonly ItemID = ItemID
  protected readonly ItemTier = ItemTier

  selectStation(stationId: StationID): void {
    this.campStore.selectStation(stationId)
  }

  selectRecipe(view: RecipeView): void {
    this.campStore.selectRecipe(view.recipe.stationId, view.recipe.id)
  }

  toggleCraftableOnly(): void {
    this.campStore.toggleCraftableOnly()
  }

  craft(view: RecipeView, times: number): void {
    // Pin it: a fallback selection would otherwise jump once crafting hides it from the Craftable filter.
    this.selectRecipe(view)
    const { crafted, installed } = this.playerStore.craftItem(view.recipe.id, times)
    if (!crafted) return

    if (installed.length) return // the store shows the installed notice

    this.notices.push({ type: 'crafted', itemId: view.recipe.itemId, count: crafted * view.recipe.createsAmount })
  }
}
