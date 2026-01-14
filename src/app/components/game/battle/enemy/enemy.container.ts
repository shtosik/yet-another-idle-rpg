import { Component, ElementRef, inject, input, ViewChild } from '@angular/core'
import { Enemy } from 'interfaces/enemy.interface'
import { EnemyComponent } from './enemy.component'
import { BattleStore } from '../../../../store/battle/battle.store'

@Component({
    selector: 'app-enemy-container',
    template: `
        <app-enemy
            #enemy
            [currentEnemy]="currentEnemy()"
            [currentEnemyHp]="currentEnemyHp()"
        />
    `,
    imports: [EnemyComponent],
})

export class EnemyContainer {
    battleStore = inject(BattleStore)
    currentEnemyHp = this.battleStore.currentEnemyHp

    currentEnemy = input<Enemy>()

    @ViewChild('enemy', { read: ElementRef }) enemyWindowRef!: ElementRef

    getEnemyNativeElement(): HTMLElement | null {
        return this.enemyWindowRef?.nativeElement || null
    }
}
