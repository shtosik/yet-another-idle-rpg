import { ChangeDetectionStrategy, Component, DestroyRef, inject, Input, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { AnimationsService } from '../../../services/animations.service'
import { I18nextPipe } from '../../../pipes/i18next.pipe'

const POPUP_LIFETIME_IN_MS = 1000
// Hits in the same tick start at the same spot; a small sideways jitter keeps them readable.
const POPUP_JITTER_IN_PX = 24

interface FloatingDamage {
  id: number // for tracking in template loop
  offsetX: number
  damage: number;
  isCriticalHit: boolean;
  isStrong: boolean;
}

@Component({
  selector: 'app-damage-popup',
  templateUrl: './damage-popup.component.html',
  styleUrls: ['./damage-popup.component.sass'],
  imports: [I18nextPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DamagePopupComponent {
  @Input() x: number
  @Input() y: number

  floatingDamages = signal<FloatingDamage[]>([])
  private animationsService = inject(AnimationsService)
  private nextId = 0
  private removeTimers = new Set<ReturnType<typeof setTimeout>>()

  constructor() {
    this.animationsService.damageEvents$
      .pipe(takeUntilDestroyed())
      .subscribe(event => this.addPopup({
        id: this.nextId++,
        offsetX: Math.round((Math.random() * 2 - 1) * POPUP_JITTER_IN_PX),
        damage: event.damage,
        isCriticalHit: !!event.isCriticalHit,
        isStrong: !!event.isStrong,
      }))

    inject(DestroyRef).onDestroy(() => this.removeTimers.forEach(clearTimeout))
  }

  private addPopup(popup: FloatingDamage) {
    this.floatingDamages.update(current => [...current, popup])

    const timer = setTimeout(() => {
      this.removeTimers.delete(timer)
      this.floatingDamages.update(current => current.filter(p => p.id !== popup.id))
    }, POPUP_LIFETIME_IN_MS)
    this.removeTimers.add(timer)
  }
}
