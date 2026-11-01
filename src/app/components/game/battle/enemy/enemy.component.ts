import { NgOptimizedImage } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, inject, viewChild } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { BattleStore } from '../../../../store/battle/battle.store'
import { ARENA } from '../../../../../data/arena-data'
import { AnimationsService } from '../../../../services/animations.service'
import { EnemyID } from '../../../../../enums/ids/enemy-id.enum'
import { I18nextPipe } from '../../../../pipes/i18next.pipe'
import { HalfSizeSpriteDirective } from '../../../shared/half-size-sprite/half-size-sprite.directive'
import { MonsterDebuffBarComponent, WEAKNESS_ICONS } from './monster-debuff-bar/monster-debuff-bar.component'
import { ArenaBossesService } from '../../../../services/arena-bosses.service'
import { DamageElement } from '../../../../../enums/damage-element.enum'

@Component({
  imports: [I18nextPipe, MonsterDebuffBarComponent, HalfSizeSpriteDirective, NgOptimizedImage],
  selector: 'app-enemy',
  templateUrl: 'enemy.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./enemy.component.sass'],
})

export class EnemyComponent {
  battleStore = inject(BattleStore)
  currentEnemyHp = this.battleStore.currentEnemyHp
  currentEnemy = this.battleStore.enemy
  bosses = inject(ArenaBossesService)
  readonly mounds = Array.from({ length: this.bosses.moundCount }, (_, index) => index)

  readonly isBoss = computed(() => {
    const run = this.battleStore.arenaRun()
    if (run) return ARENA.waves[run.wave - 1]?.count === 1
    return this.battleStore.currentWave() === this.battleStore.currentZoneData().maxWave
  })
  readonly hpPercent = computed(() => Math.max(0, Math.min(100, this.currentEnemyHp() / this.currentEnemy().maxHp * 100)))
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

  protected readonly EnemyID = EnemyID
  protected readonly DamageElement = DamageElement
  protected readonly WEAKNESS_ICONS = WEAKNESS_ICONS
}
