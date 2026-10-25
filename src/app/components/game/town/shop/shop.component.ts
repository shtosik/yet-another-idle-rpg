import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, output, signal } from '@angular/core'
import { NgOptimizedImage } from '@angular/common'
import i18next from 'i18next'
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
import { CurrencyFeedService } from '../../../../services/currency-feed.service'
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
  imports: [NgOptimizedImage, I18nextPipe, SlotComponent, InventoryItemComponent, CloseButtonComponent],
})
export class ShopComponent implements OnInit {
  private shopStore = inject(ShopStore)
  private playerStore = inject(PlayerStore)
  private modalService = inject(ModalService)
  private currencyFeed = inject(CurrencyFeedService)

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
  currencyIcon = computed(() =>
    this.currency() === 'explorerTokens' ? './assets/img/icons/explorationToken.png' : './assets/img/icons/coin.svg')
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

  /** Click buys one; Shift-click buys up to 5, stopping at the first block (stock, currency, space). */
  buyItem(index: number, event: MouseEvent): void {
    const count = event.shiftKey ? 5 : 1
    let spent = 0
    for (let bought = 0; bought < count && this.canBuy(index); bought++) {
      if (!this.buyOne(index)) break
      spent += this.items()[index].staticItem.price
    }
    if (spent) this.currencyFeed.show(this.currency(), -spent)
  }

  /** Name plus what blocks the purchase, for screen readers (sighted players get the slot's border, lock or fade). */
  buyLabel(index: number, reason: BuyBlockReason): string {
    const { itemId, price, minRank } = this.items()[index].staticItem
    const name = i18next.t(`items:names.${ItemID[itemId]}`)
    switch (reason) {
      case 'stock': {
        const key = this.isNonRefreshableSoldOut(index) ? 'shop:ui.soldOut' : 'shop:ui.restocking'
        return `${name}: ${i18next.t(key)}`
      }
      case 'rank':
        return `${name}: ${i18next.t('shop:ui.needsRank', { rank: minRank })}`
      case 'station':
        return `${name}: ${i18next.t('shop:ui.needsStation', { level: this.requiredStationLevel(index) })}`
      case 'gold':
        return `${name}: ${i18next.t('shop:ui.cantAfford', { price: this.priceLabel(price) })}`
      case 'inventory':
        return `${name}: ${i18next.t('shop:ui.inventoryFull')}`
      default:
        return `${name}: ${this.priceLabel(price)}`
    }
  }

  sellLabel(itemId: ItemID, price: number, preferred: boolean): string {
    const label = `${i18next.t(`items:names.${ItemID[itemId]}`)}: ${this.priceLabel(price)}`
    if (!preferred) return label
    return `${label}, ${i18next.t('shop:ui.preferred')}`
  }

  private priceLabel(amount: number): string {
    if (this.currency() === 'explorerTokens') return i18next.t('shop:ui.tokenPrice', { amount })
    return i18next.t('shop:ui.price', { amount })
  }

  /** Pays for and hands over one item; false when the payment fails. */
  private buyOne(index: number): boolean {
    const { itemId, tier, price } = this.items()[index].staticItem

    if (this.currency() === 'explorerTokens') {
      if (!this.playerStore.spendTokens(price)) return false
    } else {
      this.playerStore.updatePlayerStats([{ stat: 'goldCoins', amount: -price }])
    }
    this.shopStore.buyItem(this.shopId(), index)

    // Spellbook unlocks the tab immediately and is not added to inventory
    if (itemId === ItemID.spellbook) {
      this.playerStore.unlockSpellbook()
      return true
    }

    const installed = this.playerStore.addItems([{ id: itemId, tier, amount: 1 }])
    installed.forEach(id => this.modalService.openStationInstalled(id))
    return true
  }

  /** Click sells one; Ctrl/Cmd-click sells the whole stack. */
  sellItem(item: InventoryItem, event: MouseEvent): void {
    const goldBefore = this.playerStore.resources.goldCoins()
    this.playerStore.sellItem(item, this.shopId(), event.ctrlKey || event.metaKey ? item.amount : 1)
    this.currencyFeed.show('gold', this.playerStore.resources.goldCoins() - goldBefore)
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
