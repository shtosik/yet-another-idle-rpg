import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { patchState, WritableStateSource } from '@ngrx/signals'
import { PlayerStore } from '../player/player.store'
import { TASKS_PER_GUILD_RANK } from '../player/tasks'
import { tabOf } from '../player/inventory'
import { PurchaseResult, ShopStore } from './shop.store'
import { ShopID } from '../../../enums/ids/shop-id.enum'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { ReputationID } from '../../../enums/reputation-id.enum'
import SHOPS_DATA from '../../../data/shops-data'
import ITEM_DATA from '../../../data/items-data'

describe('ShopStore purchase', () => {
  let shop: InstanceType<typeof ShopStore>
  let player: InstanceType<typeof PlayerStore>
  const indexOf = (shopId: ShopID, itemId: ItemID) => SHOPS_DATA[shopId].items.findIndex(item => item.itemId === itemId)
  const give = (gold: number) => player.updatePlayerStats([{ stat: 'goldCoins', amount: gold - player.stats().goldCoins }])
  const stockOf = (shopId: ShopID, index: number) => shop.shops()[shopId]!.items[index].currentStock
  const patchPlayer = (state: object) => patchState(player as unknown as WritableStateSource<object>, state)

  const boots = indexOf(ShopID.laHarparShop, ItemID.wharfRunnersBoots)
  const spellbook = indexOf(ShopID.mawoodMagicShop, ItemID.spellbook)
  const altar = indexOf(ShopID.mawoodMagicShop, ItemID.runeAltar)
  const runes = indexOf(ShopID.mawoodMagicShop, ItemID.earthRune)
  const satchel = indexOf(ShopID.explorersGuildStore, ItemID.guildSatchel)
  const potion = indexOf(ShopID.explorersGuildStore, ItemID.minorManaPotion)

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    shop = TestBed.inject(ShopStore)
    player = TestBed.inject(PlayerStore)
    Object.values(ShopID).filter(Number.isFinite).forEach(id => shop.ensureShop(id as ShopID))
  })

  afterEach(() => localStorage.clear())

  it('blocks on reputation before currency, then lifts', () => {
    expect(shop.blockReason(ShopID.laHarparShop, boots)).toBe('reputation')
    player.addReputation([{ reputationId: ReputationID.laHarpar, amount: 200 }])
    expect(shop.blockReason(ShopID.laHarparShop, boots)).toBe('currency')
    give(3000)
    expect(shop.blockReason(ShopID.laHarparShop, boots)).toBeNull()
  })

  it('blocks on stock first, and on a missing item', () => {
    give(100000)
    expect(shop.purchase(ShopID.mawoodMagicShop, spellbook)).toEqual(jasmine.objectContaining({ bought: 1 }))
    expect(shop.blockReason(ShopID.mawoodMagicShop, spellbook)).toBe('stock')
    expect(shop.purchase(ShopID.mawoodMagicShop, spellbook)).toBe('stock')
    expect(shop.blockReason(ShopID.mawoodMagicShop, 999)).toBe('stock')
  })

  it('blocks on Guild rank before the token balance', () => {
    expect(shop.blockReason(ShopID.explorersGuildStore, satchel)).toBe('rank')
    patchPlayer({ totalTasksCompleted: TASKS_PER_GUILD_RANK })
    expect(shop.blockReason(ShopID.explorersGuildStore, satchel)).toBe('currency')
  })

  it('blocks on a full inventory tab, and on station order', () => {
    give(100000)
    const tab = tabOf(ItemID.earthRune)
    const filler = (Object.keys(ITEM_DATA).map(Number) as ItemID[])
      .filter(id => tabOf(id) === tab && id !== ItemID.earthRune)
      .slice(0, player.inventoryCapacity()[tab])
    player.grant(filler.map(id => ({ id, amount: 1 })), 'lossy')
    expect(shop.blockReason(ShopID.mawoodMagicShop, runes)).toBe('inventory')

    // Altar installs without a slot; once installed, a restocked copy fails the station order.
    expect(shop.purchase(ShopID.mawoodMagicShop, altar)).toEqual({ bought: 1, spent: 1000, installed: [ItemID.runeAltar] })
    shop.resetState()
    shop.ensureShop(ShopID.mawoodMagicShop)
    expect(shop.blockReason(ShopID.mawoodMagicShop, altar)).toBe('station')
  })

  it('pays, takes stock and adds the item', () => {
    give(100)
    const result = shop.purchase(ShopID.mawoodMagicShop, runes, 3) as PurchaseResult
    expect(result).toEqual({ bought: 3, spent: 75, installed: [] })
    expect(player.stats().goldCoins).toBe(25)
    expect(player.itemCount(ItemID.earthRune)).toBe(3)
    expect(stockOf(ShopID.mawoodMagicShop, runes)).toBe(96)
  })

  it('stops a multi-buy at the first block and keeps what it bought', () => {
    give(60)
    const result = shop.purchase(ShopID.mawoodMagicShop, runes, 5)
    expect(result).toEqual({ bought: 2, spent: 50, installed: [] })
    expect(player.stats().goldCoins).toBe(10)
    expect(shop.purchase(ShopID.mawoodMagicShop, runes, 5)).toBe('currency')
  })

  it('unlocks the spellbook tab instead of adding the item', () => {
    give(5000)
    expect(shop.purchase(ShopID.mawoodMagicShop, spellbook)).toEqual({ bought: 1, spent: 5000, installed: [] })
    expect(player.spellbookUnlocked()).toBeTrue()
    expect(player.itemCount(ItemID.spellbook)).toBe(0)
    expect(player.stats().goldCoins).toBe(0)
  })

  it('pays a token shop in explorer tokens', () => {
    patchPlayer({ explorerTokens: 3 })
    expect(shop.purchase(ShopID.explorersGuildStore, potion, 5)).toEqual({ bought: 3, spent: 3, installed: [] })
    expect(player.explorerTokens()).toBe(0)
    expect(shop.purchase(ShopID.explorersGuildStore, potion)).toBe('currency')
  })
})

describe('PlayerStore spend', () => {
  let player: InstanceType<typeof PlayerStore>

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    player = TestBed.inject(PlayerStore)
  })

  afterEach(() => localStorage.clear())

  it('refuses when the balance is too low and changes nothing', () => {
    player.updatePlayerStats([{ stat: 'goldCoins', amount: 10 }])
    const before = player.stats().goldCoins
    expect(player.spend('gold', before + 1)).toBeNull()
    expect(player.stats().goldCoins).toBe(before)
    expect(player.spend('explorerTokens', 1)).toBeNull()
    expect(player.explorerTokens()).toBe(0)
  })

  it('takes exactly the amount when affordable', () => {
    player.updatePlayerStats([{ stat: 'goldCoins', amount: 10 }])
    const before = player.stats().goldCoins
    expect(player.spend('gold', before)?.gold).toBe(-before)
    expect(player.stats().goldCoins).toBe(0)
  })
})
