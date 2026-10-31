import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal, viewChildren } from '@angular/core'
import { SlotComponent } from 'app/components/shared/slot/slot.component'
import ITEM_DATA from 'data/items-data'
import { InventoryItem, isConsumableItem } from 'interfaces/item.interface'
import { InventoryItemComponent } from './inventory-slot/inventory-slot.component'
import { PlayerStore } from '../../../store/player/player.store'
import { ItemType } from '../../../../enums/items/item-type.enum'
import { BattleManagerService } from '../../../services/battle-manager.service'
import { ModalService } from '../../../services/modal.service'
import { countFreeSlots, INVENTORY_PAGE_SIZE, INVENTORY_TABS, InventoryTab, pageCount, SLOT_TABS } from '../../../store/player/inventory'
import { missingSlotsText } from './tab-text'
import { firstValueFrom } from 'rxjs'
import { needsDestroyConfirm, SettingsStore } from '../../../store/settings/settings.store'
import { I18nextPipe } from '../../../pipes/i18next.pipe'

const isSlotTab = (tab: InventoryTab): boolean => (SLOT_TABS as readonly InventoryTab[]).includes(tab)

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
  private settingsStore = inject(SettingsStore)
  tab = signal<InventoryTab>('gear')
  inventory = computed(() => this.playerStore.inventory()[this.tab()])
  private tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton')

  /** Each tab's button text ("Materials 16/20", "Quest 3") and whether a slot tab has no free slot left. */
  tabs = computed(() => {
    const inventories = this.playerStore.inventory()
    const capacities = this.playerStore.inventoryCapacity()
    return INVENTORY_TABS.map(tab => {
      const used = inventories[tab].filter(Boolean).length
      const capacity = capacities[tab]
      const count = Number.isFinite(capacity) ? `${used}/${capacity}` : `${used}`
      // Pets and Quest never fill, so only slot tabs get the full cue.
      const full = isSlotTab(tab) && countFreeSlots(inventories[tab], capacity) === 0
      return { tab, count, full }
    })
  })

  private requestedPage = signal(0)

  /** Infinity for an unlimited tab (Quest). */
  capacity = computed(() => this.playerStore.inventoryCapacity()[this.tab()])
  /** Pets and Quest list what they hold; slot tabs show every slot, empty and locked ones too. */
  listsItemsOnly = computed(() => !isSlotTab(this.tab()))
  /** Inventory indices to show: usable slots plus items kept past capacity (a migrated save), padded to full pages. */
  private shownIndices = computed(() => {
    const inventory = this.inventory()
    if (this.listsItemsOnly()) return inventory.flatMap((slot, i) => slot ? [i] : [])
    const lastItem = inventory.reduce((last, slot, i) => slot ? i : last, -1)
    const length = pageCount(Math.max(this.capacity(), lastItem + 1)) * INVENTORY_PAGE_SIZE
    return Array.from({ length }, (_, i) => i)
  })
  pages = computed(() => pageCount(this.shownIndices().length))
  page = computed(() => Math.min(this.requestedPage(), this.pages() - 1))

  /** Absolute inventory indices shown on the current page. */
  slots = computed(() => this.shownIndices().slice(this.page() * INVENTORY_PAGE_SIZE, (this.page() + 1) * INVENTORY_PAGE_SIZE))

  readonly Items = ITEM_DATA
  protected readonly ItemType = ItemType

  selectTab(tab: InventoryTab) {
    this.tab.set(tab)
    this.requestedPage.set(0)
  }

  /** Arrow keys, Home and End move between tabs (roving tabindex), as in the quests panel. */
  onTabKeydown(event: KeyboardEvent): void {
    const index = INVENTORY_TABS.indexOf(this.tab())
    let next: number
    switch (event.key) {
      case 'ArrowRight':
        next = (index + 1) % INVENTORY_TABS.length
        break
      case 'ArrowLeft':
        next = (index - 1 + INVENTORY_TABS.length) % INVENTORY_TABS.length
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = INVENTORY_TABS.length - 1
        break
      default:
        return
    }
    event.preventDefault()
    this.selectTab(INVENTORY_TABS[next])
    this.tabButtons()[next]?.nativeElement.focus()
  }

  changePage(delta: number) {
    this.requestedPage.set(Math.min(Math.max(this.page() + delta, 0), this.pages() - 1))
  }

  equipItem(item: InventoryItem) {
    if (item.type === ItemType.equipment) this.playerStore.equipItem(item)
  }

  /** Asks first when the item's tier is at or above the setting; quest items are never destroyed. */
  async destroyItem(item: InventoryItem) {
    if (item.type === ItemType.quest) return
    if (needsDestroyConfirm(item.tier, this.settingsStore.confirmDestroyFromTier())) {
      const confirmed = await firstValueFrom(this.modalService.openDestroyConfirm(item).afterClosed())
      if (!confirmed) return
    }
    this.playerStore.destroyItem(item)
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
      const { contents, missing } = this.playerStore.openChest(item)
      this.modalService.openChestOpened({ contents, slotsNeeded: missingSlotsText(missing) })
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
