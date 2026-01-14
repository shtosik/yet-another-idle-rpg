import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { SlotComponent } from 'app/components/shared/slot/slot.component'
import { EquipmentSlotKey } from 'enums/equipment-slot.enum'
import { EquipmentItem } from 'interfaces/item.interface'
import { EquipmentItemComponent } from './equipment-slot/equipment-slot.component'
import ITEM_DATA from 'data/items-data'
import { PlayerStore } from '../../../store/player/player.store'

@Component({
    selector: 'app-equipment',
    templateUrl: 'equipment.component.html',
    styleUrls: ['./equipment.component.sass'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, SlotComponent, EquipmentItemComponent],
})

export class EquipmentComponent {
    playerStore = inject(PlayerStore)
    equipmentArray = computed(() => {
        const equipment = this.playerStore.equipment()
        return Object.entries(equipment).map(([name, item]) => ({
            name,
            item,
        })) as { name: EquipmentSlotKey, item: EquipmentItem }[]
    })

    readonly Items = ITEM_DATA

    unequipItem(slot: EquipmentSlotKey) {
        this.playerStore.unequipItem(slot)
    }
}
