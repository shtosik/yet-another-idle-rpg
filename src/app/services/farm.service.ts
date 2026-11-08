import { computed, inject, Injectable, signal } from '@angular/core'
import i18next from 'i18next'
import { PlayerStore } from '../store/player/player.store'
import { QuestsStore } from '../store/quests/quests.store'
import { ProfessionService } from './profession.service'
import { getQuestStatus } from './quest-status'
import { QuestState } from '../../enums/quest-state.enum'
import { HARVEST_ALL_TIER, PLANT_ALL_TIER, Plot, plotCount, readyPlotCount, syncPlots } from '../store/player/farm'
import { ReputationID } from '../../enums/reputation-id.enum'
import { ReputationTier } from '../../enums/reputation-tier.enum'
import { ProfessionID } from '../../enums/ids/profession-id.enum'
import { ItemID } from '../../enums/ids/item-id.enum'
import ITEM_DATA from '../../data/items-data'
import { FARM_SEEDS, PLOT_GRANT_QUEST_IDS } from '../../data/farming-data'
import { missingSlotsText } from '../components/game/inventory/tab-text'

/** The popup's float-and-fade animation in the plots panel's styles lasts as long. */
const TOAST_MS = 1600

/** One harvest action's popup at its own point in the panel: each crop with its icon and amount, the XP, or what a blocked harvest needs. */
export interface HarvestToast {
  id: number
  at: { x: number, y: number }
  crops: { id: ItemID, name: string, url: string, amount: number }[]
  xp: number
  blocked: string | null
}

/**
 * The farm's rules for its readers: plot count, the Guild tiers of Plant all and Harvest all, the active seed,
 * plot growth at the current rate, and the plot actions (harvest XP included). Readers never pass the plot count
 * or read the growth rate themselves.
 */
@Injectable({ providedIn: 'root' })
export class FarmService {
  private playerStore = inject(PlayerStore)
  private questsStore = inject(QuestsStore)
  private professionService = inject(ProfessionService)
  private nextToastId = 0

  /** One popup per harvest action, newest last; each clears itself after `TOAST_MS`. */
  toasts = signal<HarvestToast[]>([])
  /** The seed a click on an empty plot plants. Read `activeSeed`: this one may have run out. */
  private selectedSeed = signal<ItemID | null>(null)

  guildTier = computed(() => this.playerStore.reputationTierOf(ReputationID.farmingGuild))
  level = computed(() => this.playerStore.professionLevel(ProfessionID.farming))
  /** The Guild tier Plant all still needs; null once it is open. */
  plantAllLock = computed(() => this.lockedUntil(PLANT_ALL_TIER))
  /** The Guild tier Harvest all still needs; null once it is open. */
  harvestAllLock = computed(() => this.lockedUntil(HARVEST_ALL_TIER))

  /** Plots from this index on are locked. */
  plotLimit = computed(() => {
    const progression = this.questsStore.questStepProgression()
    const quests = PLOT_GRANT_QUEST_IDS.filter(id => getQuestStatus(progression, id).state === QuestState.completed).length
    return plotCount(this.guildTier(), quests)
  })

  activeSeed = computed(() => {
    const seedId = this.selectedSeed()
    return seedId !== null && this.canPlant(seedId) ? seedId : null
  })

  canPlant(seedId: ItemID): boolean {
    return (this.playerStore.farm().seeds[seedId] ?? 0) > 0 && this.level() >= (FARM_SEEDS[seedId]?.requiredLevel ?? Infinity)
  }

  /** Every plot slot with its growth up to `now`, without saving it. */
  plotsAt(now: number): (Plot | null)[] {
    return syncPlots(this.playerStore.farm().plots, now, this.playerStore.stats().seedGrowthTimeReduction)
  }

  /** Ready plots among the unlocked ones at `now`. */
  readyPlotCount(now: number): number {
    return readyPlotCount(this.playerStore.farm().plots.slice(0, this.plotLimit()), now, this.playerStore.stats().seedGrowthTimeReduction)
  }

  /** Real time for `baseMs` of growth at the current rate. */
  realTimeMs(baseMs: number): number {
    return baseMs * (1 - this.playerStore.stats().seedGrowthTimeReduction)
  }

  /** Clicking the active seed again deselects it. */
  toggleSeed(seedId: ItemID): void {
    if (!this.canPlant(seedId)) return
    this.selectedSeed.update(current => current === seedId ? null : seedId)
  }

  plant(plotIndex: number): void {
    const seedId = this.activeSeed()
    if (seedId !== null) this.playerStore.plantSeed(seedId, this.plotLimit(), plotIndex)
  }

  plantAll(): void {
    const seedId = this.activeSeed()
    if (seedId !== null && this.plantAllLock() === null) this.playerStore.plantSeed(seedId, this.plotLimit())
  }

  /** One plot, or every ready plot (Harvest all) when `plotIndex` is omitted. The popup floats from `at`. */
  harvest(at: { x: number, y: number }, plotIndex?: number): void {
    if (plotIndex === undefined && this.harvestAllLock() !== null) return
    const { crops, xp, blocked, missing } = this.playerStore.harvestPlots(plotIndex)
    if (xp > 0) this.professionService.gainXp(ProfessionID.farming, xp)
    if (crops.length === 0 && !blocked) return

    const id = this.nextToastId++
    this.toasts.update(current => [...current, {
      id,
      at,
      crops: crops.map(crop => ({ ...crop, name: `items:names.${ItemID[crop.id]}`, url: ITEM_DATA[crop.id].url })),
      xp,
      blocked: blocked ? i18next.t('map:farm.harvestBlocked', { slots: missingSlotsText(missing) }) : null,
    }])
    setTimeout(() => this.toasts.update(current => current.filter(toast => toast.id !== id)), TOAST_MS)
  }

  private lockedUntil(tier: ReputationTier): ReputationTier | null {
    return this.guildTier() >= tier ? null : tier
  }
}
