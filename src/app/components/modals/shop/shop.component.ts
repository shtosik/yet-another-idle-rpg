import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { ShopStore } from '../../../store/shop/shop.store'
import { PlayerStore } from '../../../store/player/player.store'
import { ShopID } from '../../../../enums/ids/shop-id.enum'
import SHOPS_DATA from '../../../../data/shops-data'
import ITEM_DATA from '../../../../data/items-data'
import { ItemTier } from '../../../../enums/items/item-tier.enum'
import { ItemID } from '../../../../enums/ids/item-id.enum'
import { ItemType } from '../../../../enums/items/item-type.enum'
import { TranslatePipe } from '../../../pipes/i18next.pipe'
import { SlotComponent } from '../../shared/slot/slot.component'
import { InventoryItemComponent } from '../../game/inventory/inventory-slot/inventory-slot.component'
import { CloseButtonComponent } from '../../shared/close-button/close-button.component'

type BuyBlockReason = 'stock' | 'gold' | 'inventory' | null

@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, SlotComponent, InventoryItemComponent, CloseButtonComponent],
})
export class ShopComponent implements OnInit {
  private modalRef = inject(MatDialogRef)
  private shopStore = inject(ShopStore)
  private playerStore = inject(PlayerStore)
  readonly shopId = inject<{ shopId: ShopID }>(MAT_DIALOG_DATA).shopId

  readonly staticShop = SHOPS_DATA[this.shopId]
  protected readonly ITEM_DATA = ITEM_DATA

  items = computed(() => {
    const runtime = this.shopStore.shops()[this.shopId]
    if (!runtime) return []

    return this.staticShop.items.map((staticItem, index) => ({
      staticItem,
      runtime: runtime.items[index],
      itemData: ITEM_DATA[staticItem.itemId],
    }))
  })

  cooldownLabel = computed(() => {
    const runtime = this.shopStore.shops()[this.shopId]
    const ms = runtime?.cooldownRemainingMs ?? 0
    return this.formatMs(ms)
  })

  ngOnInit(): void {
    this.shopStore.ensureShop(this.shopId)
  }

  buyBlockReason(index: number): BuyBlockReason {
    const entry = this.items()[index]
    if (!entry) return 'stock'

    if (entry.runtime.currentStock <= 0) return 'stock'

    if (this.playerStore.stats().goldCoins < entry.staticItem.price) return 'gold'

    const inventory = this.playerStore.inventory()
    const hasStack = inventory.some(
      slot => slot?.id === entry.staticItem.itemId && slot?.tier === entry.staticItem.tier,
    )
    const hasEmpty = inventory.some(slot => slot === null)
    if (!hasStack && !hasEmpty) return 'inventory'

    return null
  }

  canBuy(index: number): boolean {
    return this.buyBlockReason(index) === null
  }

  buyItem(index: number): void {
    if (!this.canBuy(index)) return

    const entry = this.items()[index]
    const { itemId, tier, price } = entry.staticItem

    this.playerStore.updatePlayerStats([{ stat: 'goldCoins', amount: -price }])
    this.playerStore.updatePlayerInventory([{
      id: itemId,
      tier,
      type: ITEM_DATA[itemId].type as ItemType,
      amount: 1,
    }])
    this.shopStore.buyItem(this.shopId, index)
  }

  isNonRefreshableSoldOut(index: number): boolean {
    const entry = this.items()[index]
    return !!entry && !entry.staticItem.refreshable && entry.runtime.currentStock <= 0
  }

  close(): void {
    this.modalRef.close()
  }

  protected readonly ItemTier = ItemTier
  protected readonly ItemID = ItemID

  private formatMs(ms: number): string {
    const totalSec = Math.max(0, Math.floor(ms / 1000))
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    const mm = String(m).padStart(2, '0')
    const ss = String(s).padStart(2, '0')
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
  }
}
