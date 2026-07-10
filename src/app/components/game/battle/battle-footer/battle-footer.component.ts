import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop'
import { BattleStore } from '../../../../store/battle/battle.store'
import { UrlPipe } from '../../../../pipes/url.pipe'
import SPELLS_DATA from '../../../../../data/spells-data'
import { SpellSlotComponent } from './spell-slot/spell-slot.component'
import { EquippedSpell } from '../../../../../interfaces/spells/equipped-spell.interface'
import { SpellID } from '../../../../../enums/ids/spell-id.enum'

const SPELL_SLOT_COUNT = 5
const PALETTE_DROP_ID = 'spellbook-palette'

@Component({
  selector: 'app-battle-footer',
  imports: [
    UrlPipe,
    SpellSlotComponent,
    CdkDropList,
    CdkDrag,
  ],
  templateUrl: './battle-footer.component.html',
  styleUrl: './battle-footer.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattleFooterComponent {
  private battleStore = inject(BattleStore)

  equippedSpells = this.battleStore.equippedSpells
  activeSpells = this.battleStore.activeBuffs

  // Each spellbar position is its own single-item drop list, so a dropped spell
  // lands in exactly the hovered slot instead of being inserted/sorted.
  slotIndices = Array.from({ length: SPELL_SLOT_COUNT }, (_, i) => i)
  connectedTo = [...this.slotIndices.map(i => `spell-slot-${i}`), PALETTE_DROP_ID]

  protected readonly SPELLS_DATA = SPELLS_DATA

  onSlotDrop(event: CdkDragDrop<number>) {
    if (event.previousContainer === event.container) return

    const targetIndex = event.container.data
    const arr: (EquippedSpell | null)[] = [...this.battleStore.equippedSpells()]
    while (arr.length < SPELL_SLOT_COUNT) arr.push(null)

    if (event.previousContainer.id === PALETTE_DROP_ID) {
      // Equip from the spellbook palette into the hovered slot.
      const spellId = event.item.data as SpellID
      const displaced = arr[targetIndex]
      arr[targetIndex] = { spellId, cooldownRemaining: 0 }
      if (displaced) {
        // Bump the previous occupant to a free slot; if none, it returns to the palette.
        const free = arr.findIndex(s => !s)
        if (free !== -1) arr[free] = displaced
      }
    } else {
      // Reorder on the bar: swap the two slots' contents.
      const sourceIndex = event.previousContainer.data as number
      ;[arr[targetIndex], arr[sourceIndex]] = [arr[sourceIndex], arr[targetIndex]]
    }

    this.battleStore.setAllEquippedSpells(arr)
  }
}
