import { NgOptimizedImage } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, output, signal } from '@angular/core'
import i18next from 'i18next'
import { I18nextPipe } from '../../../pipes/i18next.pipe'
import { CloseButtonComponent } from '../../shared/close-button/close-button.component'
import { FarmService } from '../../../services/farm.service'
import { PlayerStore } from '../../../store/player/player.store'
import { isReady, PLOT_SLOTS, syncPlots } from '../../../store/player/farm'
import { reputationProgress } from '../../../store/player/reputation'
import { xpForLevel, xpToNextLevel } from '../../../store/player/professions'
import { reputationLockText, reputationTierLabel } from '../quests/reputation/reputation-text'
import { missingSlotsText } from '../inventory/tab-text'
import { FARM_SEEDS } from '../../../../data/farming-data'
import ITEM_DATA from '../../../../data/items-data'
import PROFESSIONS_DATA from '../../../../data/professions-data'
import { ItemID } from '../../../../enums/ids/item-id.enum'
import { ProfessionID } from '../../../../enums/ids/profession-id.enum'
import { ReputationID } from '../../../../enums/reputation-id.enum'
import { ReputationTier } from '../../../../enums/reputation-tier.enum'

/** Harvest all needs this Farming Guild tier; Plant all needs `PLANT_ALL_TIER` (farm doc section 5). */
const HARVEST_ALL_TIER = ReputationTier.friendly
const PLANT_ALL_TIER = ReputationTier.honored

/** "2h 5m", "14m 30s", "45s". */
export function formatDuration(ms: number): string {
  const seconds = Math.ceil(ms / 1000)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor(seconds % 3600 / 60)
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  if (minutes > 0) return seconds % 60 > 0 ? `${minutes}m ${seconds % 60}s` : `${minutes}m`
  return `${seconds}s`
}

/** The farm's plots panel: Guild and expertise header, seed list, 3x3 plot grid, Plant all and Harvest all. */
@Component({
  selector: 'app-farm-plots',
  templateUrl: './farm-plots.component.html',
  styleUrl: './farm-plots.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [I18nextPipe, NgOptimizedImage, CloseButtonComponent],
})
export class FarmPlotsComponent {
  private playerStore = inject(PlayerStore)
  protected farmService = inject(FarmService)

  protected readonly PLOT_SLOTS = PLOT_SLOTS

  /** Back to the farm home. */
  closed = output<void>()
  toast = this.farmService.toast
  plotLimit = this.farmService.plotLimit
  activeSeed = this.farmService.activeSeed

  /** Display tick: plots grow on the clock, this only redraws the timers. */
  private now = signal(Date.now())

  private points = computed(() => this.playerStore.reputation()[ReputationID.farmingGuild] ?? 0)
  guild = computed(() => {
    const progress = reputationProgress(this.points())
    return { ...progress, label: reputationTierLabel(ReputationID.farmingGuild, progress.tier) }
  })

  expertise = computed(() => {
    const level = this.farmService.level()
    const experience = this.playerStore.professions()[ProfessionID.farming]?.experience ?? 0
    const maxed = level >= PROFESSIONS_DATA[ProfessionID.farming].maxLevel
    const next = Object.values(FARM_SEEDS)
      .filter(seed => seed.requiredLevel > level)
      .sort((a, b) => a.requiredLevel - b.requiredLevel)[0]
    return {
      level,
      current: maxed ? 1 : experience - xpForLevel(level),
      needed: maxed ? 1 : xpToNextLevel(level),
      next: next ? i18next.t('map:farm.expertiseNext', { seed: i18next.t(`items:names.${ItemID[next.seedId]}`), level: next.requiredLevel }) : null,
    }
  })

  seeds = computed(() => Object.values(FARM_SEEDS)
    .filter(seed => (this.playerStore.farm().seeds[seed.seedId] ?? 0) > 0)
    .sort((a, b) => a.tier - b.tier)
    .map(seed => ({
      id: seed.seedId,
      name: `items:names.${ItemID[seed.seedId]}`,
      url: ITEM_DATA[seed.seedId].url,
      count: this.playerStore.farm().seeds[seed.seedId] ?? 0,
      time: formatDuration(seed.growMs * (1 - this.playerStore.stats().seedGrowthTimeReduction)),
      yield: seed.yield,
      locked: this.farmService.level() < seed.requiredLevel ? i18next.t('map:farm.seedLocked', { level: seed.requiredLevel }) : null,
    })))

  plots = computed(() => {
    const now = this.now()
    const reduction = this.playerStore.stats().seedGrowthTimeReduction
    const limit = this.plotLimit()
    return syncPlots(this.playerStore.farm().plots, now, reduction).map((plot, index) => {
      const seed = plot && FARM_SEEDS[plot.seedId]
      if (index >= limit) return { index, state: 'locked' as const }
      if (!plot || !seed) return { index, state: 'empty' as const }

      const crop = { name: `items:names.${ItemID[seed.cropId]}`, url: ITEM_DATA[seed.cropId].url }
      if (!isReady(plot, seed.growMs)) {
        const remaining = (seed.growMs - plot.progressMs) * (1 - reduction)
        return { index, state: 'growing' as const, ...crop, progress: plot.progressMs, max: seed.growMs, time: formatDuration(remaining) }
      }
      const missing = this.playerStore.missingSlotsByTab([{ id: seed.cropId, amount: plot.rolledYield ?? seed.yield }])
      return { index, state: 'ready' as const, ...crop, missing: Object.keys(missing).length > 0 ? missingSlotsText(missing) : null }
    })
  })

  hasReadyPlot = computed(() => this.plots().some(plot => plot.state === 'ready'))
  hasEmptyPlot = computed(() => this.plots().some(plot => plot.state === 'empty'))

  /** Why Plant all / Harvest all are locked; null once the Guild tier is reached. */
  plantAllLock = computed(() => this.lockText(PLANT_ALL_TIER))
  harvestAllLock = computed(() => this.lockText(HARVEST_ALL_TIER))

  constructor() {
    const timer = setInterval(() => this.now.set(Date.now()), 1000)
    inject(DestroyRef).onDestroy(() => clearInterval(timer))
  }

  clickPlot(index: number, state: 'empty' | 'ready'): void {
    if (state === 'empty') this.farmService.plant(index)
    else this.farmService.harvest(index)
  }

  private lockText(tier: ReputationTier): string | null {
    if (this.farmService.guildTier() >= tier) return null
    return reputationLockText(ReputationID.farmingGuild, tier, this.points())
  }
}
