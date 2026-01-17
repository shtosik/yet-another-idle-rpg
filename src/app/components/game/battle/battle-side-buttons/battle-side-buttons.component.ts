import { Component, computed, inject } from '@angular/core'
import { BattleStore } from '../../../../store/battle/battle.store'
import { BattleManagerService } from '../../../../services/battle-manager.service'
import { NgOptimizedImage } from '@angular/common'
import { SkillPointID } from '../../../../../enums/ids/skill-tree-node-id.enum'
import { PlayerStore } from '../../../../store/player/player.store'

@Component({
  selector: 'app-battle-side-buttons',
  imports: [
    NgOptimizedImage,
  ],
  templateUrl: './battle-side-buttons.component.html',
  styleUrl: './battle-side-buttons.component.sass',
})
export class BattleSideButtonsComponent {
  private battleStore = inject(BattleStore)
  private playerStore = inject(PlayerStore)
  private battleManagerService = inject(BattleManagerService)

  canMoveToPreviousWave = this.battleManagerService.canMoveToPreviousWave
  canMoveToNextWave = this.battleManagerService.canMoveToNextWave

  hasAutoWaveProgressionEnabled = this.battleStore.autoWaveProgressionEnabled
  hasAutoWaveProgressionUnlocked = computed(() =>
    this.playerStore.hasSkillUnlocked(SkillPointID.autoWaveProgression),
  )

  onNextWave() {
    this.battleStore.changeWave(true)
  }

  onPreviousWave() {
    this.battleStore.changeWave(false)
  }

  enableAutoWaveProgressionAction(checked: boolean) {
    this.battleStore.toggleAutoWave(checked)
  }
}
