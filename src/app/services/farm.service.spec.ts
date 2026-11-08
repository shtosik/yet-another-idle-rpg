import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import i18next from 'i18next'
import { FarmService } from './farm.service'
import { PlayerStore } from '../store/player/player.store'
import { FARM_SEEDS } from '../../data/farming-data'
import ITEM_DATA from '../../data/items-data'
import { ItemID } from '../../enums/ids/item-id.enum'
import { ProfessionID } from '../../enums/ids/profession-id.enum'
import { ReputationID } from '../../enums/reputation-id.enum'
import { ReputationTier } from '../../enums/reputation-tier.enum'

const MINUTE = 60_000
const at = { x: 0, y: 0 }

describe('FarmService', () => {
  let farm: FarmService
  let player: InstanceType<typeof PlayerStore>

  beforeAll(async () => {
    await i18next.init({ lng: 'en', resources: {} })
  })

  beforeEach(() => {
    localStorage.clear()
    jasmine.clock().install()
    jasmine.clock().mockDate(new Date(1_000_000))
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    player = TestBed.inject(PlayerStore)
    farm = TestBed.inject(FarmService)
    player.unlockProfession(ProfessionID.farming)
    player.addItems([{ id: ItemID.turnipSeeds, amount: 5 }])
  })

  afterEach(() => {
    jasmine.clock().uninstall()
    localStorage.clear()
  })

  const select = (seedId: ItemID) => farm.toggleSeed(seedId)
  const planted = () => player.farm().plots.filter(plot => plot !== null).length

  it('refuses Plant all and Harvest all below their Guild tiers, but plants and harvests one plot', () => {
    expect(farm.plantAllLock()).toBe(ReputationTier.honored)
    expect(farm.harvestAllLock()).toBe(ReputationTier.friendly)
    select(ItemID.turnipSeeds)

    farm.plantAll()
    expect(planted()).toBe(0)

    farm.plant(0)
    player.growAllPlots()
    farm.harvest(at)
    expect(planted()).toBe(1)

    farm.harvest(at, 0)
    expect(planted()).toBe(0)
  })

  it('opens Harvest all at its Guild tier', () => {
    select(ItemID.turnipSeeds)
    farm.plant(0)
    farm.plant(1)
    player.growAllPlots()
    player.addReputation([{ reputationId: ReputationID.farmingGuild, amount: 60 }])

    expect(farm.harvestAllLock()).toBeNull()
    expect(farm.readyPlotCount(Date.now())).toBe(2)
    farm.harvest(at)
    expect(planted()).toBe(0)
  })

  it('counts growth before a rate change at the old rate, whatever changed it', () => {
    select(ItemID.turnipSeeds)
    farm.plant(0)
    jasmine.clock().tick(5 * MINUTE)

    const hare = ITEM_DATA[ItemID.petFarmingGuildHare]
    player.addItems([{ id: hare.id, tier: hare.tier, amount: 1 }])
    player.equipItem({ id: hare.id, type: hare.type, tier: hare.tier, amount: 1 })
    TestBed.tick()
    jasmine.clock().tick(8 * MINUTE)
    player.syncFarm()

    // 5 minutes at the base rate, then 8 minutes 10% faster.
    expect(player.farm().plots[0]?.progressMs).toBeCloseTo(5 * MINUTE + 8 * MINUTE / 0.9)
    expect(farm.realTimeMs(FARM_SEEDS[ItemID.turnipSeeds]!.growMs)).toBeCloseTo(15 * MINUTE * 0.9)
  })
})
