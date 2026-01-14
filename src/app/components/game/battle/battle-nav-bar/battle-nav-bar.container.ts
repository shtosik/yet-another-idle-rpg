import { Component, Input } from '@angular/core'
import { BattleNavBarComponent } from './battle-nav-bar.component'
import { Enemy } from 'interfaces/enemy.interface'
import { Zone } from 'interfaces/zone.interface'

@Component({
    selector: 'app-battle-nav-bar-container',
    template: `
        <app-battle-nav-bar
            [currentEnemy]="currentEnemy"
            [currentZone]="currentZone"
        />`,
    imports: [BattleNavBarComponent],
})

export class BattleNavBarContainer {
    @Input() currentEnemy: Enemy
    @Input() currentZone: Zone
}
