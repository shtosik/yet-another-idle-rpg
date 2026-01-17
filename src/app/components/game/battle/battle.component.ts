import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core'
import { UrlPipe } from 'app/pipes/url.pipe'
import { SpinnerComponent } from 'app/components/shared/spinner/spinner.component'
import { BattleStore } from '../../../store/battle/battle.store'
import { BattleNavBarComponent } from './battle-nav-bar/battle-nav-bar.component'
import { EnemyComponent } from './enemy/enemy.component'
import { DamagePopupComponent } from '../damage-popup/damage-popup.component'
import { BattleFooterComponent } from './battle-footer/battle-footer.component'
import { BattleSideButtonsComponent } from './battle-side-buttons/battle-side-buttons.component'

@Component({
  selector: 'app-battle',
  templateUrl: 'battle.component.html',
  styleUrls: ['./battle.component.sass'],
  imports: [
    CommonModule, UrlPipe, SpinnerComponent,
    BattleNavBarComponent, EnemyComponent, DamagePopupComponent, BattleFooterComponent, BattleSideButtonsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class BattleComponent {
  battleStore = inject(BattleStore)
  enemyContainerContainer = viewChild<EnemyComponent>('enemyElement')

  isInCombat = this.battleStore.isInCombat
  currentZoneData = this.battleStore.currentZoneData

  enemyPosition = signal({ x: 0, y: 0 })

  constructor() {
    // was used to determine the position of the damage popup, for now not needed
    // effect(() => {
    //   const enemy = this.enemyContainerContainer()
    //   const el = enemy?.getEnemyNativeElement()
    //
    //   if (!el) return
    //
    //   const rect = el.getBoundingClientRect()
    //
    //   console.log(rect)
    //
    //   this.enemyPosition.set({
    //     x: rect.left + 10,
    //     y: rect.top / 2,
    //   })
    // })
  }
}
