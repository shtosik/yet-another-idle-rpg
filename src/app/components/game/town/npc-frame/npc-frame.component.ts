import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core'
import { TownBuildingNpc } from '../../../../../interfaces/town.interface'
import NPC_Data from '../../../../../data/npc-data'
import { NgOptimizedImage } from '@angular/common'
import { NpcID } from '../../../../../enums/map/npc-id.enum'
import { ShopID } from '../../../../../enums/ids/shop-id.enum'
import { I18nextPipe } from '../../../../pipes/i18next.pipe'

@Component({
    selector: 'app-npc-frame',
    styleUrls: ['npc-frame.component.sass'],
    templateUrl: 'npc-frame.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        NgOptimizedImage,
        I18nextPipe,
    ],
})
export class NpcFrameComponent {
    @Input() npc: TownBuildingNpc
    /** This NPC's shop, once the player has opened it through dialogue. */
    @Input() shopId: ShopID | undefined

    @Output() openDialogue = new EventEmitter<NpcID>()
    @Output() openShop = new EventEmitter<ShopID>()

    protected readonly NPC_Data = NPC_Data
    protected readonly NpcID = NpcID
}
