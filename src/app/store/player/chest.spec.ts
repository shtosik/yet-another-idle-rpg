import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { rollChest } from './chest'
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

  describe('opening from the inventory', () => {
    let playerStore: InstanceType<typeof PlayerStore>
    const chestSlot = () => ({ ...playerStore.inventory().consumables.find(s => s?.id === ItemID.arenaChest)!, type: ItemType.chest })
    const lootIds = chest.loot.flatMap(entry => ('itemId' in entry ? [entry.itemId] : []))
    const fill = (tab: string) => playerStore.addItems(Object.values(ITEM_DATA)
      .filter(item => tabOf(item.id) === tab && !lootIds.includes(item.id))
      .slice(0, playerStore.inventoryCapacity()[tab as 'materials'])
      .map(item => ({ id: item.id, amount: 1 })))
    // rng 0 picks gold only; rng 0.5 lands on a material pick in the Arena Chest's loot.
    const materialRoll = rollChest(chest, () => 0.5)

    beforeEach(() => {
      localStorage.clear()
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
      playerStore = TestBed.inject(PlayerStore)
      playerStore.addItems([{ id: ItemID.arenaChest, amount: 3 }])
    })
    afterEach(() => localStorage.clear())

    it('opens when the roll fits, even with other tabs full', () => {
      fill('materials')
      const gold = playerStore.stats().goldCoins
      const { contents, missing } = playerStore.openChest(chestSlot(), () => 0)
      expect(contents).toEqual({ gold: chest.rolls * 6000, items: [] })
      expect(missing).toEqual({})
      expect(playerStore.stats().goldCoins).toBe(gold + chest.rolls * 6000)
      expect(playerStore.itemCount(ItemID.arenaChest)).toBe(2)
    })

    it("keeps and saves the roll when it doesn't fit, so a retry or reload can't re-roll it", () => {
      expect(materialRoll.items.length).toBeGreaterThan(0)
      fill('materials')
      const blocked = playerStore.openChest(chestSlot(), () => 0.5)
      expect(blocked.contents).toBeNull()
      expect(blocked.missing.materials).toBeGreaterThan(0)
      expect(playerStore.itemCount(ItemID.arenaChest)).toBe(3)
      expect(playerStore.rolledChests()[ItemID.arenaChest]).toEqual(materialRoll)

      // A different rng on retry still gets the kept roll.
      expect(playerStore.openChest(chestSlot(), () => 0).contents).toBeNull()

      // Saved at once: a fresh store (page reload) still holds the roll.
      TestBed.resetTestingModule()
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
      playerStore = TestBed.inject(PlayerStore)
      expect(playerStore.rolledChests()[ItemID.arenaChest]).toEqual(materialRoll)

      // Once there is room, the kept roll opens and is cleared.
      playerStore.removeItems(playerStore.inventory().materials.filter(s => s !== null).map(s => ({ id: s!.id, amount: s!.amount })))
      expect(playerStore.openChest(chestSlot(), () => 0).contents).toEqual(materialRoll)
      expect(playerStore.rolledChests()[ItemID.arenaChest]).toBeUndefined()
    })
  })
})
