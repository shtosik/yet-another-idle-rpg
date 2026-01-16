import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { BattleStore } from '../../../../store/battle/battle.store'
import { SkillPointID } from '../../../../../enums/ids/skill-tree-node-id.enum'
import { PlayerStore } from '../../../../store/player/player.store'
import { NgOptimizedImage } from '@angular/common'

@Component({
  selector: 'app-battle-footer',
  imports: [
    NgOptimizedImage,
  ],
  templateUrl: './battle-footer.component.html',
  styleUrl: './battle-footer.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattleFooterComponent {
  private battleStore = inject(BattleStore)
  private playerStore = inject(PlayerStore)

  hasAutoWaveProgressionEnabled = this.battleStore.autoWaveProgressionEnabled
  hasAutoWaveProgressionUnlocked = computed(() =>
    this.playerStore.hasSkillUnlocked(SkillPointID.autoWaveProgression),
  )

  enableAutoWaveProgressionAction(checked: boolean) {
    this.battleStore.toggleAutoWave(checked)
  }
}
