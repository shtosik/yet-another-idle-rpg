import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { TooltipTemplateDirective } from 'ngx-tooltip-directives'
import { I18nextPipe } from '../../../../../pipes/i18next.pipe'
import { UrlPipe } from '../../../../../pipes/url.pipe'
import { EquippedSpell } from '../../../../../../interfaces/spells/equipped-spell.interface'
import { PlayerStore } from '../../../../../store/player/player.store'
import { SpellID } from '../../../../../../enums/ids/spell-id.enum'
import SPELLS_DATA from '../../../../../../data/spells-data'
import { SpellType } from '../../../../../../enums/spell-type.enum'
import { BattleManagerService } from '../../../../../services/battle-manager.service'

const MS_PER_SECOND = 1000

@Component({
  selector: 'app-spell-slot',
  templateUrl: 'spell-slot.component.html',
  styleUrls: ['spell-slot.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    I18nextPipe,
    UrlPipe,
    TooltipTemplateDirective,
  ],
})
export class SpellSlotComponent {
  playerStore = inject(PlayerStore)
  battleManagerService = inject(BattleManagerService)

  equippedSpell = input.required<EquippedSpell>()

  playerStats = this.playerStore.stats

  spellData = computed(() => SPELLS_DATA[this.equippedSpell().spellId])
  canAfford = computed(() => this.battleManagerService.canAffordSpell(this.equippedSpell().spellId))
  /** After the spell's perk. */
  manaCost = computed(() => this.battleManagerService.manaCost(this.equippedSpell().spellId))
  /** Seconds, after cooldown reduction. */
  cooldown = computed(() => this.battleManagerService.spellCooldown(this.equippedSpell().spellId))
  secondsUntilReady = computed(() => Math.ceil(this.equippedSpell().cooldownRemainingMs / MS_PER_SECOND))
  cooldownSweepDeg = computed(() => this.equippedSpell().cooldownRemainingMs / (this.cooldown() * MS_PER_SECOND) * 360)

  protected readonly SpellID = SpellID
  protected readonly SpellType = SpellType

  handleCastSpell() {
    this.battleManagerService.castSpell(this.equippedSpell().spellId)
  }
}
