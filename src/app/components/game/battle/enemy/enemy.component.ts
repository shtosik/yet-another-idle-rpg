import { NgOptimizedImage } from '@angular/common'
import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core'
import { BattleStore } from '../../../../store/battle/battle.store'
import ENEMIES_DATA from '../../../../../data/enemies-data'
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

  enemyWindowRef = viewChild<ElementRef>('enemy')

  getEnemyNativeElement(): HTMLElement | null {
    return this.enemyWindowRef()?.nativeElement || null
  }

  protected readonly ENEMIES_DATA = ENEMIES_DATA
  protected readonly EnemyID = EnemyID
  protected readonly DamageElement = DamageElement
  protected readonly WEAKNESS_ICONS = WEAKNESS_ICONS
}
