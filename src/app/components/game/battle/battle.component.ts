import { CommonModule } from '@angular/common'
import { AfterViewChecked, ChangeDetectionStrategy, Component, inject, ViewChild } from '@angular/core'
import { UrlPipe } from 'app/pipes/url.pipe'
import { SpinnerComponent } from 'app/components/shared/spinner/spinner.component'
import { BattleNavBarContainer } from './battle-nav-bar/battle-nav-bar.container'
import { DamagePopupComponent } from '../damage-popup/damage-popup.component'
import { EnemyContainer } from './enemy/enemy.container'
import { BattleStore } from '../../../store/battle/battle.store'
import ZONES_DATA from '../../../../data/zones-data'

@Component({
    selector: 'app-battle',
    templateUrl: 'battle.component.html',
    styleUrls: ['./battle.component.sass'],
    imports: [
        CommonModule, UrlPipe, SpinnerComponent, BattleNavBarContainer,
        DamagePopupComponent, EnemyContainer,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class BattleComponent implements AfterViewChecked {
    battleStore = inject(BattleStore)

    @ViewChild('enemyElement') enemyContainerContainer: EnemyContainer

    currentZoneId = this.battleStore.currentZone
    isInCombat = this.battleStore.isInCombat
    currentEnemy = this.battleStore.enemy

    enemyX = 0
    enemyY = 0
    protected readonly ZONES_DATA = ZONES_DATA
    private coordsSet = false

    ngAfterViewChecked() {
        const nativeEl = this.enemyContainerContainer?.getEnemyNativeElement()

        if (!this.coordsSet && nativeEl) {
            this.coordsSet = true
            const rect = nativeEl.getBoundingClientRect()
            this.enemyX = rect.left + rect.width + 10
            this.enemyY = rect.top + rect.height / 2
        }
    }
}
