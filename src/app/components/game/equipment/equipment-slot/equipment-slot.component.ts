import { CommonModule, NgOptimizedImage } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core'
import { EquipmentSlot, EquipmentSlotKey } from 'enums/equipment-slot.enum'
import { ItemTier } from 'enums/items/item-tier.enum'
import { Item } from 'interfaces/item.interface'
import { I18nextPipe } from '../../../../pipes/i18next.pipe'
import { ItemID } from '../../../../../enums/ids/item-id.enum'
import { TooltipTemplateDirective } from 'ngx-tooltip-directives'
import { ItemType } from '../../../../../enums/items/item-type.enum'
import { DamageElement } from '../../../../../enums/damage-element.enum'
import { SpellID } from '../../../../../enums/ids/spell-id.enum'
import { StatToPercentagePipe } from '../../../../pipes/stat-to-percentage.pipe'

@Component({
    selector: 'app-equipment-slot',
    templateUrl: 'equipment-slot.component.html',
    styleUrls: ['./equipment-slot.component.sass'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgOptimizedImage, CommonModule, I18nextPipe, TooltipTemplateDirective, StatToPercentagePipe],
})

export class EquipmentItemComponent {
    readonly item = input<Item | undefined>()
    readonly tier = input<ItemTier | undefined>()
    readonly slotName = input.required<EquipmentSlotKey>()
    readonly unequipBlocked = input(false)
    readonly unequipItem = output<EquipmentSlotKey>()

    readonly hintKey = computed(() => {
        if (!this.item()) return 'app:equipment.emptyHint'
        if (this.unequipBlocked()) return 'items:unequipBlockedInventory'
        return 'items:rightClickToUnequip'
    })

    handleUnequip(): void {
        if (this.item() && !this.unequipBlocked()) this.unequipItem.emit(this.slotName())
    }

    readonly ItemTier = ItemTier
    protected readonly ItemID = ItemID
    protected readonly ItemType = ItemType
    protected readonly DamageElement = DamageElement
    protected readonly EquipmentSlot = EquipmentSlot
    protected readonly SpellID = SpellID
}
