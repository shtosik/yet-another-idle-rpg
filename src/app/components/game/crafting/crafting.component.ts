import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import RECIPES_DATA, { CraftingRecipe } from '../../../../data/recipes-data'
import { RecipeSlot } from './recipe-slot/recipe-slot.component'
import { SlotComponent } from '../../shared/slot/slot.component'
import { RecipeID } from '../../../../enums/ids/recipe-id.enum'
import { TranslatePipe } from '../../../pipes/i18next.pipe'
import { ItemID } from '../../../../enums/ids/item-id.enum'
import { PlayerStore } from '../../../store/player/player.store'

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
  playerInventory = this.playerStore.inventory

  recipesArray = computed(() => {
    const unlocked = this.playerStore.unlockedRecipes()
    return Object.values(RECIPES_DATA).filter(r => !r.requiresUnlock || unlocked.includes(r.id))
  })
  recipeToCraft: RecipeID

  protected readonly RECIPES_DATA = RECIPES_DATA
  protected readonly ItemID = ItemID

  selectItemToCraft(recipe: RecipeID) {
    this.recipeToCraft = recipe
  }

  handleCraftItem(recipe: CraftingRecipe) {
    let cantCraft = false

    recipe.itemsNeeded.forEach((itemNeeded) => {
      const ownedResource = this.playerInventory().find(item => item.id === itemNeeded.id)

      if (!ownedResource || ownedResource.amount < itemNeeded.amount) cantCraft = true
    })

    if (cantCraft) return

    this.playerStore.craftItem(recipe.id)
  }

}
