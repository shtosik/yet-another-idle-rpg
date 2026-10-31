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
import { countFreeSlots, INVENTORY_PAGE_SIZE, INVENTORY_TABS, InventoryTab, pageCount } from '../../../store/player/inventory'
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
  readonly tabs = INVENTORY_TABS
  tab = signal<InventoryTab>('gear')
  inventory = computed(() => this.playerStore.inventory()[this.tab()])

  private requestedPage = signal(0)

  /** Infinity for an unlimited tab (Quest). */
  capacity = computed(() => this.playerStore.inventoryCapacity()[this.tab()])
  limited = computed(() => Number.isFinite(this.capacity()))
  /** Usable slots, plus items kept past capacity (a migrated save); an unlimited tab shows what it holds. */
  private shownSlots = computed(() => {
    const lastItem = this.inventory().reduce((last, slot, i) => slot ? i : last, -1)
    return Math.max(this.limited() ? this.capacity() : 0, lastItem + 1)
  })
  pages = computed(() => pageCount(this.shownSlots()))
  page = computed(() => Math.min(this.requestedPage(), this.pages() - 1))
  freeSlots = computed(() => countFreeSlots(this.inventory(), this.capacity()))

  /** Absolute inventory indices shown on the current page. */
  slots = computed(() => {
    const start = this.page() * INVENTORY_PAGE_SIZE
    return Array.from({ length: INVENTORY_PAGE_SIZE }, (_, i) => start + i)
  })

  readonly Items = ITEM_DATA

  selectTab(tab: InventoryTab) {
    this.tab.set(tab)
    this.requestedPage.set(0)
  }

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

    const itemData = ITEM_DATA[item.id]
    if (itemData.type === ItemType.chest) {
      const slotsNeeded = this.playerStore.missingChestSlots(item)
      this.modalService.openChestOpened({ contents: this.playerStore.openChest(item), slotsNeeded })
      return
    }

    if (itemData.type === ItemType.spellScroll) {
      if (this.playerStore.knownSpellIds().includes(itemData.spellId)) return
      this.playerStore.useItem(item)
      // Like learning it from the skill tree: onto the spell bar if there's a free slot.
      this.battleManagerService.equipSpell(itemData.spellId)
      return
    }

    this.playerStore.useItem(item)
  }
}
