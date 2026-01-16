import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, effect, inject, signal, viewChild } from '@angular/core'
import { UrlPipe } from 'app/pipes/url.pipe'
import { SpinnerComponent } from 'app/components/shared/spinner/spinner.component'
import { BattleStore } from '../../../store/battle/battle.store'
import ZONES_DATA from '../../../../data/zones-data'
import { BattleNavBarComponent } from './battle-nav-bar/battle-nav-bar.component'
import { EnemyComponent } from './enemy/enemy.component'
import { DamagePopupComponent } from '../damage-popup/damage-popup.component'
import { BattleFooterComponent } from './battle-footer/battle-footer.component'

@Component({
    selector: 'app-battle',
    templateUrl: 'battle.component.html',
    styleUrls: ['./battle.component.sass'],
    imports: [
        CommonModule, UrlPipe, SpinnerComponent,
        BattleNavBarComponent, EnemyComponent, DamagePopupComponent, BattleFooterComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class BattleComponent {
    battleStore = inject(BattleStore)
    enemyContainerContainer = viewChild<EnemyComponent>('enemyElement')

    currentZoneId = this.battleStore.currentZoneId
    isInCombat = this.battleStore.isInCombat
    currentZoneData = this.battleStore.currentZoneData

    enemyPosition = signal({ x: 0, y: 0 })
    protected readonly ZONES_DATA = ZONES_DATA

    constructor() {
        effect(() => {
            const enemy = this.enemyContainerContainer()
            const el = enemy?.getEnemyNativeElement()

            if (!el) return

            const rect = el.getBoundingClientRect()

            this.enemyPosition.set({
                x: rect.left + window.scrollX + rect.width + 10,
                y: rect.top + window.scrollY + rect.height / 2,
            })
        })
    }
}
