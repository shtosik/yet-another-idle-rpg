import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core'
import { TownBuilding } from '../../../../../data/towns-data'
import { UrlPipe } from '../../../../pipes/url.pipe'
import { NpmFrameComponent } from '../npc-frame/npc-frame.component'
import { CommonModule } from '@angular/common'
import { TranslatePipe } from '../../../../pipes/i18next.pipe'
import { TownBuildingID } from '../../../../../enums/map/town-tab-id.enum'
import { NpcID } from '../../../../../enums/map/npc-id.enum'
import { ModalService } from '../../../../services/modal.service'

@Component({
    selector: 'app-town-building',
    templateUrl: './town-building.component.html',
    styleUrls: ['./town-building.component.sass'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        UrlPipe,
        NpmFrameComponent,
        CommonModule,
        TranslatePipe,
    ],
})
export class TownBuildingComponent {
    building = input<TownBuilding>(null)
    protected readonly TownBuildingID = TownBuildingID
    private modalService = inject(ModalService)

    openDialogue(id: NpcID) {
        this.modalService.openDialogue(id)
    }
}
