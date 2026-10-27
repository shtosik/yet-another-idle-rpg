import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { I18nextPipe } from 'app/pipes/i18next.pipe'
import { EnemyID } from 'enums/ids/enemy-id.enum'
import { ZoneID } from 'enums/ids/zone-id.enum'
import { BattleStore } from '../../../../store/battle/battle.store'
import { BattleManagerService } from '../../../../services/battle-manager.service'
import { GameNavigationService } from '../../../../services/game-navigation.service'
import { isTaskDone, PlayerStore } from '../../../../store/player/player.store'
import ENEMIES_DATA from '../../../../../data/enemies-data'
import { NgOptimizedImage } from '@angular/common'
import { ZoneMasteryComponent } from './zone-mastery/zone-mastery.component'

@Component({
  selector: 'app-battle-nav-bar',
  templateUrl: 'battle-nav-bar.component.html',
  styleUrls: ['./battle-nav-bar.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, I18nextPipe, NgOptimizedImage, ZoneMasteryComponent],
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

  private navigation = inject(GameNavigationService)

  /** A finished task's indicator jumps straight to Marvin's dialogue. */
  claimAtMarvin(): void {
    this.navigation.talkToMarvin()
  }

  taskIndicators = computed(() =>
    this.playerStore.activeTasks().map(task => ({
      id: task.id,
      enemyUrl: ENEMIES_DATA[task.monsterId].url,
      enemyName: EnemyID[task.monsterId],
      remaining: task.targetCount - task.currentCount,
      complete: isTaskDone(task),
    })),
  )

  readonly ZoneID = ZoneID
  readonly EnemyID = EnemyID
}
