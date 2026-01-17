import { ChangeDetectionStrategy, Component, effect, inject, Input, signal } from '@angular/core'
import { AnimationsService } from '../../../services/animations.service'

interface FloatingDamage {
  id: number // for tracking in template loop
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
  private animationsService = inject(AnimationsService)
  private idCounter: number = 0

  constructor() {
    effect(() => {
      const damageEvent = this.animationsService.damageEvent()
      if (!damageEvent) return

      const newDamage = {
        id: this.idCounter,
        damage: damageEvent.damage,
        isCriticalHit: !!damageEvent.isCriticalHit,
      }

      this.idCounter++

      if (this.idCounter >= 100) this.idCounter = 0

      this.floatingDamages.update(current => [...current, newDamage])

      setTimeout(() => {
        this.floatingDamages.update(current => {
          current.shift()
          return current
        })
      }, 1000)
    })
  }
}
