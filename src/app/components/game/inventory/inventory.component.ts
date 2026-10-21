import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { SlotComponent } from 'app/components/shared/slot/slot.component'
import ITEM_DATA from 'data/items-data'
import { InventoryItem, isConsumableItem } from 'interfaces/item.interface'
import { InventoryItemComponent } from './inventory-slot/inventory-slot.component'
import { PlayerStore } from '../../../store/player/player.store'
import { ItemType } from '../../../../enums/items/item-type.enum'
import { BattleManagerService } from '../../../services/battle-manager.service'
import { ModalService } from '../../../services/modal.service'

@Component({
  selector: 'app-inventory',
  templateUrl: 'inventory.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./inventory.component.sass'],
  imports: [SlotComponent, CommonModule, InventoryItemComponent],
})

export class InventoryWindow {
  playerStore = inject(PlayerStore)
  private battleManagerService = inject(BattleManagerService)
  private modalService = inject(ModalService)
  inventory = this.playerStore.inventory
  slots = computed(() => new Array(this.inventory().length).fill(1))

  readonly Items = ITEM_DATA

  equipItem(item: InventoryItem) {
    if (item.type === ItemType.equipment) this.playerStore.equipItem(item)
  }

  useItem(item: InventoryItem) {
    if (item.type === ItemType.stationUpgrade) {
      if (this.playerStore.installStationItem(item)) this.modalService.openStationInstalled(item.id)
      return
    }

    if (isConsumableItem(ITEM_DATA[item.id])) {
      this.battleManagerService.useConsumable(item.id)
      return
    }

    this.playerStore.useItem(item)
  }
}
