import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, output, signal } from '@angular/core'
import { NgOptimizedImage } from '@angular/common'
import i18next from 'i18next'
import { InventoryItem } from '../../../../../interfaces/item.interface'
import { BuyBlockReason, ShopStore } from '../../../../store/shop/shop.store'
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
import { CurrencyFeedService } from '../../../../services/currency-feed.service'
import { isInstalled, stationUpgradeOf } from '../../../../store/player/camp'
import { isPreferredBy, sellPrice } from '../../../../store/shop/shop-prices'
import { ShopCurrency } from '../../../../../types/shop/shop.type'
import { tabOf } from '../../../../store/player/inventory'
import { tabName } from '../../inventory/tab-text'
import { reputationLockText, tierName } from '../../quests/reputation/reputation-text'

type ShopTab = 'buy' | 'sell'

/** Icon and price text per currency; a new `ShopCurrency` won't compile until it has an entry here. */
const CURRENCY_UI: Record<ShopCurrency, { icon: string; priceKey: string }> = {
  gold: { icon: './assets/img/icons/coin.svg', priceKey: 'shop:ui.price' },
  explorerTokens: { icon: './assets/img/icons/explorationToken.png', priceKey: 'shop:ui.tokenPrice' },
}

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
  private currencyFeed = inject(CurrencyFeedService)

  shopId = input.required<ShopID>()
  /** Stock stage the shop was opened at; items with a higher `minStage` are hidden. */
  stage = input(0)
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

  currency = computed<ShopCurrency>(() => SHOPS_DATA[this.shopId()].currency ?? 'gold')
  currencyIcon = computed(() => CURRENCY_UI[this.currency()].icon)
  /** Shops with `buys: []` (the guild store) have no Sell tab. */
  canSell = computed(() => SHOPS_DATA[this.shopId()].buys?.length !== 0)
  /** Shops with rank-gated stock (the guild store) show the player's Guild rank. */
  showsGuildRank = computed(() => SHOPS_DATA[this.shopId()].items.some(item => item.minRank !== undefined))
  guildRank = this.playerStore.guildRank
  protected readonly tierName = tierName

  /** Inventory stacks this shop buys, at its price. */
  sellable = computed(() => {
    const shopId = this.shopId()
    return Object.values(this.playerStore.inventory()).flat().flatMap(slot => {
      if (!slot) return []
      const price = sellPrice(shopId, slot.id, slot.upgradeLevel)
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

  buyBlockReason(index: number): BuyBlockReason | null {
    return this.shopStore.blockReason(this.shopId(), index)
  }

  /** Click buys one; Shift-click buys up to 5, stopping at the first block (stock, currency, space). */
  buyItem(index: number, event: MouseEvent): void {
    const result = this.shopStore.purchase(this.shopId(), index, event.shiftKey ? 5 : 1)
    if (typeof result === 'string') return
    this.currencyFeed.show(this.currency(), -result.spent)
  }

  /** Name plus what blocks the purchase, for screen readers (sighted players get the slot's border, lock or fade). */
  buyLabel(index: number, reason: BuyBlockReason | null): string {
    const { itemId, price, minRank } = this.items()[index].staticItem
    const name = i18next.t(`items:names.${ItemID[itemId]}`)
    switch (reason) {
      case 'stock': {
        const key = this.isNonRefreshableSoldOut(index) ? 'shop:ui.soldOut' : 'shop:ui.restocking'
        return `${name}: ${i18next.t(key)}`
      }
      case 'rank':
        return `${name}: ${i18next.t('shop:ui.needsRank', { rank: minRank })}`
      case 'reputation':
        return `${name}: ${this.reputationLock(index)}`
      case 'station':
        return `${name}: ${i18next.t('shop:ui.needsStation', { level: this.requiredStationLevel(index) })}`
      case 'currency':
        return `${name}: ${i18next.t('shop:ui.cantAfford', { price: this.priceLabel(this.currency(), price) })}`
      case 'inventory':
        return `${name}: ${i18next.t('shop:ui.inventoryFull', { tab: tabName(tabOf(itemId)) })}`
      default:
        return `${name}: ${this.priceLabel(this.currency(), price)}`
    }
  }

  /** "Requires Mawood Honored — 140/200"; empty for items without a tier lock. */
  reputationLock(index: number): string {
    const minReputation = this.items()[index].staticItem.minReputation
    if (!minReputation) return ''
    const { reputationId, tier } = minReputation
    return reputationLockText(reputationId, tier, this.playerStore.reputation()[reputationId] ?? 0)
  }

  /** Shops always pay gold for what they buy. */
  sellLabel(itemId: ItemID, price: number, preferred: boolean, upgradeLevel = 0): string {
    let name = i18next.t(`items:names.${ItemID[itemId]}`)
    if (upgradeLevel > 0) name = i18next.t('items:upgradedName', { name, level: upgradeLevel })
    const label = `${name}: ${this.priceLabel('gold', price)}`
    if (!preferred) return label
    return `${label}, ${i18next.t('shop:ui.preferred')}`
  }

  private priceLabel(currency: ShopCurrency, amount: number): string {
    return i18next.t(CURRENCY_UI[currency].priceKey, { amount })
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
