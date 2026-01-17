import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { TranslatePipe } from 'app/pipes/i18next.pipe'
import { EnemyID } from 'enums/ids/enemy-id.enum'
import { ZoneID } from 'enums/ids/zone-id.enum'
import { BattleStore } from '../../../../store/battle/battle.store'
import { BattleManagerService } from '../../../../services/battle-manager.service'

@Component({
  selector: 'app-battle-nav-bar',
  templateUrl: 'battle-nav-bar.component.html',
  styleUrls: ['./battle-nav-bar.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe],
})
export class BattleNavBarComponent {
  private battleStore = inject(BattleStore)
  private battleManagerService = inject(BattleManagerService)

  currentWave = this.battleStore.currentWave
  requiredKillCount = this.battleStore.requiredKillCountOnCurrentWave
  currentZone = this.battleStore.currentZoneData
  currentKillCount = this.battleManagerService.currentWaveKillCount

  readonly ZoneID = ZoneID
  readonly EnemyID = EnemyID
}
