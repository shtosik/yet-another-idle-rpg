import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { PlayerStore } from './player.store'
import { addItems, createInventories, inventoryCapacity, lostItems, missingSlots } from './inventory'
import { takeSeeds } from './farm'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { SiteID } from '../../../enums/ids/site-id.enum'
import { ItemType } from '../../../enums/items/item-type.enum'
import { ZoneID } from '../../../enums/ids/zone-id.enum'
import { ItemTier } from '../../../enums/items/item-tier.enum'
import { EnemyID } from '../../../enums/ids/enemy-id.enum'
import { ProfessionID } from '../../../enums/ids/profession-id.enum'
import ENEMIES_DATA from '../../../data/enemies-data'
import { KillResolutionService } from '../../services/kill-resolution.service'

describe('seed routing', () => {
  const crab = ENEMIES_DATA[EnemyID.crab]
  const seedDrop = { id: ItemID.turnipSeeds, minAmount: 1, maxAmount: 1, chance: 1 } as (typeof crab.drops)[number]
  const unlock = () => store.unlockSite(SiteID.farm)
  const seeds = [{ id: ItemID.turnipSeeds, amount: 3 }]
  let store: InstanceType<typeof PlayerStore>
  const killOnline = (enemyId: EnemyID, zoneId: ZoneID, wave: number, isShiny: boolean) =>
    TestBed.inject(KillResolutionService).resolveKills(zoneId, wave, [{ enemyId, isShiny, stats: store.stats() }], Math.random)

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    store = TestBed.inject(PlayerStore)
  })

  afterEach(() => {
    localStorage.clear()
    crab.drops = crab.drops.filter(drop => drop !== seedDrop)
  })

  const inventoryHasNoSeeds = () => Object.values(store.inventory()).flat().every(slot => slot?.type !== ItemType.seed)
  const kill = (items: typeof seeds) => ({
    zoneId: ZoneID.horseshoeBeach, wave: 1, kills: 1, shinies: 0, killsByEnemy: {}, taskCountsByEnemy: {}, experience: 0, gold: 0,
    items: items.map(item => ({ ...item, type: ItemType.seed, tier: ItemTier.normal })),
  })

  it('splits seeds out of a stack list, summed', () => {
    const { seeds: taken, rest } = takeSeeds([...seeds, { id: ItemID.stick, amount: 1 }, { id: ItemID.turnipSeeds, amount: 2 }])

    expect(taken).toEqual({ [ItemID.turnipSeeds]: 5 })
    expect(rest).toEqual([{ id: ItemID.stick, amount: 1 }])
  })

  it('keeps seeds out of every inventory helper', () => {
    const capacity = inventoryCapacity([])

    expect(addItems(createInventories(), capacity, seeds)).toEqual(createInventories())
    expect(missingSlots(createInventories(), { ...capacity, materials: 0 }, seeds)).toBe(0)
    expect(lostItems(createInventories(), { ...capacity, materials: 0 }, seeds)).toEqual([])
  })

  it('counts added seeds in the farm, never in the inventory', () => {
    store.addItems(seeds)
    store.addItems(seeds)

    expect(store.farm().seeds[ItemID.turnipSeeds]).toBe(6)
    expect(inventoryHasNoSeeds()).toBeTrue()
  })

  it('counts online kill seeds silently before the unlock, and never loses them', () => {
    crab.drops = [...crab.drops, seedDrop]
    spyOn(Math, 'random').and.returnValue(0.5)
    const result = killOnline(EnemyID.crab, ZoneID.horseshoeBeach, 1, false)

    expect(store.farm().seeds[ItemID.turnipSeeds]).toBe(1)
    expect(result.receivedItems).toEqual([])
    expect(result.lost.some(stack => stack.id === ItemID.turnipSeeds)).toBeFalse()
    expect(inventoryHasNoSeeds()).toBeTrue()
  })

  it('reports online kill seeds once the farm is unlocked', () => {
    unlock()
    crab.drops = [...crab.drops, seedDrop]
    spyOn(Math, 'random').and.returnValue(0.5)

    expect(killOnline(EnemyID.crab, ZoneID.horseshoeBeach, 1, false).receivedItems).toEqual([{ id: ItemID.turnipSeeds, type: ItemType.seed, tier: ItemTier.normal, amount: 1 }])
  })

  it('rolls online kill seeds with the expertise seedDropChance', () => {
    crab.drops = [...crab.drops, { ...seedDrop, chance: 4 }]
    // 0.74 x 4 = 2.96 misses at no bonus (hit above 3) and hits at +25% (above 2.75).
    spyOn(Math, 'random').and.returnValue(0.74)
    killOnline(EnemyID.crab, ZoneID.horseshoeBeach, 1, false)
    expect(store.farm().seeds[ItemID.turnipSeeds] ?? 0).toBe(0)

    store.unlockProfession(ProfessionID.farming)
    store.applyProfessionXp(ProfessionID.farming, 1_000_000)
    expect(store.stats().seedDropChance).toBe(0.25)
    killOnline(EnemyID.crab, ZoneID.horseshoeBeach, 1, false)
    crab.drops = crab.drops.filter(drop => drop.id !== ItemID.turnipSeeds)

    expect(store.farm().seeds[ItemID.turnipSeeds]).toBe(1)
  })

  it('counts offline seeds without reporting or losing them before the unlock', () => {
    const result = store.applyKillBatch(kill(seeds))

    expect(store.farm().seeds[ItemID.turnipSeeds]).toBe(3)
    expect(result.receivedItems).toEqual([])
    expect(result.lostDrops).toBe(0)
    expect(inventoryHasNoSeeds()).toBeTrue()
  })

  it('lists offline seeds as received once the farm is unlocked, still never lost', () => {
    unlock()
    const result = store.applyKillBatch(kill(seeds))

    expect(result.receivedItems).toEqual([{ id: ItemID.turnipSeeds, type: ItemType.seed, tier: ItemTier.normal, amount: 3 }])
    expect(result.lostDrops).toBe(0)
    expect(inventoryHasNoSeeds()).toBeTrue()
  })
})
