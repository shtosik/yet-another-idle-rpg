import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { TooltipTemplateDirective } from 'ngx-tooltip-directives'
import { I18nextPipe } from 'app/pipes/i18next.pipe'
import { PlayerStore } from 'app/store/player/player.store'
import { isInvertedStat, StatSource, statContributions } from 'app/store/player/stats'
import { statsInitialState } from 'app/store/player/player'
import { formatStat, STAT_GROUPS, StatFormat, StatRow } from './stat-rows'

interface BreakdownLine {
  /** `app:statsPanel.sources.<key>`, or `base`. */
  key: StatSource | 'base'
  text: string
}

/** Stats grouped by what they affect; hovering a row breaks it down by source (gear, skills, buffs, ...). */
@Component({
  selector: 'app-player-stats',
  templateUrl: 'player-stats.component.html',
  imports: [I18nextPipe, TooltipTemplateDirective],
  styleUrls: ['./player-stats.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerStatsComponent {
  private playerStore = inject(PlayerStore)
  private playerStats = this.playerStore.stats

  /** Also lists stats still at their base value. */
  showAll = signal(false)

  groups = computed(() => {
    const stats = this.playerStats()
    const showAll = this.showAll()
    return STAT_GROUPS
      .map(group => ({
        key: group.key,
        rows: group.rows
          .filter(row => showAll || row.always || stats[row.stat] !== statsInitialState[row.stat])
          .map(row => ({ row, value: this.valueLabel(row) })),
      }))
      .filter(group => group.rows.length)
  })

  /** Whole seconds until the next mana point; null at full mana. */
  secondsToNextMana = computed(() => {
    const { mana, maxMana, manaRegenRate } = this.playerStats()
    if (mana >= maxMana) return null
    return Math.ceil((manaRegenRate - this.playerStore.manaRegenTimer()) / 1000)
  })

  toggleShowAll(): void {
    this.showAll.update(show => !show)
  }

  /** Base value, then each source's flat and percent part. Built on hover only. */
  breakdown(row: StatRow): BreakdownLine[] {
    const lines: BreakdownLine[] = [{ key: 'base', text: formatStat(row.format, statsInitialState[row.stat]) }]
    for (const { source, flat, percent } of statContributions(row.stat, this.playerStore.sourcedModifiers())) {
      const parts: string[] = []
      if (flat) parts.push(this.delta(row, flat, row.format))
      if (percent) parts.push(this.delta(row, percent, 'fraction'))
      lines.push({ key: source, text: parts.join(', ') })
    }
    return lines
  }

  totalLabel(row: StatRow): string {
    return formatStat(row.format, this.playerStats()[row.stat])
  }

  private valueLabel(row: StatRow): string {
    const stats = this.playerStats()
    if (row.format === 'mana') return `${stats.mana} / ${stats.maxMana}`
    return formatStat(row.format, stats[row.stat])
  }

  /** Signed change as the player sees it: on lower-is-better stats a positive data amount lowers the value. */
  private delta(row: StatRow, amount: number, format: StatFormat): string {
    const shown = isInvertedStat(row.stat) ? -amount : amount
    const sign = shown < 0 ? '−' : '+'
    // A multiplier grows by a plain number (×1.2 + 0.25), not by another multiplier.
    const deltaFormat = format === 'multiplier' ? 'number' : format
    return `${sign}${formatStat(deltaFormat, Math.abs(shown))}`
  }
}
