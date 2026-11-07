import { NgOptimizedImage } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { SlotComponent } from 'app/components/shared/slot/slot.component'
import { I18nextPipe } from 'app/pipes/i18next.pipe'
import { EquipmentSlotKey } from 'enums/equipment-slot.enum'
import { EquipmentItemComponent } from './equipment-slot/equipment-slot.component'
import ITEM_DATA from 'data/items-data'
import { PlayerStore } from '../../../store/player/player.store'

@Component({
    selector: 'app-equipment',
    templateUrl: 'equipment.component.html',
    styleUrls: ['./equipment.component.sass'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgOptimizedImage, SlotComponent, EquipmentItemComponent, I18nextPipe],
})
export class EquipmentComponent {
    readonly playerStore = inject(PlayerStore)
    // Grid order, row by row, left to right: DOM order is the Tab and screen reader order.
    readonly slots = [
        'helmet', 'amulet', 'chest', 'cape', 'weapon', 'belt',
        'gloves', 'ring', 'legs', 'pet', 'boots',
    ] satisfies EquipmentSlotKey[]
    readonly equipment = this.playerStore.equipment
    readonly equippedCount = computed(() => this.slots.filter(slot => this.equipment()[slot]).length)
    readonly Items = ITEM_DATA

    unequipItem(slot: EquipmentSlotKey): void {
        this.playerStore.unequipItem(slot)
    }
}
