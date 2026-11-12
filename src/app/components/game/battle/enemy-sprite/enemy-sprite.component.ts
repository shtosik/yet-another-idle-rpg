import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { BattleStore } from '../../../../store/battle/battle.store'
import { AnimationsService } from '../../../../services/animations.service'
import { ArenaBossesService } from '../../../../services/arena-bosses.service'
import { DamageElement } from '../../../../../enums/damage-element.enum'
import { I18nextPipe } from '../../../../pipes/i18next.pipe'
import { ENEMY_SPRITE_AREA } from '../../../shared/scene/scene-sizes'

/** The enemy's sprite, placed on the battle Scene in ENEMY_SPRITE_AREA, with the arena's weak point and mounds. */
@Component({
  selector: 'app-enemy-sprite',
  templateUrl: './enemy-sprite.component.html',
  styleUrls: ['./enemy-sprite.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [I18nextPipe],
  host: {
    '[style.left.%]': 'area.left',
    '[style.top.%]': 'area.top',
    '[style.width.%]': 'area.width',
    '[style.height.%]': 'area.height',
  },
})
export class EnemySpriteComponent {
  protected readonly battleStore = inject(BattleStore)
  protected readonly bosses = inject(ArenaBossesService)
  protected readonly mounds = Array.from({ length: this.bosses.moundCount }, (_, index) => index)
  protected readonly area = ENEMY_SPRITE_AREA
  /** The sprite file's width in px; the styles scale it with the Scene. */
  protected readonly spriteWidth = signal<number | null>(null)
  private readonly sprite = viewChild<ElementRef<HTMLImageElement>>('sprite')

  constructor() {
    let hitAnimation: Animation | undefined
    inject(AnimationsService).damageEvents$.pipe(takeUntilDestroyed()).subscribe(event => {
      if (event.damage <= 0 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      hitAnimation?.cancel()
      hitAnimation = this.sprite()?.nativeElement.animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(5px) scale(0.97)', offset: 0.3 },
        { transform: 'translateX(-2px)', offset: 0.65 },
        { transform: 'translateX(0)' },
      ], { duration: 160, easing: 'ease-out' })
    })
    inject(DestroyRef).onDestroy(() => hitAnimation?.cancel())
  }

  protected readonly DamageElement = DamageElement
}
