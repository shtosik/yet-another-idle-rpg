import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop'
import { BattleStore } from '../../../../store/battle/battle.store'
import { UrlPipe } from '../../../../pipes/url.pipe'
import SPELLS_DATA from '../../../../../data/spells-data'
import { SpellSlotComponent } from './spell-slot/spell-slot.component'
import { EquippedSpell } from '../../../../../interfaces/spells/equipped-spell.interface'
import { SpellID } from '../../../../../enums/ids/spell-id.enum'
import ITEM_DATA from '../../../../../data/items-data'
import { DurationPipe } from '../../../../pipes/duration.pipe'
import { I18nextPipe } from '../../../../pipes/i18next.pipe'
import { ItemID } from '../../../../../enums/ids/item-id.enum'
import { CONSUMABLE_SLOTS } from '../../../../../interfaces/consumable.interface'

const SPELL_SLOT_COUNT = 5
const MS_PER_SECOND = 1000
const PALETTE_DROP_ID = 'spellbook-palette'

@Component({
  selector: 'app-battle-footer',
  imports: [
    UrlPipe,
    SpellSlotComponent,
    CdkDropList,
    CdkDrag,
    DurationPipe,
    I18nextPipe,
  ],
  templateUrl: './battle-footer.component.html',
  styleUrl: './battle-footer.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattleFooterComponent {
  private battleStore = inject(BattleStore)

  equippedSpells = this.battleStore.equippedSpells
  activeBuffs = computed(() =>
    this.battleStore.activeBuffs().map(buff => ({ ...buff, secondsLeft: Math.ceil(buff.msRemaining / MS_PER_SECOND) })),
  )

  // A slot stays visible while its effect runs and, dimmed, while it is still locked.
  activeConsumables = computed(() => {
    const slots = this.battleStore.consumableSlots()
    return CONSUMABLE_SLOTS.flatMap(slot => {
      const active = slots[slot]
      return active && active.lockRemaining > 0 ? [{ slot, ...active }] : []
    })
  })

  // Each spellbar position is its own single-item drop list, so a dropped spell
  // lands in exactly the hovered slot instead of being inserted/sorted.
  slotIndices = Array.from({ length: SPELL_SLOT_COUNT }, (_, i) => i)
  connectedTo = [...this.slotIndices.map(i => `spell-slot-${i}`), PALETTE_DROP_ID]

  protected readonly SPELLS_DATA = SPELLS_DATA
  protected readonly ITEM_DATA = ITEM_DATA
  protected readonly ItemID = ItemID

  /** A cooling slot rejects drags outright, so CDK never moves its spell aside to preview a drop. */
  canEnterSlot = (_drag: CdkDrag, drop: CdkDropList<number>): boolean =>
    (this.battleStore.equippedSpells()[drop.data]?.cooldownRemainingMs ?? 0) <= 0

  onSlotDrop(event: CdkDragDrop<number>) {
    if (event.previousContainer === event.container) return

    const targetIndex = event.container.data
    const arr: (EquippedSpell | null)[] = [...this.battleStore.equippedSpells()]
    while (arr.length < SPELL_SLOT_COUNT) arr.push(null)

    // A slot on cooldown keeps its spell (cooling spells can't be dragged out either, see cdkDragDisabled).
    if ((arr[targetIndex]?.cooldownRemainingMs ?? 0) > 0) return

    if (event.previousContainer.id === PALETTE_DROP_ID) {
      // Equip from the spellbook palette into the hovered slot.
      const spellId = event.item.data as SpellID
      const displaced = arr[targetIndex]
      arr[targetIndex] = { spellId, cooldownRemainingMs: 0 }
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
