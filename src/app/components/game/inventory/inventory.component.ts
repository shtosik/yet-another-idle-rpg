import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { SlotComponent } from 'app/components/shared/slot/slot.component'
import ITEM_DATA from 'data/items-data'
import { InventoryItem, isConsumableItem } from 'interfaces/item.interface'
import { InventoryItemComponent } from './inventory-slot/inventory-slot.component'
import { PlayerStore } from '../../../store/player/player.store'
import { ItemType } from '../../../../enums/items/item-type.enum'
import { BattleManagerService } from '../../../services/battle-manager.service'
import { ModalService } from '../../../services/modal.service'
import { countFreeSlots, INVENTORY_PAGE_SIZE, pageCount } from '../../../store/player/inventory'
import { I18nextPipe } from '../../../pipes/i18next.pipe'

@Component({
  selector: 'app-inventory',
  templateUrl: 'inventory.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./inventory.component.sass'],
  imports: [SlotComponent, CommonModule, InventoryItemComponent, I18nextPipe],
})

export class InventoryWindow {
  playerStore = inject(PlayerStore)
  private battleManagerService = inject(BattleManagerService)
  private modalService = inject(ModalService)
  inventory = this.playerStore.inventory

  private requestedPage = signal(0)

  capacity = computed(() => this.playerStore.stats().inventorySlots)
  pages = computed(() => pageCount(this.capacity()))
  page = computed(() => Math.min(this.requestedPage(), this.pages() - 1))
  freeSlots = computed(() => countFreeSlots(this.inventory(), this.capacity()))

  /** Absolute inventory indices shown on the current page. */
  slots = computed(() => {
    const start = this.page() * INVENTORY_PAGE_SIZE
    return Array.from({ length: INVENTORY_PAGE_SIZE }, (_, i) => start + i)
  })

  readonly Items = ITEM_DATA

  changePage(delta: number) {
    this.requestedPage.set(Math.min(Math.max(this.page() + delta, 0), this.pages() - 1))
  }

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
