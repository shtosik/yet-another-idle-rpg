import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, output, signal } from '@angular/core'
import { InventoryItem } from '../../../../../interfaces/item.interface'
import { ShopStore } from '../../../../store/shop/shop.store'
import { PlayerStore } from '../../../../store/player/player.store'
import { ShopID } from '../../../../../enums/ids/shop-id.enum'
import SHOPS_DATA from '../../../../../data/shops-data'
import ITEM_DATA from '../../../../../data/items-data'
import { ItemTier } from '../../../../../enums/items/item-tier.enum'
import { ItemID } from '../../../../../enums/ids/item-id.enum'
import { I18nextPipe } from '../../../../pipes/i18next.pipe'
import { SlotComponent } from '../../../shared/slot/slot.component'
import { InventoryItemComponent } from '../../inventory/inventory-slot/inventory-slot.component'
import { CloseButtonComponent } from '../../../shared/close-button/close-button.component'
import { ModalService } from '../../../../services/modal.service'
import { GoldFeedService } from '../../../../services/gold-feed.service'
import { canInstall, isInstalled, stationUpgradeOf } from '../../../../store/player/camp'
import { isPreferredBy, sellPrice } from '../../../../store/shop/shop-prices'

/** `gold` means the shop's currency (gold or Explorer Tokens) runs short. */
type BuyBlockReason = 'stock' | 'rank' | 'gold' | 'inventory' | 'station' | null
type ShopTab = 'buy' | 'sell'

@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [I18nextPipe, SlotComponent, InventoryItemComponent, CloseButtonComponent],
})
export class ShopComponent implements OnInit {
  private shopStore = inject(ShopStore)
  private playerStore = inject(PlayerStore)
  private modalService = inject(ModalService)
  private goldFeed = inject(GoldFeedService)

  shopId = input.required<ShopID>()
  closed = output<void>()

  get staticShop() { return SHOPS_DATA[this.shopId()] }
  protected readonly ITEM_DATA = ITEM_DATA

  items = computed(() => {
    const id = this.shopId()
    const runtime = this.shopStore.shops()[id]
    if (!runtime) return []

    return SHOPS_DATA[id].items.map((staticItem, index) => ({
      staticItem,
      runtime: runtime.items[index],
      itemData: ITEM_DATA[staticItem.itemId],
    }))
  })

  tab = signal<ShopTab>('buy')

  currency = computed(() => SHOPS_DATA[this.shopId()].currency ?? 'gold')
  /** Shops with `buys: []` (the guild store) have no Sell tab. */
  canSell = computed(() => SHOPS_DATA[this.shopId()].buys?.length !== 0)
  guildRank = this.playerStore.guildRank
  balance = computed(() =>
    this.currency() === 'explorerTokens' ? this.playerStore.explorerTokens() : this.playerStore.stats().goldCoins,
  )

  /** Inventory stacks this shop buys, at its price. */
  sellable = computed(() => {
    const shopId = this.shopId()
    return this.playerStore.inventory().flatMap(slot => {
      if (!slot) return []
      const price = sellPrice(shopId, slot.id)
      return price > 0 ? [{ slot, itemData: ITEM_DATA[slot.id], price, preferred: isPreferredBy(shopId, slot.id) }] : []
    })
  })

  cooldownLabel = computed(() => {
    const runtime = this.shopStore.shops()[this.shopId()]
    const ms = runtime?.cooldownRemainingMs ?? 0
    return this.formatMs(ms)
  })

  ngOnInit(): void {
    this.shopStore.ensureShop(this.shopId())
  }

  buyBlockReason(index: number): BuyBlockReason {
    const entry = this.items()[index]
    if (!entry) return 'stock'

    if (entry.runtime.currentStock <= 0) return 'stock'

    if ((entry.staticItem.minRank ?? 0) > this.guildRank()) return 'rank'

    if (this.balance() < entry.staticItem.price) return 'gold'

    // Station gear installs on purchase and never takes a slot, but must follow the previous level.
    const upgrade = stationUpgradeOf(entry.staticItem.itemId)
    if (upgrade) return canInstall(this.playerStore.stations(), upgrade) ? null : 'station'

    // The spellbook unlocks a tab and never enters the inventory.
    const { itemId, tier } = entry.staticItem
    if (itemId !== ItemID.spellbook && !this.playerStore.canFitItems([{ id: itemId, tier, amount: 1 }])) {
      return 'inventory'
    }

    return null
  }

  canBuy(index: number): boolean {
    return this.buyBlockReason(index) === null
  }

  buyItem(index: number): void {
    if (!this.canBuy(index)) return

    const entry = this.items()[index]
    const { itemId, tier, price } = entry.staticItem

    if (this.currency() === 'explorerTokens') {
      if (!this.playerStore.spendTokens(price)) return
    } else {
      this.playerStore.updatePlayerStats([{ stat: 'goldCoins', amount: -price }])
      this.goldFeed.show(-price)
    }
    this.shopStore.buyItem(this.shopId(), index)

    // Spellbook unlocks the tab immediately and is not added to inventory
    if (itemId === ItemID.spellbook) {
      this.playerStore.unlockSpellbook()
      return
    }

    const installed = this.playerStore.addItems([{ id: itemId, tier, amount: 1 }])
    installed.forEach(id => this.modalService.openStationInstalled(id))
  }

  /** Click sells one; Ctrl/Cmd-click sells the whole stack. */
  sellItem(item: InventoryItem, event: MouseEvent): void {
    const goldBefore = this.playerStore.stats().goldCoins
    this.playerStore.sellItem(item, this.shopId(), event.ctrlKey || event.metaKey ? item.amount : 1)
    this.goldFeed.show(this.playerStore.stats().goldCoins - goldBefore)
  }

  /** Station gear the player already owns is hidden from shops. */
  isInstalledStation(index: number): boolean {
    const entry = this.items()[index]
    const upgrade = entry && stationUpgradeOf(entry.staticItem.itemId)
    return !!upgrade && isInstalled(this.playerStore.stations(), upgrade)
  }

  /** Level the station must be at before this gear can be bought. */
  requiredStationLevel(index: number): number {
    return (stationUpgradeOf(this.items()[index].staticItem.itemId)?.level ?? 1) - 1
  }

  isNonRefreshableSoldOut(index: number): boolean {
    const entry = this.items()[index]
    return !!entry && !entry.staticItem.refreshable && entry.runtime.currentStock <= 0
  }

  close(): void {
    this.closed.emit()
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
