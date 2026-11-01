import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { TooltipTemplateDirective } from 'ngx-tooltip-directives'
import { UrlPipe } from '../../../../../pipes/url.pipe'
import { EquippedSpell } from '../../../../../../interfaces/spells/equipped-spell.interface'
import SPELLS_DATA from '../../../../../../data/spells-data'
import { BattleManagerService } from '../../../../../services/battle-manager.service'
import { BattleStore } from '../../../../../store/battle/battle.store'
import { PlayerStore } from '../../../../../store/player/player.store'
import { SpellTooltipComponent } from '../../../../shared/spell-tooltip/spell-tooltip.component'
import { SpellID } from '../../../../../../enums/ids/spell-id.enum'
import i18next from 'i18next'

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
  /** A buff, damage-over-time or empower spell from this slot is running. */
  isActive = computed(() => {
    const spellId = this.equippedSpell().spellId
    return this.battleStore.activeBuffs().some(b => b.spellId === spellId)
      || this.battleStore.activeDamageOverTime().some(d => d.spellId === spellId)
      || this.battleStore.empowered()?.spellId === spellId
  })
  /** False for a gear spell whose gear came off; it stays until its cooldown ends. */
  isKnown = computed(() => this.playerStore.knownSpellIds().includes(this.equippedSpell().spellId))
  canAfford = computed(() => this.battleManagerService.canAffordSpell(this.equippedSpell().spellId))
  /** Seconds, after cooldown reduction. */
  cooldown = computed(() => this.battleManagerService.spellCooldown(this.equippedSpell().spellId))
  secondsUntilReady = computed(() => Math.ceil(this.equippedSpell().cooldownRemainingMs / MS_PER_SECOND))
  cooldownSweepDeg = computed(() => this.equippedSpell().cooldownRemainingMs / (this.cooldown() * MS_PER_SECOND) * 360)
  readonly manaCost = computed(() => this.battleManagerService.manaCost(this.equippedSpell().spellId))
  readonly canCast = computed(() => this.battleManagerService.canCast(this.equippedSpell().spellId))
  readonly statusText = computed(() => {
    let state = 'app:battle.spellWaiting'
    if (!this.isKnown()) state = 'app:battle.spellUnknown'
    else if (this.isActive()) state = 'app:battle.spellActive'
    else if (this.secondsUntilReady() > 0) state = 'app:battle.spellCooldown'
    else if (!this.canAfford()) state = 'app:battle.spellMana'
    else if (this.canCast()) state = 'app:battle.spellReady'

    return i18next.t(state, { seconds: this.secondsUntilReady() })
  })
  readonly accessibleLabel = computed(() =>
    i18next.t('app:battle.spellLabel', {
      name: i18next.t(`spells:names.${SpellID[this.equippedSpell().spellId]}.name`),
      state: this.statusText(),
      cost: this.manaCost(),
    }))

  handleCastSpell() {
    this.battleManagerService.castSpell(this.equippedSpell().spellId)
  }
}
