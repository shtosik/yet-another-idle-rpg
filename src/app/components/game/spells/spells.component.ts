import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { SpellSlotComponent } from './spell-slot/spell-slot.component'
import { SlotComponent } from '../../shared/slot/slot.component'
import { BattleStore } from '../../../store/battle/battle.store'

@Component({
    selector: 'app-spells',
    templateUrl: 'spells.component.html',
    styleUrls: ['spells.component.sass'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        SpellSlotComponent,
        SlotComponent,
    ],
})
export class SpellsComponent {
    battleStore = inject(BattleStore)
    equippedSpells = this.battleStore.equippedSpells

    readonly slots = new Array(5).fill(null)
}
