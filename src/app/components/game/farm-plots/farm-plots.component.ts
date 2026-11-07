import { DecimalPipe, NgOptimizedImage } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, inject, output, signal } from '@angular/core'
import i18next from 'i18next'
import { TooltipStrDirective } from 'ngx-tooltip-directives'
import { I18nextPipe } from '../../../pipes/i18next.pipe'
import { CloseButtonComponent } from '../../shared/close-button/close-button.component'
import { FarmService } from '../../../services/farm.service'
import { PlayerStore } from '../../../store/player/player.store'
import { isReady, PLOT_SLOTS, stageOf, syncPlots } from '../../../store/player/farm'
import { reputationProgress } from '../../../store/player/reputation'
import { xpForLevel, xpToNextLevel } from '../../../store/player/professions'
import { expertiseGain } from '../../../store/player/stats'
import { reputationTierLabel, tierName } from '../quests/reputation/reputation-text'
import { formatStat } from '../player-stats/stat-rows'
import { missingSlotsText } from '../inventory/tab-text'
import { FARM_ART, FARM_SEEDS } from '../../../../data/farming-data'
import ITEM_DATA from '../../../../data/items-data'
import PROFESSIONS_DATA from '../../../../data/professions-data'
import { ItemID } from '../../../../enums/ids/item-id.enum'
import { ProfessionID } from '../../../../enums/ids/profession-id.enum'
import { ReputationID } from '../../../../enums/reputation-id.enum'
import { ReputationTier } from '../../../../enums/reputation-tier.enum'

/** Harvest all needs this Farming Guild tier; Plant all needs `PLANT_ALL_TIER` (farm doc section 5). */
const HARVEST_ALL_TIER = ReputationTier.friendly
const PLANT_ALL_TIER = ReputationTier.honored

const percentOf = (current: number, needed: number): number => needed > 0 ? current / needed * 100 : 0

/** "2h 5m", "14m 30s", "45s". */
export function formatDuration(ms: number): string {
  const seconds = Math.ceil(ms / 1000)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor(seconds % 3600 / 60)
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  if (minutes > 0) return seconds % 60 > 0 ? `${minutes}m ${seconds % 60}s` : `${minutes}m`
  return `${seconds}s`
}

/** The farm's plots panel: Guild and expertise header, seed list, Plant all and Harvest all over the 3x3 plot grid. */
@Component({
  selector: 'app-farm-plots',
  templateUrl: './farm-plots.component.html',
  styleUrl: './farm-plots.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [I18nextPipe, DecimalPipe, NgOptimizedImage, CloseButtonComponent, TooltipStrDirective],
})
export class FarmPlotsComponent {
  private playerStore = inject(PlayerStore)
  private host = inject<ElementRef<HTMLElement>>(ElementRef)
  protected farmService = inject(FarmService)

  protected readonly PLOT_SLOTS = PLOT_SLOTS

  /** Back to the farm home. */
  closed = output<void>()
  toasts = this.farmService.toasts
  plotLimit = this.farmService.plotLimit
  activeSeed = this.farmService.activeSeed

  /** Display tick: plots grow on the clock, this only redraws the timers. */
  private now = signal(Date.now())

  private points = computed(() => this.playerStore.reputation()[ReputationID.farmingGuild] ?? 0)
  guild = computed(() => {
    const points = this.points()
    const { tier, nextThreshold, current, needed } = reputationProgress(points)
    const label = reputationTierLabel(ReputationID.farmingGuild, tier)
    // Exalted has no next tier: a full bar with the total.
    if (nextThreshold === null) return { label, current: points, needed: points, percent: 100 }
    return { label, current, needed, percent: percentOf(current, needed) }
  })

  expertise = computed(() => {
    const level = this.farmService.level()
    const experience = this.playerStore.professions()[ProfessionID.farming]?.experience ?? 0
    const bonus = this.expertiseBonus(level)
    // Max level has no next one: a full bar with the total.
    if (level >= PROFESSIONS_DATA[ProfessionID.farming].maxLevel) return { level, bonus, current: experience, needed: experience, percent: 100 }
    const current = experience - xpForLevel(level)
    const needed = xpToNextLevel(level)
    return { level, bonus, current, needed, percent: percentOf(current, needed) }
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
      min: seed.yield[0],
      max: seed.yield[1],
      locked: this.farmService.level() < seed.requiredLevel ? i18next.t('map:farm.seedLocked', { level: seed.requiredLevel }) : null,
    })))

  plots = computed(() => {
    const now = this.now()
    const reduction = this.playerStore.stats().seedGrowthTimeReduction
    const limit = this.plotLimit()
    return syncPlots(this.playerStore.farm().plots, now, reduction).map((plot, index) => {
      const seed = plot && FARM_SEEDS[plot.seedId]
      if (index >= limit) return { index, state: 'locked' as const }
      if (!plot || !seed) return { index, state: 'empty' as const, soil: FARM_ART.soil.empty }

      const stage = stageOf(plot.progressMs / seed.growMs)
      const crop = { name: `items:names.${ItemID[seed.cropId]}`, url: FARM_ART.plants[seed.cropId]?.[stage] ?? ITEM_DATA[seed.cropId].url, soil: FARM_ART.soil.planted }
      if (!isReady(plot, seed.growMs)) {
        const remaining = (seed.growMs - plot.progressMs) * (1 - reduction)
        return { index, state: 'growing' as const, stage, ...crop, progress: plot.progressMs, max: seed.growMs, time: formatDuration(remaining) }
      }
      const missing = this.playerStore.missingSlotsByTab([{ id: seed.cropId, amount: plot.rolledYield ?? seed.yield[1] }])
      return { index, state: 'ready' as const, stage, ...crop, missing: Object.keys(missing).length > 0 ? missingSlotsText(missing) : null }
    })
  })

  /** CSS for a soil layer: its image, or nothing so the plot's colour shows. */
  protected soilImage = (soil: string | null | undefined): string | null => soil ? `url(${soil})` : null

  hasReadyPlot = computed(() => this.plots().some(plot => plot.state === 'ready'))
  hasEmptyPlot = computed(() => this.plots().some(plot => plot.state === 'empty'))

  /** Tooltip saying why Plant all / Harvest all are locked; null once the Guild tier is reached. */
  plantAllLock = computed(() => this.lockText(PLANT_ALL_TIER))
  harvestAllLock = computed(() => this.lockText(HARVEST_ALL_TIER))

  constructor() {
    const timer = setInterval(() => this.now.set(Date.now()), 1000)
    inject(DestroyRef).onDestroy(() => clearInterval(timer))
  }

  harvestPlot(index: number, event: MouseEvent): void {
    this.farmService.harvest(this.popupPoint(event, true), index)
  }

  harvestAll(event: MouseEvent): void {
    this.farmService.harvest(this.popupPoint(event, false))
  }

  /** In panel coordinates: the cursor, or the clicked element's centre for Harvest all and keyboard clicks (`detail` 0, no cursor position). */
  private popupPoint(event: MouseEvent, atCursor: boolean): { x: number, y: number } {
    const panel = this.host.nativeElement.getBoundingClientRect()
    if (atCursor && event.detail > 0) return { x: event.clientX - panel.left, y: event.clientY - panel.top }
    const target = (event.currentTarget as HTMLElement).getBoundingClientRect()
    return { x: target.left + target.width / 2 - panel.left, y: target.top + target.height / 2 - panel.top }
  }

  /** "1.5% faster growth time, +10% Seed Save Chance": what expertise gives so far, not gear or pets. */
  private expertiseBonus(level: number): string {
    const growthStat = PROFESSIONS_DATA[ProfessionID.farming].perLevel.stat
    const gains = expertiseGain(ProfessionID.farming, 1, level)
    const growth = i18next.t('map:farm.growthBonus', { bonus: formatStat('bonus', gains.find(gain => gain.stat === growthStat)?.amount ?? 0) })
    const milestones = gains
      .filter(gain => gain.stat !== growthStat)
      .map(({ stat, amount }) => `+${formatStat('bonus', amount)} ${i18next.t(`app:playerStats.${stat}`)}`)
    return [growth, ...milestones].join(', ')
  }

  private lockText(tier: ReputationTier): string | null {
    if (this.farmService.guildTier() >= tier) return null
    return i18next.t('map:farm.reputationLock', { tier: tierName(tier) })
  }
}
