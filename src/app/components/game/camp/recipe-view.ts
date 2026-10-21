import { CraftingRecipe } from '../../../../data/recipes-data'
import { Item } from '../../../../interfaces/item.interface'
import { RecipeEvaluation } from '../../../store/player/camp'

export interface RecipeView {
  recipe: CraftingRecipe
  item: Item
  evaluation: RecipeEvaluation
}
