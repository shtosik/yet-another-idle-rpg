import { ChangeDetectionStrategy, Component, DestroyRef, inject, input } from '@angular/core'
import { TownBuilding } from '../../../../../interfaces/town.interface'
import { UrlPipe } from '../../../../pipes/url.pipe'
import { NpcFrameComponent } from '../npc-frame/npc-frame.component'
import { CommonModule } from '@angular/common'
import { I18nextPipe } from '../../../../pipes/i18next.pipe'
import { TownBuildingID } from '../../../../../enums/map/town-building-id.enum'
import { NpcID } from '../../../../../enums/map/npc-id.enum'
import { DialogueManagerService } from '../../../../services/dialogue-manager.service'
import { TownsStore } from '../../../../store/towns/towns.store'
import { ShopID } from '../../../../../enums/ids/shop-id.enum'

@Component({
  selector: 'app-town-building',
  templateUrl: './town-building.component.html',
  styleUrls: ['./town-building.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    UrlPipe,
    NpcFrameComponent,
    CommonModule,
    I18nextPipe,
  ],
})
export class TownBuildingComponent {
  private destroyRef = inject(DestroyRef)
  private dialogueManagerService = inject(DialogueManagerService)
  private townsStore = inject(TownsStore)
  protected readonly npcShops = this.townsStore.npcShops

  protected readonly TownBuildingID = TownBuildingID

  building = input<TownBuilding>(null)

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.dialogueManagerService.closeDialogue()
    })
  }

  openDialogue(id: NpcID) {
    this.dialogueManagerService.startDialogue(id)
  }

  openShop(shopId: ShopID) {
    this.townsStore.openShop(shopId)
  }
}
