import { Pipe, PipeTransform } from '@angular/core'

/** Compact countdown label: 754 -> "12:34", 42 -> "42s". */
@Pipe({
    name: 'duration',
})
export class DurationPipe implements PipeTransform {
    transform(seconds: number) {
        if (seconds < 60) return `${seconds}s`

        const minutes = Math.floor(seconds / 60)
        const rest = seconds % 60
        return `${minutes}:${rest.toString().padStart(2, '0')}`
    }
}
