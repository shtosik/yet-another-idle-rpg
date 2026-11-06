import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import ITEM_DATA from '../../../data/items-data'
import { PATHFINDERS_SEAL_UPGRADED_DROP_CHANCE } from '../../../data/upgrade-data'
import { EnemyID } from '../../../enums/ids/enemy-id.enum'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { ShopID } from '../../../enums/ids/shop-id.enum'
import { ItemType } from '../../../enums/items/item-type.enum'
import { ZoneID } from '../../../enums/ids/zone-id.enum'
import { sellPrice } from '../shop/shop-prices'
import { rollChest } from './chest'
import { tabOf } from './inventory'
import { PlayerStore } from './player.store'

describe("Pathfinder's Seal", () => {
  let player: InstanceType<typeof PlayerStore>
  const seal = ItemID.pathfindersSeal
  const arenaChest = ITEM_DATA[ItemID.arenaChest]
  if (arenaChest.type !== ItemType.chest) throw new Error('Expected Arena Chest')

  const heldChest = () => {
    const item = player.inventory().consumables.find(slot => slot?.id === ItemID.arenaChest)
    if (!item) throw new Error('Expected a held Arena Chest')
    return item
  }

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    player = TestBed.inject(PlayerStore)
  })
  afterEach(() => localStorage.clear())

  it('rolls the Seal separately from all four picks, with a strict 1-in-10 boundary', () => {
    const roll = (bonus: number) => {
      let calls = 0
      const rng = jasmine.createSpy('rng').and.callFake(() => ++calls <= 8 ? 0 : bonus)
      const contents = rollChest(arenaChest, rng, true)
      expect(rng).toHaveBeenCalledTimes(9)
      expect(contents.gold).toBe(32_000)
      return contents.items
    }
    expect(roll(0.099)).toEqual([{ id: seal, amount: 1 }])
    expect(roll(0.1)).toEqual([])
  })

  it('never rolls another Seal while one is held or after registration, including after reload', () => {
    player.addItems([{ id: ItemID.arenaChest, amount: 3 }])
    player.openChest(heldChest(), () => 0)
    expect(player.itemCount(seal)).toBe(1)
    const heldRng = jasmine.createSpy('held rng').and.returnValue(0)
    player.openChest(heldChest(), heldRng)
    expect(heldRng).toHaveBeenCalledTimes(8)
    expect(player.itemCount(seal)).toBe(1)
    expect(player.registerPathfindersSeal()).toBeTrue()

    TestBed.resetTestingModule()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    player = TestBed.inject(PlayerStore)
    expect(player.stats().upgradedDropChance).toBe(PATHFINDERS_SEAL_UPGRADED_DROP_CHANCE)
    const registeredRng = jasmine.createSpy('registered rng').and.returnValue(0)
    player.openChest(heldChest(), registeredRng)
    expect(registeredRng).toHaveBeenCalledTimes(8)
    expect(player.itemCount(seal)).toBe(0)
  })

  it('keeps the Seal hit with a blocked chest roll through retries and reloads', () => {
    player.addItems([{ id: ItemID.arenaChest, amount: 2 }])
    const lootIds = arenaChest.loot.flatMap(entry => 'itemId' in entry ? [entry.itemId] : [])
    const filler = Object.values(ITEM_DATA).filter(item => tabOf(item.id) === 'materials' && !lootIds.includes(item.id))
      .slice(0, player.inventoryCapacity().materials).map(item => ({ id: item.id, amount: 1 }))
    player.addItems(filler)
    let calls = 0
    expect(player.openChest(heldChest(), () => ++calls <= 8 ? 0.5 : 0).contents).toBeNull()
    const kept = player.rolledChests()[ItemID.arenaChest]
    expect(kept?.items).toContain({ id: seal, amount: 1 })
    const retryRng = jasmine.createSpy('retry rng').and.throwError('Kept rolls must not reroll')
    expect(player.openChest(heldChest(), retryRng).contents).toBeNull()

    TestBed.resetTestingModule()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    player = TestBed.inject(PlayerStore)
    expect(player.rolledChests()[ItemID.arenaChest]).toEqual(kept)
    player.removeItems(filler)
    expect(player.openChest(heldChest(), retryRng).contents).toEqual(kept ?? null)
    expect(player.itemCount(seal)).toBe(1)
    expect(retryRng).not.toHaveBeenCalled()
    player.openChest(heldChest(), () => 0)
    expect(player.itemCount(seal)).toBe(1)
  })

  it('is unsellable and indestructible, and registers exactly once without requiring The Cold Forge', () => {
    expect(player.registerPathfindersSeal()).toBeFalse()
    expect(player.stats().upgradedDropChance).toBe(0)
    player.addItems([{ id: seal, amount: 2 }])
    const item = player.inventory().quest.find(slot => slot?.id === seal)
    if (!item) throw new Error('Expected the Seal')
    expect(sellPrice(ShopID.laHarparShop, seal)).toBe(0)
    expect(player.destroyItem(item)).toBeFalse()
    expect(player.registerPathfindersSeal()).toBeTrue()
    expect(player.itemCount(seal)).toBe(1)
    expect(player.registerPathfindersSeal()).toBeFalse()
    expect(player.itemCount(seal)).toBe(1)
    expect(player.permanentBonuses().upgradedDropChance).toBe(PATHFINDERS_SEAL_UPGRADED_DROP_CHANCE)
    expect(player.statsFor([], []).upgradedDropChance).toBe(PATHFINDERS_SEAL_UPGRADED_DROP_CHANCE)
  })

  it('upgrades online gear drops only after registration', () => {
    let calls = 0
    spyOn(Math, 'random').and.callFake(() => ++calls === 3 ? 0.01 : 0.99)
    player.processBattleEnd(EnemyID.gangsterCrab, ZoneID.horseshoeBeach, 1, false)
    expect(player.inventory().gear.some(item => item?.upgradeLevel === 1)).toBeFalse()
    player.addItems([{ id: seal, amount: 1 }])
    player.registerPathfindersSeal()
    calls = 0
    player.processBattleEnd(EnemyID.gangsterCrab, ZoneID.horseshoeBeach, 1, false)
    expect(player.inventory().gear.find(item => item?.id === ItemID.knife && item.upgradeLevel === 1)?.amount).toBe(1)
  })
})

