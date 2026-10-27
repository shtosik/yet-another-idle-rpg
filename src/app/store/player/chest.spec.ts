import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { rollChest } from './chest'
import { PlayerStore } from './player.store'
import ITEM_DATA from '../../../data/items-data'
import { ChestItem } from '../../../interfaces/item.interface'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { ItemType } from '../../../enums/items/item-type.enum'

describe('chests', () => {
  const chest = ITEM_DATA[ItemID.arenaChest] as ChestItem

  it('rolls its picks, merging the same item into one stack', () => {
    // rng 0 always picks the first entry (gold) at its minimum.
    expect(rollChest(chest, () => 0)).toEqual({ gold: chest.rolls * 800, items: [] })

    const silk: ChestItem = { ...chest, loot: [{ weight: 1, itemId: ItemID.elderSilk, amount: [2, 2] }] }
    expect(rollChest(silk, () => 0.5).items).toEqual([{ id: ItemID.elderSilk, amount: 2 * chest.rolls }])
  })

  it("opens from the inventory, or not at all when the loot doesn't fit", () => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    const playerStore = TestBed.inject(PlayerStore)
    // rng 0: gold only, so the later full-inventory check starts with no stacks the loot could join.
    const open = () => playerStore.openChest({ ...playerStore.inventory().find(s => s?.id === ItemID.arenaChest)!, type: ItemType.chest }, () => 0)

    playerStore.addItems([{ id: ItemID.arenaChest, amount: 3 }])
    const gold = playerStore.stats().goldCoins
    expect(open()).not.toBeNull()
    expect(playerStore.stats().goldCoins).toBe(gold + chest.rolls * 800)
    expect(playerStore.itemCount(ItemID.arenaChest)).toBe(2)

    // Fill every other slot with items the loot can't stack onto; the chest stack stays, so no new stack fits.
    const lootIds = chest.loot.flatMap(entry => ('itemId' in entry ? [entry.itemId] : []))
    const free = playerStore.stats().inventorySlots - playerStore.inventory().filter(Boolean).length
    const fillers = Object.values(ITEM_DATA).filter(item => item.id !== ItemID.arenaChest && !lootIds.includes(item.id)).slice(0, free)
    playerStore.addItems(fillers.map(item => ({ id: item.id, amount: 1 })))
    expect(playerStore.openChest({ ...playerStore.inventory().find(s => s?.id === ItemID.arenaChest)!, type: ItemType.chest }, () => 0.5)).toBeNull()
    expect(playerStore.itemCount(ItemID.arenaChest)).toBe(2)
    localStorage.clear()
  })
})
