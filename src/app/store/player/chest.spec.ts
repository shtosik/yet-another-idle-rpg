import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { rollChest } from './chest'
import { tabOf } from './inventory'
import { PlayerStore } from './player.store'
import ITEM_DATA from '../../../data/items-data'
import { ChestItem } from '../../../interfaces/item.interface'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { ProfessionID } from '../../../enums/ids/profession-id.enum'
import { ItemType } from '../../../enums/items/item-type.enum'

describe('chests', () => {
  const chest = ITEM_DATA[ItemID.arenaChest] as ChestItem

  it('rolls its picks, merging the same item into one stack', () => {
    // rng 0 always picks the first entry (gold) at its minimum.
    expect(rollChest(chest, () => 0)).toEqual({ gold: chest.rolls * 8000, items: [] })

    const silk: ChestItem = { ...chest, loot: [{ weight: 1, itemId: ItemID.elderSilk, amount: [2, 2] }] }
    expect(rollChest(silk, () => 0.5).items).toEqual([{ id: ItemID.elderSilk, amount: 2 * chest.rolls }])
  })

  describe('seedDropChance', () => {
    // Without the bonus 0.47 x 200 = 94 lands on silk; with +25% 0.47 x 225 = 105.75 lands on seeds.
    const loot: ChestItem['loot'] = [
      { weight: 100, itemId: ItemID.elderSilk, amount: [1, 1] },
      { weight: 100, itemId: ItemID.turnipSeeds, amount: [1, 1] },
    ]
    const twoEntries: ChestItem = { ...chest, rolls: 1, loot }

    it('scales seed weights only', () => {
      expect(rollChest(twoEntries, () => 0.47).items).toEqual([{ id: ItemID.elderSilk, amount: 1 }])
      expect(rollChest(twoEntries, () => 0.47, false, 0.25).items).toEqual([{ id: ItemID.turnipSeeds, amount: 1 }])
    })

    it('is applied when opening a chest at expertise 30', () => {
      localStorage.clear()
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
      const playerStore = TestBed.inject(PlayerStore)
      playerStore.unlockProfession(ProfessionID.farming)
      playerStore.applyProfessionXp(ProfessionID.farming, 1_000_000)
      playerStore.grant([{ id: ItemID.arenaChest, amount: 1 }], 'lossy')
      const slot = { ...playerStore.inventory().consumables.find(s => s?.id === ItemID.arenaChest)!, type: ItemType.chest }
      const originalLoot = chest.loot
      const originalRolls = chest.rolls
      chest.loot = loot
      chest.rolls = 1
      try {
        expect(playerStore.openChest(slot, () => 0.47).contents?.items).toEqual([{ id: ItemID.turnipSeeds, amount: 1 }])
      } finally {
        chest.loot = originalLoot
        chest.rolls = originalRolls
        localStorage.clear()
      }
    })
  })

  describe('opening from the inventory', () => {
    let playerStore: InstanceType<typeof PlayerStore>
    const chestSlot = () => ({ ...playerStore.inventory().consumables.find(s => s?.id === ItemID.arenaChest)!, type: ItemType.chest })
    const lootIds = chest.loot.flatMap(entry => ('itemId' in entry ? [entry.itemId] : []))
    const fill = (tab: string) => playerStore.grant(Object.values(ITEM_DATA)
      .filter(item => tabOf(item.id) === tab && !lootIds.includes(item.id))
      .slice(0, playerStore.inventoryCapacity()[tab as 'materials'])
      .map(item => ({ id: item.id, amount: 1 })), 'lossy')
    // Weighted picks use 0 (gold); the separate Seal roll uses 0.5 (miss).
    const goldRoll = () => {
      let calls = 0
      return () => ++calls <= chest.rolls * 2 ? 0 : 0.5
    }
    const materialRoll = rollChest(chest, () => 0.5)

    beforeEach(() => {
      localStorage.clear()
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
      playerStore = TestBed.inject(PlayerStore)
      playerStore.grant([{ id: ItemID.arenaChest, amount: 3 }], 'lossy')
    })
    afterEach(() => localStorage.clear())

    it('opens when the roll fits, even with other tabs full', () => {
      fill('materials')
      const gold = playerStore.stats().goldCoins
      const { contents, missing } = playerStore.openChest(chestSlot(), goldRoll())
      expect(contents).toEqual({ gold: chest.rolls * 8000, items: [] })
      expect(missing).toEqual({})
      expect(playerStore.stats().goldCoins).toBe(gold + chest.rolls * 8000)
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

    it('drops a kept roll once the last chest of its id is gone, so a later one rolls fresh', () => {
      fill('materials')
      playerStore.openChest(chestSlot(), () => 0.5)
      playerStore.removeItems([{ id: ItemID.arenaChest, amount: 2 }])
      expect(playerStore.rolledChests()[ItemID.arenaChest]).toEqual(materialRoll)
      playerStore.destroyItem(chestSlot())
      expect(playerStore.rolledChests()[ItemID.arenaChest]).toBeUndefined()
    })
  })
})
