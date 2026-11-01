import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ShopComponent } from './shop.component'
import { ShopStore } from '../../../../store/shop/shop.store'
import { PlayerStore } from '../../../../store/player/player.store'
import { ShopID } from '../../../../../enums/ids/shop-id.enum'
import { ItemID } from '../../../../../enums/ids/item-id.enum'
import { TownID } from '../../../../../enums/map/town-id.enum'
import SHOPS_DATA from '../../../../../data/shops-data'

describe('ShopComponent reputation lock', () => {
  let shop: ShopComponent
  let playerStore: InstanceType<typeof PlayerStore>
  const boots = SHOPS_DATA[ShopID.laHarparShop].items.findIndex(item => item.itemId === ItemID.wharfRunnersBoots)

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    TestBed.inject(ShopStore).ensureShop(ShopID.laHarparShop)
    playerStore = TestBed.inject(PlayerStore)
    const fixture = TestBed.createComponent(ShopComponent)
    fixture.componentRef.setInput('shopId', ShopID.laHarparShop)
    shop = fixture.componentInstance
  })

  afterEach(() => localStorage.clear())

  it('shows the lock before the price, and lifts it at Honored', () => {
    expect(shop.buyBlockReason(boots)).toBe('reputation')

    playerStore.addReputation([{ townId: TownID.laHarpar, amount: 200 }])
    expect(shop.buyBlockReason(boots)).toBe('currency')

    playerStore.updatePlayerStats([{ stat: 'goldCoins', amount: 3000 }])
    expect(shop.buyBlockReason(boots)).toBeNull()
  })
})
