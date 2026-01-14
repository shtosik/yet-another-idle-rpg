import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { TranslatePipe } from 'app/pipes/i18next.pipe'
import { EnemyID } from 'enums/ids/enemy-id.enum'
import { ZoneID } from 'enums/ids/zone-id.enum'
import { PlayerStore } from '../../../../store/player/player.store'
import { SkillPointID } from '../../../../../enums/ids/skill-tree-node-id.enum'
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
    playerStore = inject(PlayerStore)
    battleStore = inject(BattleStore)
    battleManagerService = inject(BattleManagerService)

    hasAutoWaveProgressionEnabled = this.battleStore.autoWaveProgressionEnabled
    currentWave = this.battleStore.currentWave
    currentEnemy = this.battleStore.enemy
    requiredKillCount = this.battleStore.requiredKillCountOnCurrentWave
    currentZone = this.battleStore.currentZoneData

    hasAutoWaveProgressionUnlocked = computed(() =>
        this.playerStore.hasSkillUnlocked(SkillPointID.autoWaveProgression),
    )

    readonly ZoneID = ZoneID
    readonly EnemyID = EnemyID

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
