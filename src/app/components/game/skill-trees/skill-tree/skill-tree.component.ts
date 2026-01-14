import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core'
import { TranslatePipe } from 'app/pipes/i18next.pipe'
import { ALL_SKILLS } from 'data/skill-tree-data'
import { SkillTreeID } from 'enums/ids/skill-tree-id.enum'
import { SkillPointID } from 'enums/ids/skill-tree-node-id.enum'
import { UrlPipe } from '../../../../pipes/url.pipe'
import { TooltipTemplateDirective } from 'ngx-tooltip-directives'
import { PlayerManagerService } from '../../../../services/player-manager.service'

@Component({
    selector: 'app-skill-tree',
    templateUrl: 'skill-tree.component.html',
    styleUrls: ['./skill-tree.component.sass'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, TranslatePipe, UrlPipe, TooltipTemplateDirective],
})

export class SkillTreeComponent {
    playerManagerService = inject(PlayerManagerService)
    unlockedSkillPoints = this.playerManagerService.unlockedSkillPoints

    @Input() skillPoints: SkillPointID[][]
    @Input() skillTreeId: SkillTreeID

    readonly AllSkills = ALL_SKILLS
    readonly SkillTreeID = SkillTreeID
    readonly SkillPointID = SkillPointID

    handleBuySkillPoint(skillPoint: SkillPointID, event: MouseEvent) {
        this.playerManagerService.buySkillPoint(skillPoint, event.ctrlKey)
    }
}
