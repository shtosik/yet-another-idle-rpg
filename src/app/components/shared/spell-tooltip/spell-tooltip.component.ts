import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { I18nextPipe } from '../../../pipes/i18next.pipe'
import { PlayerStore } from '../../../store/player/player.store'
import { BattleManagerService } from '../../../services/battle-manager.service'
import { SpellID } from '../../../../enums/ids/spell-id.enum'
import { SpellType } from '../../../../enums/spell-type.enum'
import SPELLS_DATA from '../../../../data/spells-data'

/** Tooltip body for a spell: name, type, mana, cooldown and duration after the player's stats and perks, description. */
@Component({
  selector: 'app-spell-tooltip',
  templateUrl: './spell-tooltip.component.html',
  styleUrls: ['./spell-tooltip.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [I18nextPipe],
})
export class SpellTooltipComponent {
  private playerStore = inject(PlayerStore)
  private battleManagerService = inject(BattleManagerService)

  spellId = input.required<SpellID>()

  spell = computed(() => SPELLS_DATA[this.spellId()])
  manaCost = computed(() => this.battleManagerService.manaCost(this.spellId()))
  cooldown = computed(() => this.battleManagerService.spellCooldown(this.spellId()))
  increasedSpellDuration = computed(() => this.playerStore.stats().increasedSpellDuration)

  protected readonly SpellID = SpellID
  protected readonly SpellType = SpellType
}
