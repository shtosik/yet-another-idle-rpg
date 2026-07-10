import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop'
import { PlayerStore } from '../../../store/player/player.store'
import { BattleStore } from '../../../store/battle/battle.store'
import { SpellID } from '../../../../enums/ids/spell-id.enum'
import { EquippedSpell } from '../../../../interfaces/spells/equipped-spell.interface'
import SPELLS_DATA from '../../../../data/spells-data'
import { UrlPipe } from '../../../pipes/url.pipe'
import { TranslatePipe } from '../../../pipes/i18next.pipe'

@Component({
  selector: 'app-spellbook',
  templateUrl: './spellbook.component.html',
  styleUrls: ['./spellbook.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkDropList, CdkDrag, UrlPipe, TranslatePipe],
})
export class SpellbookComponent {
  private playerStore = inject(PlayerStore)
  private battleStore = inject(BattleStore)

  protected readonly SPELLS_DATA = SPELLS_DATA
  protected readonly SpellID = SpellID

  // Connect the palette to every spellbar slot so spells can be equipped onto any position.
  slotDropIds = Array.from({ length: 5 }, (_, i) => `spell-slot-${i}`)

  availableSpells = computed(() => {
    const unlocked = this.playerStore.unlockedSpells()
    const equippedIds = new Set(
      this.battleStore.equippedSpells().filter((s): s is EquippedSpell => !!s).map(s => s.spellId),
    )
    return (Object.keys(unlocked) as unknown as SpellID[])
      .map(key => Number(key) as SpellID)
      .filter(id => (unlocked[id] ?? 0) > 0 && !equippedIds.has(id))
  })

  onPaletteDrop(event: CdkDragDrop<SpellID[]>) {
    // Only handle drops coming from the spell-bar (unequip).
    if (event.previousContainer === event.container) return
    const spell = event.item.data as EquippedSpell
    const arr = this.battleStore.equippedSpells().map(s => s?.spellId === spell.spellId ? null : s)
    this.battleStore.setAllEquippedSpells(arr)
  }
}
