import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { SlotComponent } from 'app/components/shared/slot/slot.component'
import ITEM_DATA from 'data/items-data'
import { InventoryItem } from 'interfaces/item.interface'
import { InventoryItemComponent } from './inventory-slot/inventory-slot.component'
import { PlayerStore } from '../../../store/player/player.store'
import { ItemType } from '../../../../enums/items/item-type.enum'

@Component({
  selector: 'app-inventory',
  templateUrl: 'inventory.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./inventory.component.sass'],
  imports: [SlotComponent, CommonModule, InventoryItemComponent],
})

export class InventoryWindow {
  playerStore = inject(PlayerStore)
  inventory = this.playerStore.inventory
  slots = new Array(40).fill(1)

  readonly Items = ITEM_DATA

  equipItem(item: InventoryItem) {
    if (item.type === ItemType.equipment) this.playerStore.equipItem(item)
  }
}
