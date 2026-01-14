import { ChangeDetectionStrategy, Component } from '@angular/core'
import { SkillTreeID } from 'enums/ids/skill-tree-id.enum'
import { SkillTreeComponent } from './skill-tree/skill-tree.component'
import SkillTreeData from '../../../../data/skill-tree-data'
import { SkillPointID } from '../../../../enums/ids/skill-tree-node-id.enum'

@Component({
    selector: 'app-skill-trees',
    templateUrl: 'skill-trees.component.html',
    styleUrls: ['./skill-trees.component.sass'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SkillTreeComponent],
})

export class SkillTreesComponent {
    SkillTreeID = SkillTreeID
    protected readonly SkillTreeData = SkillTreeData
    protected readonly SkillPointID = SkillPointID
}
