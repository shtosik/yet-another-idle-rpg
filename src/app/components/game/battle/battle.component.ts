import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { I18nextPipe } from '../../../pipes/i18next.pipe'
import { SceneComponent } from '../../shared/scene/scene.component'
import { SceneMaskComponent } from '../../shared/scene/scene-mask/scene-mask.component'
import { BattleStore } from '../../../store/battle/battle.store'
import { BattleNavBarComponent } from './battle-nav-bar/battle-nav-bar.component'
import { EnemyComponent } from './enemy/enemy.component'
import { EnemySpriteComponent } from './enemy-sprite/enemy-sprite.component'
import { DamagePopupComponent } from '../damage-popup/damage-popup.component'
import { BattleFooterComponent } from './battle-footer/battle-footer.component'
import { BattleSideButtonsComponent } from './battle-side-buttons/battle-side-buttons.component'
import { NoticesService } from '../../../services/notices.service'
import { ARENA } from '../../../../data/arena-data'

@Component({
  selector: 'app-battle',
  templateUrl: 'battle.component.html',
  styleUrls: ['./battle.component.sass'],
  imports: [
    CommonModule, SceneComponent, SceneMaskComponent, I18nextPipe,
    BattleNavBarComponent, EnemyComponent, EnemySpriteComponent, DamagePopupComponent, BattleFooterComponent, BattleSideButtonsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class BattleComponent {
  battleStore = inject(BattleStore)

  dropsLostToast = inject(NoticesService).toast('battle')
  seedFoundToast = inject(NoticesService).toast('battleBelow')
  isInCombat = this.battleStore.isInCombat
  currentZoneData = this.battleStore.currentZoneData

  readonly sceneUrl = computed(() => this.battleStore.arenaRun() ? ARENA.url : this.currentZoneData().url)
}
