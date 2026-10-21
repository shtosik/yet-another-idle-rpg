import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core'
import { TownBuildingNpc } from '../../../../../interfaces/town.interface'
import NPC_Data from '../../../../../data/npc-data'
import { NgOptimizedImage } from '@angular/common'
import { NpcID } from '../../../../../enums/map/npc-id.enum'

@Component({
    selector: 'app-npc-frame',
    styleUrls: ['npc-frame.component.sass'],
    templateUrl: 'npc-frame.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        NgOptimizedImage,
    ],
})
export class NpcFrameComponent {
    @Input() npc: TownBuildingNpc

    @Output() openDialogue = new EventEmitter<NpcID>()

    protected readonly NPC_Data = NPC_Data
}
