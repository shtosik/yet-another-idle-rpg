import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { BattleStore } from '../../../../store/battle/battle.store'
import { UrlPipe } from '../../../../pipes/url.pipe'
import SPELLS_DATA from '../../../../../data/spells-data'
import { SlotComponent } from '../../../shared/slot/slot.component'
import { SpellSlotComponent } from './spell-slot/spell-slot.component'

@Component({
  selector: 'app-battle-footer',
  imports: [
    UrlPipe,
    SlotComponent,
    SpellSlotComponent,
  ],
  templateUrl: './battle-footer.component.html',
  styleUrl: './battle-footer.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattleFooterComponent {
  private battleStore = inject(BattleStore)

  equippedSpells = this.battleStore.equippedSpells

  readonly slots = new Array(5).fill(null)
  protected readonly SPELLS_DATA = SPELLS_DATA

  activeSpells = computed(() => {
    return this.battleStore.equippedSpells().filter(s => s.duration > 0)
  })
}
