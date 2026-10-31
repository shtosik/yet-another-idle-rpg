import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { PlayerStore } from './player.store'
import ITEM_DATA from '../../../data/items-data'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { ItemTier } from '../../../enums/items/item-tier.enum'
import { InventoryItem } from '../../../interfaces/item.interface'

const stack = (id: ItemID, tier: ItemTier, amount: number): InventoryItem => ({ id, type: ITEM_DATA[id].type, tier, amount })

describe('PlayerStore.destroyItem', () => {
  let store: InstanceType<typeof PlayerStore>

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    store = TestBed.inject(PlayerStore)
  })

  it('removes the whole stack and leaves other stacks alone', () => {
    store.addItems([
      { id: ItemID.stone, amount: 7, tier: ItemTier.trash },
      { id: ItemID.stone, amount: 3, tier: ItemTier.rare },
      { id: ItemID.spiderSilk, amount: 2 },
    ])

    expect(store.destroyItem(stack(ItemID.stone, ItemTier.trash, 7))).toBeTrue()

    expect(store.inventory().materials.filter(s => s?.id === ItemID.stone)).toEqual([stack(ItemID.stone, ItemTier.rare, 3)])
    expect(store.itemCount(ItemID.spiderSilk)).toBe(2)
  })

  it('refuses quest items', () => {
    store.addItems([{ id: ItemID.captainsLetter, amount: 1 }])

    expect(store.destroyItem(stack(ItemID.captainsLetter, ItemTier.normal, 1))).toBeFalse()

    expect(store.itemCount(ItemID.captainsLetter)).toBe(1)
  })
})
