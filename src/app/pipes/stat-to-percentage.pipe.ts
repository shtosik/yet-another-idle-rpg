import { Pipe, PipeTransform } from '@angular/core'
import { additivePercentStats, multiplierStats, percentageState, PlayerStat } from '../../types/player/player-stat.type';

@Pipe({
    name: 'statToPercentage',
    pure: false,
})
export class StatToPercentagePipe implements PipeTransform {
    transform(stat: PlayerStat, amount: number) {
        if (multiplierStats.includes(stat)) return `${Math.floor(amount * 100)}%`

        if (percentageState.includes(stat)) return `${amount}%`

        if (additivePercentStats.includes(stat)) return `+${Math.floor(amount * 100)}%`

        return amount
    }
}
