import { ChangeDetectionStrategy, Component, computed, effect, inject, untracked } from '@angular/core'
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop'
import { PlayerStore } from '../../../store/player/player.store'
import { BattleStore } from '../../../store/battle/battle.store'
import { SpellID } from '../../../../enums/ids/spell-id.enum'
import { EquippedSpell } from '../../../../interfaces/spells/equipped-spell.interface'
import SPELLS_DATA from '../../../../data/spells-data'
import { UrlPipe } from '../../../pipes/url.pipe'
import { I18nextPipe } from '../../../pipes/i18next.pipe'
import { BattleManagerService } from '../../../services/battle-manager.service'
import { TooltipTemplateDirective } from 'ngx-tooltip-directives'
import { SpellTooltipComponent } from '../../shared/spell-tooltip/spell-tooltip.component'

@Component({
  selector: 'app-spellbook',
  templateUrl: './spellbook.component.html',
  styleUrls: ['./spellbook.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkDropList, CdkDrag, UrlPipe, I18nextPipe, TooltipTemplateDirective, SpellTooltipComponent],
})
export class SpellbookComponent {
  private playerStore = inject(PlayerStore)
  private battleStore = inject(BattleStore)
  private battleManagerService = inject(BattleManagerService)

  protected readonly SPELLS_DATA = SPELLS_DATA

  // Connect the palette to every spellbar slot so spells can be equipped onto any position.
  slotDropIds = Array.from({ length: 5 }, (_, i) => `spell-slot-${i}`)

  availableSpells = computed(() => {
    const equippedIds = new Set(
      this.battleStore.equippedSpells().filter((s): s is EquippedSpell => !!s).map(s => s.spellId),
    )
    return this.playerStore.knownSpellIds().filter(id => !equippedIds.has(id))
  })

  constructor() {
    // Spells learned while the tab is open count as seen too, so the navbar badge stays clear.
    effect(() => {
      if (this.playerStore.unseenSpellCount()) untracked(() => this.playerStore.markSpellsSeen())
    })
  }

  onPaletteDrop(event: CdkDragDrop<SpellID[]>) {
    // Only handle drops coming from the spell-bar (unequip).
    if (event.previousContainer === event.container) return
    const spell = event.item.data as EquippedSpell
    this.battleManagerService.unequipSpell(spell.spellId)
  }
}
