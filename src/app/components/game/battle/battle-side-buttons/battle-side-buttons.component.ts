import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { I18nextPipe } from '../../../../pipes/i18next.pipe'
import { BattleStore } from '../../../../store/battle/battle.store'
import { BattleManagerService } from '../../../../services/battle-manager.service'
import { NgOptimizedImage } from '@angular/common'
import { SkillNodeID } from '../../../../../enums/ids/skill-node-id.enum'
import { PlayerStore } from '../../../../store/player/player.store'

@Component({
  selector: 'app-battle-side-buttons',
  imports: [
    NgOptimizedImage,
    I18nextPipe,
  ],
  templateUrl: './battle-side-buttons.component.html',
  styleUrl: './battle-side-buttons.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattleSideButtonsComponent {
  private battleStore = inject(BattleStore)
  private playerStore = inject(PlayerStore)
  private battleManagerService = inject(BattleManagerService)

  canMoveToPreviousWave = this.battleManagerService.canMoveToPreviousWave
  isInArena = computed(() => !!this.battleStore.arenaRun())
  canMoveToNextWave = this.battleManagerService.canMoveToNextWave

  hasAutoWaveProgressionEnabled = this.battleStore.autoWaveProgressionEnabled
  hasAutoWaveProgressionUnlocked = computed(() =>
    this.playerStore.hasSkillUnlocked(SkillNodeID.autoWaveProgression),
  )

  hasAutoEatEnabled = this.battleStore.autoEatEnabled
  hasAutoEatUnlocked = computed(() =>
    this.playerStore.hasSkillUnlocked(SkillNodeID.autoEat),
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

  toggleAutoEat(enabled: boolean) {
    this.battleStore.toggleAutoEat(enabled)
  }
}
