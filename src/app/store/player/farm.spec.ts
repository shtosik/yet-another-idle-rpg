import { FARM_SEEDS } from '../../../data/farming-data'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { FarmState, harvest, harvestAll, HarvestContext, initialFarm, isReady, plant, plantAll, PlantContext, plotCount, syncPlots } from './farm'

const MIN = 60_000
const turnip = FARM_SEEDS[ItemID.turnipSeeds]!
const wheat = FARM_SEEDS[ItemID.wheatSeeds]!

const plantCtx = (over: Partial<PlantContext> = {}): PlantContext => ({ now: 0, level: 30, plotLimit: 3, seedSaveChance: 0, ...over })
const harvestCtx = (over: Partial<HarvestContext> = {}): HarvestContext =>
  ({ doubleChance: 0, bonusChance: 0, xpMultiplier: 0, fits: () => true, ...over })
const withSeeds = (seeds: FarmState['seeds']): FarmState => ({ ...initialFarm, seeds })
const grown = (farm: FarmState, now: number, reduction = 0): FarmState => ({ ...farm, plots: syncPlots(farm.plots, now, reduction) })

describe('farm rules', () => {
  it('counts plots from reputation tiers and quests, capped at 9', () => {
    expect(plotCount(0, 0)).toBe(3)
    expect(plotCount(2, 1)).toBe(6)
    expect(plotCount(4, 2)).toBe(9)
    expect(plotCount(9, 9)).toBe(9)
  })

  describe('planting', () => {
    it('uses one seed and starts the plot at zero progress', () => {
      const farm = plant(withSeeds({ [ItemID.turnipSeeds]: 2 }), 0, ItemID.turnipSeeds, plantCtx({ now: 50 }), () => 1)!

      expect(farm.seeds[ItemID.turnipSeeds]).toBe(1)
      expect(farm.plots[0]).toEqual({ seedId: ItemID.turnipSeeds, plantedAt: 50, progressMs: 0, syncedAt: 50 })
    })

    it('rolls the seed save once per planting and keeps the seed on a save', () => {
      const rolls: number[] = []
      const rng = () => { rolls.push(0); return 0 }
      const farm = plant(withSeeds({ [ItemID.turnipSeeds]: 1 }), 0, ItemID.turnipSeeds, plantCtx({ seedSaveChance: 0.1 }), rng)!

      expect(rolls.length).toBe(1)
      expect(farm.seeds[ItemID.turnipSeeds]).toBe(1)
    })

    it('is blocked, rolling nothing, without a seed, with a locked expertise, on a busy or locked plot', () => {
      const rng = jasmine.createSpy('rng').and.returnValue(0)
      const held = withSeeds({ [ItemID.turnipSeeds]: 1, [ItemID.wheatSeeds]: 1 })

      expect(plant(withSeeds({}), 0, ItemID.turnipSeeds, plantCtx(), rng)).toBeNull()
      expect(plant(held, 0, ItemID.wheatSeeds, plantCtx({ level: 1 }), rng)).toBeNull()
      expect(plant(held, 3, ItemID.turnipSeeds, plantCtx(), rng)).toBeNull()
      const busy = plant(held, 0, ItemID.turnipSeeds, plantCtx(), rng)!
      expect(plant({ ...busy, seeds: { [ItemID.turnipSeeds]: 1 } }, 0, ItemID.turnipSeeds, plantCtx(), rng)).toBeNull()
      expect(rng).toHaveBeenCalledTimes(1)
    })

    it('plants every empty plot and stops when the seeds run out', () => {
      const farm = plantAll(withSeeds({ [ItemID.turnipSeeds]: 2 }), ItemID.turnipSeeds, plantCtx(), () => 1)

      expect(farm.plots.filter(Boolean).length).toBe(2)
      expect(farm.seeds[ItemID.turnipSeeds]).toBe(0)
    })
  })

  describe('growth', () => {
    const planted = plant(withSeeds({ [ItemID.turnipSeeds]: 1 }), 0, ItemID.turnipSeeds, plantCtx(), () => 1)!

    it('accrues time at the rate in force, so a rate change only affects the time after it', () => {
      // 5 min at no reduction, then 10 min at 50%: 5 + 10 / 0.5 = 25 min of base growth, capped at 15.
      const first = grown(planted, 5 * MIN)
      expect(first.plots[0]!.progressMs).toBe(5 * MIN)
      expect(isReady(first.plots[0]!, turnip.growMs)).toBeFalse()

      const second = grown(first, 10 * MIN, 0.5)
      expect(second.plots[0]!.progressMs).toBe(turnip.growMs)
      expect(isReady(second.plots[0]!, turnip.growMs)).toBeTrue()
    })

    it('does not make an old crop ready when a reduction starts later', () => {
      const early = grown(planted, 1 * MIN)
      expect(early.plots[0]!.progressMs).toBe(1 * MIN)
      // Equipping the hare at minute 1 (synced first at the old rate); nothing jumps.
      expect(isReady(early.plots[0]!, turnip.growMs)).toBeFalse()
    })

    it('counts a long offline gap and keeps a ready crop ready', () => {
      const away = grown(planted, 3 * 24 * 60 * MIN)
      expect(away.plots[0]!.progressMs).toBe(turnip.growMs)
      expect(grown(away, 3 * 24 * 60 * MIN + MIN, 0).plots[0]!.progressMs).toBe(turnip.growMs)
    })

    it('counts a clock set backwards as no time and resumes from the new time', () => {
      const first = grown(planted, 10 * MIN)
      const back = grown(first, 2 * MIN)

      expect(back.plots[0]!.progressMs).toBe(10 * MIN)
      expect(back.plots[0]!.syncedAt).toBe(2 * MIN)
      expect(grown(back, 5 * MIN).plots[0]!.progressMs).toBe(13 * MIN)
    })
  })

  describe('harvest', () => {
    const readyFarm = (seedId = ItemID.turnipSeeds, count = 1): FarmState => {
      let farm = withSeeds({ [seedId]: count })
      farm = plantAll(farm, seedId, plantCtx({ plotLimit: count }), () => 1)
      return grown(farm, 24 * 60 * MIN)
    }

    it('pays the base yield and XP once, and empties the plot', () => {
      const result = harvest(readyFarm(), 0, harvestCtx({ xpMultiplier: 0.1 }), () => 1)

      expect(result.status).toBe('harvested')
      expect(result.crops).toEqual([{ id: ItemID.turnip, amount: turnip.yield }])
      expect(result.xp).toBe(Math.round(turnip.xp * 1.1))
      expect(result.farm.plots[0]).toBeNull()
    })

    it('doubles, then adds a bonus crop independently', () => {
      const all = harvest(readyFarm(), 0, harvestCtx({ doubleChance: 1, bonusChance: 1 }), () => 0)
      expect(all.crops[0].amount).toBe(turnip.yield * 2 + 1)

      const bonusOnly = harvest(readyFarm(), 0, harvestCtx({ doubleChance: 0.5, bonusChance: 0.5 }), jasmine.createSpy().and.returnValues(0.9, 0.1))
      expect(bonusOnly.crops[0].amount).toBe(turnip.yield + 1)
    })

    it('is unavailable for an empty or unripe plot', () => {
      expect(harvest(initialFarm, 0, harvestCtx()).status).toBe('unavailable')
      const young = plant(withSeeds({ [ItemID.wheatSeeds]: 1 }), 0, ItemID.wheatSeeds, plantCtx(), () => 1)!
      expect(harvest(grown(young, wheat.growMs - 1), 0, harvestCtx()).status).toBe('unavailable')
    })

    it('keeps a blocked plot with its roll, pays no XP, and never rerolls', () => {
      let open = false
      const ctx = harvestCtx({ doubleChance: 1, fits: () => open })
      const blocked = harvest(readyFarm(), 0, ctx, () => 0)

      expect(blocked.status).toBe('blocked')
      expect(blocked.xp).toBe(0)
      expect(blocked.crops).toEqual([])
      expect(blocked.farm.plots[0]!.rolledYield).toBe(turnip.yield * 2)

      // A retry that would roll no double still pays the saved roll, without calling the rng.
      open = true
      const rng = jasmine.createSpy('rng').and.returnValue(1)
      const retry = harvest(blocked.farm, 0, { ...ctx, doubleChance: 0 }, rng)
      expect(retry.crops).toEqual([{ id: ItemID.turnip, amount: turnip.yield * 2 }])
      expect(rng).not.toHaveBeenCalled()
      expect(retry.farm.plots[0]).toBeNull()
    })

    it('harvests all ready plots and stops at the first blocked one', () => {
      const farm = readyFarm(ItemID.turnipSeeds, 3)
      // Room for two plots' crops (cumulative check).
      const result = harvestAll(farm, harvestCtx({ fits: crops => crops.reduce((sum, c) => sum + c.amount, 0) <= 2 * turnip.yield }), () => 1)

      expect(result.blocked).toBeTrue()
      expect(result.crops).toEqual([{ id: ItemID.turnip, amount: 2 * turnip.yield }])
      expect(result.xp).toBe(2 * turnip.xp)
      expect(result.farm.plots.filter(Boolean).length).toBe(1)
      expect(result.farm.plots[2]!.rolledYield).toBe(turnip.yield)
    })
  })
})
