import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { BattleStore } from '../../../../store/battle/battle.store'
import { UrlPipe } from '../../../../pipes/url.pipe'
import SPELLS_DATA from '../../../../../data/spells-data'

@Component({
  selector: 'app-battle-footer',
  imports: [
    UrlPipe,
  ],
  templateUrl: './battle-footer.component.html',
  styleUrl: './battle-footer.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattleFooterComponent {
  private battleStore = inject(BattleStore)
  protected readonly SPELLS_DATA = SPELLS_DATA

  activeSpells = computed(() => {
    return this.battleStore.equippedSpells().filter(s => s.duration > 0)
  })
}
