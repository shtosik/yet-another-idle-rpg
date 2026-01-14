import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, Input } from '@angular/core'
import { TranslatePipe } from 'app/pipes/i18next.pipe'
import { EnemyID } from 'enums/ids/enemy-id.enum'
import { ZoneID } from 'enums/ids/zone-id.enum'
import { Enemy } from 'interfaces/enemy.interface'
import { Zone } from 'interfaces/zone.interface'
import { PlayerStore } from '../../../../store/player/player.store'
import { SkillPointID } from '../../../../../enums/ids/skill-tree-node-id.enum'
import { BattleStore } from '../../../../store/battle/battle.store'

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

    hasAutoWaveProgressionEnabled = this.battleStore.autoWaveProgressionEnabled
    currentWave = this.battleStore.currentWave
    currentWaveKillCount = computed(() => {
        const zoneProgression = this.playerStore.zonesProgression()[this.battleStore.currentZone()] || {}
        console.log(zoneProgression)
        return zoneProgression[this.battleStore.currentWave()] || 0
    })
    hasAutoWaveProgressionUnlocked = computed(() =>
        this.playerStore.hasSkillUnlocked(SkillPointID.autoWaveProgression),
    )

    @Input() currentEnemy: Enemy
    @Input() currentZone: Zone

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
