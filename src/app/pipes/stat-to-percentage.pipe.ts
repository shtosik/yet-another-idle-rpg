import { Pipe, PipeTransform } from '@angular/core'
import { additivePercentStats, multiplierStats, percentageStats, PlayerStat } from '../../types/player/player-stat.type';
import { isInvertedStat } from '../store/player/stats'
import { formatStat, STAT_GROUPS } from '../components/game/player-stats/stat-rows'

const STAT_ROWS = STAT_GROUPS.flatMap(group => group.rows)

/** A stat amount from data as a signed bonus: "+15%", "+3", or for lower-is-better stats "-3s" in the stats panel's unit. */
@Pipe({
    name: 'statToPercentage',
    pure: false,
})
export class StatToPercentagePipe implements PipeTransform {
    transform(stat: PlayerStat, amount: number) {
        if (multiplierStats.includes(stat) || additivePercentStats.includes(stat)) return `+${Math.floor(amount * 100)}%`

        if (percentageStats.includes(stat)) return `+${amount}%`

        // Data amounts are "positive = better", so a lower-is-better stat goes down by the amount.
        const row = STAT_ROWS.find(r => r.stat === stat)
        if (isInvertedStat(stat)) return `-${row ? formatStat(row.format, amount) : amount}`

        return `+${amount}`
    }
}
