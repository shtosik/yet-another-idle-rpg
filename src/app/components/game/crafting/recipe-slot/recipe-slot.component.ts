import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core'
import { CraftingRecipe } from '../../../../../data/recipes-data'
import { NgOptimizedImage } from '@angular/common'
import { ItemTier } from '../../../../../enums/items/item-tier.enum'
import { StatToPercentagePipe } from '../../../../pipes/stat-to-percentage.pipe'
import { TranslatePipe } from '../../../../pipes/i18next.pipe'
import { TooltipTemplateDirective } from 'ngx-tooltip-directives'
import { ItemType } from '../../../../../enums/items/item-type.enum'
import { ItemID } from '../../../../../enums/ids/item-id.enum'
import ITEM_DATA from '../../../../../data/items-data'
import { RecipeID } from '../../../../../enums/ids/recipe-id.enum'
import { ConsumableEffectComponent } from '../../../shared/consumable-effect/consumable-effect.component'

@Component({
    selector: 'app-recipe-slot',
    templateUrl: './recipe-slot.component.html',
    styleUrls: ['./recipe-slot.component.sass'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        NgOptimizedImage,
        StatToPercentagePipe,
        TranslatePipe,
        TooltipTemplateDirective,
        ConsumableEffectComponent,
    ],
})
export class RecipeSlot {
    @Input() recipe: CraftingRecipe

    @Output() selectItemToCraft = new EventEmitter<RecipeID>()

    protected readonly ItemTier = ItemTier
    protected readonly ItemType = ItemType
    protected readonly ItemID = ItemID
    protected readonly ITEM_DATA = ITEM_DATA
}
