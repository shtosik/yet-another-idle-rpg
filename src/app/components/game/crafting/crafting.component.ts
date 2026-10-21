import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import RECIPES_DATA from '../../../../data/recipes-data'
import { RecipeSlot } from './recipe-slot/recipe-slot.component'
import { SlotComponent } from '../../shared/slot/slot.component'
import { RecipeID } from '../../../../enums/ids/recipe-id.enum'
import { TranslatePipe } from '../../../pipes/i18next.pipe'
import { ItemID } from '../../../../enums/ids/item-id.enum'
import { PlayerStore } from '../../../store/player/player.store'
import { canFit, maxAffordable, removeItems } from '../../../store/player/inventory'

@Component({
  selector: 'app-crafting',
  templateUrl: './crafting.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./crafting.component.sass'],
  imports: [
    RecipeSlot,
    SlotComponent,
    TranslatePipe,
  ],
})
export class CraftingComponent {
  playerStore = inject(PlayerStore)

  readonly batchSizes = [1, 5, 10]

  recipesArray = computed(() => {
    const unlocked = this.playerStore.unlockedRecipes()
    return Object.values(RECIPES_DATA).filter(r => !r.requiresUnlock || unlocked.includes(r.id))
  })

  selectedRecipeId = signal<RecipeID | null>(null)
  selectedRecipe = computed(() => {
    const id = this.selectedRecipeId()
    return id === null ? null : RECIPES_DATA[id] ?? null
  })

  maxCraftable = computed(() => {
    const recipe = this.selectedRecipe()
    return recipe ? maxAffordable(this.playerStore.inventory(), recipe.itemsNeeded) : 0
  })

  // Paying for one craft can free a slot, so check space after the ingredients are gone.
  hasRoomForResult = computed(() => {
    const recipe = this.selectedRecipe()
    if (!recipe) return false
    return canFit(removeItems(this.playerStore.inventory(), recipe.itemsNeeded), recipe.itemId)
  })

  canCraft = computed(() => this.maxCraftable() > 0 && this.hasRoomForResult())

  protected readonly ItemID = ItemID

  selectItemToCraft(recipe: RecipeID) {
    this.selectedRecipeId.set(recipe)
  }

  ownedCount(id: ItemID): number {
    return this.playerStore.itemCount(id)
  }

  handleCraftItem(times: number) {
    const recipe = this.selectedRecipe()
    if (!recipe || !this.canCraft()) return

    this.playerStore.craftItem(recipe.id, times)
  }
}
