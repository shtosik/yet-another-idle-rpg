import { ChangeDetectionStrategy, Component, inject, input, Input } from '@angular/core'
import { TooltipTemplateDirective } from 'ngx-tooltip-directives'
import { TranslatePipe } from '../../../../pipes/i18next.pipe'
import { UrlPipe } from '../../../../pipes/url.pipe'
import { EquippedSpell } from '../../../../../interfaces/spells/equipped-spell.interface'
import { PlayerStore } from '../../../../store/player/player.store'
import { SpellID } from '../../../../../enums/ids/spell-id.enum'
import SPELLS_DATA from '../../../../../data/spells-data'
import { SpellType } from '../../../../../enums/spell-type.enum'
import { BattleStore } from '../../../../store/battle/battle.store'
import { BattleManagerService } from '../../../../services/battle-manager.service'

@Component({
    selector: 'app-spell-slot',
    templateUrl: 'spell-slot.component.html',
    styleUrls: ['spell-slot.component.sass'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        TranslatePipe,
        UrlPipe,
        TooltipTemplateDirective,
    ],
})
export class SpellSlotComponent {
    playerStore = inject(PlayerStore)
    battleStore = inject(BattleStore)
    battleManagerService = inject(BattleManagerService)

    spellId = input<SpellID>(null)

    playerStats = this.playerStore.stats
    isInCombat = this.battleStore.isInCombat

    @Input() equippedSpell: EquippedSpell
    @Input() spellLevel: number

    protected readonly SpellID = SpellID
    protected readonly SPELLS_DATA = SPELLS_DATA
    protected readonly SpellType = SpellType

    handleCastSpell(spellId: SpellID, equippedSpell: EquippedSpell) {
        if (equippedSpell.cooldown > 0 || !this.isInCombat) return

        this.battleManagerService.castSpell(spellId)
    }

    // const passedTime = (spell.currentCooldown / getSpellCooldown(cooldown, playerStats.cooldownReduction)) * 100;
    // if (refs.reference.current) (refs.reference.current as HTMLElement).style.setProperty("--time-left", `${passedTime}%`);
}
