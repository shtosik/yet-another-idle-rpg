import { NgOptimizedImage } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { BattleStore } from '../../../../store/battle/battle.store'
import { ARENA } from '../../../../../data/arena-data'
import { I18nextPipe } from '../../../../pipes/i18next.pipe'
import { MonsterDebuffBarComponent, WEAKNESS_ICONS } from './monster-debuff-bar/monster-debuff-bar.component'
import { ArenaBossesService } from '../../../../services/arena-bosses.service'
import { DamageElement } from '../../../../../enums/damage-element.enum'
import { DisplayNamePipe } from '../../../../pipes/display-name.pipe'

/** The enemy's name, tags, HP bar and arena status lines: battle HUD at a fixed size (the sprite is `app-enemy-sprite`). */
@Component({
  imports: [DisplayNamePipe, I18nextPipe, MonsterDebuffBarComponent, NgOptimizedImage],
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

  readonly isBoss = computed(() => {
    const run = this.battleStore.arenaRun()
    if (run) return ARENA.waves[run.wave - 1]?.count === 1
    return this.battleStore.currentWave() === this.battleStore.currentZoneData().maxWave
  })
  readonly hpPercent = computed(() => Math.max(0, Math.min(100, this.currentEnemyHp() / this.currentEnemy().maxHp * 100)))

  protected readonly DamageElement = DamageElement
  protected readonly WEAKNESS_ICONS = WEAKNESS_ICONS
}
