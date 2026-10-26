import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { TooltipTemplateDirective } from 'ngx-tooltip-directives'
import { UrlPipe } from '../../../../../pipes/url.pipe'
import { EquippedSpell } from '../../../../../../interfaces/spells/equipped-spell.interface'
import SPELLS_DATA from '../../../../../../data/spells-data'
import { BattleManagerService } from '../../../../../services/battle-manager.service'
import { BattleStore } from '../../../../../store/battle/battle.store'
import { PlayerStore } from '../../../../../store/player/player.store'
import { SpellTooltipComponent } from '../../../../shared/spell-tooltip/spell-tooltip.component'

const MS_PER_SECOND = 1000

@Component({
  selector: 'app-spell-slot',
  templateUrl: 'spell-slot.component.html',
  styleUrls: ['spell-slot.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    UrlPipe,
    TooltipTemplateDirective,
    SpellTooltipComponent,
  ],
})
export class SpellSlotComponent {
  battleManagerService = inject(BattleManagerService)
  private battleStore = inject(BattleStore)
  private playerStore = inject(PlayerStore)

  equippedSpell = input.required<EquippedSpell>()

  spellData = computed(() => SPELLS_DATA[this.equippedSpell().spellId])
  /** A buff or damage-over-time spell from this slot is running. */
  isActive = computed(() => {
    const spellId = this.equippedSpell().spellId
    return this.battleStore.activeBuffs().some(b => b.spellId === spellId)
      || this.battleStore.activeDamageOverTime().some(d => d.spellId === spellId)
  })
  /** False for a gear spell whose gear came off; it stays until its cooldown ends. */
  isKnown = computed(() => this.playerStore.knownSpellIds().includes(this.equippedSpell().spellId))
  canAfford = computed(() => this.battleManagerService.canAffordSpell(this.equippedSpell().spellId))
  /** Seconds, after cooldown reduction. */
  cooldown = computed(() => this.battleManagerService.spellCooldown(this.equippedSpell().spellId))
  secondsUntilReady = computed(() => Math.ceil(this.equippedSpell().cooldownRemainingMs / MS_PER_SECOND))
  cooldownSweepDeg = computed(() => this.equippedSpell().cooldownRemainingMs / (this.cooldown() * MS_PER_SECOND) * 360)

  handleCastSpell() {
    this.battleManagerService.castSpell(this.equippedSpell().spellId)
  }
}
