import { Pipe, PipeTransform } from '@angular/core'
import { calculateXp } from '../store/player/experience'

export { calculateXp }

@Pipe({
    name: 'calculateXp',
    pure: false,
})
export class CalculateXpPipe implements PipeTransform {
    transform(level: number) {
        //Tibia XP formula
        return calculateXp(level)
    };
}
