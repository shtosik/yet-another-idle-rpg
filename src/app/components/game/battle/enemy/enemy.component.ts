import { NgOptimizedImage } from '@angular/common'
import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core'
import { BattleStore } from '../../../../store/battle/battle.store'
import ENEMIES_DATA from '../../../../../data/enemies-data'
import { EnemyID } from '../../../../../enums/ids/enemy-id.enum'
import { I18nextPipe } from '../../../../pipes/i18next.pipe'
import { HalfSizeSpriteDirective } from '../../../shared/half-size-sprite/half-size-sprite.directive'
import { MonsterDebuffBarComponent } from './monster-debuff-bar/monster-debuff-bar.component'

@Component({
  imports: [I18nextPipe, MonsterDebuffBarComponent, HalfSizeSpriteDirective],
  selector: 'app-enemy',
  templateUrl: 'enemy.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./enemy.component.sass'],
})

export class EnemyComponent {
  battleStore = inject(BattleStore)
  currentEnemyHp = this.battleStore.currentEnemyHp
  currentEnemy = this.battleStore.enemy

  enemyWindowRef = viewChild<ElementRef>('enemy')

  getEnemyNativeElement(): HTMLElement | null {
    return this.enemyWindowRef()?.nativeElement || null
  }

  protected readonly ENEMIES_DATA = ENEMIES_DATA
  protected readonly EnemyID = EnemyID
}
