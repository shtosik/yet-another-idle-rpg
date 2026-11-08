import { ItemID } from '../../../enums/ids/item-id.enum'
import { SiteID } from '../../../enums/ids/site-id.enum'
import { ReputationTier } from '../../../enums/reputation-tier.enum'
import { FARM_SEEDS, FarmSeed, GrowthStage } from '../../../data/farming-data'
import { UnlockedContent } from '../../../types/player/unlocked-content.type'
import { isSeed, ItemStack } from './inventory'

/** Plot count = base + Guild reputation tiers + plot-granting quests, capped at the array length (farm doc §5). */
export const PLOT_SLOTS = 9
export const BASE_PLOTS = 3
export const PLOT_REPUTATION_TIERS = 4
export const PLOT_GRANT_QUESTS = 2

/** Plant all and Harvest all open at these Farming Guild tiers (farm doc §5). */
export const PLANT_ALL_TIER = ReputationTier.honored
export const HARVEST_ALL_TIER = ReputationTier.friendly

export interface Plot {
  seedId: ItemID
  /** Epoch ms, display only. */
  plantedAt: number
  /** Growth accrued in base grow-time ms; full is `FarmSeed.growMs`. Never shrinks. */
  progressMs: number
  /** Epoch ms of the last progress update. */
  syncedAt: number
  /** The harvest roll, kept from the first attempt until the harvest succeeds, so a blocked harvest cannot reroll. */
  rolledYield?: number
}

export interface FarmState {
  /** Fixed length `PLOT_SLOTS`; unused slots stay null. */
  plots: (Plot | null)[]
  /** Seed item id -> count held; absent means 0. No cap, no slots. */
  seeds: Partial<Record<ItemID, number>>
}

export const initialFarm: FarmState = { plots: new Array<Plot | null>(PLOT_SLOTS).fill(null), seeds: {} }

type Rng = () => number

/** The farm unlocks with its Site; seed drops are reported only from then on, but always counted. */
export const isFarmUnlocked = (unlocked: UnlockedContent): boolean => (unlocked.sites ?? []).includes(SiteID.farm)

/** Splits seeds out of `items`, summed per seed id; the rest still goes to the inventory. */
export function takeSeeds(items: ItemStack[]): { seeds: Partial<Record<ItemID, number>>, rest: ItemStack[] } {
  const seeds: Partial<Record<ItemID, number>> = {}
  const rest: ItemStack[] = []
  for (const stack of items) {
    if (isSeed(stack.id)) seeds[stack.id] = (seeds[stack.id] ?? 0) + stack.amount
    else rest.push(stack)
  }
  return { seeds, rest }
}

export const seedStacks = (seeds: Partial<Record<ItemID, number>>): ItemStack[] =>
  (Object.entries(seeds) as [string, number][]).map(([id, amount]) => ({ id: Number(id) as ItemID, amount }))

export function addSeeds(held: Partial<Record<ItemID, number>>, added: Partial<Record<ItemID, number>>): Partial<Record<ItemID, number>> {
  const result = { ...held }
  for (const [id, amount] of Object.entries(added) as [string, number][]) result[Number(id) as ItemID] = (result[Number(id) as ItemID] ?? 0) + amount
  return result
}

export const plotCount = (reputationTierIndex: number, grantQuestsDone: number): number =>
  Math.min(PLOT_SLOTS, BASE_PLOTS + reputationTierIndex + grantQuestsDone)

/**
 * Accrues growth: time since `syncedAt` counts at the rate in force (`reduction` = `seedGrowthTimeReduction`).
 * `PlayerStore` runs it with the old rate whenever the reduction changes, so the old rate only covers the old time.
 * A clock set backwards counts as no time passed; progress is capped at full and never shrinks.
 */
export function syncPlots(plots: (Plot | null)[], now: number, reduction: number): (Plot | null)[] {
  return plots.map(plot => {
    const seed = plot && FARM_SEEDS[plot.seedId]
    if (!plot || !seed) return plot
    const gained = Math.max(0, now - plot.syncedAt) / (1 - reduction)
    return { ...plot, progressMs: Math.max(plot.progressMs, Math.min(seed.growMs, plot.progressMs + gained)), syncedAt: now }
  })
}

export const isReady = (plot: Plot, growMs: number): boolean => plot.progressMs >= growMs

/** How many of `plots` are ready at `now`, growth since their last sync included. */
export const readyPlotCount = (plots: (Plot | null)[], now: number, reduction: number): number =>
  syncPlots(plots, now, reduction).filter(plot => {
    const seed = plot && FARM_SEEDS[plot.seedId]
    return plot && seed && isReady(plot, seed.growMs)
  }).length

export interface PlantContext {
  now: number
  /** Farming expertise level. */
  level: number
  /** `plotCount(...)`: plots from this index on are locked. */
  plotLimit: number
  /** `farmSeedSaveChance` */
  seedSaveChance: number
}

/** Plants one seed; null when blocked (locked or busy plot, no seed held, expertise too low), which rolls nothing. */
export function plant(farm: FarmState, plotIndex: number, seedId: ItemID, ctx: PlantContext, rng: Rng = Math.random): FarmState | null {
  const seed = FARM_SEEDS[seedId]
  const held = farm.seeds[seedId] ?? 0
  if (!seed || held < 1 || ctx.level < seed.requiredLevel || plotIndex < 0 || plotIndex >= ctx.plotLimit || farm.plots[plotIndex]) return null

  const saved = rng() < ctx.seedSaveChance
  const plots = [...farm.plots]
  plots[plotIndex] = { seedId, plantedAt: ctx.now, progressMs: 0, syncedAt: ctx.now }
  return { plots, seeds: saved ? farm.seeds : { ...farm.seeds, [seedId]: held - 1 } }
}

/** Plants `seedId` in every empty plot in order; stops when the seeds run out. */
export function plantAll(farm: FarmState, seedId: ItemID, ctx: PlantContext, rng: Rng = Math.random): FarmState {
  let result = farm
  for (let i = 0; i < ctx.plotLimit; i++) result = plant(result, i, seedId, ctx, rng) ?? result
  return result
}

export interface HarvestContext {
  /** `farmDoubleHarvestChance` */
  doubleChance: number
  /** `farmBonusCropChance` */
  bonusChance: number
  /** `farmXpMultiplier` */
  xpMultiplier: number
  /** Whether these crops, everything harvested in this action so far, fit the inventory. */
  fits: (crops: ItemStack[]) => boolean
}

export interface HarvestResult {
  /** `unavailable`: no plot or not ready. `blocked`: the crops did not fit; the plot stays with its roll saved. */
  status: 'harvested' | 'blocked' | 'unavailable'
  farm: FarmState
  crops: ItemStack[]
  xp: number
}

/** Growth stage by progress fraction (0 to 1): seedling below 40%, growing until full, ready at 100%. */
export function stageOf(progress: number): GrowthStage {
  if (progress >= 1) return 'ready'
  return progress >= 0.4 ? 'growing' : 'seedling'
}

/** Base rolled uniformly from the seed's min to max, doubled on a double roll, then an independent +1 on a bonus crop. */
const rollYield = (seed: FarmSeed, ctx: HarvestContext, rng: Rng): number => {
  const doubled = rng() < ctx.doubleChance
  const bonus = rng() < ctx.bonusChance
  const [min, max] = seed.yield
  const base = Math.min(max, min + Math.floor(rng() * (max - min + 1)))
  return base * (doubled ? 2 : 1) + (bonus ? 1 : 0)
}

/** Harvests one ready plot (sync it first). A blocked harvest pays nothing but saves its roll, which every retry reuses. */
export function harvest(farm: FarmState, plotIndex: number, ctx: HarvestContext, rng: Rng = Math.random): HarvestResult {
  const plot = farm.plots[plotIndex]
  const seed = plot && FARM_SEEDS[plot.seedId]
  if (!plot || !seed || !isReady(plot, seed.growMs)) return { status: 'unavailable', farm, crops: [], xp: 0 }

  const amount = plot.rolledYield ?? rollYield(seed, ctx, rng)
  const plots = [...farm.plots]
  const crops = [{ id: seed.cropId, amount }]
  if (!ctx.fits(crops)) {
    plots[plotIndex] = { ...plot, rolledYield: amount }
    return { status: 'blocked', farm: { ...farm, plots }, crops: [], xp: 0 }
  }
  plots[plotIndex] = null
  return { status: 'harvested', farm: { ...farm, plots }, crops, xp: Math.round(seed.xp * (1 + ctx.xpMultiplier)) }
}

/** Harvests every ready plot in order and stops at the first blocked one (its roll is kept). */
export function harvestAll(farm: FarmState, ctx: HarvestContext, rng: Rng = Math.random): Omit<HarvestResult, 'status'> & { blocked: boolean } {
  let result = farm
  let xp = 0
  const totals = new Map<ItemID, number>()
  const stacks = (): ItemStack[] => [...totals].map(([id, amount]) => ({ id, amount }))

  for (let i = 0; i < result.plots.length; i++) {
    // The caller's fit check sees what earlier plots already added in this action.
    const fits = (crops: ItemStack[]) => ctx.fits(stacks().concat(crops))
    const outcome = harvest(result, i, { ...ctx, fits }, rng)
    result = outcome.farm
    if (outcome.status === 'blocked') return { farm: result, crops: stacks(), xp, blocked: true }
    for (const { id, amount } of outcome.crops) totals.set(id, (totals.get(id) ?? 0) + amount)
    xp += outcome.xp
  }
  return { farm: result, crops: stacks(), xp, blocked: false }
}
