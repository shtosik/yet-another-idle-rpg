import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { ConsumableEffect } from '../../../../interfaces/consumable.interface'
import { TranslatePipe } from '../../../pipes/i18next.pipe'
import { StatToPercentagePipe } from '../../../pipes/stat-to-percentage.pipe'
import { DurationPipe } from '../../../pipes/duration.pipe'

/** Tooltip lines for a food / potion: stats, mana restore, duration. */
@Component({
    selector: 'app-consumable-effect',
    templateUrl: './consumable-effect.component.html',
    styleUrls: ['./consumable-effect.component.sass'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        TranslatePipe,
        StatToPercentagePipe,
        DurationPipe,
    ],
})
export class ConsumableEffectComponent {
    effect = input.required<ConsumableEffect>()
}
