import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { chestSlotsNeeded, rollChest } from './chest'
import { tabOf } from './inventory'
import { PlayerStore } from './player.store'
import ITEM_DATA from '../../../data/items-data'
import { ChestItem } from '../../../interfaces/item.interface'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { ItemType } from '../../../enums/items/item-type.enum'

describe('chests', () => {
  const chest = ITEM_DATA[ItemID.arenaChest] as ChestItem

  it('rolls its picks, merging the same item into one stack', () => {
    // rng 0 always picks the first entry (gold) at its minimum.
    expect(rollChest(chest, () => 0)).toEqual({ gold: chest.rolls * 6000, items: [] })

    const silk: ChestItem = { ...chest, loot: [{ weight: 1, itemId: ItemID.elderSilk, amount: [2, 2] }] }
    expect(rollChest(silk, () => 0.5).items).toEqual([{ id: ItemID.elderSilk, amount: 2 * chest.rolls }])
  })

  it("opens from the inventory, or not at all when the loot doesn't fit", () => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    const playerStore = TestBed.inject(PlayerStore)
    // rng 0: gold only, so the later full-inventory check starts with no stacks the loot could join.
    const chestSlot = () => ({ ...playerStore.inventory().consumables.find(s => s?.id === ItemID.arenaChest)!, type: ItemType.chest })

    playerStore.addItems([{ id: ItemID.arenaChest, amount: 3 }])
    const gold = playerStore.stats().goldCoins
    expect(playerStore.openChest(chestSlot(), () => 0)).not.toBeNull()
    expect(playerStore.stats().goldCoins).toBe(gold + chest.rolls * 6000)
    expect(playerStore.itemCount(ItemID.arenaChest)).toBe(2)

    // A full Materials tab blocks it: every pick could be a new material stack.
    const lootIds = chest.loot.flatMap(entry => ('itemId' in entry ? [entry.itemId] : []))
    const fillersIn = (tab: string, count: number) => Object.values(ITEM_DATA)
      .filter(item => tabOf(item.id) === tab && !lootIds.includes(item.id)).slice(0, count).map(item => ({ id: item.id, amount: 1 }))
    playerStore.addItems(fillersIn('materials', playerStore.inventoryCapacity().materials))
    expect(playerStore.missingChestSlots(chestSlot())).toBe(chestSlotsNeeded(chest).materials!)
    expect(playerStore.openChest(chestSlot(), () => 0.5)).toBeNull()
    expect(playerStore.itemCount(ItemID.arenaChest)).toBe(2)
    localStorage.clear()
  })

  it('needs, per tab, one slot per pick up to the loot items stored there', () => {
    const needed = chestSlotsNeeded(chest)
    expect(needed.materials).toBe(chest.rolls)
    expect(needed.quest).toBeUndefined()

    const oneGear: ChestItem = { ...chest, loot: [{ weight: 1, itemId: ItemID.patronGloves, amount: [1, 1] }, { weight: 1, gold: [1, 1] }] }
    expect(chestSlotsNeeded(oneGear)).toEqual({ gear: 1 })
  })
})
