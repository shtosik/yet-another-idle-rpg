import { CommonModule, NgOptimizedImage } from '@angular/common'
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core'
import { EquipmentSlotKey } from 'enums/equipment-slot.enum'
import { ItemTier } from 'enums/items/item-tier.enum'
import { Item } from 'interfaces/item.interface'
import { TranslatePipe } from '../../../../pipes/i18next.pipe'
import { ItemID } from '../../../../../enums/ids/item-id.enum'
import { TooltipTemplateDirective } from 'ngx-tooltip-directives'
import { ItemType } from '../../../../../enums/items/item-type.enum'
import { StatToPercentagePipe } from '../../../../pipes/stat-to-percentage.pipe'

@Component({
    selector: 'app-equipment-slot',
    templateUrl: 'equipment-slot.component.html',
    styleUrls: ['./equipment-slot.component.sass'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgOptimizedImage, CommonModule, TranslatePipe, TooltipTemplateDirective, StatToPercentagePipe],
})

export class EquipmentItemComponent {
    @Input() item: Item
    @Input() tier: ItemTier
    @Input() slotName: EquipmentSlotKey
    @Input() unequipBlocked = false

    @Output() unequipItem = new EventEmitter<EquipmentSlotKey>()

    ItemTier = ItemTier
    protected readonly ItemID = ItemID
    protected readonly ItemType = ItemType
}
