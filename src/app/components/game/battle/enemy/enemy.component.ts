import { NgOptimizedImage } from '@angular/common'
import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core'
import { BattleStore } from '../../../../store/battle/battle.store'

@Component({
    imports: [NgOptimizedImage],
    selector: 'app-enemy',
    templateUrl: 'enemy.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrls: ['./enemy.component.sass'],
})

export class EnemyComponent {
    battleStore = inject(BattleStore)
    currentEnemyHp = this.battleStore.currentEnemyHp
    currentEnemy = this.battleStore.enemy

    enemyWindowRef = viewChild<ElementRef>('enemy')

    getEnemyNativeElement(): HTMLElement | null {
        return this.enemyWindowRef()?.nativeElement || null
    }
}
