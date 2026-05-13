import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { TranslatePipe } from 'app/pipes/i18next.pipe'
import { EnemyID } from 'enums/ids/enemy-id.enum'
import { ZoneID } from 'enums/ids/zone-id.enum'
import { BattleStore } from '../../../../store/battle/battle.store'
import { BattleManagerService } from '../../../../services/battle-manager.service'
import { PlayerStore } from '../../../../store/player/player.store'
import ENEMIES_DATA from '../../../../../data/enemies-data'
import { NgOptimizedImage } from '@angular/common'

@Component({
  selector: 'app-battle-nav-bar',
  templateUrl: 'battle-nav-bar.component.html',
  styleUrls: ['./battle-nav-bar.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe, NgOptimizedImage],
})
export class BattleNavBarComponent {
  private battleStore = inject(BattleStore)
  private battleManagerService = inject(BattleManagerService)
  private playerStore = inject(PlayerStore)

  currentWave = this.battleStore.currentWave
  requiredKillCount = this.battleStore.requiredKillCountOnCurrentWave
  currentZone = this.battleStore.currentZoneData
  currentKillCount = this.battleManagerService.currentWaveKillCount

  killCountToShow = computed(() => {
    const current = this.currentKillCount()
    const required = this.requiredKillCount()

    if (current < required) {
      return `${current} / ${required}`
    }

    return `${current}`
  })

  activeTask = this.playerStore.activeTask
  isTaskComplete = this.playerStore.isTaskComplete

  taskIndicator = computed(() => {
    const task = this.activeTask()
    if (!task) return null

    const enemy = ENEMIES_DATA[task.monsterId]
    const remaining = task.targetCount - task.currentCount
    const complete = task.currentCount >= task.targetCount

    return {
      enemyUrl: enemy.url,
      enemyName: EnemyID[task.monsterId],
      remaining,
      complete,
      current: task.currentCount,
      target: task.targetCount,
    }
  })

  readonly ZoneID = ZoneID
  readonly EnemyID = EnemyID
}
