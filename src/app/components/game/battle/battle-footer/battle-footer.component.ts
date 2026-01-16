import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { BattleStore } from '../../../../store/battle/battle.store'
import { SkillPointID } from '../../../../../enums/ids/skill-tree-node-id.enum'
import { PlayerStore } from '../../../../store/player/player.store'
import { NgOptimizedImage } from '@angular/common'
import { UrlPipe } from '../../../../pipes/url.pipe'
import SPELLS_DATA from '../../../../../data/spells-data'

@Component({
  selector: 'app-battle-footer',
  imports: [
    NgOptimizedImage,
    UrlPipe,
  ],
  templateUrl: './battle-footer.component.html',
  styleUrl: './battle-footer.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattleFooterComponent {
  private battleStore = inject(BattleStore)
  private playerStore = inject(PlayerStore)
  protected readonly SPELLS_DATA = SPELLS_DATA

  hasAutoWaveProgressionEnabled = this.battleStore.autoWaveProgressionEnabled
  hasAutoWaveProgressionUnlocked = computed(() =>
    this.playerStore.hasSkillUnlocked(SkillPointID.autoWaveProgression),
  )

  activeSpells = computed(() => {
    return this.battleStore.equippedSpells().filter(s => s.duration > 0)
  })

  enableAutoWaveProgressionAction(checked: boolean) {
    this.battleStore.toggleAutoWave(checked)
  }
}
