import { ChangeDetectionStrategy, Component, effect, inject, Input, signal } from '@angular/core'
import { AnimationsService } from '../../../services/animations.service'

interface FloatingDamage {
    id: number;
    damage: number;
    isCriticalHit: boolean;
}

@Component({
    selector: 'app-damage-popup',
    templateUrl: './damage-popup.component.html',
    styleUrls: ['./damage-popup.component.sass'],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class DamagePopupComponent {
    @Input() x: number
    @Input() y: number

    floatingDamages = signal<FloatingDamage[]>([])
    private idCounter = 0
    private animationsService = inject(AnimationsService)


    constructor() {
        effect(() => {
            const damageEvent = this.animationsService.damageEvent()
            if (!damageEvent) return

            const id = this.idCounter++
            const newDamage = {
                id,
                damage: damageEvent.damage,
                isCriticalHit: !!damageEvent.isCriticalHit,
            }

            // 2. Use .update() to trigger change detection
            this.floatingDamages.update(current => [...current, newDamage])

            // 3. Cleanup logic using .update()
            setTimeout(() => {
                this.floatingDamages.update(current =>
                    current.filter(d => d.id !== id),
                )
            }, 1000)
        })
    }
}
